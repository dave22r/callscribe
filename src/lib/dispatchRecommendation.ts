/**
 * Recommends which queued call to dispatch next based on:
 * - Urgency (critical > urgent > stable)
 * - Wait time (longer wait = higher priority within same urgency)
 * - AI confidence (tiebreaker)
 */
import type { EmergencyCall, UrgencyLevel } from '@/data/mockCalls';

const URGENCY_ORDER: Record<UrgencyLevel, number> = {
  critical: 3,
  urgent: 2,
  stable: 1,
};

function getWaitMinutes(call: EmergencyCall): number {
  const ts = call.timestamp instanceof Date ? call.timestamp : new Date(call.timestamp);
  return Math.floor((Date.now() - ts.getTime()) / 60_000);
}

export function getRecommendedDispatch(calls: EmergencyCall[]): EmergencyCall | null {
  const queued = calls.filter((c) => c.status === 'queued');
  if (queued.length === 0) return null;

  return [...queued].sort((a, b) => {
    // Primary: urgency (higher first)
    const urgA = URGENCY_ORDER[a.urgency];
    const urgB = URGENCY_ORDER[b.urgency];
    if (urgB !== urgA) return urgB - urgA;

    // Secondary: wait time (longer first)
    const waitA = getWaitMinutes(a);
    const waitB = getWaitMinutes(b);
    if (waitB !== waitA) return waitB - waitA;

    // Tertiary: confidence (higher first)
    return b.confidence - a.confidence;
  })[0];
}

export function getWaitTimeLabel(call: EmergencyCall): string {
  const mins = getWaitMinutes(call);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min';
  return `${mins} min`;
}
