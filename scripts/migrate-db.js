#!/usr/bin/env node
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SQL = `
ALTER TABLE visits ADD COLUMN IF NOT EXISTS post_locale VARCHAR(2) DEFAULT 'fr';
CREATE INDEX IF NOT EXISTS idx_visits_locale ON visits(post_locale);
UPDATE visits SET post_locale = 'fr' WHERE post_locale IS NULL;
ALTER TABLE visits ALTER COLUMN post_locale SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visits_locale_date ON visits(post_locale, visit_date DESC);
`;

const dbUrl = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!dbUrl) {
  console.error('❌ No POSTGRES_URL found');
  process.exit(1);
}

console.log('🚀 Running migration via psql...\n');

exec(`psql "${dbUrl}" -c "${SQL.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(stderr);
    process.exit(1);
  }
  
  console.log('✅ Migration completed!\n');
  console.log(stdout);
  
  // Verify
  exec(`psql "${dbUrl}" -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'post_locale';"`, (err, out) => {
    if (!err) {
      console.log('Verification:');
      console.log(out);
    }
  });
});
