export async function onRequestPost(context) {
  const { env } = context;

  const prompt = `You are a senior cloud technology editor.
Generate exactly 8 realistic, current-looking cloud/devops news articles.

Return ONLY a valid JSON array.
Each object must contain:
- id
- title
- summary
- source
- category

Topics should cover AWS, Azure, GCP, Kubernetes, DevOps, Terraform, and platform engineering.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2500
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data?.error?.message || "Groq API failed" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    let raw = data.choices?.[0]?.message?.content?.trim() || "[]";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let articles;
    try {
      articles = JSON.parse(raw);
    } catch {
      return new Response(
        JSON.stringify({ error: "Model returned invalid JSON", raw }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(JSON.stringify(articles), {
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}