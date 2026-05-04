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

    const {
      geo_target,
      limit = 25,
      min_followers,
      max_followers,
      contact_availability, // 'email' | 'phone' | 'both'
    } = await req.json();

    if (!geo_target) {
      return Response.json({ error: 'geo_target (state code) is required' }, { status: 400 });
    }

    const dbUrl = Deno.env.get('LOCAL_DB_URL');
    if (!dbUrl) {
      return Response.json({ error: 'LOCAL_DB_URL is not configured' }, { status: 500 });
    }

    // Fetch already-purchased lead IDs from Base44 to deduplicate
    let purchasedIds = new Set();
    try {
      const purchased = await base44.asServiceRole.entities.User_Purchased_Leads.list('-created_date', 5000);
      purchased.forEach(p => { if (p.lead_id) purchasedIds.add(String(p.lead_id)); });
    } catch (_) {
      // Entity may not exist yet — skip deduplication gracefully
    }

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();

    try {
      // Build dynamic query with optional filters
      const params = [geo_target.toUpperCase()];
      let paramIdx = 2;
      let whereClauses = ['state = $1'];

      if (min_followers != null && min_followers !== '') {
        whereClauses.push(`follower_count >= $${paramIdx++}`);
        params.push(Number(min_followers));
      }
      if (max_followers != null && max_followers !== '') {
        whereClauses.push(`follower_count <= $${paramIdx++}`);
        params.push(Number(max_followers));
      }
      if (contact_availability === 'email') {
        whereClauses.push(`email IS NOT NULL AND email <> ''`);
      } else if (contact_availability === 'phone') {
        whereClauses.push(`phone IS NOT NULL AND phone <> ''`);
      } else if (contact_availability === 'both') {
        whereClauses.push(`email IS NOT NULL AND email <> '' AND phone IS NOT NULL AND phone <> ''`);
      }

      const query = `
        SELECT id, industry, city, state, verification_score, follower_count, email, phone
        FROM leads
        WHERE ${whereClauses.join(' AND ')}
        LIMIT $${paramIdx}
      `;
      params.push(Number(limit));

      const result = await client.query(query, params);

      // Deduplicate against purchased leads
      const rows = result.rows.filter(r => !purchasedIds.has(String(r.id)));

      return Response.json({ rows, count: rows.length });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});