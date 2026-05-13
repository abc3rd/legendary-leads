import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { callLogId, outcome, callNotes, durationSeconds } = await req.json();

  // Fetch the call log
  const callLog = await base44.entities.CallLog.get(callLogId);
  if (!callLog) return Response.json({ error: 'Call log not found' }, { status: 404 });

  // Analyze sentiment from call notes
  let sentiment = 'Neutral';
  let sentimentScore = 50;
  let sentimentSummary = '';

  if (callNotes && callNotes.trim().length > 10) {
    const sentimentResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the sentiment of these call notes and return a JSON with sentiment (Positive/Neutral/Negative), score (0-100), and a 1-sentence summary.

Call notes: "${callNotes}"
Outcome: ${outcome}

Return JSON: { "sentiment": "...", "score": number, "summary": "..." }`,
      response_json_schema: {
        type: 'object',
        properties: {
          sentiment: { type: 'string' },
          score: { type: 'number' },
          summary: { type: 'string' }
        }
      }
    });
    sentiment = sentimentResult.sentiment || 'Neutral';
    sentimentScore = sentimentResult.score || 50;
    sentimentSummary = sentimentResult.summary || '';
  }

  // Determine follow-up date based on outcome
  const followUpDaysMap = {
    interested: 1,
    callback: 1,
    voicemail: 2,
    not_interested: 14,
    no_answer: 3,
    converted: null,
    unknown: 3
  };

  const followUpDays = followUpDaysMap[outcome];
  let followUpDate = null;
  let followUpTaskId = null;

  if (followUpDays !== null) {
    const fDate = new Date();
    fDate.setDate(fDate.getDate() + followUpDays);
    followUpDate = fDate.toISOString().split('T')[0];

    // Create a follow-up task
    const taskTypeMap = {
      interested: 'Schedule Meeting',
      callback: 'Make Phone Call',
      voicemail: 'Make Phone Call',
      not_interested: 'Send Direct Message',
      no_answer: 'Make Phone Call',
      unknown: 'Follow Up'
    };

    const task = await base44.entities.Task.create({
      title: `Follow up: ${callLog.lead_name || callLog.lead_username} (${outcome})`,
      description: `Post-call follow-up. Sentiment: ${sentiment}. Notes: ${callNotes || 'N/A'}`,
      task_type: taskTypeMap[outcome] || 'Follow Up',
      status: 'Pending',
      priority: outcome === 'interested' || outcome === 'callback' ? 'High' : 'Medium',
      lead_id: callLog.lead_id,
      lead_name: callLog.lead_name,
      lead_username: callLog.lead_username,
      assigned_to: callLog.assigned_to || user.email,
      due_date: followUpDate
    });
    followUpTaskId = task.id;
  }

  // Update the call log
  await base44.entities.CallLog.update(callLogId, {
    status: 'completed',
    outcome,
    call_notes: callNotes,
    duration_seconds: durationSeconds || 0,
    sentiment,
    sentiment_score: sentimentScore,
    sentiment_summary: sentimentSummary,
    follow_up_scheduled: followUpDate !== null,
    follow_up_date: followUpDate,
    follow_up_task_id: followUpTaskId,
    called_at: new Date().toISOString()
  });

  // Update lead sentiment
  await base44.entities.Lead.update(callLog.lead_id, {
    sentiment,
    sentiment_score: sentimentScore,
    sentiment_summary: sentimentSummary,
    sentiment_analyzed_at: new Date().toISOString()
  });

  // Log activity note
  await base44.entities.LeadNote.create({
    lead_id: callLog.lead_id,
    lead_name: callLog.lead_name,
    lead_username: callLog.lead_username,
    author_email: user.email,
    author_name: user.full_name,
    body: `📞 Call completed. Outcome: ${outcome}. Sentiment: ${sentiment}. ${callNotes ? `Notes: ${callNotes}` : ''}`,
    activity_type: 'note',
  });

  return Response.json({
    success: true,
    sentiment,
    sentimentScore,
    sentimentSummary,
    followUpDate,
    followUpTaskId
  });
});