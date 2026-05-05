import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      niche,
      location,
      minFollowers,
      maxFollowers,
      mustHaveEmail,
      mustHavePhone,
      mustHaveWebsite,
      platforms,   // array: ['instagram','linkedin','tiktok','youtube','twitter']
      count = 10,
      autoSave = false,
      tag,
    } = await req.json();

    if (!niche) return Response.json({ error: 'niche is required' }, { status: 400 });

    const platformList = (platforms || ['instagram']).join(', ');
    const followerRange = minFollowers || maxFollowers
      ? `Follower range: ${minFollowers || 0}–${maxFollowers || 'unlimited'}.`
      : '';
    const locationReq = location ? `Located in or targeting: ${location}.` : '';
    const contactReq = [
      mustHaveEmail && 'must have email',
      mustHavePhone && 'must have phone number',
      mustHaveWebsite && 'must have website',
    ].filter(Boolean).join(', ');

    const prompt = `You are an expert lead discovery AI for a social media influencer outreach platform called "Legendary Leads".

Scan public business directories, social media profiles, and online listings to discover ${count} REAL, specific, highly relevant leads matching ALL of these criteria:

NICHE / INDUSTRY: ${niche}
PLATFORMS: ${platformList}
${followerRange}
${locationReq}
${contactReq ? `CONTACT REQUIREMENTS: ${contactReq}` : ''}

For each lead, provide as much real data as you can find from public sources. Use your internet knowledge to surface real businesses and creators — not generic placeholders.

Rules:
- Username must be the actual handle on the primary platform
- Bio should reflect their actual public bio or description  
- Category must match the niche precisely
- followerCount should be an approximate real number
- email: if publicly available, provide it; otherwise leave empty
- website: official website if publicly listed
- phone: if publicly listed, otherwise empty
- platform: which platform this lead is primarily on
- source: where you found this lead (e.g. "Instagram public profile", "LinkedIn directory", "Google Business")
- confidence: 0.0–1.0 score for how well they match the criteria
- reason: 1-sentence explanation of why this is a good lead

Return ONLY valid JSON.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
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
                username:       { type: 'string' },
                name:           { type: 'string' },
                bio:            { type: 'string' },
                category:       { type: 'string' },
                followerCount:  { type: 'number' },
                followingCount: { type: 'number' },
                website:        { type: 'string' },
                email:          { type: 'string' },
                phone:          { type: 'string' },
                platform:       { type: 'string' },
                source:         { type: 'string' },
                confidence:     { type: 'number' },
                reason:         { type: 'string' },
              }
            }
          }
        }
      }
    });

    const leads = result.leads || [];

    // Auto-save to database if requested
    if (autoSave && leads.length > 0) {
      const toSave = leads.map(l => ({
        username:       l.username || '',
        name:           l.name || '',
        bio:            l.bio || '',
        category:       l.category || niche,
        followerCount:  l.followerCount || 0,
        followingCount: l.followingCount || 0,
        website:        l.website || '',
        email:          l.email || '',
        phone:          l.phone || '',
        tag:            tag || niche,
        status:         'new',
      }));
      await base44.entities.Lead.bulkCreate(toSave);
    }

    return Response.json({ leads, saved: autoSave ? leads.length : 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});