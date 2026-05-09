import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { lead_id } = await req.json();
  if (!lead_id) return Response.json({ error: 'lead_id required' }, { status: 400 });

  let lead;
  try {
    const leads = await base44.entities.Lead.filter({ id: lead_id });
    lead = leads[0];
  } catch(_) {}
  if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

  // Use AI to simulate enriched profile data based on known lead info
  const profileData = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a social media intelligence tool. Given the following lead profile, simulate what their latest public Instagram/social media activity might look like and provide an enriched profile update.

Lead info:
- Name: ${lead.name || 'Unknown'}
- Username: @${lead.username || 'unknown'}
- Bio: ${lead.bio || 'No bio'}
- Category: ${lead.category || 'Unknown'}
- Followers: ${lead.followerCount || 0}
- Website: ${lead.website || 'None'}

Based on this profile, generate:
1. An updated bio that reflects their niche/business (keep it realistic and relevant)
2. 3 recent post topics they likely post about
3. A relevance score 0-100 for B2B/influencer marketing outreach
4. Updated lead grade (A/B/C/D/F) based on their profile strength and engagement potential
5. A brief reason for the grade

Return ONLY valid JSON with keys: updated_bio, recent_topics (array of 3 strings), relevance_score (number), lead_grade (letter), grade_reason (string)`,
    response_json_schema: {
      type: 'object',
      properties: {
        updated_bio: { type: 'string' },
        recent_topics: { type: 'array', items: { type: 'string' } },
        relevance_score: { type: 'number' },
        lead_grade: { type: 'string' },
        grade_reason: { type: 'string' },
      },
    },
  });

  // Update the lead with enriched data
  const updates = {
    lead_score: profileData.relevance_score,
    lead_grade: profileData.lead_grade,
    lead_score_summary: profileData.grade_reason,
    lead_score_at: new Date().toISOString(),
  };
  if (profileData.updated_bio && !lead.bio) {
    updates.bio = profileData.updated_bio;
  }

  await base44.entities.Lead.update(lead_id, updates);

  return Response.json({
    success: true,
    lead_grade: profileData.lead_grade,
    relevance_score: profileData.relevance_score,
    recent_topics: profileData.recent_topics,
    grade_reason: profileData.grade_reason,
    updated_bio: profileData.updated_bio,
  });
});