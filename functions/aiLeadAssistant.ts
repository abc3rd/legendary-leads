import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, criteria, lead } = await req.json();

    // Generate brand-new lead profiles based on criteria
    if (action === 'generate') {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a lead generation expert for an Instagram influencer outreach platform called "Legendary Leads".
Generate ${criteria.count || 5} realistic lead profiles that match these criteria: ${criteria.description}.
Each lead should be a realistic Instagram influencer/business account.
Return ONLY valid JSON, no markdown.`,
        add_context_from_internet: true,
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

    // Suggest potential leads based on existing leads patterns
    if (action === 'suggest') {
      const existingLeads = await base44.entities.Lead.list('-created_date', 50);
      const sample = existingLeads.slice(0, 20).map(l => ({
        category: l.category, bio: l.bio?.slice(0, 80), followerCount: l.followerCount, tag: l.tag
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI lead generation specialist for an Instagram influencer outreach platform.
Based on these existing lead patterns: ${JSON.stringify(sample)}
And these additional criteria: ${criteria?.description || 'similar niche and scale'}

Suggest ${criteria?.count || 5} new potential Instagram lead profiles that would be a good fit.
Use internet data to suggest realistic accounts in similar niches.
Return ONLY valid JSON.`,
        add_context_from_internet: true,
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

    // Enrich a single existing lead with more data
    if (action === 'enrich') {
      if (!lead) return Response.json({ error: 'No lead provided' }, { status: 400 });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a lead enrichment specialist. Enrich this Instagram lead profile with additional information found online.
Existing data: ${JSON.stringify(lead)}

Fill in any missing fields (email, phone, website, bio, category, followerCount, followingCount) with realistic data found from public sources.
If a field already has a value, keep it as-is. Only enrich fields that are empty/missing.
Return ONLY valid JSON with the enriched fields.`,
        add_context_from_internet: true,
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

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});