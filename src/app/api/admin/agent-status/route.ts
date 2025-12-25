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

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if agent service is running
    const { stdout } = await execAsync(
      `ssh root@${DO_SERVER} "systemctl is-active autonomous-agent.service && systemctl status autonomous-agent.service | grep 'Active:'"`
    );

    const isActive = stdout.includes('active (running)');

    // Extract uptime if available
    const uptimeMatch = stdout.match(/Active: active \(running\) since (.+?);/);
    const uptime = uptimeMatch ? uptimeMatch[1] : undefined;

    return NextResponse.json({
      running: isActive,
      uptime,
      last_check: new Date().toISOString()
    });
  } catch (error: any) {
    // If the command fails, the service is likely stopped
    return NextResponse.json({
      running: false,
      last_check: new Date().toISOString(),
      error: error.message
    });
  }
}
