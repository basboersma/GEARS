const fs = require("node:fs");
const path = require("node:path");

function escapePdfText(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(text, maxChars) {
  if (text.length === 0) {
    return [""];
  }
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length > maxChars) {
      if (current.length > 0) {
        lines.push(current);
      }
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}

function buildParagraphs(paragraphs, maxChars) {
  const lines = [];
  for (const paragraph of paragraphs) {
    if (paragraph === "") {
      lines.push("");
      continue;
    }
    lines.push(...wrapLine(paragraph, maxChars));
  }
  return lines;
}

function chunkLines(lines, perPage) {
  const pages = [];
  for (let i = 0; i < lines.length; i += perPage) {
    pages.push(lines.slice(i, i + perPage));
  }
  return pages.length > 0 ? pages : [[]];
}

function buildContentStream(title, lines, isFirstPage) {
  const contentLines = ["BT", "/F1 11 Tf", "15 TL", "50 790 Td"];
  if (isFirstPage) {
    contentLines.push(`(${escapePdfText(title)}) Tj`, "T*", "T*");
  }
  for (const line of lines) {
    contentLines.push(
      line.length === 0 ? "T*" : `(${escapePdfText(line)}) Tj`,
      "T*"
    );
  }
  contentLines.push("ET");
  return contentLines.join("\n");
}

function buildMultiPageTextPdf(paragraphs, title) {
  const maxChars = 95;
  const linesPerPage = 48;
  const allLines = buildParagraphs(paragraphs, maxChars);
  const pageLineChunks = chunkLines(allLines, linesPerPage);

  const objects = [];
  // 1: Catalog
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  // 2: Pages (filled in after we know page object numbers)
  const pageCount = pageLineChunks.length;
  const fontObjNum = 3;
  const firstPageObjNum = 4;
  const pageObjNums = [];
  const contentObjNums = [];
  for (let i = 0; i < pageCount; i++) {
    pageObjNums.push(firstPageObjNum + i * 2);
    contentObjNums.push(firstPageObjNum + i * 2 + 1);
  }

  objects.push(
    `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageCount} >>`
  );
  // 3: Font
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  for (let i = 0; i < pageCount; i++) {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /Contents ${contentObjNums[i]} 0 R >>`
    );
    const stream = buildContentStream(title, pageLineChunks[i], i === 0);
    objects.push(
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`
    );
  }

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
  const paragraphs = [
    "Are you part of a student team gearing up to compete in an (inter)national student challenge? The FSE Student Challenge Seed Fund is here to help you take your idea to the next level. Last year we sponsored the Makercie team participating in the European Rover Challenge, the HARD racing team going to France, and one team participating in the CanSat Mundial in Mexico.",
    "",
    "Who can apply",
    "- Teams participating in the qualifications or finals of an (inter)national student competition",
    "- Teams including BSc/MSc students from at least two different FSE programmes or from one FSE programme together with students from Hanze University of Applied Sciences and/or MBO Noorderpoort",
    "- Each team can apply only once per competition round",
    "- Applications are processed on a first come, first served basis. Please note that the available budget is limited.",
    "- There is limited room for bottom-up initiatives that do not fully meet these criteria but align with the faculty's strengths and have a strong potential to generate publicity. Such cases will be evaluated by a small committee",
    "",
    "What's in it for you",
    "- Seed funding covering up to EUR 5,000 for equipment, software, and hardware",
    "- Three travel grants of up to EUR 1,000 each to help your team go global",
    "",
    "When and how to apply",
    "Your application should include:",
    "- A short description of the competition, with relevant website links",
    "- An itemised cost breakdown",
    "- The name(s) of the professors or expert-faculty staff supporting the team",
    "- A timeline describing the planned activities, including qualification rounds and finals, with dates and locations",
    "- A short plan on how additional funding and support will be acquired, and which types of support and equipment are needed",
    "- A list of team members, including their study programme at FSE, Hanze, or MBO, their student numbers, and their roles and responsibilities within the team",
    "",
    "This can be submitted to Prof. Marc van der Maarel, FSE Student Challenge Coordinator (m.j.e.c.van.der.maarel@rug.nl)",
    "",
    "Deadlines: November 15 2026 or March 1 2027",
    "Applications are processed on a first come, first served basis. Please note that the available budget is limited.",
    "",
    "Important",
    "To be eligible to receive the fund, a team that is not an officially registered foundation (stichting) or association (vereniging) must either be, or become, a committee of the GEARS study association. In addition, all members of the team must be, or become, members of GEARS. Funding will be transferred to GEARS, which will support the team in administering and spending the funds in accordance with the approved project budget. Newly established foundations created solely for the purpose of receiving the FSE Student Challenge Seed Fund are not eligible. The FSE Student Challenge Seed Fund does not cover the costs associated with establishing a foundation or association.",
    "",
    "Don't miss this opportunity to fuel your innovation, connect across disciplines, and represent our university on the (inter)national stage.",
    "",
    "Apply now and let your challenge idea take off!",
  ];

  const pdf = buildMultiPageTextPdf(
    paragraphs,
    "Apply for the FSE Student Challenge Seed Fund 2026/2027"
  );
  const outputPath = path.join(
    process.cwd(),
    "public",
    "fse-student-challenge-seed-fund.pdf"
  );
  fs.writeFileSync(outputPath, pdf, "binary");
  console.log(`Generated ${outputPath}`);
}

main();
