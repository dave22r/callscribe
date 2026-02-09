# CallScribe 🚑
**Real-Time AI Assistant for 911 Dispatchers**

> *Saving seconds saves lives.*

CallScribe is a next-generation dispatch interface that uses **Real-Time AI** to listen, transcribe, and analyze emergency calls instantly. It empowers operators to make faster, data-driven decisions when every moment counts.

## 🚨 The Problem
911 Operators are overwhelmed. They have to:
1.  Listen to distressed callers.
2.  Type transcripts manually.
3.  Calculate logistics and traffic.
4.  Make life-or-death triage decisions.
...all at the same time.

## ⚡ The Solution
CallScribe automates the "busy work" so the human can focus on the human.
- **👂 Listens**: Transcribes audio in real-time using medical-grade AI.
- **🧠 Thinks**: Extracts symptoms, patient age, and urgency automatically.
- **🚀 Acts**: Calculates traffic-based ETAs and recommends the nearest ambulance.

---

## ✨ Key Features

### 🎙️ Live Transcription (ElevenLabs Scribe)
Forget typing. We use **ElevenLabs Scribe v2** to transcribe audio with human-level accuracy, handling accents, medical terms, and overlapping speech (Diarization) in real-time.

### 🧠 Intelligent Triage (Google Gemini)
Our background AI engine analyzesthe transcript every 5 seconds to:
- **Detect Symptoms**: "Chest pain", "Slurred speech".
- **Assess Urgency**: Automatically flags calls as **Stable**, **Urgent**, or **Critical**.
- **Generate Checklists**: Pushes live SOPs (e.g., "Start CPR") to the operator's screen.

### 🚑 Smart Dispatch (Featherless + OpenRouter)
Who is *actually* closest?
- Real-time map with moving ambulance markers.
- **Featherless (GLM-4)** calculates complex logistics and traffic patterns.
- **OpenRouter (GPT-4o)** serves as a robust fallback to ensure 99.99% uptime.

### 📱 "Walkie-Talkie" Audio System
A custom bi-directional audio pipeline that allows:
- **Cross-Device Communication**: Operator on Laptop ↔️ Paramedic on iPhone.
- **On-the-Fly Conversion**: Transcodes web audio (WebM) to iOS-compatible formats (AAC/MP4) instantly on the server.

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/UI, Leaflet Maps.
- **Backend**: Node.js, Express, Socket.io (Real-time events).
- **AI**: ElevenLabs Scribe (STT), Google Gemini (Analysis), Featherless/OpenRouter (Logistics).
- **Database**: MongoDB Atlas (Encrypted storage).
- **Infrastructure**: PM2, FFmpeg (Server-side processing).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB URI
- API Keys (ElevenLabs, Gemini, OpenRouter)

### Installation
```bash
# Clone the repo
git clone https://github.com/dave22r/callscribe.git

# Install dependencies
npm install

# Setup Environment
cp .env.example .env
# (Fill in your API keys)
```

### Run Locally
```bash
# Starts both Frontend (Vite) and Backend (Node) concurrently
npm run dev:all
```
Open `http://localhost:8080` to see the Dispatch Dashboard.

---

## 🔒 Privacy & Security
CallScribe uses a **Zero-Retention Architecture**.
- AI analysis is performed in-memory and discarded.
- Audio files are cryptographically deleted immediately after processing.
- Data is only persisted in your secure, encrypted MongoDB instance.

---

*Built with ❤️ for the Hackathon.*
