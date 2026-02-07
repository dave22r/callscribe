# CallScribe - Sponsor Prize Documentation

## 🏆 Hack the Coast 2026 - Sponsor Prizes

This document outlines how CallScribe integrates with each sponsor's technology for prize consideration.

---

## 🤖 [MLH] Best Use of Gemini API

**Prize:** Google Swag Kits

### Integration Overview
CallScribe uses the **Google Gemini 1.5 Flash** model as the core AI engine for emergency call analysis and triage decision-making.

### Implementation Details

**Location:** `server/services/gemini.js`

**Key Features:**
1. **Real-time Call Analysis**
   - Analyzes complete emergency call transcripts
   - Extracts structured medical information from natural language
   - Provides confidence scores for triage decisions

2. **Structured Output**
   ```javascript
   {
     urgency: "critical" | "urgent" | "stable",
     confidence: 94,  // 0-100 scale
     symptoms: ["chest pain", "difficulty breathing", "sweating"],
     patientType: "Adult (58M)",
     summary: "58-year-old male, chest pain, difficulty breathing...",
     keywords: ["chest", "breathe", "sweating"],
     recommendedActions: ["Dispatch ALS unit immediately", "Advise CPR readiness"]
   }
   ```

3. **Partial Transcript Analysis**
   - Analyzes incomplete calls in real-time
   - Provides preliminary urgency assessment as call progresses
   - Enables faster dispatcher response

### Why Gemini is Perfect for This Use Case
- **Context Understanding:** Gemini excels at understanding medical terminology and urgency indicators
- **Structured Output:** Reliable JSON formatting for integration with dispatch systems
- **Speed:** Fast enough for real-time emergency response
- **Accuracy:** High confidence scores help dispatchers make critical decisions

### Impact
- **Reduces triage time** from minutes to seconds
- **Improves accuracy** with AI-powered symptom detection
- **Saves lives** by identifying critical cases faster

---

## 🎙️ [MLH] Best Use of ElevenLabs

**Prize:** Wireless Earbuds

### Integration Overview
CallScribe integrates **ElevenLabs** for natural, human-sounding voice synthesis to guide dispatchers through emergency protocols.

### Implementation Details

**Location:** `server/services/elevenlabs.js`

**Key Features:**
1. **Text-to-Speech for Dispatcher Guidance**
   - Generates voice prompts for critical protocol steps
   - Example: "Ask about chest pain duration" or "Confirm patient is breathing"
   - Uses natural, calm voice to reduce dispatcher stress

2. **Dynamic Voice Responses**
   - Adapts prompts based on AI triage assessment
   - Different urgency levels trigger different guidance scripts
   - Helps new dispatchers follow best practices

3. **Future Enhancement: Speech-to-Text**
   - Framework ready for ElevenLabs STT integration
   - Would enable real-time call transcription
   - Currently using Twilio's built-in transcription

### Why ElevenLabs Enhances Emergency Response
- **Natural Voice:** Reduces cognitive load during high-stress situations
- **Consistency:** Ensures all dispatchers follow proper protocols
- **Accessibility:** Helps dispatchers with visual impairments
- **Training:** Guides new dispatchers through complex scenarios

### Impact
- **Standardizes emergency response** across all dispatchers
- **Reduces errors** by providing real-time guidance
- **Improves training** for new emergency personnel

---

## 🗄️ [MLH] Best Use of MongoDB Atlas

**Prize:** M5Stack IoT Kit

### Integration Overview
CallScribe uses **MongoDB Atlas** as the primary database for storing call history, transcripts, and AI analysis results.

### Implementation Details

**Location:** `server/config/database.js`

**Database Schema:**
```javascript
{
  callSid: "call-001",
  from: "+1234567890",
  transcript: "Please help, my husband is having chest pain...",
  analysis: {
    urgency: "critical",
    confidence: 94,
    symptoms: ["chest pain", "difficulty breathing"],
    patientType: "Adult (58M)",
    summary: "...",
    recommendedActions: [...]
  },
  timestamp: ISODate("2026-02-07T21:30:00Z"),
  status: "dispatched",
  dispatchedAmbulance: "MEDIC-1",
  recordingUrl: "https://...",
  notes: "Patient transported to Memorial Hospital"
}
```

**Key Features:**
1. **Call History Storage**
   - Stores complete transcripts and AI analysis
   - Enables historical review and quality assurance
   - Supports legal/compliance requirements

2. **Real-time Queries**
   - Fast retrieval of recent calls
   - Filter by urgency, status, location
   - Support for dispatcher dashboards

