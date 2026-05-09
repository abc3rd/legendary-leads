import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { lead_id } = await req.json();
  if (!lead_id) return Response.json({ error: 'lead_id required' }, { status: 400 });

  const lead = await base44.entities.Lead.get(lead_id);
  if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

  // Fetch communication logs
  const logs = await base44.entities.FollowUpLog.filter({ lead_id });

  // Build scoring prompt
  const sentLogs = logs.filter(l => l.status === 'sent');
  const failedLogs = logs.filter(l => l.status === 'failed');

  const prompt = `You are a sales conversion probability analyst. Score this lead's likelihood of converting (0-100).

Lead Profile:
- Name: ${lead.name || 'Unknown'}
- Category/Niche: ${lead.category || 'Unknown'}
- Followers: ${lead.followerCount || 0}
- Following: ${lead.followingCount || 0}
- Has Email: ${lead.email ? 'Yes' : 'No'}
- Has Phone: ${lead.phone ? 'Yes' : 'No'}
- Has Website: ${lead.website ? 'Yes' : 'No'}
- Current Status: ${lead.status || 'new'}
- Current Sentiment: ${lead.sentiment || 'Unknown'} (${lead.sentiment_score || 'N/A'}/100)
- Sentiment Summary: ${lead.sentiment_summary || 'No sentiment data'}
- Bio: ${lead.bio || 'None'}

Communication History:
- Total messages sent: ${sentLogs.length}
- Failed sends: ${failedLogs.length}
- Channels used: ${[...new Set(logs.map(l => l.channel))].join(', ') || 'None'}

Scoring Criteria:
1. Contact completeness (email, phone, website) — more contact info = higher score
2. Engagement level based on pipeline status (new=low, in_negotiation=high, converted=very high)
3. Sentiment score (positive=+boost, negative=penalty)
4. Follower count (larger audience = higher business value)
5. Communication history (more touchpoints = more engaged)
6. Bio relevance (mentions business, brand deals, etc.)

Return ONLY a JSON object with:
{
  "score": <number 0-100>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "summary": <one sentence explaining the score>,
  "strengths": [<up to 3 short strength strings>],
  "risks": [<up to 2 short risk strings>]
}`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        grade: { type: 'string' },
        summary: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
      }
    }
  });

  // Persist to lead
  await base44.entities.Lead.update(lead_id, {
    lead_score: result.score,
    lead_grade: result.grade,
    lead_score_summary: result.summary,
    lead_score_at: new Date().toISOString(),
  });

  return Response.json({ success: true, ...result });
});