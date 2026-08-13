/**
 * Backend design document → Word (.docx) generator.
 * Maps structured JSON sections into a consistent, review-ready design doc.
 */
const { Document } = require('docx');
const {
  PAGE,
  heading1,
  heading2,
  bodyText,
  bullet,
  mutedText,
  titleBlock,
  createTable,
  documentChrome,
  saveDocument,
} = require('../styles');
const { validateBackendDesign } = require('../schemas/backendDesign');

/**
 * Builds Word paragraphs for one database table definition.
 * Keeps column detail compact so design docs stay scannable.
 */
function renderTableSection(table) {
  const blocks = [heading2(table.name)];

  if (table.purpose) {
    blocks.push(bodyText(table.purpose));
  }

  const rows = (table.columns || []).map((col) => [
    col.name || '',
    col.type || '',
    col.constraints || '',
    col.notes || '',
  ]);

  if (rows.length) {
    blocks.push(createTable(['Column', 'Type', 'Constraints', 'Notes'], rows));
    blocks.push(bodyText(''));
  }

  return blocks;
}

/**
 * Converts validated backend-design JSON into a DOCX file.
 * Content drives sections; styles.js owns branding/layout.
 */
async function generateBackendDesign(content, outputPath) {
  const errors = validateBackendDesign(content);
  if (errors.length) {
    const err = new Error(`Invalid backend-design content:\n- ${errors.join('\n- ')}`);
    err.validationErrors = errors;
    throw err;
  }

  const children = [
    ...titleBlock({
      title: content.title,
    }),

    heading1('1. Overview'),
    heading2('Problem Statement'),
    bodyText(content.overview.problemStatement),
    heading2('Key Assumptions'),
    ...(content.overview.assumptions.length
      ? content.overview.assumptions.map(bullet)
      : [mutedText('No assumptions listed.')]),

    heading1('2. Database Design'),
    ...(content.database.tables.length
      ? content.database.tables.flatMap(renderTableSection)
      : [mutedText('No tables defined.')]),

    heading1('3. APIs'),
    createTable(
      ['Method', 'Route', 'Purpose'],
      content.apis.map((api) => [api.method, api.route, api.purpose])
    ),
    bodyText(''),

    heading1('4. Core Flows'),
    ...(content.coreFlows.length
      ? content.coreFlows.flatMap((flow, index) => {
          const steps = Array.isArray(flow.steps) ? flow.steps : [];
          return [
            heading2(`${index + 1}. ${flow.name || 'Flow'}`),
            ...(flow.summary ? [bodyText(flow.summary)] : []),
            ...steps.map((step, stepIndex) => bullet(`${stepIndex + 1}. ${step}`)),
          ];
        })
      : [mutedText('No core flows defined.')]),

    heading1('5. Core Logic'),
    ...(content.coreLogic.length
      ? content.coreLogic.flatMap((item) => [
          heading2(item.title || 'Logic'),
          bodyText(item.description || ''),
        ])
      : [mutedText('No core logic defined.')]),

    heading1('6. Validation & Rules'),
    ...(content.validationRules.length
      ? content.validationRules.map(bullet)
      : [mutedText('No validation rules defined.')]),

    heading1('7. Edge Cases'),
    ...(content.edgeCases.length
      ? content.edgeCases.map(bullet)
      : [mutedText('No edge cases defined.')]),
  ];

  const doc = new Document({
    ...documentChrome({ title: content.title }),
    sections: [
      {
        properties: {
          page: {
            size: {
              width: PAGE.width,
              height: PAGE.height,
            },
            margin: {
              top: PAGE.margin,
              right: PAGE.margin,
              bottom: PAGE.margin,
              left: PAGE.margin,
            },
          },
        },
        children,
      },
    ],
  });

  return saveDocument(doc, outputPath);
}

module.exports = {
  generateBackendDesign,
};
