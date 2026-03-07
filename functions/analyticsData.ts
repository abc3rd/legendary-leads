import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { propertyId, startDate = '30daysAgo', endDate = 'today', dimensions = [] } = body;

    if (!propertyId) {
      // Return list of GA4 properties
      const accountsRes = await fetch(
        'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const accountsData = await accountsRes.json();
      return Response.json({ accounts: accountsData.accountSummaries || [] });
    }

    // Build dimension objects
    const dimensionObjs = dimensions.map(d => ({ name: d }));

    // Run report
    const reportRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'newUsers' },
          ],
          dimensions: dimensionObjs.length > 0 ? dimensionObjs : [{ name: 'date' }],
          orderBys: [{ dimension: { dimensionName: dimensionObjs.length > 0 ? dimensionObjs[0].name : 'date' } }],
          limit: 100,
        }),
      }
    );

    const reportData = await reportRes.json();
    return Response.json({ report: reportData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});