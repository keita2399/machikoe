import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOpinionDraft } from "@/lib/gemini";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { stance, userType } = await request.json();

    if (!["agree", "disagree", "conditional"].includes(stance)) {
      return NextResponse.json({ error: "Invalid stance" }, { status: 400 });
    }

    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const draft = await generateOpinionDraft(
      topic.summary,
      stance as "agree" | "disagree" | "conditional",
      (userType ?? "resident") as "resident" | "business" | "other"
    );

    return NextResponse.json({ draft });
  } catch (err) {
    console.error("POST /api/topics/[id]/draft error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
