import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Support both scheduled (service role) and user-triggered calls
  let isScheduled = false;
  let watchId = null;

  try {
    const body = await req.json();
    watchId = body.watchId;
    isScheduled = body.scheduled === true;
  } catch {
    // no body
  }

  // For user-triggered, verify auth
  if (!isScheduled) {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch watches to run
  let watches = [];
  if (watchId) {
    const w = await base44.asServiceRole.entities.NicheWatch.get(watchId);
    if (w) watches = [w];
  } else {
    watches = await base44.asServiceRole.entities.NicheWatch.filter({ is_active: true });
  }

  const results = [];

  for (const watch of watches) {
    const keyword = watch.keywords?.[0] || '';
    const platform = watch.platforms?.[0] || 'instagram';
    if (!keyword) continue;

    // Discover leads
    let discovered = [];
    try {
      const res = await base44.asServiceRole.functions.invoke('discoverLeads', {
        platform,
        keyword,
        niche: keyword,
        minFollowers: watch.min_followers || 1000,
        maxFollowers: watch.max_followers || 5000000,
        count: Math.min(watch.leads_per_run || 10, 20),
      });
      discovered = res?.leads || res?.data?.leads || [];
    } catch {
      results.push({ watchId: watch.id, name: watch.name, error: 'discoverLeads failed', found: 0 });
      continue;
    }

    if (!discovered.length) {
      results.push({ watchId: watch.id, name: watch.name, found: 0 });
      continue;
    }

    // Bulk create leads with niche tag
    const records = discovered.map(l => ({
      username: l.username || l.handle,
      name: l.name || l.display_name,
      bio: l.bio || l.description,
      category: l.niche || l.category || keyword,
      followerCount: l.follower_count || l.followers || 0,
      followingCount: l.following_count || l.following || 0,
      website: l.website || l.url,
      email: l.email,
      phone: l.phone,
      status: 'new',
      tag: watch.tag || keyword,
      platform_source: platform,
    }));

    const created = await base44.asServiceRole.entities.Lead.bulkCreate(records);

    // Trigger sequences if enabled
    if (watch.trigger_sequence && created?.length) {
      for (const lead of created) {
        if (!lead?.id) continue;
        try {
          await base44.asServiceRole.functions.invoke('triggerStatusFollowUp', {
            leadId: lead.id,
            status: 'new',
          });
        } catch {
          // best effort
        }
      }
    }

    // Update watch stats
    await base44.asServiceRole.entities.NicheWatch.update(watch.id, {
      last_run_at: new Date().toISOString(),
      total_leads_found: (watch.total_leads_found || 0) + (created?.length || 0),
    });

    results.push({ watchId: watch.id, name: watch.name, found: created?.length || 0 });
  }

  return Response.json({ success: true, results });
});