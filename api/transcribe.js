import formidable from 'formidable';
import fs from 'fs';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error parsing form data' });

    const file = files.audio;
    if (!file) return res.status(400).json({ error: 'No audio file uploaded' });

    try {
      const transcript = await openai.audio.transcriptions.create({
        file: fs.createReadStream(file.filepath),
        model: 'whisper-1',
        response_format: 'json',
      });

      res.status(200).json({ transcript: transcript.text });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Transcription failed' });
    }
  });
}
