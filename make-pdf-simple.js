const fs = require("node:fs");
const path = require("node:path");

function escapePdfText(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildSimpleTextPdf(lines, title) {
  const contentLines = [
    "BT",
    "/F1 12 Tf",
    "16 TL",
    "50 790 Td",
    `(${escapePdfText(title)}) Tj`,
    "T*",
    "T*",
    ...lines.flatMap((line) =>
      line.length === 0 ? ["T*"] : [`(${escapePdfText(line)}) Tj`, "T*"]
    ),
    "ET",
  ];

  const stream = contentLines.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += "trailer\n";
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += "startxref\n";
  pdf += `${xrefStart}\n`;
  pdf += "%%EOF\n";

  return pdf;
}

function main() {
  const lines = [
    "This document describes how Gears processes personal data.",
    "",
    "1. Purpose",
    "We process personal data to provide access to GEARS services.",
    "",
    "2. Data We Process",
    "Name, surname, student number, educational institution, and IBAN.",
    "",
    "3. Legal Basis",
    "Processing is based on user consent and legitimate organizational needs.",
    "",
    "4. Retention",
    "Data is kept as long as necessary for membership administration.",
    "",
    "5. Contact",
    "For questions, contact GEARS board or data coordinator.",
  ];

  const pdf = buildSimpleTextPdf(lines, "GEARS Data Processing");
  const outputPath = path.join(process.cwd(), "public", "data-processing.pdf");
  fs.writeFileSync(outputPath, pdf, "binary");
  console.log(`Generated ${outputPath}`);
}

main();
