# CallScribe 

**The national response time goal for paramedics in Canada is 8 minutes 59 seconds, for the most serious emergencies, and according to the BCHRN , in the province of British Columbia, this goal is only being met 30% of the time.**

CallScribe is a next-generation dispatch interface that uses **Real-Time AI** to listen, transcribe, and analyze emergency calls instantly. It empowers operators to make faster, data-driven decisions when every moment counts.

## The Problem

Emergency dispatchers operate in one of the most high-stakes environments imaginable. In just a few minutes, they must extract critical information from callers who may be panicked, injured, or speaking a different language, all while knowing that missing a single question (such as breathing or scene safety) can have life-or-death consequences.

##  The Solution
CallScribe automates the "busy work" so the human can focus on the human.
- **Listens**: Transcribes audio in real-time using medical-grade AI.
- **Thinks**: Extracts symptoms, patient age, and urgency automatically.
- **Acts**: Calculates traffic-based ETAs and recommends the nearest ambulance.

---

## Key Features

### Live Transcription (ElevenLabs Scribe)
Forget typing. We use **ElevenLabs Scribe v2** to transcribe audio with human-level accuracy, handling accents, diff languages medical terms, and overlapping speech (Diarization) in real-time.

### Intelligent Triage (Google Gemini)
Our background AI engine analyzesthe transcript every 5 seconds to:
- **Detect Symptoms**: "Chest pain", "Slurred speech".
- **Assess Urgency**: Automatically flags calls as **Stable**, **Urgent**, or **Critical**.
- **Generate Checklists**: Pushes live SOPs to the operator's screen.

### Smart Dispatch (Featherless + OpenRouter)
Who is *actually* closest?
- Real-time map with moving ambulance markers.
- **Featherless (GLM-4)** calculates complex logistics and traffic patterns.
- **OpenRouter (GPT-4o)** serves as a robust fallback to ensure uptime.

### Audio Playback
A custom bi-directional audio pipeline that allows:
- **Cross-Device Communication**: Operator on Laptop ↔️ Paramedic on iPhone.
- **On-the-Fly Conversion**: Transcodes web audio (WebM) to iOS-compatible formats (AAC/MP4) instantly on the server.
---

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/UI, Leaflet Maps.
- **Backend**: Node.js, Express, Socket.io (Real-time events).
- **AI**: ElevenLabs Scribe (STT), Google Gemini (Analysis & Transalation), Featherless/OpenRouter (Logistics).
- **Database**: MongoDB Atlas (Encrypted storage).

---

## Privacy & Security
CallScribe uses a **Zero-Retention Architecture**.
- AI analysis is performed in-memory and discarded.
- Audio files are cryptographically deleted immediately after processing.
- Data is only persisted in your secure, encrypted MongoDB instance.

---

## Demo
https://callscribe.onrender.com




https://www.youtube.com/watch?v=Ft1t0QtdnL8
