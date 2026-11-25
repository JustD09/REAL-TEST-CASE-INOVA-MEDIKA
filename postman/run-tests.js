#!/usr/bin/env node
/**
 * Postman API Test Runner for Yii-SIMRS
 * Runs the Postman collection and generates a PDF report with API responses
 */

const newman = require('newman');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const COLLECTION_PATH = path.join(__dirname, 'Yii-SIMRS-API.postman_collection.json');
const ENVIRONMENT_PATH = path.join(__dirname, 'environment.json');
const OUTPUT_DIR = path.join(__dirname, 'results');
const REPORT_PDF = path.join(OUTPUT_DIR, 'API_Test_Report.pdf');
const REPORT_JSON = path.join(OUTPUT_DIR, 'test-results.json');
const REPORT_HTML = path.join(OUTPUT_DIR, 'test-report.html');

// Default environment if file doesn't exist
const DEFAULT_ENVIRONMENT = {
  id: 'yii-simrs-test-env',
  name: 'Yii-SIMRS Test Environment',
  values: [
    { key: 'baseUrl', value: 'http://localhost:8080', enabled: true },
    { key: 'authToken', value: '', enabled: true },
    { key: 'kunjunganId', value: '', enabled: true },
    { key: 'dokterId', value: '', enabled: true },
    { key: 'pemeriksaanId', value: '', enabled: true },
    { key: 'billingId', value: '', enabled: true },
    { key: 'resepId', value: '', enabled: true },
    { key: 'resepDetailId1', value: '', enabled: true },
    { key: 'resepDetailId2', value: '', enabled: true },
    { key: 'paymentId', value: '', enabled: true },
    { key: 'totalAmount', value: '', enabled: true }
  ],
  _postman_variable_scope: 'environment'
};

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Write default environment if not exists
if (!fs.existsSync(ENVIRONMENT_PATH)) {
  fs.writeFileSync(ENVIRONMENT_PATH, JSON.stringify(DEFAULT_ENVIRONMENT, null, 2));
  console.log(`Created default environment at ${ENVIRONMENT_PATH}`);
}

