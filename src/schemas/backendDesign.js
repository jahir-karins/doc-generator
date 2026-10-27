/**
 * Lightweight validation for backend design doc JSON.
 * Shape mirrors the Cursor "Create a Backend Design Document" rule so
 * Word generation fails early on incomplete, non-implementable content.
 */

const REQUIRED_TOP_LEVEL = [
  'title',
  'overview',
  'database',
  'apis',
  'coreFlows',
  'coreLogic',
  'validationRules',
  'edgeCases',
];

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

/**
 * Validates content shape before DOCX generation.
 * dataMapping is optional so older example JSON files keep working.
 */
function validateBackendDesign(content) {
  const errors = [];

  assert(content && typeof content === 'object', 'Content must be a JSON object', errors);
  if (errors.length) return errors;

  REQUIRED_TOP_LEVEL.forEach((key) => {
    assert(content[key] != null, `Missing required field: ${key}`, errors);
  });

  if (content.overview) {
    assert(
      typeof content.overview.problemStatement === 'string' &&
        content.overview.problemStatement.trim(),
      'overview.problemStatement is required',
      errors
    );
    assert(
      Array.isArray(content.overview.assumptions),
      'overview.assumptions must be an array',
      errors
    );
  }

  if (content.database) {
    assert(Array.isArray(content.database.tables), 'database.tables must be an array', errors);
    (content.database.tables || []).forEach((table, i) => {
      assert(table.name, `database.tables[${i}].name is required`, errors);
      assert(Array.isArray(table.columns), `database.tables[${i}].columns must be an array`, errors);
    });
  }

  if (content.apis) {
    assert(Array.isArray(content.apis), 'apis must be an array', errors);
    (content.apis || []).forEach((api, i) => {
      assert(api.method, `apis[${i}].method is required`, errors);
      assert(api.route, `apis[${i}].route is required`, errors);
      assert(api.purpose, `apis[${i}].purpose is required`, errors);
      if (api.requestFields != null) {
        assert(
          Array.isArray(api.requestFields),
          `apis[${i}].requestFields must be an array`,
          errors
        );
      }
      if (api.errors != null) {
        assert(Array.isArray(api.errors), `apis[${i}].errors must be an array`, errors);
      }
    });
  }

  if (content.dataMapping != null) {
    assert(
      typeof content.dataMapping === 'object' && !Array.isArray(content.dataMapping),
      'dataMapping must be an object',
      errors
    );
    ['create', 'update', 'external'].forEach((key) => {
      if (content.dataMapping[key] != null) {
        assert(
          Array.isArray(content.dataMapping[key]),
          `dataMapping.${key} must be an array of { sourceField, databaseColumn, notes }`,
          errors
        );
        content.dataMapping[key].forEach((row, i) => {
          assert(
            row && (row.sourceField || row.databaseColumn),
            `dataMapping.${key}[${i}] needs sourceField and/or databaseColumn`,
            errors
          );
        });
      }
    });
  }

  ['coreFlows', 'coreLogic', 'validationRules', 'edgeCases'].forEach((key) => {
    if (content[key] != null) {
      assert(Array.isArray(content[key]), `${key} must be an array`, errors);
    }
  });

  return errors;
}

module.exports = {
  validateBackendDesign,
};
