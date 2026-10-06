const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env.local'), override: true });

const { createClient } = require('@supabase/supabase-js');
const { curriculumExtras } = require('./data/curriculumExtras');

async function seedCurriculumExtras() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed curriculum content.');
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const questionTexts = curriculumExtras.map(item => item.question);
  const existingQuestions = new Set();
  const lookupBatchSize = 25;
  for (let start = 0; start < questionTexts.length; start += lookupBatchSize) {
    const batch = questionTexts.slice(start, start + lookupBatchSize);
    const { data, error } = await supabase
      .from('education')
      .select('question')
      .in('question', batch);
    if (error) throw new Error(`Could not check existing curriculum questions: ${error.message}`);
    for (const item of data || []) existingQuestions.add(item.question);
  }

  const unmatchedQuestions = questionTexts.filter(question => !existingQuestions.has(question));
  const exactLookupBatchSize = 10;
  for (let start = 0; start < unmatchedQuestions.length; start += exactLookupBatchSize) {
    const batch = unmatchedQuestions.slice(start, start + exactLookupBatchSize);
    const results = await Promise.all(batch.map(async question => {
      const { data, error } = await supabase
        .from('education')
        .select('question')
        .eq('question', question)
        .maybeSingle();
      if (error) throw new Error(`Could not verify curriculum question: ${error.message}`);
      return data?.question;
    }));
    for (const question of results) {
      if (question) existingQuestions.add(question);
    }
  }

  const newRows = curriculumExtras
    .filter(item => !existingQuestions.has(item.question))
    .map(({ options, correctAnswer, ...row }) => ({
      ...row,
      curriculum: 'NCERT',
      quality_score: 0.98,
      source: 'NCERT-aligned supplemental practice',
    }));

  if (newRows.length === 0) {
    console.log('Curriculum extras are already present; no database changes made.');
    return;
  }

  const { error: insertError } = await supabase.from('education').insert(newRows);
  if (insertError) throw new Error(`Could not add curriculum questions: ${insertError.message}`);
  console.log(`Added ${newRows.length} supplemental question-and-answer items.`);
}

seedCurriculumExtras().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