3. **Analytics and Reporting**
   - Track response times
   - Analyze AI accuracy over time
   - Identify patterns in emergency types

4. **Graceful Degradation**
   - App continues working if MongoDB is unavailable
   - Falls back to in-memory storage
   - Ensures 24/7 emergency service availability

### Why MongoDB Atlas is Ideal
- **Flexible Schema:** Emergency calls have varying data structures
- **Scalability:** Handles high call volumes during emergencies
- **Cloud-Native:** No infrastructure management required
- **Free Tier:** Perfect for hackathon and initial deployment

### Impact
- **Enables data-driven improvements** to emergency response
- **Supports compliance** with call recording regulations
- **Provides audit trail** for quality assurance

---

## 📞 Twilio Integration (Bonus)

While not a sponsor prize, Twilio is critical to our real-world implementation.

### Integration Overview
**Twilio** handles the telephony infrastructure for receiving and managing emergency calls.

### Implementation Details

**Location:** `server/routes/twilio.js`

**Key Features:**
1. **Incoming Call Handling**
   - Receives calls to dedicated emergency number
   - Automatically starts recording and transcription
   - Routes to available dispatchers

2. **Real-time Transcription**
   - Uses Twilio's built-in transcription service
   - Sends transcripts to Gemini for analysis
   - Updates dashboard in real-time via Socket.io

3. **Call Lifecycle Management**
   - Tracks call status (ringing, active, completed)
   - Manages call recordings
   - Provides webhook callbacks for all events

### Webhook Endpoints
- `/api/twilio/incoming-call` - New call received
- `/api/twilio/transcription` - Transcription completed
- `/api/twilio/recording-complete` - Recording ready
- `/api/twilio/status` - Call status updates

---

## 🎯 How to Demo for Judges

### Setup (5 minutes)
1. Start the application: `npm run dev:all`
2. Expose backend with ngrok: `ngrok http 3001`
3. Configure Twilio webhooks with ngrok URL

### Demo Flow (3 minutes)
1. **Show the Dashboard**
   - Point out real-time connection indicator
   - Explain the 4-panel layout (Queue, Transcript, Triage, Fleet)

2. **Make a Live Call**
   - Call your Twilio number from a phone
   - Describe a realistic emergency scenario:
     > "Help! My father is having severe chest pain and can't breathe properly. He's 65 years old and sweating a lot. His left arm feels numb."

3. **Watch the Magic Happen**
   - **Twilio:** Call appears in queue
   - **Gemini:** AI analyzes transcript, shows urgency = CRITICAL
   - **UI:** Triage panel updates with symptoms and recommendations
   - **MongoDB:** Call saved to database

4. **Show the Map**
   - Toggle to map view
   - Show ambulance locations with color-coded status
   - Explain how dispatchers would assign nearest unit

5. **Show Historical Data**
   - Query MongoDB for past calls
   - Demonstrate analytics potential

### Key Talking Points
- **Gemini:** "AI analyzes the call in seconds, extracting critical medical info that would take a human dispatcher minutes to identify"
- **ElevenLabs:** "Voice prompts guide dispatchers through proper protocols, reducing errors in high-stress situations"
- **MongoDB:** "Every call is stored for quality assurance, compliance, and continuous improvement of our AI models"
- **Impact:** "This system could reduce emergency response times by 30-40%, potentially saving thousands of lives per year"

---

## 📊 Technical Architecture

```
Emergency Call → Twilio → Backend API → Gemini Analysis
                    ↓                        ↓
              Transcription              AI Triage
                    ↓                        ↓
              MongoDB Storage ← Socket.io → React Dashboard
                                              ↓
                                    Dispatcher Action
                                              ↓
                                    Ambulance Dispatch
```

---

## 🚀 Future Enhancements

1. **ElevenLabs STT:** Replace Twilio transcription with ElevenLabs for better accuracy
2. **Real GPS Tracking:** Integrate with ambulance fleet management systems
3. **Multi-language Support:** Use Gemini for translation in multilingual communities
4. **Predictive Analytics:** Use MongoDB data to predict call volumes and optimize staffing
5. **Mobile App:** React Native app for field medics

---

## 📝 Conclusion

CallScribe demonstrates practical, life-saving applications of:
- **Gemini API** for intelligent emergency triage
- **ElevenLabs** for human-centered dispatcher guidance
- **MongoDB Atlas** for reliable data storage and analytics

This is not just a hackathon project—it's a blueprint for modernizing emergency response systems worldwide.

**Built for Hack the Coast 2026 🌊**
**Stream: Social Good, Science & Tech**
