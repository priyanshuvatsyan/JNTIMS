import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { runAutomatedScenario } from './test-harness.js';
import { analyzeResults } from './ai-manager.js';
import { sendAutomationReport } from './email-report.js';

const RESULTS_DIR = path.resolve('automation', 'test-results');

function ensureResultsDir() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

async function main() {
  ensureResultsDir();

  console.log('🚀 Starting automation run...');

  const { scenario, results, actual } = await runAutomatedScenario({
    startDate: process.env.TEST_BASE_DATE,
  });

  let aiReport = {
    pass: false,
    failures: [],
    summary: 'AI analysis not executed',
    analysis: 'No AI result available.',
  };

  try {
    aiReport = await analyzeResults(scenario, actual);
  } catch (error) {
    console.warn('⚠️ analyzeResults failed:', error?.message || error);
    aiReport = {
      pass: false,
      failures: [],
      summary: 'AI analysis failed during execution',
      analysis: error?.message || String(error),
    };
  }

  const output = {
    timestamp: new Date().toISOString(),
    scenario,
    results,
    actual,
    aiReport,
  };

  const fileName = `automation-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filePath = path.join(RESULTS_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log(`✅ Saved output to ${filePath}`);

  try {
    await sendAutomationReport(aiReport);
    console.log('✅ Email report sent');
  } catch (error) {
    console.error('❌ Failed to send email report', error);
  }
}

main().catch((error) => {
  console.error('❌ Automation runner failed:', error);
  process.exit(1);
});
