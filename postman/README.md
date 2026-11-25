# Yii-SIMRS Postman API Tests

This directory contains Postman collection and test runner for testing important transaction APIs in Yii-SIMRS.

## Contents

- `Yii-SIMRS-API.postman_collection.json` - Postman collection with tests for:
  - **Pemeriksaan (Examination)**: Create, View, Vital Signs, Complete
  - **Resep (Prescription)**: Create, View, Submit, Dispense
  - **Pembayaran (Payment)**: Process, View, Refund, Void + Negative Tests

- `environment.json` - Test environment with variables
- `run-tests.js` - Node.js script to run tests and generate PDF report
- `package.json` - Dependencies for test runner

## Prerequisites

1. **Node.js 16+** installed
2. **Yii-SIMRS application running** (default: `http://localhost:8080`)
3. **Postman CLI (Newman)** - installed via npm

## Installation

```bash
cd postman
npm install
```

## Configuration

Edit `environment.json` to match your setup:

```json
{
  "values": [
    { "key": "baseUrl", "value": "http://your-server:port" }
  ]
}
```

Or set environment variable:
```bash
export BASE_URL=http://your-server:port
```

## Running Tests

### Option 1: Using the test runner (generates PDF report)

```bash
cd postman
npm test
```

This will:
1. Run all Postman tests via Newman
2. Generate `test-results.json` - Raw test results
3. Generate `test-report.html` - HTML report
4. Generate `API_Test_Report.pdf` - **PDF report with API responses**

### Option 2: Using Postman Desktop App

1. Open Postman (`C:\Users\MASTER2\AppData\Local\Postman\Postman.exe`)
2. Import `Yii-SIMRS-API.postman_collection.json`
3. Import `environment.json` as environment
4. Select the environment
5. Run the collection

### Option 3: Using Newman CLI directly

```bash
cd postman
npx newman run Yii-SIMRS-API.postman_collection.json -e environment.json -r cli,json,html --reporter-json-export results/test-results.json --reporter-html-export results/test-report.html
```

## PDF Report

The PDF report (`API_Test_Report.pdf`) includes:

1. **Title Page** - Project info, test coverage summary
2. **Test Summary** - Overall pass/fail statistics
3. **Detailed Results** - Per-folder test results with:
   - Request details (method, URL, body)
   - Response details (status code, body)
   - Failed assertions
4. **API Response Examples** - Sample successful responses for key endpoints:
   - Create Examination
   - Complete Examination
   - Create Prescription
   - Submit Prescription
   - Dispense Prescription
   - Process Payment
   - Refund Payment
   - Void Payment

## Test Coverage

### Pemeriksaan (Examination)
- ✅ Create examination with vital signs
- ✅ View examination details
- ✅ Save/update vital signs
- ✅ Complete examination (generates billing + medical record)

### Resep (Prescription)
- ✅ Create prescription with multiple items
- ✅ View prescription with details
- ✅ Submit prescription (draft → submitted)
- ✅ Dispense prescription (stock reduction)

### Pembayaran (Payment)
- ✅ Process payment (cash, transfer, e-wallet, BPJS, insurance)
- ✅ View payments by billing
- ✅ Refund payment (restores billing status)
- ✅ Void payment (cancels payment)
- ✅ **Negative: Payment exceeds outstanding balance** (400 error)
- ✅ **Negative: Duplicate reference prevented by idempotency key**

## CI/CD Integration

For CI pipelines, use the `test:ci` script which bails on first failure:

```bash
npm run test:ci
```

Or with Newman directly:

```bash
npx newman run collection.json -e env.json --bail
```

## Troubleshooting

### Authentication Issues
- Ensure `admin`/`admin123` credentials work on your instance
- Check if API uses token-based auth (adjust Login request if needed)

### Missing Test Data
Tests expect certain reference data to exist:
- At least one `Dokter` record
- At least one `Poli` record
- At least one `Obat` record (for prescriptions)
- At least one `Diagnosa` record (for examinations)

Run database seeders first:
```bash
# From project root
php yii seed/run
```

### Base URL
Default is `http://localhost:8080`. Change in `environment.json` or set `BASE_URL` env var.

## Output Files

```
postman/
├── results/
│   ├── test-results.json      # Raw Newman JSON output
│   ├── test-report.html       # Newman HTML report
│   └── API_Test_Report.pdf    # Generated PDF with responses
├── environment.json           # Test environment
├── run-tests.js              # Test runner script
├── package.json              # Dependencies
└── Yii-SIMRS-API.postman_collection.json
```

## Viewing the PDF Report

Open `results/API_Test_Report.pdf` in any PDF viewer. The report contains formatted API requests and responses for documentation and audit purposes.

---

**Note**: The Postman executable is located at `C:\Users\MASTER2\AppData\Local\Postman\Postman.exe` as mentioned. You can use either the desktop app or the CLI runner (`newman`) for execution.