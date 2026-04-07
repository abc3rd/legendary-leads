import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Runs on a schedule to process time-based and delayed pending follow-ups
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const now = new Date();

    // Find all active time-based sequences
    const sequences = await base44.asServiceRole.entities.FollowUpSequence.filter({ 
      is_active: true, 
      trigger_type: 'time_based' 
    });

    const results = [];

    for (const seq of sequences) {
      const template = (await base44.asServiceRole.entities.FollowUpTemplate.filter({ id: seq.template_id }))[0];
      if (!template) continue;

      // Get leads matching sequence filters
      const leadFilter = {};
      if (seq.filter_category) leadFilter.category = seq.filter_category;

      const leads = await base44.asServiceRole.entities.Lead.filter(leadFilter);

      for (const lead of leads) {
        if (seq.filter_has_email && !lead.email) continue;
        if (seq.filter_has_phone && !lead.phone) continue;

        // Check if we already sent this sequence to this lead
        const existingLogs = await base44.asServiceRole.entities.FollowUpLog.filter({
          lead_id: lead.id,
          sequence_id: seq.id,
          status: 'sent',
        });
        if (existingLogs.length > 0) continue;

        // Check lead age vs delay
        const leadDate = new Date(lead.created_date);
        const daysOld = (now - leadDate) / (1000 * 60 * 60 * 24);
        if (daysOld < (seq.delay_days || 0)) continue;

        const renderedSubject = renderTemplate(template.subject, lead);
        const renderedBody = renderTemplate(template.body, lead);

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

        if (template.channel === 'email' && lead.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: lead.email,
            subject: renderedSubject || 'Follow-up from Legendary Leads',
            body: renderedBody,
          });
          logEntry.status = 'sent';
        } else if (!lead.email && !lead.phone) {
          logEntry.status = 'failed';
          logEntry.error = 'No contact info';
        }

        await base44.asServiceRole.entities.FollowUpLog.create(logEntry);
        results.push({ lead: lead.username || lead.id, status: logEntry.status });
      }
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

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