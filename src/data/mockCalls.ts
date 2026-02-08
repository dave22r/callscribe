export type UrgencyLevel = 'critical' | 'urgent' | 'stable';

export interface EmergencyCall {
  id: string;
  callerName: string;
  phone: string;
  location: string;
  urgency: UrgencyLevel;
  status: 'active' | 'queued' | 'dispatched' | 'resolved' | 'processing';
  tags?: string[];
  summary: string;
  symptoms: string[];
  patientType: string;
  confidence: number;
  timestamp: Date;
  duration: number; // seconds
  transcript: TranscriptLine[];
}

export interface TranscriptLine {
  speaker: 'caller' | 'operator';
  text: string;
  timestamp: string;
  keywords?: string[];
}

export interface Ambulance {
  id: string;
  unit: string;
  status: 'available' | 'en-route' | 'on-scene' | 'returning';
  crew: string;
  location: string;
  assignedCall?: string;
  eta?: number; // minutes
}

export const mockCalls: EmergencyCall[] = [
  {
    id: 'call-001',
    callerName: 'Maria Santos',
    phone: '+1 (555) 234-8901',
    location: '142 Oak Street, Downtown',
    urgency: 'critical',
    status: 'active',
    summary: '58-year-old male, chest pain, difficulty breathing. History of cardiac issues.',
    symptoms: ['chest pain', 'difficulty breathing', 'sweating', 'dizziness'],
    patientType: 'Adult (58M)',
    confidence: 94,
    timestamp: new Date(Date.now() - 120000),
    duration: 127,
    transcript: [
      { speaker: 'operator', text: 'Emergency services, what is your emergency?', timestamp: '00:00' },
      { speaker: 'caller', text: 'Please help, my husband — he\'s grabbing his chest, he can\'t breathe properly!', timestamp: '00:03', keywords: ['chest', 'breathe'] },
      { speaker: 'operator', text: 'Ma\'am, I need you to stay calm. Is he conscious right now?', timestamp: '00:08' },
      { speaker: 'caller', text: 'Yes, yes he\'s awake but he\'s sweating a lot and says his left arm feels numb.', timestamp: '00:12', keywords: ['sweating', 'left arm', 'numb'] },
      { speaker: 'operator', text: 'How old is your husband?', timestamp: '00:18' },
      { speaker: 'caller', text: 'He\'s 58. He had a heart procedure two years ago, a stent I think.', timestamp: '00:21', keywords: ['heart procedure', 'stent'] },
      { speaker: 'caller', text: 'Oh god, he looks really pale now. Please hurry!', timestamp: '00:28', keywords: ['pale'] },
    ],
  },
  {
    id: 'call-002',
    callerName: 'James Chen',
    phone: '+1 (555) 876-5432',
    location: '89 Riverside Ave, Westside',
    urgency: 'urgent',
    status: 'queued',
    summary: 'Vehicle collision, driver conscious but bleeding from forehead. Airbag deployed.',
    symptoms: ['head laceration', 'bleeding', 'neck pain', 'disorientation'],
    patientType: 'Adult (34M)',
    confidence: 87,
    timestamp: new Date(Date.now() - 300000),
    duration: 203,
    transcript: [
      { speaker: 'operator', text: 'Emergency services, what is your emergency?', timestamp: '00:00' },
      { speaker: 'caller', text: 'There\'s been a car accident on Riverside Ave. I hit a pole.', timestamp: '00:04' },
      { speaker: 'operator', text: 'Are you injured?', timestamp: '00:08' },
      { speaker: 'caller', text: 'My head is bleeding pretty bad, the airbag went off. My neck hurts too.', timestamp: '00:11', keywords: ['bleeding', 'head', 'neck'] },
    ],
  },
  {
    id: 'call-003',
    callerName: 'Linda Park',
    phone: '+1 (555) 345-6789',
    location: '2100 Maple Drive, Northgate',
    urgency: 'stable',
    status: 'queued',
    summary: 'Child fell from playground equipment. Possible wrist fracture, no head injury.',
    symptoms: ['wrist pain', 'swelling', 'crying'],
    patientType: 'Child (7F)',
    confidence: 78,
    timestamp: new Date(Date.now() - 480000),
    duration: 156,
    transcript: [
      { speaker: 'operator', text: 'Emergency services, what is your emergency?', timestamp: '00:00' },
      { speaker: 'caller', text: 'My daughter fell off the monkey bars at the park. Her wrist looks swollen.', timestamp: '00:03', keywords: ['fell', 'wrist', 'swollen'] },
      { speaker: 'operator', text: 'Is she conscious? Did she hit her head?', timestamp: '00:08' },
      { speaker: 'caller', text: 'She\'s awake and crying. No, she landed on her arm, not her head.', timestamp: '00:12' },
    ],
  },
  {
    id: 'call-004',
    callerName: 'Robert Kim',
    phone: '+1 (555) 901-2345',
    location: '456 Industrial Blvd, East District',
    urgency: 'critical',
    status: 'dispatched',
    summary: 'Workplace accident. Patient unconscious after fall from scaffolding, approximately 15 feet.',
    symptoms: ['unconscious', 'possible spinal injury', 'head trauma'],
    patientType: 'Adult (42M)',
    confidence: 96,
    timestamp: new Date(Date.now() - 600000),
    duration: 89,
    transcript: [
      { speaker: 'operator', text: 'Emergency services, what is your emergency?', timestamp: '00:00' },
      { speaker: 'caller', text: 'A worker fell from scaffolding at our construction site! He\'s not moving!', timestamp: '00:03', keywords: ['fell', 'scaffolding', 'not moving'] },
      { speaker: 'operator', text: 'Is he breathing?', timestamp: '00:07' },
      { speaker: 'caller', text: 'I think so but he\'s unconscious. It was at least 15 feet.', timestamp: '00:10', keywords: ['unconscious', '15 feet'] },
    ],
  },
];

export const mockAmbulances: Ambulance[] = [
  { id: 'amb-1', unit: 'MEDIC-1', status: 'en-route', crew: 'Martinez / Patel', location: 'En route to 142 Oak St', assignedCall: 'call-001', eta: 4 },
  { id: 'amb-2', unit: 'MEDIC-2', status: 'on-scene', crew: 'Johnson / Lee', location: '456 Industrial Blvd', assignedCall: 'call-004' },
  { id: 'amb-3', unit: 'MEDIC-3', status: 'available', crew: 'Williams / Garcia', location: 'Station 3 — Central' },
  { id: 'amb-4', unit: 'MEDIC-4', status: 'available', crew: 'Brown / Nguyen', location: 'Station 1 — Northgate' },
  { id: 'amb-5', unit: 'MEDIC-5', status: 'returning', crew: 'Davis / Wilson', location: 'Returning from Memorial Hospital', eta: 12 },
];
