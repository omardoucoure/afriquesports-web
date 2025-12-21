import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | null = null;

// Get Supabase client (typed as any to avoid schema type requirements)
function getClient(): any {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  console.log('[Supabase] Creating client...');
  client = createClient(supabaseUrl, supabaseKey);
  console.log('[Supabase] Client created successfully');
  return client;
}

// Record a visit
export async function recordVisit(data: {
  postId: string;
  postSlug: string;
  postTitle: string;
  postImage?: string;
  postAuthor?: string;
  postCategory?: string;
  postSource?: string;
}): Promise<{ id: number; count: number } | null> {
  const supabase = getClient();
  if (!supabase) return null;

  const { postId, postSlug, postTitle, postImage, postAuthor, postCategory, postSource = 'afriquesports' } = data;
  const visitDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // Check if visit exists for today
    const { data: existing, error: selectError } = await supabase
      .from('visits')
      .select('id, count')
      .eq('post_id', postId)
      .eq('visit_date', visitDate)
      .maybeSingle();

    if (selectError) {
      console.error('[Supabase] Error checking existing visit:', selectError);
      return null;
    }

    if (existing) {
      // Update count
      const { data: updated, error: updateError } = await supabase
        .from('visits')
        .update({
          count: existing.count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('id, count')
        .single();

      if (updateError) {
        console.error('[Supabase] Error updating visit:', updateError);
        return null;
      }

      console.log('[Supabase] Visit count updated:', updated);
      return updated as { id: number; count: number };
    } else {
      // Insert new visit
      const { data: inserted, error: insertError } = await supabase
        .from('visits')
        .insert({
          post_id: postId,
          post_slug: postSlug,
          post_title: postTitle,
          post_image: postImage || null,
          post_author: postAuthor || null,
          post_category: postCategory || null,
          post_source: postSource,
          visit_date: visitDate,
          count: 1
        })
        .select('id, count')
        .single();

      if (insertError) {
        console.error('[Supabase] Error inserting visit:', insertError);
        return null;
      }

      console.log('[Supabase] New visit recorded:', inserted);
      return inserted as { id: number; count: number };
    }
  } catch (error) {
    console.error('[Supabase] Error recording visit:', error);
    return null;
  }
}

export interface TrendingPost {
  post_id: string;
  post_slug: string;
  post_title: string;
  post_image?: string | null;
  post_author?: string | null;
  post_category?: string | null;
  post_source?: string | null;
  count: number;
  total_count: number;
}

// Get trending posts for a date range
export async function getTrendingPostsByRange(days: number = 7, limit: number = 10): Promise<TrendingPost[]> {
  const supabase = getClient();
  if (!supabase) return [];

  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const fromDate = dateFrom.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('visits')
      .select('post_id, post_slug, post_title, post_image, post_author, post_category, post_source, count')
      .gte('visit_date', fromDate)
      .order('count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Supabase] Error fetching trending:', error);
      return [];
    }

    // Sum up counts for posts that appear on multiple days
    const postMap = new Map();
    data?.forEach((row: any) => {
      if (postMap.has(row.post_id)) {
        postMap.get(row.post_id).total_count += row.count;
      } else {
        postMap.set(row.post_id, { ...row, total_count: row.count });
      }
    });

    const results = Array.from(postMap.values())
      .sort((a, b) => b.total_count - a.total_count)
      .slice(0, limit);

    console.log('[Supabase] Trending posts fetched:', results.length);
    return results;
  } catch (error) {
    console.error('[Supabase] Error in getTrendingPostsByRange:', error);
    return [];
  }
}
