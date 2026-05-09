import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { lead_id, category } = await req.json();
  if (!lead_id) return Response.json({ error: 'lead_id required' }, { status: 400 });

  // Get all active assignees
  const assignees = await base44.asServiceRole.entities.LeadAssignment.filter({ is_active: true });
  if (!assignees.length) return Response.json({ error: 'No active assignees configured' }, { status: 404 });

  // Priority: category expertise match, then least workload
  const lead = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
  const leadCategory = category || lead[0]?.category || '';

  // Score each assignee
  const scored = assignees.map(a => {
    const expertise = a.category_expertise || [];
    const expertiseMatch = expertise.some(e =>
      e.toLowerCase().includes(leadCategory.toLowerCase()) ||
      leadCategory.toLowerCase().includes(e.toLowerCase())
    ) ? 0 : 1; // 0 = match (better), 1 = no match
    return { ...a, score: expertiseMatch * 1000 + (a.active_lead_count || 0) };
  });

  scored.sort((a, b) => a.score - b.score);
  const chosen = scored[0];

  // Update the lead
  await base44.asServiceRole.entities.Lead.update(lead_id, {
    assigned_to: chosen.assignee_email,
    assigned_name: chosen.assignee_name,
  });

  // Update workload counter
  await base44.asServiceRole.entities.LeadAssignment.update(chosen.id, {
    active_lead_count: (chosen.active_lead_count || 0) + 1,
    last_assigned_at: new Date().toISOString(),
  });

  return Response.json({
    success: true,
    assigned_to: chosen.assignee_email,
    assigned_name: chosen.assignee_name,
    message: `Lead assigned to ${chosen.assignee_name || chosen.assignee_email}`,
  });
});