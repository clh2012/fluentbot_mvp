// server.js

const express = require('express');
const multer = require('multer');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer setup – save uploads to /uploads
const upload = multer({ dest: uploadsDir });

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '.')));
app.use(express.json()); // for parsing JSON bodies (if needed)

// OpenAI Whisper setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/transcribe – handles audio file upload and transcription
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  const audioPath = req.file?.path;
  console.log('Received transcription request');

  if (!audioPath) {
    console.error('No audio file uploaded.');
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }

  try {
   const transcription = await openai.audio.transcriptions.create({
  file: {
    name: 'recording.webm',
    type: 'audio/webm',
    data: fs.createReadStream(file.filepath),
  },
  model: 'whisper-1',
  response_format: 'json',
  language: 'es',
});


    console.log('Transcription success:', transcription.text);

    fs.unlink(audioPath, () => {}); // cleanup

    res.json({ transcript: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error?.response?.data || error.message || error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});


// POST /api/tts – generate speech audio from text using 11 Labs
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Rachel' } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    // 11 Labs API details
    const apiKey = process.env.LABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: '11 Labs API key is not configured.' });
    }

    const voiceId = getVoiceId(voice); // Map voice name to 11 Labs voice ID

    // 11 Labs TTS API endpoint
    const url = `https://api.11labs.io/v1/text-to-speech/${voiceId}`;

    // Call 11 Labs TTS API
    const response = await axios.post(
      url,
      { text },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      }
    );

    // Respond with audio data (mp3)
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);
  } catch (error) {
    console.error('TTS error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Text-to-speech failed' });
  }
});

// Helper to map voice name to 11 Labs voice IDs — add or edit as you want
function getVoiceId(voiceName) {
  const voices = {
    Rachel: 'EXAVITQu4vr4xnSDxMaL', // example voice ID from 11 Labs
    // add more voices if you want
  };
  return voices[voiceName] || voices['Rachel'];
}

// Start the server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
