import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, criteria, lead } = await req.json();

    // ── Generate brand-new lead profiles ──────────────────────────────────
    if (action === 'generate') {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a lead generation expert for an influencer outreach platform called "Legendary Leads".
Generate ${criteria.count || 5} realistic lead profiles matching: ${criteria.description}.
Each lead should be a realistic Instagram influencer or business account.
Return ONLY valid JSON, no markdown.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            leads: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  name: { type: 'string' },
                  bio: { type: 'string' },
                  category: { type: 'string' },
                  followerCount: { type: 'number' },
                  followingCount: { type: 'number' },
                  website: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  tag: { type: 'string' },
                  status: { type: 'string' }
                }
              }
            }
          }
        }
      });
      return Response.json({ leads: result.leads || [] });
    }

    // ── Suggest leads based on existing patterns ───────────────────────────
    if (action === 'suggest') {
      const existingLeads = await base44.entities.Lead.list('-created_date', 50);
      const sample = existingLeads.slice(0, 20).map(l => ({
        category: l.category, bio: l.bio?.slice(0, 80), followerCount: l.followerCount, tag: l.tag
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI lead generation specialist for an Instagram influencer outreach platform.
Based on these existing lead patterns: ${JSON.stringify(sample)}
And these additional criteria: ${criteria?.description || 'similar niche and scale'}

Suggest ${criteria?.count || 5} new potential Instagram lead profiles that would be a great fit.
Return ONLY valid JSON.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            leads: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  name: { type: 'string' },
                  bio: { type: 'string' },
                  category: { type: 'string' },
                  followerCount: { type: 'number' },
                  followingCount: { type: 'number' },
                  website: { type: 'string' },
                  email: { type: 'string' },
                  tag: { type: 'string' },
                  status: { type: 'string' },
                  reason: { type: 'string' }
                }
              }
            }
          }
        }
      });
      return Response.json({ leads: result.leads || [] });
    }

    // ── Enrich a single lead ───────────────────────────────────────────────
    if (action === 'enrich') {
      if (!lead) return Response.json({ error: 'No lead provided' }, { status: 400 });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a lead enrichment specialist. Enrich this lead profile with additional information from public sources.
Existing data: ${JSON.stringify(lead)}

Fill in any missing fields (email, phone, website, bio, category, followerCount, followingCount) with realistic data.
If a field already has a value, keep it as-is.
Return ONLY valid JSON with the enriched fields.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            name: { type: 'string' },
            bio: { type: 'string' },
            category: { type: 'string' },
            followerCount: { type: 'number' },
            followingCount: { type: 'number' },
            website: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            tag: { type: 'string' },
            enrichment_notes: { type: 'string' }
          }
        }
      });
      return Response.json({ enriched: result });
    }

    // ── Smart database search with AI query building ───────────────────────
    if (action === 'smart_search') {
      const { query: userQuery } = criteria;
      if (!userQuery) return Response.json({ error: 'query required' }, { status: 400 });

      // Use AI to build the filter
      const filterResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a database query builder for a CRM called Legendary Leads.
The Lead entity has these fields: username, name, bio, category, followerCount, followingCount, website, email, phone, tag, status, sentiment, lead_grade, churn_risk, platform_source, assigned_to.

Convert this natural language query into a MongoDB-style filter object:
"${userQuery}"

Rules:
- Use $regex with $options: "i" for text fields
- Use $gte / $lte for numeric ranges
- Use $ne for "has value" checks: {"email": {"$ne": null}}
- Combine with $and or $or as needed
- For location: check bio field for city/state names
- Return ONLY the JSON filter object, no explanation`,
        response_json_schema: {
          type: 'object',
          properties: {
            filter: { type: 'object', additionalProperties: true }
          }
        }
      });

      const filter = filterResult.filter || {};
      const leads = await base44.entities.Lead.filter(filter, '-lead_score', 50);
      return Response.json({ leads, filter_used: filter });
    }

    return Response.json({ error: 'Invalid action. Use: generate, suggest, enrich, smart_search' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});