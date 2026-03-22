import { NextRequest, NextResponse } from 'next/server';
import { getAllCourses } from '@/lib/db';
import { chatAdvisorTurn } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { history, message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const courses = await getAllCourses();
    const fullHistory = [...(history || []), { role: 'user', parts: message }];
    const reply   = await chatAdvisorTurn(fullHistory, courses);

    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error('[POST /api/chat]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
