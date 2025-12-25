import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token-' + Date.now();
const DO_SERVER = '159.223.103.16';

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7);
  return token === ADMIN_TOKEN;
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (!['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be start, stop, or restart' },
        { status: 400 }
      );
    }

    // Execute systemctl command
    const { stdout, stderr } = await execAsync(
      `ssh root@${DO_SERVER} "systemctl ${action} autonomous-agent.service && systemctl status autonomous-agent.service"`
    );

    return NextResponse.json({
      success: true,
      action,
      message: `Agent ${action} successful`,
      output: stdout
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Control action failed', message: error.message },
      { status: 500 }
    );
  }
}