function runPostmanTests() {
  return new Promise((resolve, reject) => {
    const options = {
      collection: COLLECTION_PATH,
      environment: ENVIRONMENT_PATH,
      reporters: ['cli', 'json', 'html'],
      reporter: {
        json: {
          export: REPORT_JSON
        },
        html: {
          export: REPORT_HTML,
          template: path.join(__dirname, 'report-template.hbs')
        }
      },
      timeoutRequest: 30000,
      delayRequest: 1000,
      bail: false
    };

    console.log('Starting Postman API tests...');
    console.log(`Collection: ${COLLECTION_PATH}`);
    console.log(`Environment: ${ENVIRONMENT_PATH}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);

    newman.run(options, (err, summary) => {
      if (err) {
        console.error('Newman run failed:', err);
        reject(err);
        return;
      }

      console.log('\n=== Test Run Summary ===');
      console.log(`Total runs: ${summary.run.stats.iterations.total}`);
      console.log(`Failed: ${summary.run.stats.iterations.failed}`);
      console.log(`Passed: ${summary.run.stats.iterations.total - summary.run.stats.iterations.failed}`);
      console.log(`Total assertions: ${summary.run.stats.assertions.total}`);
      console.log(`Failed assertions: ${summary.run.stats.assertions.failed}`);
      console.log(`Duration: ${summary.run.timings.total}ms`);

      resolve(summary);
    });
  });
}

async function generatePDFReport(summary) {
  console.log('\nGenerating PDF report...');

  // Read the JSON results
  const results = JSON.parse(fs.readFileSync(REPORT_JSON, 'utf8'));

  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;
  const lineHeight = 14;
  let y = pageHeight - margin;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);

  function addText(text, options = {}) {
    const {
      font = timesRomanFont,
      size = 10,
      color = rgb(0, 0, 0),
      x = margin,
      maxWidth = contentWidth,
      bold = false
    } = options;

    const selectedFont = bold ? timesRomanBold : font;
    const lines = wrapText(text, selectedFont, size, maxWidth);

    for (const line of lines) {
      if (y < margin + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, { x, y, size, font: selectedFont, color });
      y -= lineHeight;
    }
    return lines.length;
  }

  function wrapText(text, font, size, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, size);

      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  function addHeading(text, level = 1) {
    const sizes = { 1: 18, 2: 14, 3: 12 };
    const spacing = { 1: 10, 2: 6, 3: 4 };
    y -= spacing[level] || 4;
    addText(text, { font: timesRomanBold, size: sizes[level] || 12, bold: true });
    y -= 4;
  }

  function addDivider() {
    if (y < margin + lineHeight) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7)
    });
    y -= lineHeight;
  }

  // Title page
  y = pageHeight - 200;
  addText('Yii-SIMRS API Test Report', { font: timesRomanBold, size: 24, x: margin, bold: true });
  y -= 10;
  addText('Postman Collection Test Results', { font: timesRomanFont, size: 14 });
  y -= 20;
  addText(`Generated: ${new Date().toLocaleString()}`, { font: timesRomanFont, size: 10 });
  addText(`Base URL: ${results.environment?.values?.find(v => v.key === 'baseUrl')?.value || 'N/A'}`, { font: timesRomanFont, size: 10 });
  addText(`Collection: Yii-SIMRS-API.postman_collection.json`, { font: timesRomanFont, size: 10 });
  y -= 30;
  addText('Test Coverage:', { font: timesRomanBold, size: 12, bold: true });
  addText('• Pemeriksaan (Examination) - Create, View, Vital Signs, Complete', { font: timesRomanFont, size: 10 });
  addText('• Resep (Prescription) - Create, View, Submit, Dispense', { font: timesRomanFont, size: 10 });
  addText('• Pembayaran (Payment) - Process, Refund, Void, Negative Tests', { font: timesRomanFont, size: 10 });

  // Summary page
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;

  addHeading('Test Summary', 1);
  addDivider();

  const stats = results.run?.stats || {};
  addText(`Total Iterations: ${stats.iterations?.total || 0}`, { bold: true });
  addText(`Passed: ${(stats.iterations?.total || 0) - (stats.iterations?.failed || 0)}`, { bold: true });
  addText(`Failed: ${stats.iterations?.failed || 0}`, { bold: true });
  addText(`Total Assertions: ${stats.assertions?.total || 0}`, { bold: true });
  addText(`Failed Assertions: ${stats.assertions?.failed || 0}`, { bold: true });
  addText(`Duration: ${results.run?.timings?.total || 0}ms`, { bold: true });
  addText(`Started: ${results.run?.started || 'N/A'}`, { bold: true });

  y -= 10;
  addDivider();

  // Detailed test results per folder
  const collections = results.run?.executions || [];

  // Group by folder
  const folderResults = {};
  for (const execution of collections) {
    const folder = execution.item?.parentIds?.[0] || 'root';
    if (!folderResults[folder]) {
      folderResults[folder] = { passed: 0, failed: 0, tests: [] };
    }
    const testResult = {
      name: execution.item?.name || 'Unknown',
      status: execution.assertions?.every(a => a.error === undefined) ? 'passed' : 'failed',
      assertions: execution.assertions || [],
      request: execution.request,
      response: execution.response
    };
    if (testResult.status === 'passed') {
      folderResults[folder].passed++;
    } else {
      folderResults[folder].failed++;
    }
    folderResults[folder].tests.push(testResult);
  }

  for (const [folderName, data] of Object.entries(folderResults)) {
    if (y < margin + 60) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    addHeading(`${folderName}: ${data.passed} passed, ${data.failed} failed`, 2);

    for (const test of data.tests) {
      if (y < margin + 40) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      const statusColor = test.status === 'passed' ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0);
      addText(`[${test.status.toUpperCase()}] ${test.name}`, { color: statusColor, bold: true });

      // Request details
      if (test.request) {
        addText(`  Request: ${test.request.method} ${test.request.url?.raw || test.request.url}`, { size: 9, color: rgb(0.3, 0.3, 0.3) });
        if (test.request.body?.raw) {
          const bodyPreview = test.request.body.raw.substring(0, 200);
          addText(`  Body: ${bodyPreview}${test.request.body.raw.length > 200 ? '...' : ''}`, { size: 8, color: rgb(0.4, 0.4, 0.4) });
        }
      }

      // Response details
      if (test.response) {
        addText(`  Response: ${test.response.code} ${test.response.status}`, { size: 9, color: test.response.code >= 400 ? rgb(0.8, 0, 0) : rgb(0, 0.6, 0) });
        if (test.response.body) {
          const bodyPreview = test.response.body.substring(0, 300);
          addText(`  Body: ${bodyPreview}${test.response.body.length > 300 ? '...' : ''}`, { size: 8, color: rgb(0.4, 0.4, 0.4) });
        }
      }

      // Failed assertions
      const failedAssertions = test.assertions?.filter(a => a.error) || [];
      if (failedAssertions.length > 0) {
        addText('  Failed Assertions:', { size: 9, color: rgb(0.8, 0, 0), bold: true });
        for (const assertion of failedAssertions) {
          addText(`    - ${assertion.assertion}: ${assertion.error?.message || 'Failed'}`, { size: 8, color: rgb(0.8, 0, 0) });
        }
      }

      y -= 4;
    }

    addDivider();
  }

  // API Response Examples Section
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;

  addHeading('API Response Examples', 1);
  addDivider();

  // Find successful responses for each key endpoint
  const keyEndpoints = [
    { name: 'Create Examination', method: 'POST', path: '/api/v1/pemeriksaan' },
    { name: 'Complete Examination', method: 'POST', path: '/api/v1/pemeriksaan/complete' },
    { name: 'Create Prescription', method: 'POST', path: '/api/v1/resep' },
    { name: 'Submit Prescription', method: 'POST', path: '/api/v1/resep/submit' },
    { name: 'Dispense Prescription', method: 'POST', path: '/api/v1/resep/dispense' },
    { name: 'Process Payment', method: 'POST', path: '/api/v1/pembayaran' },
    { name: 'Refund Payment', method: 'POST', path: '/api/v1/pembayaran/refund' },
    { name: 'Void Payment', method: 'POST', path: '/api/v1/pembayaran/void' }
  ];

  for (const endpoint of keyEndpoints) {
    if (y < margin + 60) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    const execution = collections.find(e =>
      e.request?.method === endpoint.method &&
      e.request?.url?.path?.includes(endpoint.path.replace('/api/v1/', '')) &&
      e.response?.code < 400
    );

    if (execution) {
      addHeading(`${endpoint.name} (${endpoint.method} ${endpoint.path})`, 3);
      addText('Request:', { bold: true, size: 9 });
      if (execution.request?.body?.raw) {
        const formatted = formatJSON(execution.request.body.raw);
        const lines = formatted.split('\n');
        for (const line of lines.slice(0, 15)) {
          addText(`  ${line}`, { font: courierFont, size: 7, color: rgb(0.2, 0.2, 0.2) });
        }
        if (lines.length > 15) {
          addText('  ... (truncated)', { font: courierFont, size: 7, color: rgb(0.5, 0.5, 0.5) });
        }
      }

      addText('Response:', { bold: true, size: 9 });
      if (execution.response?.body) {
        const formatted = formatJSON(execution.response.body);
        const lines = formatted.split('\n');
        for (const line of lines.slice(0, 20)) {
          addText(`  ${line}`, { font: courierFont, size: 7, color: rgb(0.2, 0.2, 0.2) });
        }
        if (lines.length > 20) {
          addText('  ... (truncated)', { font: courierFont, size: 7, color: rgb(0.5, 0.5, 0.5) });
        }
      }
    } else {
      addHeading(`${endpoint.name} (${endpoint.method} ${endpoint.path})`, 3);
      addText('No successful response captured', { size: 9, color: rgb(0.6, 0.6, 0.6) });
    }
    y -= 6;
  }

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(REPORT_PDF, pdfBytes);
  console.log(`PDF report saved to: ${REPORT_PDF}`);

  // Also copy to a more accessible location
  const publicPath = path.join(process.cwd(), 'API_Test_Report.pdf');
  fs.copyFileSync(REPORT_PDF, publicPath);
  console.log(`PDF report also copied to: ${publicPath}`);
}

function formatJSON(jsonString) {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return jsonString;
  }
}

// Main execution
async function main() {
  try {
    const summary = await runPostmanTests();
    await generatePDFReport(summary);
    console.log('\n✅ All done! PDF report generated successfully.');
    console.log(`📄 Report: ${REPORT_PDF}`);
    console.log(`📊 JSON results: ${REPORT_JSON}`);
    console.log(`🌐 HTML report: ${REPORT_HTML}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();