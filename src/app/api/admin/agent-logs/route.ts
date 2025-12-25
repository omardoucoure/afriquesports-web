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
    const { searchParams } = new URL(request.url);
    const lines = searchParams.get('lines') || '50';

    // Fetch recent logs from the agent
    const { stdout } = await execAsync(
      `ssh root@${DO_SERVER} "tail -${lines} /var/log/autonomous-agent.log"`
    );

    // Parse logs into structured format
    const logLines = stdout.trim().split('\n').filter(line => line.length > 0);
    const logs = logLines.map(line => {
      // Try to extract timestamp
      const timestampMatch = line.match(/(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})/);
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toLocaleString();

      // Determine log type
      let type: 'info' | 'error' | 'success' = 'info';
      if (line.includes('ERROR') || line.includes('❌') || line.includes('Error')) {
        type = 'error';
      } else if (line.includes('✅') || line.includes('SUCCESS') || line.includes('saved')) {
        type = 'success';
      }

      return {
        timestamp,
        message: line,
        type
      };
    });

    return NextResponse.json({
      logs,
      count: logs.length
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch logs', message: error.message },
      { status: 500 }
    );
  }
}
