/**
 * CAN 2025 Matches API
 * Alias for /api/can2025/schedule endpoint
 *
 * This endpoint returns the same data as the schedule endpoint
 * for backwards compatibility and clearer API semantics.
 */

// Import the schedule handler
import { GET as getSchedule } from '../schedule/route';

export async function GET() {
  // Proxy to the schedule endpoint
  return getSchedule();
}

// Cache configuration
export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = 'force-dynamic'; // Always fetch fresh data
