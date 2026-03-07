import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Called by entity automation when a Lead is updated
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data } = payload;

    if (!data || !old_data) return Response.json({ skipped: 'missing data' });
    if (data.status === old_data.status) return Response.json({ skipped: 'status unchanged' });

    // Find matching status_change sequences
    const sequences = await base44.asServiceRole.entities.FollowUpSequence.filter({
      is_active: true,
      trigger_type: 'status_change',
      trigger_status: data.status,
    });

    if (sequences.length === 0) return Response.json({ skipped: 'no matching sequences', status: data.status });

    const results = [];

    function renderTemplate(text, lead) {
      if (!text) return '';
      return text
        .replace(/\{\{name\}\}/g, lead.name || lead.username || 'there')
        .replace(/\{\{username\}\}/g, lead.username || '')
        .replace(/\{\{email\}\}/g, lead.email || '')
        .replace(/\{\{phone\}\}/g, lead.phone || '')
        .replace(/\{\{category\}\}/g, lead.category || '')
        .replace(/\{\{status\}\}/g, (lead.status || '').replace(/_/g, ' '));
    }

    for (const seq of sequences) {
      if (seq.filter_has_email && !data.email) continue;
      if (seq.filter_has_phone && !data.phone) continue;
      if (seq.filter_category && data.category !== seq.filter_category) continue;

      const templates = await base44.asServiceRole.entities.FollowUpTemplate.filter({ id: seq.template_id });
      const template = templates[0];
      if (!template) continue;

      const renderedSubject = renderTemplate(template.subject, data);
      const renderedBody = renderTemplate(template.body, data);

      const logEntry = {
        lead_id: data.id,
        lead_username: data.username || '',
        lead_email: data.email || '',
        lead_phone: data.phone || '',
        sequence_id: seq.id,
        sequence_name: seq.name,
        template_id: template.id,
        channel: template.channel,
        subject: renderedSubject,
        body: renderedBody,
        status: 'pending',
      };

      const delayDays = seq.delay_days || 0;

      if (delayDays === 0) {
        if (template.channel === 'email' && data.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: data.email,
            subject: renderedSubject || 'Follow-up from Legendary Leads',
            body: renderedBody,
          });
          logEntry.status = 'sent';
        } else if (template.channel === 'sms') {
          logEntry.status = 'pending';
          logEntry.error = 'SMS requires Twilio — configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN';
        } else {
          logEntry.status = 'failed';
          logEntry.error = `No ${template.channel} contact info on lead`;
        }
      }

      await base44.asServiceRole.entities.FollowUpLog.create(logEntry);
      results.push({ sequence: seq.name, status: logEntry.status });
    }

    return Response.json({ triggered: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});