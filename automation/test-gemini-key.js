import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing Gemini API key...');
console.log('Key preview:', apiKey?.substring(0, 20) + '...');

try {
  const client = new GoogleGenerativeAI({ apiKey });
  const model = client.getGenerativeModel({ model: 'gemini-flash-latest' });
  
  console.log('Client initialized successfully');
  console.log('Testing API call with gemini-flash-latest...');
  
  const result = await model.generateContent('Say hello in one word');
  const text = result.response.text();
  
  console.log('✅ API call successful!');
  console.log('Response:', text);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Full error:', error);
}
