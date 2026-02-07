# CallScribe Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up API Keys

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

#### Required API Keys:

**Gemini API** (Required for AI analysis)
- Get your key: https://makersuite.google.com/app/apikey
- Add to `.env`: `VITE_GEMINI_API_KEY=your_key_here`

**MongoDB Atlas** (Optional - app works without it)
- Create free cluster: https://www.mongodb.com/cloud/atlas/register
- Get connection string from Atlas dashboard
- Add to `.env`: `VITE_MONGODB_URI=mongodb+srv://...`

**Twilio** (Required for real phone calls)
- Sign up: https://www.twilio.com/try-twilio
- Get Account SID, Auth Token, and Phone Number
- Add to `.env`:
  ```
  TWILIO_ACCOUNT_SID=your_sid
  TWILIO_AUTH_TOKEN=your_token
  TWILIO_PHONE_NUMBER=+1234567890
  ```

**ElevenLabs** (Optional - for voice synthesis)
- Sign up: https://elevenlabs.io/
- Get API key from dashboard
- Add to `.env`: `ELEVENLABS_API_KEY=your_key_here`

### 3. Configure Twilio Webhooks

Once you have a Twilio number, configure these webhooks in your Twilio console:

**Voice Configuration:**
- When a call comes in: `https://your-domain.com/api/twilio/incoming-call`
- Status callback URL: `https://your-domain.com/api/twilio/status`

**For local development**, use ngrok to expose your local server:
```bash
ngrok http 3001
```

Then use the ngrok URL in Twilio webhooks (e.g., `https://abc123.ngrok.io/api/twilio/incoming-call`)

### 4. Run the Application

**Development mode (frontend + backend):**
```bash
npm run dev:all
```

This starts:
- Frontend on http://localhost:5173
- Backend API on http://localhost:3001

**Or run separately:**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

## 📱 Testing the System

### Option 1: Real Phone Call
1. Call your Twilio number from any phone
2. Describe an emergency scenario
3. Watch the dashboard update in real-time with:
   - Live transcription
   - AI urgency classification
   - Symptom detection
   - Triage recommendations

### Option 2: Mock Data (for demo)
The app includes mock emergency calls that demonstrate the UI without needing real calls.

## 🗺️ Ambulance Tracking

The map shows ambulance locations with color-coded status:
- 🟢 Green: Available
- 🟠 Orange: En Route
- 🔴 Red: On Scene
- 🔵 Blue: Returning

Currently uses simulated locations around Vancouver. In production, integrate with real GPS tracking.

## 🏆 Hackathon Sponsor Integrations

### ✅ Gemini API
- Analyzes call transcripts in real-time
- Extracts urgency level, symptoms, patient info
- Provides confidence scores and recommendations

### ✅ ElevenLabs
- Text-to-speech for dispatcher voice prompts
- Can be extended for speech-to-text transcription

### ✅ MongoDB Atlas
- Stores call history and transcripts
- Enables historical analysis and reporting
- App works without it (graceful degradation)

### ✅ Twilio
- Handles incoming emergency calls
- Provides call recording and transcription
- Manages call lifecycle events

## 🛠️ Project Structure

```
callscribe/
├── src/                    # Frontend React app
│   ├── components/         # UI components
│   ├── services/           # API & Socket.io clients
│   ├── hooks/              # React hooks
│   └── pages/              # Page components
├── server/                 # Backend Node.js API
│   ├── routes/             # API routes
│   ├── services/           # Gemini, ElevenLabs, etc.
│   └── config/             # Database config
└── public/                 # Static assets
```

## 🐛 Troubleshooting

**MongoDB connection fails:**
- App will continue working with mock data
- Check your connection string format
- Ensure IP whitelist includes your IP (or use 0.0.0.0/0 for testing)

**Twilio webhooks not working:**
- Verify ngrok is running and URL is updated in Twilio console
- Check server logs for incoming webhook requests
- Ensure webhook URLs end with correct paths

**Socket.io not connecting:**
- Check that backend server is running on port 3001
- Verify CORS settings allow your frontend origin
- Check browser console for connection errors

## 📊 Demo Script for Judges

1. **Show the dashboard** with mock calls
2. **Make a live call** to your Twilio number
3. **Watch real-time updates:**
   - Transcription appears as you speak
   - AI analyzes urgency and symptoms
   - Triage panel updates with recommendations
4. **Dispatch an ambulance** - show map tracking
5. **Show historical calls** from MongoDB

## 🎯 Next Steps for Production

- [ ] Integrate dedicated STT service (Deepgram/AssemblyAI)
- [ ] Add real GPS tracking for ambulances
- [ ] Implement dispatcher authentication
- [ ] Add call recording playback
- [ ] Build analytics dashboard
- [ ] Deploy to production (Render, Vercel, etc.)
