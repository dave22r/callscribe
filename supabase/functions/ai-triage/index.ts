import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI-powered emergency dispatch operator for the CallScribe system. Your role is to:

1. Respond calmly and professionally to emergency callers
2. Ask targeted questions to assess the situation
3. Extract key medical information (symptoms, patient age, consciousness, breathing)
4. Provide reassurance while gathering critical details

Keep responses SHORT (1-3 sentences max). Be direct, calm, and professional.
Never provide medical diagnosis - only gather information and provide basic safety instructions.

After each exchange, also provide a JSON analysis block at the end of your response in this exact format:
---ANALYSIS---
{"urgency":"critical|urgent|stable","confidence":0-100,"symptoms":["symptom1","symptom2"],"patientType":"description","summary":"one line summary","keywords":["key","words"]}

The analysis should reflect the cumulative information gathered so far in the conversation.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    console.log(`🤖 Processing AI triage with ${messages.length} messages`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://callscribe.lovable.app",
        "X-Title": "CallScribe Emergency Triage",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please wait a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the analysis from the response
    let analysis = null;
    let responseText = content;

    const analysisMatch = content.split("---ANALYSIS---");
    if (analysisMatch.length > 1) {
      responseText = analysisMatch[0].trim();
      try {
        analysis = JSON.parse(analysisMatch[1].trim());
      } catch {
        console.warn("Failed to parse analysis JSON");
      }
    }

    console.log("✅ AI triage response generated");

    return new Response(
      JSON.stringify({ response: responseText, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI triage error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
