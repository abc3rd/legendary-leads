import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { lead_id, bulk_ids } = await req.json();

  // Support bulk scoring
  const ids = bulk_ids && bulk_ids.length ? bulk_ids : lead_id ? [lead_id] : [];
  if (!ids.length) return Response.json({ error: 'lead_id or bulk_ids required' }, { status: 400 });

  const results = [];

  for (const id of ids) {
    const lead = await base44.entities.Lead.get(id);
    if (!lead) { results.push({ id, error: 'not found' }); continue; }

    const logs = await base44.entities.FollowUpLog.filter({ lead_id: id });
    const notes = await base44.entities.LeadNote.filter({ lead_id: id });

    const sentLogs = logs.filter(l => l.status === 'sent');
    const failedLogs = logs.filter(l => l.status === 'failed');
    const noteCount = notes.length;
    const recentNotes = notes.slice(0, 5).map(n => n.body?.slice(0, 80)).join(' | ');

    // ML-style weighted feature extraction
    const features = {
      follower_tier: lead.followerCount > 100000 ? 'mega' : lead.followerCount > 10000 ? 'macro' : lead.followerCount > 1000 ? 'micro' : 'nano',
      has_email: !!lead.email,
      has_phone: !!lead.phone,
      has_website: !!lead.website,
      status_depth: ['new','cold_outreach','contacted','qualified','in_negotiation','converted','unresponsive'].indexOf(lead.status || 'new'),
      sentiment_score: lead.sentiment_score || 0,
      sentiment: lead.sentiment || 'Neutral',
      messages_sent: sentLogs.length,
      messages_failed: failedLogs.length,
      interaction_notes: noteCount,
      days_since_contact: lead.days_since_contact || 0,
      churn_risk: lead.churn_risk || 'none',
      bio_length: (lead.bio || '').length,
    };

    const prompt = `You are an ML-based lead scoring engine for a social media influencer CRM. Score this lead using weighted feature analysis.

LEAD FEATURES (extracted):
- Follower tier: ${features.follower_tier} (${lead.followerCount || 0} followers)
- Contact completeness: email=${features.has_email}, phone=${features.has_phone}, website=${features.has_website}
- Pipeline stage (0-6): ${features.status_depth} (${lead.status || 'new'})
- Sentiment: ${features.sentiment} score=${features.sentiment_score}/100
- Messages sent: ${features.messages_sent}, failed: ${features.messages_failed}
- CRM interaction notes: ${features.interaction_notes}
- Days since last contact: ${features.days_since_contact}
- Churn risk: ${features.churn_risk}
- Bio length (engagement signal): ${features.bio_length} chars
- Niche/Category: ${lead.category || 'Unknown'}
- Recent note snippets: ${recentNotes || 'none'}

SCORING WEIGHTS:
- Pipeline stage: 30 pts max (higher stage = higher score)
- Contact completeness: 20 pts (email=10, phone=6, website=4)
- Sentiment: 15 pts (positive=15, neutral=8, negative=2)
- Social authority: 15 pts (follower tier: mega=15, macro=11, micro=7, nano=3)
- Engagement depth: 12 pts (messages + notes activity)
- Risk penalty: -15 pts if churn_risk=high, -8 if medium

Calculate realistically. A "new" lead with no contact = 10-25 range. A "qualified" lead with email and positive sentiment = 60-80 range. A "converted" lead = 85-100.

Return ONLY valid JSON:
{
  "score": <integer 0-100>,
  "grade": <"A" if score>=85, "B" if >=70, "C" if >=50, "D" if >=30, "F" if <30>,
  "summary": <one specific sentence explaining the score based on the actual data>,
  "strengths": [<up to 3 specific strength strings based on actual features>],
  "risks": [<up to 2 specific risk strings based on actual features>],
  "feature_weights": {
    "pipeline": <0-30>,
    "contact": <0-20>,
    "sentiment": <0-15>,
    "authority": <0-15>,
    "engagement": <0-12>,
    "risk_penalty": <0 or negative>
  }
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
          feature_weights: { type: 'object' },
        }
      }
    });

    await base44.entities.Lead.update(id, {
      lead_score: result.score,
      lead_grade: result.grade,
      lead_score_summary: result.summary,
      lead_score_at: new Date().toISOString(),
    });

    // Log as activity note
    await base44.entities.LeadNote.create({
      lead_id: id,
      lead_name: lead.name || lead.username,
      lead_username: lead.username,
      body: `ML Score updated: ${result.score}/100 (${result.grade}) — ${result.summary}`,
      activity_type: 'score_update',
      activity_meta: JSON.stringify({ score: result.score, grade: result.grade, feature_weights: result.feature_weights }),
    });

    results.push({ id, success: true, ...result });
  }

  if (ids.length === 1) return Response.json({ success: true, ...results[0] });
  return Response.json({ success: true, results, total: results.length });
});