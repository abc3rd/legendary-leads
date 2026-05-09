import { useMemo } from 'react';

const CLUSTER_RADIUS_DEG = 1.2; // degrees (~80 miles)

function distance(a, b) {
  const dlat = a[0] - b[0];
  const dlng = a[1] - b[1];
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

/**
 * Simple greedy clustering: groups leads within CLUSTER_RADIUS_DEG of each other.
 * Returns an array of { center: [lat, lng], leads: [...] }
 */
export default function useLeadClusters(geoLeads) {
  return useMemo(() => {
    const visited = new Set();
    const clusters = [];

    for (let i = 0; i < geoLeads.length; i++) {
      if (visited.has(i)) continue;
      const lead = geoLeads[i];
      const cluster = { leads: [lead], center: [...lead._latlng] };
      visited.add(i);

      for (let j = i + 1; j < geoLeads.length; j++) {
        if (visited.has(j)) continue;
        if (distance(lead._latlng, geoLeads[j]._latlng) <= CLUSTER_RADIUS_DEG) {
          cluster.leads.push(geoLeads[j]);
          visited.add(j);
        }
      }

      // Recalculate centroid
      const avgLat = cluster.leads.reduce((s, l) => s + l._latlng[0], 0) / cluster.leads.length;
      const avgLng = cluster.leads.reduce((s, l) => s + l._latlng[1], 0) / cluster.leads.length;
      cluster.center = [avgLat, avgLng];

      clusters.push(cluster);
    }

    return clusters;
  }, [geoLeads]);
}