import { NextRequest, NextResponse } from 'next/server';
import { parseCatalogText } from '@/lib/gemini';
import { bulkInsertCourses } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData     = await req.formData();
    const file         = formData.get('file') as File | null;
    const defaultMajor = (formData.get('defaultMajor') as string) || undefined;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText  = '';

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse')).default;
      rawText = (await pdfParse(buffer)).text;
    } else {
      rawText = buffer.toString('utf-8');
    }

    if (!rawText.trim()) return NextResponse.json({ error: 'Could not extract text from file' }, { status: 422 });

    const courses  = await parseCatalogText(rawText, defaultMajor);
    if (!courses.length) return NextResponse.json({ error: 'No courses found in document' }, { status: 422 });

    const inserted = await bulkInsertCourses(courses);
    return NextResponse.json({ inserted, total: courses.length, courses });
  } catch (e: any) {
    console.error('[POST /api/catalog]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
