import Papa from "papaparse";

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

// .xlsx/.docx/.zip all start with the ZIP magic number "PK\x03\x04" — if a
// renamed or actual Excel file is dropped in, Papa.parse would otherwise
// happily "parse" the raw binary as garbled text instead of failing loudly.
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

async function looksLikeBinarySpreadsheet(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return ZIP_MAGIC.every((byte, i) => head[i] === byte);
}

/** Client-side only — parses a File in the browser, never touches Supabase Storage. */
export async function parseCsvFile(file: File): Promise<ParsedCsv> {
  if (/\.(xlsx|xls|xlsm)$/i.test(file.name) || (await looksLikeBinarySpreadsheet(file))) {
    throw new Error(
      "Este archivo parece ser un Excel (.xlsx), no un CSV de texto. Abrilo y usá \"Archivo > Guardar como > CSV (UTF-8)\" antes de subirlo.",
    );
  }

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({ headers: results.meta.fields ?? [], rows: results.data });
      },
      error: (err: Error) => reject(err),
    });
  });
}
