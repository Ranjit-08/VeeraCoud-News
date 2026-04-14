export async function onRequestPost(context) {
  const { env } = context;

  const fallbackNews = [
    {
      id: 1,
      title: "AWS expands container optimization updates",
      summary: "AWS introduced improvements around container performance and operational visibility.",
      source: "CloudPulse",
      category: "aws"
    },
    {
      id: 2,
      title: "Azure strengthens AI workload deployment options",
      summary: "Azure added enhancements for deploying AI workloads with better control and scale.",
      source: "CloudPulse",
      category: "azure"
    },
    {
      id: 3,
      title: "Google Cloud improves Kubernetes operations",
      summary: "GCP continues improving Kubernetes-based deployment workflows and observability.",
      source: "CloudPulse",
      category: "gcp"
    },
    {
      id: 4,
      title: "Terraform usage grows in multi-cloud automation",
      summary: "Infrastructure teams are increasing Terraform adoption for repeatable cloud automation.",
      source: "CloudPulse",
      category: "terraform"
    },
    {
      id: 5,
      title: "DevOps teams focus more on platform engineering",
      summary: "Internal platform engineering remains a major trend across modern DevOps teams.",
      source: "CloudPulse",
      category: "devops"
    }
  ];

  const prompt = `Generate exactly 5 cloud and DevOps news items.

Return ONLY valid JSON array.
Each object must contain:
- id
- title
- summary
- source
- category

Keep each summary under 25 words.
Topics: AWS, Azure, GCP, Kubernetes, DevOps, Terraform.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 700
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(fallbackNews), {
        headers: { "Content-Type": "application/json" }
      });
    }

    let raw = data.choices?.[0]?.message?.content?.trim() || "[]";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let articles;
    try {
      articles = JSON.parse(raw);
    } catch {
      articles = fallbackNews;
    }

    return new Response(JSON.stringify(articles), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify(fallbackNews), {
      headers: { "Content-Type": "application/json" }
    });
  }
} 