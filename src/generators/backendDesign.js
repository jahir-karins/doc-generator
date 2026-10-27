/**
 * Backend design document → Word (.docx) generator.
 * Section order follows the Cursor "Create a Backend Design Document" rule:
 * Overview → Database → APIs → Data Mapping → Core Flows → Core Logic → Validations.
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
 * Renders one API endpoint with optional request / response / error detail.
 * Older JSON that only sets method/route/purpose still renders cleanly.
 */
function renderApiSection(api, index) {
  const blocks = [
    heading2(`${index + 1}. ${api.method} ${api.route}`),
    bodyText(api.purpose || ''),
  ];

  if (Array.isArray(api.requestFields) && api.requestFields.length) {
    blocks.push(bodyText('Required request fields:'));
    api.requestFields.forEach((field) => blocks.push(bullet(field)));
  }

  if (api.response) {
    blocks.push(bodyText('Expected response:'));
    blocks.push(bodyText(api.response));
  }

  if (Array.isArray(api.errors) && api.errors.length) {
    blocks.push(bodyText('Important error responses:'));
    api.errors.forEach((err) => blocks.push(bullet(err)));
  }

  return blocks;
}

/**
 * Renders a Source → DB column mapping table for create / update / external.
 * Skipped when the mapping array is empty so docs stay free of noise.
 */
function renderMappingSection(title, rows) {
  if (!Array.isArray(rows) || !rows.length) return [];

  return [
    heading2(title),
    createTable(
      ['Source field', 'Database column', 'Notes'],
      rows.map((row) => [
        row.sourceField || '',
        row.databaseColumn || '',
        row.notes || '',
      ])
    ),
    bodyText(''),
  ];
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

  const dataMapping = content.dataMapping || {};
  const hasAnyMapping =
    (dataMapping.create && dataMapping.create.length) ||
    (dataMapping.update && dataMapping.update.length) ||
    (dataMapping.external && dataMapping.external.length);

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
    ...(content.apis.length
      ? content.apis.flatMap((api, index) => renderApiSection(api, index))
      : [mutedText('No APIs defined.')]),

    heading1('4. Data Mapping'),
    ...(hasAnyMapping
      ? [
          ...renderMappingSection('Create Mapping', dataMapping.create),
          ...renderMappingSection('Update Mapping', dataMapping.update),
          ...renderMappingSection('External API Response Mapping', dataMapping.external),
        ]
      : [mutedText('No data mappings defined.')]),

    heading1('5. Core Flows'),
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

    heading1('6. Core Business Logic'),
    ...(content.coreLogic.length
      ? content.coreLogic.flatMap((item) => [
          heading2(item.title || 'Logic'),
          bodyText(item.description || ''),
        ])
      : [mutedText('No core logic defined.')]),

    heading1('7. Validations and Error Handling'),
    heading2('Validations & Business Constraints'),
    ...(content.validationRules.length
      ? content.validationRules.map(bullet)
      : [mutedText('No validation rules defined.')]),
    heading2('Failure Scenarios & Edge Cases'),
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
