# Fixing Vercel Function Timeouts and MySQL Connection Errors

## Problem 1: Function Timeout Error

**Error:**
```
Your function was stopped as it did not return an initial response within 25s
```

### Understanding the Issue

- **Edge Functions:** Must start responding within 25 seconds
- **Node.js Functions:** Default timeout is 10-60 seconds (depending on plan)
- **Root cause:** Long-running operations block the response

### Solutions (Pick the Best for Each Route)

---

#### Solution 1: Increase maxDuration ⚡ EASIEST

For routes that need more time but will finish eventually.

```typescript
// Add to any API route or page
export const maxDuration = 60; // Pro plan: up to 300s with Fluid Compute
```

**Apply to:**
- `/api/cron/seo-agent/route.ts` (already has 60s)
- `/api/cron/preindex-matches/route.ts` (already has 30s)
- Any route doing heavy processing

**Limits:**
- Free/Hobby: 10s max
- Pro: 60s max (300s with Fluid Compute enabled)
- Enterprise: 900s max

---

#### Solution 2: Streaming Responses 🌊 BEST FOR LONG OPERATIONS

For AI operations, large data processing, or anything that takes >25s.

**Example - AI Commentary Generation:**

```typescript
// BEFORE: Times out after 25s
export async function POST(request: Request) {
  const commentary = await generateAICommentary(); // Takes 60s
  return NextResponse.json({ commentary });
}

// AFTER: Streams response immediately
export async function POST(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial response immediately (prevents timeout)
        controller.enqueue(encoder.encode('data: {"status":"processing"}\\n\\n'));

        // Process in chunks
        for await (const chunk of generateAICommentaryStream()) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\\n\\n`));
        }

        controller.enqueue(encoder.encode('data: {"status":"complete"}\\n\\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Benefits:**
- Response starts immediately (no timeout)
- Can run for up to 300 seconds
- Better UX (progressive loading)

**Sources:**
- [Vercel Streaming Documentation](https://vercel.com/docs/concepts/functions/edge-functions/streaming)
- [Streaming from Node.js on Vercel](https://vercel.com/blog/streaming-for-serverless-node-js-and-edge-runtimes-with-vercel-functions)

---

#### Solution 3: Return Immediately + Background Processing 🔄 BEST FOR ASYNC

For operations that don't need immediate results (cron jobs, webhooks).

```typescript
// BEFORE: Waits for completion
export async function GET(request: Request) {
  const result = await processHeavyOperation(); // Blocks
  return NextResponse.json(result);
}

// AFTER: Returns immediately, processes in background
export async function GET(request: Request) {
  // Return success immediately
  const response = NextResponse.json({
    status: 'processing',
    message: 'Operation started in background'
  });

  // Process in background (don't await)
  processHeavyOperation()
    .then(result => console.log('✅ Background task completed:', result))
    .catch(error => console.error('❌ Background task failed:', error));

  return response;
}
```

**Apply to:**
- Cron jobs (they don't need to wait for completion)
- Webhooks (acknowledge receipt, then process)
- Image processing
- Email sending

---

#### Solution 4: Use Upstash Workflow 🚀 PREMIUM SOLUTION

For complex, multi-step workflows.

> "With Upstash Workflow, you don't pay for the idle time of the function while waiting for the API response"
> — [Get Rid of Function Timeouts](https://upstash.com/blog/vercel-cost-workflow)

**Benefits:**
- No timeout issues
- Reduces costs (don't pay for idle time)
- Automatic retries
- Can run for hours

**Example:**
```typescript
import { serve } from "@upstash/workflow/nextjs";

export const POST = serve(async (context) => {
  // Step 1: Fetch data (can take minutes)
  const data = await context.run("fetch-data", async () => {
    return await fetchLargeDataset();
  });

  // Step 2: Process (can take more minutes)
  const processed = await context.run("process", async () => {
    return await processData(data);
  });

  // Step 3: Save (even more time)
  await context.run("save", async () => {
    await saveToDatabase(processed);
  });

  return { success: true };
});
```

**Cost:** ~$10/month for starter plan (worth it if you have many long-running tasks)

Source: [Upstash Workflow](https://upstash.com/blog/vercel-cost-workflow)

---

## Problem 2: MySQL ECONNRESET Error

**Error:**
```
[MySQL] Error in batch insert: Error: write ECONNRESET
code: 'ECONNRESET',
errno: -104
```

### Understanding the Issue

**ECONNRESET** means the MySQL server forcibly closed the connection. Common causes:

1. **Connection timeout:** Connection idle too long
2. **Network interruption:** Packet loss between Vercel and WordPress server
3. **MySQL max_connections:** Server hit connection limit
4. **Serverless cold starts:** Old connections become stale

### Solutions

---

#### Solution 1: Add Connection Retry Logic with Exponential Backoff ⚡ CRITICAL

```typescript
// src/lib/mysql-db.ts

async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T | null> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Only retry on connection errors
      if (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'PROTOCOL_CONNECTION_LOST'
      ) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`[MySQL] Connection error on attempt ${attempt}/${maxRetries}, retrying in ${delay}ms...`, error.code);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Non-retryable error or max retries exceeded
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// Update batchRecordVisits to use retry logic
export async function batchRecordVisits(visits: VisitData[]): Promise<mysql.ResultSetHeader | null> {
  return executeWithRetry(async () => {
    const db = getPool();
    if (!db) return null;
    if (visits.length === 0) return null;

    const visitDate = new Date().toISOString().split('T')[0];

    // ... existing batch insert logic ...

    const [result] = await db.query<mysql.ResultSetHeader>(sql, values);
    console.log(`[MySQL] Batch insert completed: ${visits.length} visits, ${result.affectedRows} rows affected`);
    return result;
  });
}
```

**Benefits:**
- Automatically retries failed connections
- Exponential backoff prevents overwhelming the server
- Handles network glitches gracefully

---

#### Solution 2: Add Connection Timeouts and Keepalive ⚡ IMPORTANT

```typescript
// src/lib/mysql-db.ts

function getPool(): mysql.Pool | null {
  if (pool) return pool;

  const config = {
    host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
    user: process.env.WORDPRESS_DB_USER,
    password: process.env.WORDPRESS_DB_PASSWORD,
    database: process.env.WORDPRESS_DB_NAME || 'wordpress',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // ADD THESE:
    connectTimeout: 10000, // 10 seconds to establish connection
    acquireTimeout: 10000, // 10 seconds to acquire connection from pool
    timeout: 60000, // 60 seconds query timeout
    enableKeepAlive: true, // Keep connections alive
    keepAliveInitialDelay: 0, // Start keepalive immediately
  };

  // ... rest of existing code
}
```

**What this fixes:**
- `connectTimeout`: Prevents hanging on connection attempts
- `acquireTimeout`: Fails fast if pool is exhausted
- `timeout`: Kills queries that run too long
- `enableKeepAlive`: Prevents connections from going stale

---

#### Solution 3: Connection Pool Health Check 🔍 PROACTIVE

Add a health check to detect and remove stale connections:

```typescript
// src/lib/mysql-db.ts

async function healthCheckPool(): Promise<void> {
  const db = getPool();
  if (!db) return;

  try {
    await db.query('SELECT 1');
    console.log('[MySQL] Health check passed');
  } catch (error) {
    console.error('[MySQL] Health check failed, recreating pool...', error);

    // Close and recreate pool
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }

    // Next getPool() call will create new pool
  }
}

// Run health check periodically (optional, for long-running processes)
if (typeof setInterval !== 'undefined') {
  setInterval(healthCheckPool, 60000); // Every minute
}
```

---

#### Solution 4: Handle Connection Errors in Batch Processor 🔄 RESILIENCE

Update the visit batch processor to handle failures better:

```typescript
// src/lib/visit-batch-processor.ts

async flush(): Promise<void> {
  if (this.isProcessing || this.queue.length === 0) {
    return;
  }

  this.isProcessing = true;
  let batch: QueuedVisit[] = [];

  try {
    batch = this.queue.splice(0, this.BATCH_SIZE);
    if (batch.length === 0) return;

    console.log(`[VisitBatchProcessor] Flushing batch of ${batch.length} visits`);

    const visits: VisitData[] = batch.map(({ timestamp, ...visit }) => visit);
    const result = await batchRecordVisits(visits);

    if (result) {
      console.log(`[VisitBatchProcessor] ✓ Batch saved: ${result.affectedRows} rows affected`);
    } else {
      throw new Error('Batch insert returned null');
    }

  } catch (error: any) {
    console.error('[VisitBatchProcessor] ❌ Batch save failed:', error.message);

    // Re-queue with exponential backoff limit
    if (batch.length > 0) {
      // Check if visits are too old (older than 5 minutes = likely stale)
      const now = Date.now();
      const validVisits = batch.filter(v => now - v.timestamp < 300000);

      if (validVisits.length > 0) {
        console.log(`[VisitBatchProcessor] Re-queuing ${validVisits.length} valid visits`);
        this.queue.unshift(...validVisits);
      } else {
        console.warn(`[VisitBatchProcessor] Discarding ${batch.length} stale visits (>5min old)`);
      }
    }
  } finally {
    this.isProcessing = false;
  }
}
```

**What this fixes:**
- Prevents infinite retry loops for stale data
- Discards visits older than 5 minutes
- Better error logging

---

## Implementation Priority

### Immediate (Deploy Today)

1. ✅ **Add retry logic to MySQL connections** (Solution 2.1)
2. ✅ **Add connection timeouts** (Solution 2.2)
3. ✅ **Update batch processor error handling** (Solution 2.4)

### This Week

4. **Increase maxDuration on slow routes** (Solution 1.1)
5. **Add health check to connection pool** (Solution 2.3)

### If Issues Persist

6. **Implement streaming for long operations** (Solution 1.2)
7. **Consider Upstash Workflow for complex tasks** (Solution 1.4)

---

## Quick Fixes You Can Do Right Now

### For Timeout Errors:

```typescript
// Add to any slow API route:
export const maxDuration = 60; // seconds
```

### For MySQL Errors:

```typescript
// In mysql-db.ts config, add:
connectTimeout: 10000,
acquireTimeout: 10000,
timeout: 60000,
enableKeepAlive: true,
keepAliveInitialDelay: 0,
```

---

## Monitoring

After implementing fixes, monitor:

1. **Vercel Function Logs:**
   - Look for "FUNCTION_INVOCATION_TIMEOUT" errors
   - Check execution duration graphs

2. **MySQL Connection Logs:**
   - Count ECONNRESET errors
   - Monitor retry attempts
   - Check stale visit discards

3. **Batch Processor Stats:**
   - Queue size (should stay < 100)
   - Successful vs failed batches
   - Average flush time

---

## Sources

- [Vercel: What to do about functions timing out](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
- [Configuring Maximum Duration for Vercel Functions](https://vercel.com/docs/functions/configuring-functions/duration)
- [Streaming from Serverless Node.js on Vercel](https://vercel.com/blog/streaming-for-serverless-node-js-and-edge-runtimes-with-vercel-functions)
- [Get Rid of Function Timeouts - Upstash](https://upstash.com/blog/vercel-cost-workflow)
- [How to Solve Next.js Timeouts - Inngest](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts)
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations)
