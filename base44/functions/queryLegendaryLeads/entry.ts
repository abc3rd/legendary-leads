import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import pg from 'npm:pg@8.11.3';

const { Pool } = pg;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { geo_target, limit = 25 } = await req.json();

    if (!geo_target) {
      return Response.json({ error: 'geo_target (state code) is required' }, { status: 400 });
    }

    const dbUrl = Deno.env.get('LOCAL_DB_URL');
    if (!dbUrl) {
      return Response.json({ error: 'LOCAL_DB_URL is not configured' }, { status: 500 });
    }

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, industry, city, state, verification_score FROM leads WHERE state = $1 LIMIT $2',
        [geo_target.toUpperCase(), Number(limit)]
      );
      return Response.json({ rows: result.rows, count: result.rowCount });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});