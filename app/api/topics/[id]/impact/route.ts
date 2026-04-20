import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateImpactDescription } from "@/lib/gemini";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userType } = await request.json();

    if (!["resident", "business", "other"].includes(userType)) {
      return NextResponse.json({ error: "Invalid userType" }, { status: 400 });
    }

    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const impact = await generateImpactDescription(
      topic.rawText || topic.summary,
      userType as "resident" | "business" | "other"
    );

    return NextResponse.json({ impact });
  } catch (err) {
    console.error("POST /api/topics/[id]/impact error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
