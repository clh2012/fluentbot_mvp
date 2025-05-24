export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { text, voice = 'Rachel' } = req.body;

  try {
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!ttsRes.ok) {
      const errorText = await ttsRes.text();
      throw new Error(`TTS API error: ${errorText}`);
    }

    const audioBuffer = await ttsRes.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'TTS failed' });
  }
}
