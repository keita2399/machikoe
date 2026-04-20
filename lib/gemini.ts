import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
});

async function invoke(system: string, user: string): Promise<string> {
  const res = await model.invoke([
    new SystemMessage(system),
    new HumanMessage(user),
  ]);
  return typeof res.content === "string" ? res.content : res.content[0]?.toString() ?? "";
}

export async function generateTopicSummary(rawText: string): Promise<string> {
  return invoke(
    "地方議会の議事録を要約するアシスタントです。回答は必ず1文・50字以内。それ以上は書かないでください。",
    `以下の議事録の要点を「○○について、△△が審議された。」の形で1文・50字以内で答えてください。背景・経緯・感想は一切不要です。\n\n${rawText}`
  );
}

export async function generateImpactDescription(
  rawText: string,
  userType: "resident" | "business" | "other"
): Promise<string> {
  const label = userType === "resident" ? "住民" : userType === "business" ? "事業者" : "町民";
  return invoke(
    "地方議会の議題が住民生活に与える影響を説明するアシスタントです。中立的なトーンで、ポイントを絞って伝えてください。",
    `以下の議題について、${label}への影響を「メリット1点・デメリットまたは注意点1点」の形で、合計80字以内で答えてください。箇条書き不要、自然な日本語で。\n\n${rawText}`
  );
}

export async function generateOpinionDraft(
  topicSummary: string,
  stance: "agree" | "disagree" | "conditional",
  userType: "resident" | "business" | "other"
): Promise<string> {
  const stanceLabel = stance === "agree" ? "賛成" : stance === "disagree" ? "反対" : "条件付き賛成";
  const userLabel = userType === "resident" ? "住民" : userType === "business" ? "事業者" : "町民";
  return invoke(
    "あなたは住民の意見表明を支援するアシスタントです。丁寧な言葉遣いを保ちながら、主張は明確・端的に伝えてください。応援や感想ではなく「何を求めているか」を言い切る文章にしてください。",
    `以下の議題に対して「${stanceLabel}」の立場から、${userLabel}として意見文を生成してください。

【形式】
・1文目：立場と主張を一言で言い切る（例：「〜については賛成です。ただし〜を求めます。」）
・箇条書き2〜3点：具体的な要望・懸念・理由を端的に記述
・丁寧語を使うが、あいまいな表現や応援文句は不要

【文字数】全体で120字前後

議題の概要：${topicSummary}`
  );
}
