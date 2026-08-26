import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import Team from '@/lib/models/Team';
import { buildProgressPayload } from '@/lib/progress';

export async function GET(request) {
  try {
    await dbConnect();
    const accessCode = new URL(request.url).searchParams.get('accessCode') || '';
    const code = accessCode.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Missing access code.' }, { status: 400 });
    }

    const team = await Team.findOne({ accessCode: code });
    if (!team) {
      return NextResponse.json({ error: 'Team session expired.' }, { status: 401 });
    }

    return NextResponse.json(await buildProgressPayload(team));
  } catch (error) {
    console.error('progress error', error);
    return NextResponse.json({ error: 'Unable to load progress.' }, { status: 500 });
  }
}
