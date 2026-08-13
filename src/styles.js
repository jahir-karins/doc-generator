/**
 * Shared Word document look-and-feel.
 * Keeps branding consistent so generators only fill content sections.
 */
const {
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} = require('docx');

const COLORS = {
  primary: '1F4E79',
  accent: '2E75B6',
  text: '2D2D2D',
  muted: '666666',
  border: 'D0D7DE',
  headerBg: '1F4E79',
  headerText: 'FFFFFF',
  altRow: 'F5F8FA',
};

const PAGE = {
  width: 11906,
  height: 16838,
  margin: 720,
};

// Usable content width so tables stretch edge-to-edge within page margins
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: COLORS.primary,
        font: 'Calibri',
        size: 30, // 15pt — slight bump over original 14pt
      }),
    ],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: COLORS.accent,
        font: 'Calibri',
        size: 26, // 13pt
      }),
    ],
  });
}

function bodyText(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: text || '',
        color: COLORS.text,
        font: 'Calibri',
        size: 24, // 12pt body
      }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 360 },
    children: [
      new TextRun({
        text: `• ${text}`,
        color: COLORS.text,
        font: 'Calibri',
        size: 24,
      }),
    ],
  });
}

function mutedText(text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        italics: true,
        color: COLORS.muted,
        font: 'Calibri',
        size: 22, // 11pt
      }),
    ],
  });
}

/**
 * Document title only — no subtitle/module/author/version/generated metadata.
 * Keeps the first page focused on the feature name.
 */
function titleBlock({ title }) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          color: COLORS.primary,
          font: 'Calibri',
          size: 44, // 22pt
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 280 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.primary },
      },
      children: [],
    }),
  ];
}

function cellParagraph(text, { bold = false, color = COLORS.text } = {}) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({
        text: text == null ? '' : String(text),
        bold,
        color,
        font: 'Calibri',
        size: 20, // 10pt table text
      }),
    ],
  });
}

// Inner cell padding so text doesn't sit flush against borders
const CELL_MARGINS = {
  top: 80,
  bottom: 80,
  left: 120,
  right: 120,
};

const CELL_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
};

function createTable(headers, rows) {
  const colCount = headers.length;
  // Split full content width evenly so the table spans the printable page width
  const colWidth = Math.floor(CONTENT_WIDTH / colCount);

  const headerRow = new TableRow({
    children: headers.map(
      (header) =>
        new TableCell({
          width: { size: colWidth, type: WidthType.DXA },
          margins: CELL_MARGINS,
          shading: { type: ShadingType.CLEAR, fill: COLORS.headerBg },
          borders: CELL_BORDERS,
          children: [cellParagraph(header, { bold: true, color: COLORS.headerText })],
        })
    ),
  });

  const dataRows = rows.map(
    (row, index) =>
      new TableRow({
        children: row.map(
          (value) =>
            new TableCell({
              width: { size: colWidth, type: WidthType.DXA },
              margins: CELL_MARGINS,
              shading:
                index % 2 === 1
                  ? { type: ShadingType.CLEAR, fill: COLORS.altRow }
                  : undefined,
              borders: CELL_BORDERS,
              children: [cellParagraph(value)],
            })
        ),
      })
  );

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: Array(colCount).fill(colWidth),
    rows: [headerRow, ...dataRows],
  });
}

function documentChrome({ title }) {
  return {
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title || 'Design Document',
                color: COLORS.muted,
                font: 'Calibri',
                size: 18,
              }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Page ',
                color: COLORS.muted,
                font: 'Calibri',
                size: 18,
              }),
              new TextRun({
                children: [PageNumber.CURRENT],
                color: COLORS.muted,
                font: 'Calibri',
                size: 18,
              }),
            ],
          }),
        ],
      }),
    },
  };
}

async function saveDocument(doc, outputPath) {
  const buffer = await Packer.toBuffer(doc);
  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

module.exports = {
  COLORS,
  PAGE,
  AlignmentType,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  heading1,
  heading2,
  bodyText,
  bullet,
  mutedText,
  titleBlock,
  createTable,
  documentChrome,
  saveDocument,
};
