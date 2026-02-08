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
  resolvedAt?: Date;
  dispatchedAt?: Date;
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
  status: 'available' | 'en-route' | 'on-scene';
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
    location: '1250 Granville Street, Downtown Vancouver',
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
    location: '3500 Cambie Street, Vancouver',
    urgency: 'urgent',
    status: 'queued',
    summary: 'Caller took a fall while running, reporting leg injury and bleeding. Conscious but unable to stand.',
    symptoms: ['leg injury', 'bleeding'],
    patientType: 'Adult (34M)',
    confidence: 87,
    timestamp: new Date(Date.now() - 300000),
    duration: 203,
    transcript: [
      { speaker: 'operator', text: 'Emergency services, what is your emergency?', timestamp: '00:00' },
      { speaker: 'caller', text: 'I fell while running. I think someone was following me and I tripped.', timestamp: '00:04' },
      { speaker: 'operator', text: 'Are you injured?', timestamp: '00:08' },
      { speaker: 'caller', text: 'My leg hurts really bad and I\'m bleeding a little. I can\'t stand up.', timestamp: '00:11', keywords: ['leg', 'bleeding', 'can\'t stand'] },
    ],
  },
  {
    id: 'call-003',
    callerName: 'Linda Park',
    phone: '+1 (555) 345-6789',
    location: '850 West 41st Avenue, Kerrisdale Vancouver',
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
    location: '2750 East Hastings Street, Vancouver',
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
  {
    id: 'call-005',
    callerName: 'Marie Dubois',
    phone: '+1 (555) 432-9876',
    location: '1055 West Broadway, Vancouver',
    urgency: 'urgent',
    status: 'queued',
    summary: '52-year-old female, severe chest pain and shortness of breath.',
    symptoms: ['douleur thoracique', 'essoufflement', 'transpiration'],
    patientType: 'Adult (52F)',
    confidence: 91,
    timestamp: new Date(Date.now() - 180000),
    duration: 102,
    transcript: [
      { speaker: 'operator', text: 'Services d\'urgence, quelle est votre urgence?', timestamp: '00:00' },
      { speaker: 'caller', text: 'S\'il vous plaît, aidez-moi. J\'ai une forte douleur à la poitrine et j\'ai du mal à respirer.', timestamp: '00:05', keywords: ['douleur', 'poitrine', 'respirer'] },
      { speaker: 'operator', text: 'Êtes-vous consciente? Pouvez-vous me parler?', timestamp: '00:11' },
      { speaker: 'caller', text: 'Oui, mais je me sens très faible et j\'ai des vertiges.', timestamp: '00:15', keywords: ['faible', 'vertiges'] },
      { speaker: 'operator', text: 'Quel âge avez-vous?', timestamp: '00:20' },
      { speaker: 'caller', text: 'J\'ai 52 ans. J\'ai aussi des douleurs dans le bras gauche.', timestamp: '00:23', keywords: ['bras gauche'] },
      { speaker: 'operator', text: 'Restez calme. L\'ambulance arrive tout de suite.', timestamp: '00:28' },
      { speaker: 'caller', text: 'Merci, dépêchez-vous s\'il vous plaît.', timestamp: '00:32' },
    ],
  },
];

export const mockAmbulances: Ambulance[] = [
  { id: 'amb-1', unit: 'MEDIC-1', status: 'en-route', crew: 'Martinez / Patel', location: 'En route to 142 Oak St', assignedCall: 'call-001', eta: 4 },
  { id: 'amb-2', unit: 'MEDIC-2', status: 'on-scene', crew: 'Johnson / Lee', location: '456 Industrial Blvd', assignedCall: 'call-004' },
  { id: 'amb-3', unit: 'MEDIC-3', status: 'available', crew: 'Williams / Garcia', location: 'Station 3 — Central' },
  { id: 'amb-4', unit: 'MEDIC-4', status: 'available', crew: 'Brown / Nguyen', location: 'Station 1 — Northgate' },
  { id: 'amb-5', unit: 'MEDIC-5', status: 'available', crew: 'Davis / Wilson', location: 'Station' },
];
