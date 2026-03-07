import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Merge template variables with lead data
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { lead_id, trigger_type, new_status } = await req.json();

    if (!lead_id) return Response.json({ error: 'lead_id required' }, { status: 400 });

    // Fetch lead
    const leads = await base44.entities.Lead.filter({ id: lead_id });
    const lead = leads[0];
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    // Find matching sequences
    const allSequences = await base44.entities.FollowUpSequence.filter({ is_active: true });

    const matched = allSequences.filter(seq => {
      if (trigger_type === 'status_change') {
        if (seq.trigger_type !== 'status_change') return false;
        if (seq.trigger_status && seq.trigger_status !== new_status) return false;
      } else if (trigger_type === 'time_based') {
        if (seq.trigger_type !== 'time_based') return false;
      } else {
        return false;
      }

      // Apply filters
      if (seq.filter_has_email && !lead.email) return false;
      if (seq.filter_has_phone && !lead.phone) return false;
      if (seq.filter_category && lead.category !== seq.filter_category) return false;

      return true;
    });

    const results = [];

    for (const seq of matched) {
      const templates = await base44.entities.FollowUpTemplate.filter({ id: seq.template_id });
      const template = templates[0];
      if (!template) continue;

      const renderedSubject = renderTemplate(template.subject, lead);
      const renderedBody = renderTemplate(template.body, lead);

      // Create a log entry
      const logEntry = {
        lead_id: lead.id,
        lead_username: lead.username || '',
        lead_email: lead.email || '',
        lead_phone: lead.phone || '',
        sequence_id: seq.id,
        sequence_name: seq.name,
        template_id: template.id,
        channel: template.channel,
        subject: renderedSubject,
        body: renderedBody,
        status: 'pending',
      };

      // If delay_days = 0, mark as sent immediately (simulation)
      // In production, connect to Twilio/SendGrid via their API keys
      if ((seq.delay_days || 0) === 0) {
        if (template.channel === 'email' && lead.email) {
          // Send via Base44 built-in email
          await base44.integrations.Core.SendEmail({
            to: lead.email,
            subject: renderedSubject || `Follow-up from Legendary Leads`,
            body: renderedBody,
          });
          logEntry.status = 'sent';
        } else if (template.channel === 'sms' && lead.phone) {
          // SMS requires Twilio - log as pending for external pickup
          logEntry.status = 'pending';
          logEntry.error = 'SMS requires Twilio integration — configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN';
        } else {
          logEntry.status = 'failed';
          logEntry.error = `No ${template.channel} contact info on lead`;
        }
      } else {
        // Delayed — keep as pending; the scheduledFollowUps function will pick it up
        logEntry.status = 'pending';
      }

      const created = await base44.entities.FollowUpLog.create(logEntry);
      results.push({ sequence: seq.name, channel: template.channel, status: logEntry.status, log_id: created.id });
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});