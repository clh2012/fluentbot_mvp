// server.js

const express = require('express');
const multer = require('multer');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
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

// OpenAI Whisper setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/transcribe – handles audio file upload and transcription
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  const audioPath = req.file?.path;

  if (!audioPath) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      response_format: 'json',
      language: 'es', // Optional: change or remove if needed
    });

    fs.unlink(audioPath, () => {}); // Clean up the uploaded file

    res.json({ transcript: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
