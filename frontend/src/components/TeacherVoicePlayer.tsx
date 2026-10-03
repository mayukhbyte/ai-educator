import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  Chip,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import SpeedIcon from '@mui/icons-material/Speed';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

interface TeacherVoicePlayerProps {
  textToSpeak: string;
  title?: string;
}

const TEACHER_VOICES = [
  { id: 'sharma', name: '👩‍🏫 Mrs. Sharma (Science & Maths)', pitch: 1.1, rate: 0.95 },
  { id: 'verma', name: '👨‍🏫 Prof. Verma (Senior Board Examiner)', pitch: 0.9, rate: 0.9 },
  { id: 'sarah', name: '🎓 Dr. Sarah (Adaptive AI Tutor)', pitch: 1.0, rate: 1.0 },
];

export const TeacherVoicePlayer: React.FC<TeacherVoicePlayerProps> = ({
  textToSpeak,
  title = 'AI Teacher Voiceover Explanation',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('sharma');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean text by stripping markdown symbols and urls for natural narration
  const cleanSpeechText = (raw: string) => {
    return raw
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[#*`_~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/•/g, ', ')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis for clear audio
      .trim();
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = cleanSpeechText(textToSpeak);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    const teacher = TEACHER_VOICES.find((t) => t.id === selectedTeacher) || TEACHER_VOICES[0];
    utterance.pitch = teacher.pitch;
    utterance.rate = teacher.rate * playbackSpeed;

    // Pick suitable voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
      if (selectedTeacher === 'sharma' || selectedTeacher === 'sarah') {
        const femaleVoice = englishVoices.find((v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha'));
        if (femaleVoice) utterance.voice = femaleVoice;
      } else {
        const maleVoice = englishVoices.find((v) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('george'));
        if (maleVoice) utterance.voice = maleVoice;
      }
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if ('speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: '#ffffff',
        border: '1.5px solid #cbd5e1',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <RecordVoiceOverIcon color="primary" sx={{ fontSize: 24 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            {title}
          </Typography>
          {isPlaying && (
            <Chip
              icon={<GraphicEqIcon sx={{ animation: 'pulse 1s infinite' }} />}
              label="Speaking Aloud..."
              color="success"
              size="small"
              sx={{ fontWeight: 700, height: 22 }}
            />
          )}
        </Stack>

        {/* Controls */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {/* Teacher Character Selection */}
          <Select
            size="small"
            value={selectedTeacher}
            onChange={(e) => {
              setSelectedTeacher(e.target.value);
              if (isPlaying) handleStop();
            }}
            sx={{
              fontSize: '0.8rem',
              borderRadius: 2,
              bgcolor: '#f8fafc',
              height: 34,
            }}
          >
            {TEACHER_VOICES.map((tv) => (
              <MenuItem key={tv.id} value={tv.id} sx={{ fontSize: '0.85rem' }}>
                {tv.name}
              </MenuItem>
            ))}
          </Select>

          {/* Speed Toggle */}
          <Tooltip title="Playback Speed">
            <Select
              size="small"
              value={playbackSpeed}
              onChange={(e) => {
                setPlaybackSpeed(Number(e.target.value));
                if (isPlaying) handleStop();
              }}
              sx={{ fontSize: '0.8rem', height: 34, borderRadius: 2, bgcolor: '#f8fafc' }}
              startAdornment={<SpeedIcon sx={{ fontSize: 16, mr: 0.5, color: '#64748b' }} />}
            >
              <MenuItem value={0.8}>0.8x (Slow & Clear)</MenuItem>
              <MenuItem value={1.0}>1.0x (Normal)</MenuItem>
              <MenuItem value={1.25}>1.25x (Fast)</MenuItem>
            </Select>
          </Tooltip>

          {/* Play / Pause / Stop Buttons */}
          {!isPlaying ? (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={handlePlay}
              sx={{ fontWeight: 700, borderRadius: 2, height: 34, textTransform: 'none', px: 2 }}
            >
              {isPaused ? 'Resume Voice' : 'Listen Like in Class'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="warning"
              size="small"
              startIcon={<PauseIcon />}
              onClick={handlePause}
              sx={{ fontWeight: 700, borderRadius: 2, height: 34, textTransform: 'none' }}
            >
              Pause
            </Button>
          )}

          {(isPlaying || isPaused) && (
            <IconButton size="small" color="error" onClick={handleStop}>
              <StopIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>
    </Box>
  );
};
