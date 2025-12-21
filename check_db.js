const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCommentary() {
  const { data, error } = await supabase
    .from('match_commentary_ai')
    .select('*')
    .eq('match_id', '732133')
    .eq('locale', 'fr')
    .order('time_seconds', { ascending: false });

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log(`\nFound ${data.length} commentary items:\n`);
  data.forEach(item => {
    const preview = item.text.length > 80 ? item.text.substring(0, 80) + '...' : item.text;
    console.log(`[${item.time}] ${preview}`);
  });
}

checkCommentary().then(() => process.exit(0));
