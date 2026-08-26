import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Team from '@/lib/models/Team';
import { buildProgressPayload } from '@/lib/progress';

export async function POST(request) {
  try {
    await dbConnect();
    const { accessCode } = await request.json();
    const code = String(accessCode || '')
      .trim()
      .toUpperCase();

    if (!/^[A-Z0-9]{6}$/.test(code)) {
      return NextResponse.json({ error: 'Enter your 6-character team access code.' }, { status: 400 });
    }

    const team = await Team.findOne({ accessCode: code });
    if (!team) {
      return NextResponse.json({ error: 'Invalid access code. Ask a volunteer for help.' }, { status: 401 });
    }

    const progress = await buildProgressPayload(team);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('login error', error);
    return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500 });
  }
}
