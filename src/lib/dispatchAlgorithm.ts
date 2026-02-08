import type { Ambulance, EmergencyCall } from '@/data/mockCalls';

// Track dispatch history for fairness calculation
const dispatchHistory: { ambulanceId: string; timestamp: number }[] = [];

// Severity weights
const SEVERITY_WEIGHTS = {
  critical: 100,
  urgent: 50,
  stable: 10,
};

// Calculate distance between two points (simplified)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Parse location string to coordinates (simplified)
function parseLocation(location: string): { lat: number; lon: number } | null {
  // Vancouver coordinates as default
  const defaultCoords = { lat: 49.2827, lon: -123.1207 };
  
  // If location contains coordinates, parse them
  if (location.includes(',')) {
    const parts = location.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lon: parts[1] };
    }
  }
  
  return defaultCoords;
}

// Calculate fairness score (lower is better - means ambulance hasn't been used recently)
function calculateFairnessScore(ambulanceId: string): number {
  const now = Date.now();
  const recentDispatches = dispatchHistory.filter(
    (h) => h.ambulanceId === ambulanceId && now - h.timestamp < 3600000 // Last hour
  );
  
  return recentDispatches.length * 10; // Penalty for recent dispatches
}

// Main dispatch algorithm
export function calculateBestAmbulance(
  call: EmergencyCall,
  ambulances: Ambulance[]
): { ambulance: Ambulance; score: number; breakdown: any } | null {
  const availableAmbulances = ambulances.filter((a) => a.status === 'available');
  
  if (availableAmbulances.length === 0) {
    return null;
  }
  
  const callLocation = parseLocation(call.location);
  if (!callLocation) {
    return null;
  }
  
  const scores = availableAmbulances.map((ambulance) => {
    const ambulanceLocation = parseLocation(ambulance.location);
    if (!ambulanceLocation) {
      return { ambulance, score: Infinity, breakdown: {} };
    }
    
    // Calculate components
    const distance = calculateDistance(
      callLocation.lat,
      callLocation.lon,
      ambulanceLocation.lat,
      ambulanceLocation.lon
    );
    
    const severityScore = SEVERITY_WEIGHTS[call.urgency] || 10;
    const fairnessScore = calculateFairnessScore(ambulance.id);
    
    // Weighted score (lower is better)
    // Distance is most important, then severity, then fairness
    const totalScore = distance * 2 + (100 - severityScore) * 0.5 + fairnessScore;
    
    return {
      ambulance,
      score: totalScore,
      breakdown: {
        distance: distance.toFixed(2),
        severity: severityScore,
        fairness: fairnessScore,
      },
    };
  });
  
  // Sort by score (lower is better)
  scores.sort((a, b) => a.score - b.score);
  
  return scores[0];
}

// Record a dispatch
export function recordDispatch(ambulanceId: string): void {
  dispatchHistory.push({
    ambulanceId,
    timestamp: Date.now(),
  });
  
  // Keep only last 100 dispatches
  if (dispatchHistory.length > 100) {
    dispatchHistory.shift();
  }
}

// Get dispatch history for an ambulance
export function getDispatchHistory(ambulanceId: string): number {
  const now = Date.now();
  return dispatchHistory.filter(
    (h) => h.ambulanceId === ambulanceId && now - h.timestamp < 3600000
  ).length;
}
