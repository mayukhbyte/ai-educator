const express = require('express');
const { randomBytes } = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const FACULTY_ACCESS_CODE = process.env.FACULTY_ACCESS_CODE || '123456';
const REAL_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function authRoutes(supabase) {
  const router = express.Router();
  const supabaseAuth = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    : null;

  async function getRole(user) {
    if (['student', 'teacher', 'admin'].includes(user.app_metadata?.role)) {
      return user.app_metadata.role;
    }
    if (!supabase) return user.app_metadata?.role || 'student';

    const { data, error } = await supabase
      .from('profiles')
      .select('role, full_name, grade_level')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      console.error('Could not load user profile:', error.message);
      throw new Error('Could not load the account profile.');
    }
    return data || { role: user.app_metadata?.role || 'student' };
  }

  function readBearerToken(req) {
    return req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  }

  router.post('/login', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ message: 'Both email and password are required.' });
    }
    if (!REAL_EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (!supabase || !supabaseAuth) {
      return res.status(503).json({ message: 'Supabase authentication is not configured.' });
    }

    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
      if (error || !data?.user || !data.session?.access_token) {
        return res.status(401).json({ message: 'Invalid email or password. Confirm the email address if required.' });
      }
      const profile = await getRole(data.user);
      let role = typeof profile === 'string' ? profile : profile.role;
      if (role !== 'teacher' && role !== 'admin') role = 'student';
      const roster = role === 'student'
        ? await supabase.from('student_roster')
          .select('student_id, full_name, class_level, section, status, removal_reason')
          .eq('auth_user_id', data.user.id)
          .maybeSingle()
        : { data: null, error: null };
      if (roster.error) {
        console.error('Student roster lookup failed:', roster.error.message);
        return res.status(503).json({ message: 'Could not load the signed-in student account.' });
      }
      if (roster.data?.status === 'removed') {
        return res.status(403).json({
          message: `Account is inactive: "${roster.data.removal_reason || 'Contact course faculty'}".`,
        });
      }
      if (role === 'student' && !roster.data) {
        return res.status(403).json({ message: 'This student account is not in the active roster.' });
      }

      const name = (typeof profile === 'object' && profile.full_name) ||
        roster.data?.full_name ||
        data.user.user_metadata?.name ||
        email.split('@')[0];
      return res.json({
        message: 'Login successful.',
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email,
          name,
          role,
          classLevel: roster.data?.class_level || profile.grade_level,
          section: roster.data?.section,
          studentId: roster.data?.student_id,
        },
      });
    } catch (error) {
      console.error('Supabase login failed:', error.message);
      return res.status(503).json({ message: error.message || 'Could not verify the account.' });
    }
  });

  router.post('/signup', async (req, res) => {
    const { email: inputEmail, password: inputPassword, name: inputName, role = 'student', classLevel = 10, section = 'Section A' } = req.body || {};
    const email = String(inputEmail || '').trim().toLowerCase();
    const password = String(inputPassword || '');
    const name = String(inputName || '').trim();
    const parsedClassLevel = Number.parseInt(classLevel, 10);

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }
    if (!REAL_EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    if (role !== 'student' && role !== 'teacher') {
      return res.status(400).json({ message: 'Choose a valid account role.' });
    }
    if (role === 'teacher' && req.body?.facultyCode !== FACULTY_ACCESS_CODE) {
      return res.status(403).json({ message: 'The faculty access code is invalid.' });
    }
    if (role === 'student' && (!Number.isInteger(parsedClassLevel) || parsedClassLevel < 1 || parsedClassLevel > 12)) {
      return res.status(400).json({ message: 'Student class must be between 1 and 12.' });
    }
    if (!supabase?.auth?.admin) {
      return res.status(503).json({ message: 'Supabase service-role authentication is required for account registration.' });
    }

    let user;
    try {
      const created = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, classLevel: parsedClassLevel, section },
        app_metadata: { role },
      });
      if (created.error || !created.data?.user) {
        const duplicateEmail = created.error?.code === 'email_exists' ||
          created.error?.code === 'user_already_exists' ||
          /already\s+(been\s+)?(registered|exists)/i.test(created.error?.message || '');
        if (duplicateEmail) {
          return res.status(409).json({
            message: 'An account with this email address is already registered. Sign in with that account instead.',
          });
        }
        return res.status(409).json({ message: created.error?.message || 'Could not create this account.' });
      }
      user = created.data.user;

      const profile = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: name,
        role,
        grade_level: role === 'student' ? parsedClassLevel : null,
      }, { onConflict: 'id' });
      if (profile.error && !['PGRST205', '42P01'].includes(profile.error.code)) {
        throw profile.error;
      }
      if (profile.error) {
        console.warn('Profiles table is missing; using Supabase Auth app metadata for account roles.');
      }

      let studentId;
      if (role === 'student') {
        studentId = `STU-${randomBytes(4).toString('hex').toUpperCase()}`;
        const roster = await supabase.from('student_roster').insert({
          auth_user_id: user.id,
          student_id: studentId,
          full_name: name,
          email,
          class_level: parsedClassLevel,
          section: String(section || 'Section A').trim(),
        });
        if (roster.error) throw roster.error;
      }

      const signedIn = await supabaseAuth.auth.signInWithPassword({ email, password });
      if (signedIn.error || !signedIn.data?.session?.access_token) {
        throw signedIn.error || new Error('Could not create an authenticated session.');
      }
      return res.status(201).json({
        message: 'Account created successfully.',
        token: signedIn.data.session.access_token,
        user: {
          id: user.id,
          email,
          name,
          role,
          classLevel: role === 'student' ? parsedClassLevel : undefined,
          section: role === 'student' ? section : undefined,
          studentId,
        },
      });
    } catch (error) {
      if (user) {
        const rollback = await supabase.auth.admin.deleteUser(user.id);
        if (rollback.error) console.error('Could not roll back failed account registration:', rollback.error.message);
      }
      console.error('Supabase registration failed:', error.message);
      return res.status(503).json({ message: 'Could not save the account profile or roster record.' });
    }
  });

  router.get('/me', async (req, res) => {
    const token = readBearerToken(req);
    if (!token || !supabase) {
      return res.status(401).json({ message: 'A valid Supabase sign-in is required.' });
    }
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ message: 'Your Supabase session is invalid or expired.' });
    }
    try {
      const profile = await getRole(data.user);
      const role = typeof profile === 'string' ? profile : profile.role;
      return res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: (typeof profile === 'object' && profile.full_name) || data.user.user_metadata?.name || data.user.email?.split('@')[0],
          role: role === 'teacher' || role === 'admin' ? role : 'student',
          classLevel: typeof profile === 'object' ? profile.grade_level : undefined,
        },
      });
    } catch (profileError) {
      return res.status(503).json({ message: profileError.message });
    }
  });

  router.post('/logout', (_req, res) => res.json({ message: 'Successfully signed out.' }));
  return router;
}

module.exports = authRoutes;
