// Utility to translate text using LibreTranslate public API
// No API key required for small-scale use

// Mock translation dictionary for demo purposes
const mockTranslations: Record<string, string> = {
  'Servicios de emergencia, ¿cuál es su emergencia?': 'Emergency services, what is your emergency?',
  'Por favor, ayúdame. Tengo un dolor fuerte en el pecho y me cuesta respirar.': 'Please help me. I have a strong pain in my chest and I have difficulty breathing.',
  '¿Está consciente?': 'Are you conscious?',
  'Sí, pero me siento muy débil y mareado.': 'Yes, but I feel very weak and dizzy.',
  '¿Cuántos años tiene?': 'How old are you?',
  'Tengo 45 años.': 'I am 45 years old.',
};

// Translate an array of transcript lines
async function translateLines(lines: string[], targetLang = 'en'): Promise<string[]> {
  // Try mock translation first for demo
  const allMocked = lines.every(line => line in mockTranslations);
  if (allMocked) {
    return lines.map(line => mockTranslations[line] || line);
  }

  // Fallback to API (may fail with public instance)
  try {
    const url = 'https://libretranslate.com/translate';
    const text = lines.join('\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'auto',
        target: targetLang,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translatedText.split('\n');
  } catch (error) {
    console.error('Translation failed:', error);
    // Return original text as fallback
    return lines.map(line => `[Translation unavailable] ${line}`);
  }
}

export { translateLines };