const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function deleteCommentary(matchId) {
  const connection = await mysql.createConnection({
    host: process.env.WORDPRESS_DB_HOST,
    user: process.env.WORDPRESS_DB_USER,
    password: process.env.WORDPRESS_DB_PASSWORD,
    database: process.env.WORDPRESS_DB_NAME,
    port: parseInt(process.env.WORDPRESS_DB_PORT || '3306'),
  });

  const [result] = await connection.execute(
    'DELETE FROM wp_match_commentary WHERE match_id = ?',
    [matchId]
  );

  console.log(`Deleted ${result.affectedRows} commentary entries for match ${matchId}`);
  await connection.end();
}

deleteCommentary('732178');
