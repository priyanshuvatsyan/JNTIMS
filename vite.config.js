import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import fs from 'node:fs'

let testingValue = "true"; // Default fallback

try {
  // 1. Try to read the local env.env file (Works on your computer)
  const customEnv = dotenv.parse(fs.readFileSync('env.env'));
  if (customEnv.TESTING !== undefined) {
    testingValue = customEnv.TESTING;
  }
} catch (error) {
  // 2. If env.env is missing (Works on Netlify), grab it from the system variables
  console.log('env.env not found. Using system environment variables instead.');
  if (process.env.TESTING !== undefined) {
    testingValue = process.env.TESTING;
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 3. Inject the final value into your React code globally
    'import.meta.env.TESTING': JSON.stringify(testingValue),
  },
})