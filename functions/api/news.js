export async function onRequestPost(context) {
  const { env } = context;

  // ── Fallback articles (used if Groq fails) ──────────────
  const fallbackNews = [
    {
      id: 1, title: "AWS Graviton4 delivers 40% compute gains in EKS workloads",
      summary: "Graviton4-powered EC2 instances show significant performance improvements for containerised workloads on Amazon EKS.",
      content: "AWS Graviton4 has been benchmarked extensively across EKS-managed workloads and the results point to a meaningful leap in performance. Engineering teams running Java microservices reported up to 40% faster request throughput compared to Graviton3.\n\nThe gains are attributed to a redesigned memory subsystem and wider SIMD execution units. Teams leveraging Graviton4 with Bottlerocket as the node OS saw further improvements in cold-start latency for containerised applications.\n\nCost efficiency also improved: the same throughput is achievable with roughly 30% fewer nodes, translating directly to reduced EC2 spend for auto-scaling clusters.",
      tags: ["aws", "kubernetes"], source: "AWS Blog", category: "announcement"
    },
    {
      id: 2, title: "Azure AI Foundry expands to six new APAC regions",
      summary: "Microsoft's AI Foundry platform is now available across Southeast Asia, enabling low-latency model inference close to regional customers.",
      content: "Azure AI Foundry's regional expansion brings managed model endpoints to Singapore, Tokyo, Sydney, Mumbai, Seoul, and Taipei. The move is designed to satisfy data residency requirements for enterprises operating in regulated APAC markets.\n\nDevelopers can now deploy fine-tuned GPT-4o and Phi-3 models with single-digit millisecond latency from regional hubs. The expansion is paired with new private networking options via Azure Private Link, ensuring traffic stays within regional boundaries.\n\nMicrosoft also announced a 20% price reduction on inference tokens for Phi-3-mini in all new regions, targeting cost-sensitive workloads like document classification and support chat.",
      tags: ["azure"], source: "Azure Updates", category: "announcement"
    },
    {
      id: 3, title: "Kubernetes 1.32 reaches GA with native sidecar container support",
      summary: "The long-awaited sidecar container feature graduates to stable, simplifying service mesh and log-shipping architectures.",
      content: "Kubernetes 1.32 marks the general availability of sidecar containers as a first-class API concept. Previously teams relied on init containers or custom operators to manage lifecycle dependencies between application and proxy containers.\n\nWith the new `restartPolicy: Always` field on init containers, sidecars now start before the main application and remain running for the pod's lifetime. This directly addresses the most common Istio and Envoy lifecycle race conditions that plagued earlier versions.\n\nThe release also introduces improved memory manager behaviour and a new DRA (Dynamic Resource Allocation) plugin model for accelerator hardware, laying groundwork for cleaner GPU scheduling across heterogeneous clusters.",
      tags: ["kubernetes", "gcp"], source: "Cloud Native Now", category: "news"
    },
    {
      id: 4, title: "Terraform 1.9 introduces provider functions and ephemeral resources",
      summary: "HashiCorp's latest release adds custom provider-defined functions and a new ephemeral resource type for short-lived secrets.",
      content: "Terraform 1.9 ships two headline features that address long-standing community requests. Provider functions allow provider authors to expose custom functions callable directly in HCL expressions — removing the need for external data sources just to compute simple transformations.\n\nEphemeral resources introduce a lifecycle that does not persist to state. The canonical use case is short-lived credentials: a Vault token or AWS STS session generated during a plan can now be consumed within the same operation without leaving sensitive values in tfstate.\n\nBoth features work with the OpenTofu fork as well, following the specification-sharing agreement between HashiCorp and the OpenTofu steering committee announced earlier this year.",
      tags: ["terraform", "devops"], source: "InfoQ", category: "news"
    },
    {
      id: 5, title: "Platform engineering adoption reaches 65% across enterprise DevOps teams",
      summary: "A new DORA report highlights internal developer platforms as the top investment priority for organisations seeking to improve deployment frequency.",
      content: "The 2025 DORA State of DevOps report surveyed over 3,200 engineers and found that 65% of high-performing organisations now maintain a dedicated internal developer platform. Teams with IDPs reported four times higher deployment frequency compared to those without.\n\nThe data points to golden paths and self-service infrastructure as the two capabilities with the highest impact on developer satisfaction. Teams spending more than 30% of their time on environment provisioning consistently ranked in the low-performing cohort.\n\nPlatform engineering as a discipline is also maturing: 44% of respondents reported having a named platform team with dedicated headcount, up from 29% in the prior year's survey.",
      tags: ["devops"], source: "DevOps.com", category: "analysis"
    }
  ];

  // ── Lean, token-efficient prompt ────────────────────────
  // Asks for 8 articles (enough for hero + side + 5 list cards)
  // Keeps summaries short, skips `content` to save tokens
  // Frontend will use `summary` as modal body if `content` absent
  const prompt = `You are a cloud tech editor. Return ONLY a valid JSON array of 8 news articles. No markdown, no explanation.

Each object must have these exact keys:
- "id": number 1-8
- "title": specific headline with real product names (EKS, AKS, BigQuery, ArgoCD, Bedrock, Cloud Run, etc.)
- "summary": 2-3 sentences, max 60 words
- "tags": array, 1-2 values from ["aws","azure","gcp","devops","multicloud","kubernetes","terraform"]
- "source": realistic tech publication name
- "category": one of ["announcement","analysis","tutorial","news","case-study"]

Cover these 8 topics (one each):
1. AWS compute or serverless
2. Azure AI or ML services
3. GCP Kubernetes or data
4. DevOps tooling (CI/CD, observability)
5. Multicloud or FinOps
6. AWS security or networking
7. Terraform or IaC
8. Platform engineering or SRE culture`;

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
        temperature: 0.7,
        max_tokens: 1800   // enough for 8 articles with summaries only
      })
    });

    if (!response.ok) {
      console.error("Groq error:", response.status);
      return jsonResponse(fallbackNews);
    }

    const data = await response.json();
    let raw = data.choices?.[0]?.message?.content?.trim() || "[]";

    // Strip markdown fences if model added them
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let articles;
    try {
      articles = JSON.parse(raw);
      if (!Array.isArray(articles) || articles.length === 0) throw new Error("empty");
    } catch {
      console.error("JSON parse failed, using fallback");
      articles = fallbackNews;
    }

    return jsonResponse(articles);

  } catch (error) {
    console.error("Function error:", error);
    return jsonResponse(fallbackNews);
  }
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"   // allows same-origin + local dev
    }
  });
}