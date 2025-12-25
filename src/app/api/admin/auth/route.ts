import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'afriquesports2025';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token-' + Date.now();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        token: ADMIN_TOKEN
      });
    }

    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Authentication failed', message: error.message },
      { status: 500 }
    );
  }
}
