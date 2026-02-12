// ============================================
// GOOGLE SHEETS INTEGRATION
// ============================================

const SHEETS_URL_KEY = 'sheets_url';
const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwAdoN2kLTaXBYLugZ0pj2pTtLurKYIvaKcThI1RLW-Wdjx6-8-Nid8telw3ODCPRGm/exec';

function getSheetsUrl() {
  return localStorage.getItem(SHEETS_URL_KEY) || DEFAULT_SHEETS_URL;
}

async function saveToGoogleSheets(receiptType, data) {
  const url = getSheetsUrl();
  if (!url) return false;
  try {
    const payload = {
      action: 'saveReceipt',
      type: receiptType,
      data: JSON.stringify(data),
      timestamp: new Date().toISOString()
    };
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (e) {
    console.error('Google Sheets error:', e);
    return false;
  }
}

// Google Apps Script template (for reference - user deploys this)
const APPS_SCRIPT_TEMPLATE = `
// Deploy ini sebagai Web App di Google Apps Script
// 1. Buka script.google.com → New Project
// 2. Paste kode ini
// 3. Deploy → New Deployment → Web App
// 4. Siapa saja bisa akses → Deploy
// 5. Copy URL dan paste di Pengaturan aplikasi

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.type,
    data.data,
    data.timestamp
  ]);
  return ContentService.createTextOutput(
    JSON.stringify({status: 'ok'})
  ).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput('Print Struk API Active');
}
`;
