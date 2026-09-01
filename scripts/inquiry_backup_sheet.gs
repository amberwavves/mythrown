/**
 * THROWN inquiry backup — Google Apps Script Web App
 *
 * Purpose: append every website inquiry to a Google Sheet so a lead is never
 * lost if email delivery fails. This is a mirror, not a replacement for email.
 *
 * SETUP (one time, ~3 minutes):
 *   1. Create a Google Sheet (sheets.new) named e.g. "THROWN Inquiries".
 *   2. Extensions -> Apps Script. Delete the placeholder, paste this file.
 *   3. Save, then Deploy -> New deployment -> type "Web app".
 *        Execute as:        Me
 *        Who has access:    Anyone            <-- required; Vercel is anonymous
 *   4. Authorize when prompted (choose your account -> Advanced -> Allow).
 *   5. Copy the "/exec" Web app URL.
 *   6. In Vercel -> mythrown -> Settings -> Environment Variables, add:
 *        INQUIRY_BACKUP_WEBHOOK_URL = <that /exec URL>       (Production)
 *   7. Redeploy so the variable takes effect.
 *
 * NOTE: after editing this script you must Deploy -> Manage deployments ->
 * edit -> New version, or the live URL keeps running the old code.
 *
 * "Anyone" means anyone with the unguessable URL can append rows. To lock it
 * down, set INQUIRY_SHARED_SECRET below and add the same value as an env var
 * in Vercel, then include it in the payload.
 */

var HEADERS = [
  'receivedAt',
  'name',
  'email',
  'projectType',
  'investment',
  'timeline',
  'referral',
  'message',
  'origin',
  'inquiryId',
];

// Optional. Leave '' to accept any request that knows the URL.
var INQUIRY_SHARED_SECRET = '';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: 'empty request body' });
    }

    var data = JSON.parse(e.postData.contents);

    if (INQUIRY_SHARED_SECRET && data.secret !== INQUIRY_SHARED_SECRET) {
      return json({ ok: false, error: 'unauthorized' });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Write the header row once, on first use.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow(
      HEADERS.map(function (key) {
        var value = data[key];
        return value === undefined || value === null ? '' : String(value);
      })
    );

    return json({ ok: true, inquiryId: data.inquiryId || null });
  } catch (err) {
    // Returning 200 with ok:false keeps a logging failure from ever being
    // mistaken for a delivery failure on the website side.
    return json({ ok: false, error: String(err) });
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
