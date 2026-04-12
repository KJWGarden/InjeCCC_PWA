import { google, sheets_v4 } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

function getSheetsClient(): sheets_v4.Sheets | null {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson || !SPREADSHEET_ID) {
    console.warn(
      "Google Sheets 환경 변수 미설정 — 시트 연동을 건너뜁니다"
    );
    return null;
  }

  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function sanitizeSheetTitle(title: string): string {
  return title
    .replace(/[*?:\\/[\]]/g, "")
    .trim()
    .slice(0, 100);
}

export async function createSessionSheet(
  title: string
): Promise<string | null> {
  const sheets = getSheetsClient();
  if (!sheets) return null;

  let sheetTitle = sanitizeSheetTitle(title);

  // Check for duplicate tab names
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID!,
    fields: "sheets.properties.title",
  });

  const existingTitles = new Set(
    spreadsheet.data.sheets?.map((s) => s.properties?.title) ?? []
  );

  if (existingTitles.has(sheetTitle)) {
    const suffix = `_${Date.now()}`;
    sheetTitle = sheetTitle.slice(0, 100 - suffix.length) + suffix;
  }

  // Create new sheet tab
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID!,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetTitle } } }],
    },
  });

  // Write header row
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID!,
    range: `'${sheetTitle}'!A1:E1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [["이름", "학번", "캠퍼스", "역할", "출석시간"]],
    },
  });

  return sheetTitle;
}

async function getSheetIdByTitle(
  sheets: sheets_v4.Sheets,
  title: string
): Promise<number | null> {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID!,
    fields: "sheets.properties",
  });

  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === title
  );
  return sheet?.properties?.sheetId ?? null;
}

export async function renameSessionSheet(
  oldTitle: string,
  newTitle: string
): Promise<string | null> {
  const sheets = getSheetsClient();
  if (!sheets) return null;

  const sheetId = await getSheetIdByTitle(sheets, oldTitle);
  if (sheetId === null) return null;

  const sanitized = sanitizeSheetTitle(newTitle);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID!,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId, title: sanitized },
            fields: "title",
          },
        },
      ],
    },
  });

  return sanitized;
}

export async function deleteSessionSheet(
  sheetTitle: string
): Promise<void> {
  const sheets = getSheetsClient();
  if (!sheets) return;

  const sheetId = await getSheetIdByTitle(sheets, sheetTitle);
  if (sheetId === null) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID!,
    requestBody: {
      requests: [{ deleteSheet: { sheetId } }],
    },
  });
}

interface AttendanceRowData {
  name: string;
  studentId: string;
  university: string;
  role: string;
}

const ROLE_DISPLAY: Record<string, string> = {
  leader: "순장",
  member: "순원",
};

export async function appendAttendanceRow(
  sheetTitle: string,
  data: AttendanceRowData
): Promise<void> {
  const sheets = getSheetsClient();
  if (!sheets) return;

  const checkedInAt = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID!,
    range: `'${sheetTitle}'!A:E`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          data.name,
          data.studentId,
          data.university,
          ROLE_DISPLAY[data.role] ?? data.role,
          checkedInAt,
        ],
      ],
    },
  });
}
