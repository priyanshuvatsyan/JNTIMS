import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import fs from 'node:fs'

const customEnv = dotenv.parse(fs.readFileSync('env.env'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.TESTING': JSON.stringify(customEnv.TESTING),
  },
})
