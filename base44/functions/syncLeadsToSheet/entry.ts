import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spreadsheetId } = await req.json();
    if (!spreadsheetId) {
      return Response.json({ error: 'spreadsheetId is required' }, { status: 400 });
    }

    // Get Google Sheets access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch all leads
    const leads = await base44.asServiceRole.entities.Lead.list('-updated_date', 5000);

    // Build rows: header + data
    const header = [
      'Username', 'Full Name', 'Status', 'Lead Score', 'Grade',
      'Category', 'Email', 'Phone', 'Assigned To', 'Followers',
      'Sentiment', 'Churn Risk', 'Last Updated'
    ];

    const rows = leads.map(lead => [
      lead.username || '',
      lead.name || '',
      lead.status || 'new',
      lead.lead_score != null ? lead.lead_score : '',
      lead.lead_grade || '',
      lead.category || '',
      lead.email || '',
      lead.phone || '',
      lead.assigned_name || lead.assigned_to || '',
      lead.followerCount != null ? lead.followerCount : '',
      lead.sentiment || '',
      lead.churn_risk || '',
      lead.updated_date ? new Date(lead.updated_date).toLocaleString() : '',
    ]);

    const values = [header, ...rows];
    const range = 'Lead Status Report!A1';

    // Clear the sheet first, then write fresh data
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Lead%20Status%20Report!A1:Z10000:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    // Write all data
    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
    const writeRes = await fetch(writeUrl, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    });

    if (!writeRes.ok) {
      const errText = await writeRes.text();
      // If sheet tab doesn't exist, create it then retry
      if (errText.includes('Unable to parse range') || writeRes.status === 400) {
        // Add the sheet tab
        const addSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
        await fetch(addSheetUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: 'Lead Status Report' } } }]
          }),
        });
        // Retry write
        const retryRes = await fetch(writeUrl, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
        });
        if (!retryRes.ok) {
          const retryErr = await retryRes.text();
          return Response.json({ error: retryErr }, { status: 500 });
        }
      } else {
        return Response.json({ error: errText }, { status: 500 });
      }
    }

    // Bold the header row
    const getMetaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
    const metaRes = await fetch(getMetaUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const meta = await metaRes.json();
    const sheetTab = (meta.sheets || []).find(s => s.properties?.title === 'Lead Status Report');
    if (sheetTab) {
      const sheetId = sheetTab.properties.sheetId;
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.09, green: 0.04, blue: 0.18 } } },
              fields: 'userEnteredFormat(textFormat,backgroundColor)',
            }
          }]
        }),
      });
    }

    return Response.json({ success: true, updated: rows.length, total: leads.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});