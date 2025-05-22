export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Missing user message" });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("Missing OPENROUTER_API_KEY");
    return res.status(500).json({ error: "Server misconfigured: Missing API key" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
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

    if (!response.ok) {
      console.error("OpenRouter API error:", data);
      return res.status(500).json({ error: "API call failed", details: data });
    }

    if (data.choices && data.choices.length > 0) {
      return res.status(200).json({ reply: data.choices[0].message.content });
    } else {
      console.error("Unexpected API response:", data);
      return res.status(500).json({ error: "No reply generated" });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}