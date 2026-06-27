import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendAutomationReport(report) {
  const html = `
    <h2>Automation Report</h2>
    <p><strong>Pass:</strong> ${report.pass}</p>
    <p><strong>Summary:</strong> ${report.summary}</p>
    <p><strong>Failures:</strong> ${report.failures.length}</p>
    <pre>${JSON.stringify(report, null, 2)}</pre>
  `;

  return transporter.sendMail({
    from: process.env.REPORT_FROM,
    to: process.env.REPORT_TO,
    subject: `Automation Test Report - ${new Date().toISOString().slice(0, 10)}`,
    html,
  });
}
