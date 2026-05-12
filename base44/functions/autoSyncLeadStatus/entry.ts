import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation when a lead's status changes.
// Reads the saved spreadsheetId from a config entity or env, then pushes the updated lead row.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { event, data } = body;

    // Only process update events where status actually changed
    if (event?.type !== 'update') {
      return Response.json({ skipped: true, reason: 'not an update event' });
    }

    const spreadsheetId = Deno.env.get('GOOGLE_SHEET_ID');
    if (!spreadsheetId) {
      return Response.json({ skipped: true, reason: 'GOOGLE_SHEET_ID env not set' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    const lead = data;
    if (!lead) {
      return Response.json({ skipped: true, reason: 'no lead data' });
    }

    // Append a single row to the "Status Change Log" sheet for real-time tracking
    const row = [
      lead.username || '',
      lead.name || '',
      lead.status || '',
      lead.lead_score != null ? lead.lead_score : '',
      lead.lead_grade || '',
      lead.assigned_name || lead.assigned_to || '',
      new Date().toISOString(),
    ];

    const range = 'Status Change Log!A:G';
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

    const res = await fetch(appendUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Sheets append error:', errText);
      return Response.json({ success: false, error: errText }, { status: 500 });
    }

    return Response.json({ success: true, lead_username: lead.username, new_status: lead.status });
  } catch (error) {
    console.error('autoSyncLeadStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});