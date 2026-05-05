import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { lead_id } = await req.json();
    if (!lead_id) return Response.json({ error: 'lead_id is required' }, { status: 400 });

    // Fetch the lead
    const leads = await base44.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    // Fetch all follow-up logs for this lead (these contain message bodies = conversation history)
    const logs = await base44.entities.FollowUpLog.filter({ lead_id });

    // Build conversation context
    const conversationText = logs.length > 0
      ? logs.map(l => {
          const parts = [];
          if (l.subject) parts.push(`Subject: ${l.subject}`);
          if (l.body) parts.push(`Message: ${l.body}`);
          if (l.status) parts.push(`Delivery: ${l.status}`);
          if (l.channel) parts.push(`Channel: ${l.channel}`);
          return parts.join('\n');
        }).join('\n---\n')
      : null;

    // Build profile context
    const profileContext = [
      lead.bio && `Bio: ${lead.bio}`,
      lead.status && `Pipeline status: ${lead.status}`,
      lead.category && `Category: ${lead.category}`,
    ].filter(Boolean).join('\n');

    const hasConversation = conversationText && logs.length > 0;

    const prompt = `You are a sales sentiment analyst for an influencer outreach platform.

Analyze the following lead's profile and ${hasConversation ? 'outreach conversation history' : 'available profile data'} to determine their overall sentiment toward our outreach.

LEAD PROFILE:
${profileContext}

${hasConversation ? `OUTREACH CONVERSATION HISTORY (${logs.length} messages):
${conversationText}` : 'NOTE: No direct conversation history yet. Base your analysis on their profile, bio, and pipeline status.'}

Determine:
1. Overall sentiment: Positive, Neutral, or Negative
2. A sentiment score from 0 to 100 (0 = very negative, 50 = completely neutral, 100 = very positive)
3. A concise 1-2 sentence summary explaining the sentiment and key signals observed

Scoring guide:
- Positive (65–100): Shows interest, engaged, responsive, positive bio language, in active pipeline stages
- Neutral (35–64): No clear signal, early stage, average engagement, generic bio
- Negative (0–34): Unresponsive, negative language, disengaged, delivery failures

Return ONLY valid JSON.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          sentiment: { type: 'string', enum: ['Positive', 'Neutral', 'Negative'] },
          sentiment_score: { type: 'number' },
          sentiment_summary: { type: 'string' },
        }
      }
    });

    const update = {
      sentiment: result.sentiment,
      sentiment_score: Math.max(0, Math.min(100, Math.round(result.sentiment_score || 50))),
      sentiment_summary: result.sentiment_summary || '',
      sentiment_analyzed_at: new Date().toISOString(),
    };

    await base44.entities.Lead.update(lead_id, update);

    return Response.json({ success: true, ...update });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});