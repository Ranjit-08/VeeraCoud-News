export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.GROQ_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing GROQ_KEY secret in Cloudflare Pages settings" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const body = await request.json();
    const prompt = body.prompt;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 7500
      })
    });

    const data = await groqResponse.json();

    return new Response(JSON.stringify(data), {
      status: groqResponse.status,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}