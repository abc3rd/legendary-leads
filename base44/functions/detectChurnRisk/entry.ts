import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { lead_id } = await req.json();
  if (!lead_id) return Response.json({ error: 'lead_id required' }, { status: 400 });

  const lead = await base44.entities.Lead.get(lead_id);
  if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

  const logs = await base44.entities.FollowUpLog.filter({ lead_id });

  const now = new Date();
  const daysSinceCreated = Math.floor((now - new Date(lead.created_date)) / (1000 * 60 * 60 * 24));

  // Find last interaction
  const sortedLogs = logs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const lastLog = sortedLogs[0];
  const daysSinceLastContact = lastLog
    ? Math.floor((now - new Date(lastLog.created_date)) / (1000 * 60 * 60 * 24))
    : daysSinceCreated;

  const isConverted = lead.status === 'converted';
  const isUnresponsive = lead.status === 'unresponsive';

  // Skip already converted/unresponsive
  if (isConverted) {
    await base44.entities.Lead.update(lead_id, { churn_risk: 'none', churn_risk_at: now.toISOString() });
    return Response.json({ churn_risk: 'none', reason: 'Already converted' });
  }

  // Determine risk level
  let churn_risk = 'none';
  let churn_reason = '';

  if (isUnresponsive || daysSinceLastContact >= 30) {
    churn_risk = 'high';
    churn_reason = `No interaction in ${daysSinceLastContact} days and status is ${lead.status}`;
  } else if (daysSinceLastContact >= 14) {
    churn_risk = 'medium';
    churn_reason = `No interaction in ${daysSinceLastContact} days`;
  } else if (lead.sentiment === 'Negative') {
    churn_risk = 'medium';
    churn_reason = 'Negative sentiment detected in recent communications';
  } else if (daysSinceLastContact >= 7 && lead.status === 'new') {
    churn_risk = 'low';
    churn_reason = 'New lead with no follow-up after 7 days';
  }

  // Use LLM for deeper analysis if there's history
  if (logs.length > 0) {
    const prompt = `Analyze this lead's engagement and determine churn risk.

Lead Info:
- Name: ${lead.name || 'Unknown'}
- Status: ${lead.status}
- Sentiment: ${lead.sentiment || 'Unknown'} (score: ${lead.sentiment_score || 'N/A'})
- Days since last contact: ${daysSinceLastContact}
- Total messages sent: ${logs.length}
- Failed messages: ${logs.filter(l => l.status === 'failed').length}
- Has email: ${lead.email ? 'Yes' : 'No'}
- Has phone: ${lead.phone ? 'Yes' : 'No'}
- Lead score: ${lead.lead_score || 'N/A'}

Return JSON: { "churn_risk": "none"|"low"|"medium"|"high", "reason": "<one sentence>" }`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          churn_risk: { type: 'string' },
          reason: { type: 'string' }
        }
      }
    });
    churn_risk = result.churn_risk || churn_risk;
    churn_reason = result.reason || churn_reason;
  }

  await base44.entities.Lead.update(lead_id, {
    churn_risk,
    churn_reason,
    churn_risk_at: now.toISOString(),
    days_since_contact: daysSinceLastContact,
  });

  return Response.json({ churn_risk, churn_reason, days_since_contact: daysSinceLastContact });
});