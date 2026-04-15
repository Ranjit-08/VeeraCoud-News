export async function onRequestPost(context) {
  const { env } = context;

  // ── Fallback articles (used if Groq fails) ──────────────
  const fallbackNews = [
    {
      id: 1,
      title: "AWS Graviton4 delivers 40% compute gains in EKS workloads",
      summary: "Graviton4-powered EC2 instances show significant performance improvements for containerised workloads on Amazon EKS, with teams reporting up to 40% faster request throughput.",
      content: "AWS Graviton4 has been benchmarked extensively across EKS-managed workloads and the results point to a meaningful leap in performance. Engineering teams running Java microservices reported up to 40% faster request throughput compared to Graviton3, with some Go-based services seeing even higher gains.\n\nThe improvements are attributed to a redesigned memory subsystem and wider SIMD execution units that handle vectorised computation more efficiently. Teams using Graviton4 with Bottlerocket as the node OS saw further improvements in cold-start latency for containerised applications, cutting initialisation times by roughly a quarter.\n\nCost efficiency also improved dramatically: the same throughput is achievable with roughly 30% fewer nodes, translating directly to reduced EC2 spend for auto-scaling clusters. For organisations with large EKS fleets, the migration payback period is estimated at under three months.\n\nAWS has also updated its Savings Plans to include Graviton4 at the same discount tiers as Graviton3, removing the pricing barrier that had slowed enterprise adoption of earlier ARM-based instance generations.",
      tags: ["aws", "kubernetes"],
      source: "AWS Blog",
      category: "announcement"
    },
    {
      id: 2,
      title: "Azure AI Foundry expands to six new APAC regions",
      summary: "Microsoft's AI Foundry platform is now available across Southeast Asia, enabling low-latency model inference close to regional customers with new data residency guarantees.",
      content: "Azure AI Foundry's regional expansion brings managed model endpoints to Singapore, Tokyo, Sydney, Mumbai, Seoul, and Taipei. The move is designed to satisfy data residency requirements for enterprises operating in regulated APAC markets, particularly in financial services and healthcare.\n\nDevelopers can now deploy fine-tuned GPT-4o and Phi-3 models with single-digit millisecond latency from regional hubs. The expansion is paired with new private networking options via Azure Private Link, ensuring traffic stays within regional boundaries and never traverses the public internet.\n\nMicrosoft also announced a 20% price reduction on inference tokens for Phi-3-mini in all new regions, targeting cost-sensitive workloads like document classification and support chat. Early access customers in Singapore reported a 60% reduction in end-to-end response latency compared to routing through the nearest US West region.\n\nThe expansion also unlocks new compliance certifications including MAS TRM for Singapore-based financial institutions and IRAP for Australian government workloads.",
      tags: ["azure"],
      source: "Azure Updates",
      category: "announcement"
    },
    {
      id: 3,
      title: "Kubernetes 1.32 reaches GA with native sidecar container support",
      summary: "The long-awaited sidecar container feature graduates to stable in Kubernetes 1.32, simplifying service mesh and log-shipping architectures across the ecosystem.",
      content: "Kubernetes 1.32 marks the general availability of sidecar containers as a first-class API concept. Previously teams relied on init containers or custom operators to manage lifecycle dependencies between application and proxy containers, resulting in brittle startup ordering workarounds.\n\nWith the new restartPolicy: Always field on init containers, sidecars now start before the main application and remain running for the pod's lifetime. This directly addresses the most common Istio and Envoy lifecycle race conditions that plagued earlier versions, where the proxy container would sometimes start after the application had already begun accepting traffic.\n\nThe release also introduces improved memory manager behaviour for NUMA-aware scheduling and a new DRA (Dynamic Resource Allocation) plugin model for accelerator hardware, laying groundwork for cleaner GPU scheduling across heterogeneous clusters.\n\nCluster operators upgrading from 1.31 will find the migration straightforward: existing workloads are unaffected, and the new sidecar semantics are opt-in per container. The Kubernetes project also notes that this feature significantly reduces the complexity of Istio ambient mode deployments.",
      tags: ["kubernetes", "gcp"],
      source: "Cloud Native Now",
      category: "news"
    },
    {
      id: 4,
      title: "Terraform 1.9 introduces provider functions and ephemeral resources",
      summary: "HashiCorp's latest release adds custom provider-defined functions callable in HCL expressions and a new ephemeral resource type for managing short-lived secrets safely.",
      content: "Terraform 1.9 ships two headline features that address long-standing community requests. Provider functions allow provider authors to expose custom functions callable directly in HCL expressions, removing the need for external data sources just to compute simple transformations like CIDR block calculations or ARN parsing.\n\nEphemeral resources introduce a lifecycle that does not persist to state. The canonical use case is short-lived credentials: a Vault token or AWS STS session generated during a plan can now be consumed within the same operation without leaving sensitive values in tfstate files or leaking them into plan output.\n\nBoth features work with the OpenTofu fork as well, following the specification-sharing agreement between HashiCorp and the OpenTofu steering committee. Several major providers including AWS, Azure, and Google Cloud have already shipped updated versions with ephemeral resource support for their secrets management integrations.\n\nThe release also includes performance improvements to the dependency graph solver that reduce plan times by up to 25% for large root modules with hundreds of resources.",
      tags: ["terraform", "devops"],
      source: "InfoQ",
      category: "news"
    },
    {
      id: 5,
      title: "Platform engineering adoption reaches 65% across enterprise DevOps teams",
      summary: "The 2025 DORA report highlights internal developer platforms as the top investment priority, with teams reporting four times higher deployment frequency when IDPs are in place.",
      content: "The 2025 DORA State of DevOps report surveyed over 3,200 engineers and found that 65% of high-performing organisations now maintain a dedicated internal developer platform. Teams with IDPs reported four times higher deployment frequency compared to those without, the largest gap DORA has measured in its eight years of research.\n\nThe data points to golden paths and self-service infrastructure as the two capabilities with the highest impact on developer satisfaction. Teams spending more than 30% of their time on environment provisioning consistently ranked in the low-performing cohort, while those with fully automated provisioning showed the strongest improvement year-over-year.\n\nPlatform engineering as a discipline is also maturing: 44% of respondents reported having a named platform team with dedicated headcount, up from 29% in the prior year's survey. The median platform team size is now six engineers, with a mix of infrastructure, developer experience, and product management roles.\n\nThe report also found that organisations treating their IDP as an internal product — with user research, feedback loops, and a roadmap — outperformed those treating it as a shared infrastructure service by a factor of two on reliability metrics.",
      tags: ["devops"],
      source: "DevOps.com",
      category: "analysis"
    }
  ];

  // ── Prompt requesting full article content ──────────────
  const prompt = `You are a cloud tech editor. Return ONLY a valid JSON array of 8 news articles. No markdown, no code fences, no explanation — just the raw JSON array.

Each object must have these exact keys:
- "id": number 1-8
- "title": specific headline with real product names (EKS, AKS, BigQuery, ArgoCD, Bedrock, Cloud Run, Vertex AI, etc.)
- "summary": 2-3 sentences, max 60 words, punchy and informative
- "content": 4 paragraphs of 50-70 words each, written as a proper tech news article with specific details, numbers, and technical context. NO PLACEHOLDER TEXT. Each paragraph separated by \\n\\n.
- "tags": array of 1-2 values from ["aws","azure","gcp","devops","multicloud","kubernetes","terraform"]
- "source": realistic tech publication name (AWS Blog, Azure Updates, InfoQ, The New Stack, etc.)
- "category": one of ["announcement","analysis","tutorial","news","case-study"]

Cover these 8 topics (one each):
1. AWS compute or serverless (Lambda, EC2, Graviton, Fargate)
2. Azure AI or ML services (AI Foundry, OpenAI integration, Copilot)
3. GCP Kubernetes or data (GKE, BigQuery, Dataflow, Vertex)
4. DevOps tooling (CI/CD pipelines, observability, ArgoCD, Grafana)
5. Multicloud or FinOps (cost optimisation, cloud spend, FOCUS spec)
6. AWS security or networking (IAM, VPC, Shield, WAF)
7. Terraform or IaC (OpenTofu, Pulumi, CDK)
8. Platform engineering or SRE culture (IDPs, golden paths, reliability)`;

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
        max_tokens: 3500
      })
    });

    if (!response.ok) {
      console.error("Groq error:", response.status, await response.text());
      return jsonResponse(fallbackNews);
    }

    const data = await response.json();
    let raw = data.choices?.[0]?.message?.content?.trim() || "[]";

    // Strip markdown fences if model added them
    raw = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let articles;
    try {
      articles = JSON.parse(raw);
      if (!Array.isArray(articles) || articles.length === 0) throw new Error("empty array");
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr.message);
      articles = fallbackNews;
    }

    // Ensure every article has content — fall back to summary if missing
    articles = articles.map((a, i) => ({
      ...a,
      content: a.content && a.content.trim().length > 30 ? a.content : a.summary
    }));

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
      "Access-Control-Allow-Origin": "*"
    }
  });
}