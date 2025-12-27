import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    const config = {
      host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
      user: process.env.WORDPRESS_DB_USER,
      password: process.env.WORDPRESS_DB_PASSWORD,
      database: process.env.WORDPRESS_DB_NAME || 'wordpress',
    };

    const hasCredentials = !!(config.user && config.password);

    if (!hasCredentials) {
      return NextResponse.json({
        success: false,
        error: 'Missing MySQL credentials',
        config: {
          host: config.host,
          database: config.database,
          hasUser: !!config.user,
          hasPassword: !!config.password,
        }
      });
    }

    // Create connection
    const connection = await mysql.createConnection(config);

    // Test query
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM wp_match_prematch_analysis'
    );

    const count = (rows as any)[0].count;

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'MySQL connection successful',
      prematch_count: count,
      config: {
        host: config.host,
        database: config.database,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
