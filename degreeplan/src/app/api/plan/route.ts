import { NextRequest, NextResponse } from 'next/server';
import { getAllCourses, savePlan } from '@/lib/db';
import { generateDegreePlan } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcriptText, major, secondMajor, standing, gradTerm, maxUnits, includeSummer } = body;

    if (!transcriptText?.trim()) return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    if (!major)                  return NextResponse.json({ error: 'Major is required' },      { status: 400 });

    const courses = await getAllCourses();
    const result  = await generateDegreePlan({ transcriptText, major, secondMajor, standing, gradTerm, maxUnits, includeSummer, courses });

    await savePlan({
      major, second_major: secondMajor, standing, grad_term: gradTerm,
      max_units: maxUnits, include_summer: includeSummer,
      transcript_text: transcriptText, result_json: result, feasibility: result.feasibility,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[POST /api/plan]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
