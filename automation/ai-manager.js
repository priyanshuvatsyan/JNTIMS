import { GoogleGenerativeAI } from '@google/generative-ai';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set GEMINI_API_KEY environment variable.');
  }
  return new GoogleGenerativeAI({ apiKey });
}

export async function getExpectedResultPrompt(scenario, actual) {
  return `You are a QA automation manager. Given this scenario and actual results, create a JSON report with these fields:\n
- pass: true/false\n- failures: []\n- summary: string\n- analysis: string\n\nScenario:\n${JSON.stringify(scenario, null, 2)}\n\nActual:\n${JSON.stringify(actual, null, 2)}\n\nReturn only valid JSON.`;
}

export async function analyzeResults(scenario, actual) {
  const prompt = await getExpectedResultPrompt(scenario, actual);
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    try {
      return JSON.parse(text);
    } catch (parseError) {
      return {
        pass: false,
        failures: [],
        summary: 'Failed to parse AI output',
        analysis: text || 'No analysis returned',
        error: parseError.message,
      };
    }
  } catch (error) {
    console.warn('⚠️ AI analysis failed:', error.message || error);
    return {
      pass: false,
      failures: [],
      summary: 'AI analysis skipped due to API error',
      analysis: error.message || String(error),
      error: error.code || null,
    };
  }
}
