import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3308'),
  user: process.env.MYSQL_USER || 'csi_super',
  password: process.env.MYSQL_PASSWORD || 'NL2Gu7JdlsKISSlS8PI0qp',
  database: process.env.MYSQL_DATABASE || 'devcs_banco_groomy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}
