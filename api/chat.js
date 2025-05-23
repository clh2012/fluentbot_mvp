export default async function handler(req, res) {
  const userMessage = req.body.message;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const ELEVENLABS_VOICE_ID = "Ir1QNHvhaJXbAGhT50w3"; // Replace with real voice ID

  try {
    // 1. Send message to OpenAI
    const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un amable interlocutor que ayuda al usuario a practicar conversación en español."
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    const chatData = await chatResponse.json();

    const replyText = chatData?.choices?.[0]?.message?.content || "Lo siento, ha ocurrido un error.";

    // 2. Convert reply to speech via ElevenLabs
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: replyText,
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.75
        }
      })
    });

    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    // 3. Return reply text + audio
    res.status(200).json({
      reply: replyText,
      audioBase64: base64Audio
    });

  } catch (err) {
    console.error("Error in chat handler:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}
