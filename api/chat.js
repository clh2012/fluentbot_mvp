export default async function handler(req, res) {
  const userMessage = req.body.message;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
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

  const data = await response.json();

  if (data.choices && data.choices.length > 0) {
    res.status(200).json({ reply: data.choices[0].message.content });
  } else {
    console.error("API error:", data);
    res.status(500).json({ reply: "Lo siento, ha ocurrido un error." });
  }
}
