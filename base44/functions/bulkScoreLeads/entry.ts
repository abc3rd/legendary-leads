import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Scheduled daily: re-scores all leads that haven't been scored in 7 days
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const leads = await base44.asServiceRole.entities.Lead.list('-updated_date', 2000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Only score leads not recently scored
    const toScore = leads.filter(l =>
      !l.lead_score_at || l.lead_score_at < sevenDaysAgo
    ).slice(0, 50); // Batch max 50 per run to stay within limits

    let scored = 0;
    let failed = 0;

    for (const lead of toScore) {
      const logs = await base44.asServiceRole.entities.FollowUpLog.filter({ lead_id: lead.id });
      const notes = await base44.asServiceRole.entities.LeadNote.filter({ lead_id: lead.id });
      const sentLogs = logs.filter(l => l.status === 'sent');
      const failedLogs = logs.filter(l => l.status === 'failed');

      const features = {
        follower_tier: lead.followerCount > 100000 ? 'mega' : lead.followerCount > 10000 ? 'macro' : lead.followerCount > 1000 ? 'micro' : 'nano',
        has_email: !!lead.email,
        has_phone: !!lead.phone,
        has_website: !!lead.website,
        status_depth: ['new','cold_outreach','contacted','qualified','in_negotiation','converted','unresponsive'].indexOf(lead.status || 'new'),
        sentiment_score: lead.sentiment_score || 0,
        messages_sent: sentLogs.length,
        messages_failed: failedLogs.length,
        notes_count: notes.length,
        churn_risk: lead.churn_risk || 'none',
      };

      const prompt = `Score this CRM lead 0-100. Return ONLY valid JSON with keys: score (int), grade (A/B/C/D/F), summary (string), strengths (array), risks (array).
Features: status_depth=${features.status_depth}, has_email=${features.has_email}, has_phone=${features.has_phone}, has_website=${features.has_website}, sentiment=${lead.sentiment || 'Neutral'}(${features.sentiment_score}), follower_tier=${features.follower_tier}, messages_sent=${features.messages_sent}, notes=${features.notes_count}, churn_risk=${features.churn_risk}
Rules: A=85+, B=70+, C=50+, D=30+, F<30. Pipeline stage(0-6) worth 30pts, contact=20pts, sentiment=15pts, authority=15pts, engagement=12pts, churn penalty=-15(high)/-8(medium).`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
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
      }).catch(() => null);

      if (result && result.score != null) {
        await base44.asServiceRole.entities.Lead.update(lead.id, {
          lead_score: result.score,
          lead_grade: result.grade,
          lead_score_summary: result.summary,
          lead_score_at: new Date().toISOString(),
        });
        scored++;
      } else {
        failed++;
      }
    }

    return Response.json({ success: true, scored, failed, skipped: leads.length - toScore.length, total: leads.length });
  } catch (error) {
    console.error('bulkScoreLeads error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});