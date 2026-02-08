/**
 * Extracts structured data from transcript text using pattern matching.
 * Used for auto-fill in the Triage Panel when processing live transcripts.
 */
import type { UrgencyLevel, TranscriptLine } from '@/data/mockCalls';

const CRITICAL_KEYWORDS = [
  'not breathing', 'unconscious', 'no pulse', 'severe bleeding', 'choking',
  'overdose', 'suicide', 'gunshot', 'stabbing', 'cardiac arrest', 'stroke',
  'anaphylaxis', 'severe allergic', 'not responsive', 'not moving',
  'not waking', 'stopped breathing', 'can\'t breathe', "can't breathe",
  'drowning', 'electrocution',
];

const URGENT_KEYWORDS = [
  'chest pain', 'heart attack', 'difficulty breathing', 'bleeding', 'broken',
  'fracture', 'head injury', 'concussion', 'severe pain', 'overdose',
  'diabetic', 'seizure', 'asthma attack', 'allergic reaction', 'burn',
  'fell', 'accident', 'collision', 'stabbed', 'shot',
];

export interface ParsedTranscript {
  location: string;
  age: string;
  patientType: string;
  symptoms: string[];
  urgency: UrgencyLevel;
  confidence: number;
  summary: string;
}

export function parseTranscript(transcript: TranscriptLine[]): ParsedTranscript {
  const fullText = transcript.map((t) => t.text).join(' ').toLowerCase();
  const words = fullText.split(/\s+/);

  const result: ParsedTranscript = {
    location: '',
    age: '',
    patientType: '',
    symptoms: [] as string[],
    urgency: 'stable',
    confidence: 70,
    summary: '',
  };

  // Extract location - address patterns, "at X", "in X"
  const addressMatch = fullText.match(
    /\d+\s+[\w\s]+?(?:street|st|avenue|ave|road|rd|drive|dr|blvd|lane|ln|way|park|place|pl)/gi
  );
  if (addressMatch?.length) {
    result.location = addressMatch[0].trim();
  } else {
    const atMatch = fullText.match(/(?:at|in)\s+([^,.!?]+(?:park|hospital|school|mall|center|store)[^,.!?]*)/gi);
    if (atMatch?.length) {
      result.location = atMatch[0].replace(/^(at|in)\s+/i, '').trim();
    }
  }
  if (!result.location) {
    const genericLoc = fullText.match(/(?:address|location|address is|we\'re at)\s*[:\.]?\s*([^,.!?]+)/i);
    if (genericLoc?.[1]) result.location = genericLoc[1].trim();
  }

  // Extract age
  const ageMatch = fullText.match(/(\d+)\s*(?:year|yr)s?\s*old/i) ?? fullText.match(/(?:age|he\'s|she\'s)\s*(?:is\s*)?(\d+)/i);
  if (ageMatch) {
    const age = ageMatch[1];
    result.age = age;
    const gender = /\b(he|him|male|boy|husband|father|son)\b/i.test(fullText) ? 'M' :
      /\b(she|her|female|girl|wife|mother|daughter)\b/i.test(fullText) ? 'F' : '';
    result.patientType = gender ? `Adult (${age}${gender})` : `Adult (${age})`;
  }
  const childMatch = fullText.match(/(\d+)\s*(?:year|month|day)s?\s*old/i);
  if (childMatch && parseInt(childMatch[1], 10) < 18) {
    const age = childMatch[1];
    result.age = age;
    const gender = /\b(boy|son|he|him)\b/i.test(fullText) ? 'M' : /\b(girl|daughter|she|her)\b/i.test(fullText) ? 'F' : '';
    result.patientType = gender ? `Child (${age}${gender})` : `Child (${age})`;
  }

  // Extract symptoms from keyword lists and common phrases
  const foundSymptoms = new Set<string>();
  const symptomPhrases = [
    'chest pain', 'difficulty breathing', 'can\'t breathe', 'not breathing',
    'bleeding', 'unconscious', 'severe pain', 'head injury', 'neck pain',
    'broken arm', 'broken leg', 'wrist pain', 'swelling', 'dizzy', 'dizziness',
    'sweating', 'numb', 'numbness', 'vomiting', 'seizure', 'fell', 'fall',
    'heart attack', 'stroke', 'allergic', 'choking', 'burn', 'cut',
  ];
  for (const phrase of symptomPhrases) {
    if (fullText.includes(phrase)) foundSymptoms.add(phrase);
  }
  result.symptoms = Array.from(foundSymptoms);

  // Urgency from keywords
  if (CRITICAL_KEYWORDS.some((k) => fullText.includes(k))) {
    result.urgency = 'critical';
    result.confidence = 92;
  } else if (URGENT_KEYWORDS.some((k) => fullText.includes(k))) {
    result.urgency = 'urgent';
    result.confidence = 85;
  } else {
    result.urgency = 'stable';
    result.confidence = 75;
  }

  // Build summary from first 200 chars of caller lines
  const callerLines = transcript.filter((t) => t.speaker === 'caller').map((t) => t.text);
  result.summary = callerLines.join(' ').slice(0, 200);
  if (callerLines.join(' ').length > 200) result.summary += '...';

  return result;
}
