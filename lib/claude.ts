import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-20250514";

export async function generateTopicSummary(rawText: string): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system:
      "あなたは地方議会の議事録を住民向けにわかりやすく要約するアシスタントです。専門用語を避け、中学生でも理解できる言葉で書いてください。",
    messages: [
      {
        role: "user",
        content: `以下の議事録テキストを3行以内で要約してください。住民が「自分ごと」として理解できるよう、具体的な影響を含めてください。\n\n${rawText}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text;
}

export async function generateImpactDescription(
  rawText: string,
  userType: "resident" | "business" | "other"
): Promise<string> {
  const userTypeLabel =
    userType === "resident" ? "一般住民" : userType === "business" ? "事業者" : "その他";

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system:
      "あなたは地方議会の議題が住民生活に与える影響を説明するアシスタントです。中立的・建設的なトーンを維持し、特定の立場への誘導は行いません。",
    messages: [
      {
        role: "user",
        content: `以下の議題について、${userTypeLabel}への影響を200字以内で具体的に説明してください。\n\n${rawText}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text;
}

export async function generateOpinionDraft(
  topicSummary: string,
  stance: "agree" | "disagree" | "conditional",
  userType: "resident" | "business" | "other"
): Promise<string> {
  const stanceLabel =
    stance === "agree" ? "賛成" : stance === "disagree" ? "反対" : "条件付き賛成";
  const userTypeLabel =
    userType === "resident" ? "住民" : userType === "business" ? "事業者" : "町民";

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system:
      "あなたは住民の意見表明を支援するアシスタントです。中立的・建設的なトーンを維持し、パブリックコメントやSNS投稿に使える意見文を生成します。断定的・感情的な表現は避け、建設的な提案を含めてください。",
    messages: [
      {
        role: "user",
        content: `以下の議題に対して「${stanceLabel}」の立場から、${userTypeLabel}として意見文を150〜200字で生成してください。X（Twitter）への投稿にも使えるよう、読みやすい文体にしてください。\n\n議題の概要：${topicSummary}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text;
}
