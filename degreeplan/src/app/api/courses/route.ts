import { NextRequest, NextResponse } from 'next/server';
import { getAllCourses, upsertCourse, updateCourse, deleteCourse } from '@/lib/db';

export async function GET() {
  try {
    const courses = await getAllCourses();
    return NextResponse.json({ courses });
  } catch (e: any) {
    console.error('[GET /api/courses]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const course = await upsertCourse(body);
    return NextResponse.json({ course }, { status: 201 });
  } catch (e: any) {
    console.error('[POST /api/courses]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') ?? '');
    if (isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const body   = await req.json();
    const course = await updateCourse(id, body);
    return NextResponse.json({ course });
  } catch (e: any) {
    console.error('[PUT /api/courses]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') ?? '');
    if (isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await deleteCourse(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[DELETE /api/courses]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
