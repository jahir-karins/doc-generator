/**
 * Public API for doc-generator.
 * Register document types here so CLI and other callers share one entry point.
 */
const path = require('path');
const { generateBackendDesign } = require('./generators/backendDesign');

const GENERATORS = {
  'backend-design': generateBackendDesign,
};

function listTypes() {
  return Object.keys(GENERATORS);
}

/**
 * Picks the right generator by type and writes a .docx under outputDir.
 * File name defaults to a slug of the document title when not provided.
 */
async function generate({ type, content, outputDir = 'output', fileName }) {
  const generator = GENERATORS[type];
  if (!generator) {
    throw new Error(
      `Unknown document type "${type}". Supported: ${listTypes().join(', ')}`
    );
  }

  const safeTitle = String(content.title || type)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const finalName = fileName || `${safeTitle || type}.docx`;
  const outputPath = path.resolve(outputDir, finalName.endsWith('.docx') ? finalName : `${finalName}.docx`);

  await generator(content, outputPath);
  return outputPath;
}

module.exports = {
  generate,
  listTypes,
  GENERATORS,
};
