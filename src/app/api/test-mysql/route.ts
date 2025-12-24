import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export const runtime = 'nodejs';

export async function GET() {
  const config = {
    host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
    user: process.env.WORDPRESS_DB_USER,
    password: process.env.WORDPRESS_DB_PASSWORD,
    database: process.env.WORDPRESS_DB_NAME || 'wordpress',
    connectTimeout: 10000,
  };

  const envStatus = {
    WORDPRESS_DB_HOST: process.env.WORDPRESS_DB_HOST ? 'SET' : 'NOT SET',
    WORDPRESS_DB_USER: process.env.WORDPRESS_DB_USER ? 'SET' : 'NOT SET',
    WORDPRESS_DB_PASSWORD: process.env.WORDPRESS_DB_PASSWORD ? 'SET' : 'NOT SET',
    WORDPRESS_DB_NAME: process.env.WORDPRESS_DB_NAME ? 'SET' : 'NOT SET',
    host_value: config.host,
    database_value: config.database,
  };

  if (!config.user || !config.password) {
    return NextResponse.json({
      status: 'error',
      message: 'Missing required environment variables',
      env: envStatus,
    });
  }

  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.query('SELECT DATABASE() as db, NOW() as time');
    await connection.end();

    return NextResponse.json({
      status: 'success',
      message: 'MySQL connection successful',
      env: envStatus,
      result: rows,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      env: envStatus,
    });
  }
}
