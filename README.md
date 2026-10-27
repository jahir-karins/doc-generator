# doc-generator

Generate branded Word (`.docx`) design documents from structured JSON.

## Quick start

```bash
cd doc-generator
npm install
npm run generate:example
```

Output lands in `output/`.

## Generate a document

1. Copy the example JSON and fill your content:

```bash
cp examples/backend-design.example.json examples/my-feature.json
```

2. Run:

```bash
npm run generate -- --type backend-design --input examples/my-feature.json --out output
```

Optional file name:

```bash
npm run generate -- --type backend-design --input examples/my-feature.json --out output --name my-feature-design.docx
```

## Supported types

| Type | Purpose |
|------|---------|
| `backend-design` | Backend design doc aligned with Cursor rule sections |

## Content contract (`backend-design`)

Sections match the Cursor **Create a Backend Design Document** rule:

1. Overview  
2. Database Design  
3. APIs (purpose + request fields + response + errors)  
4. Data Mapping (create / update / external)  
5. Core Flows  
6. Core Business Logic  
7. Validations and Error Handling  

```json
{
  "title": "Feature Name",
  "subtitle": "Backend Design Document",
  "module": "service-name",
  "author": "Engineering",
  "version": "1.0",
  "overview": {
    "problemStatement": "...",
    "assumptions": ["..."]
  },
  "database": {
    "tables": [
      {
        "name": "table_name",
        "purpose": "...",
        "columns": [
          { "name": "id", "type": "BIGINT", "constraints": "PK", "notes": "" }
        ]
      }
    ]
  },
  "apis": [
    {
      "method": "POST",
      "route": "/api/...",
      "purpose": "...",
      "requestFields": ["field (type, required)"],
      "response": "{ success, data }",
      "errors": ["400 — ..."]
    }
  ],
  "dataMapping": {
    "create": [
      { "sourceField": "requestField", "databaseColumn": "table.column", "notes": "" }
    ],
    "update": [],
    "external": []
  },
  "coreFlows": [
    { "name": "Flow name", "summary": "...", "steps": ["Step 1", "Step 2"] }
  ],
  "coreLogic": [
    { "title": "Rule name", "description": "..." }
  ],
  "validationRules": ["..."],
  "edgeCases": ["..."]
}
```

Sample input that exercises every section: `examples/sample-backend-design.json`.

## Project layout

```text
doc-generator/
  examples/                 # sample JSON content
  output/                   # generated .docx (gitignored)
  src/
    cli.js                  # command line entry
    index.js                # public API
    styles.js               # shared Word branding/layout
    schemas/                # content validation
    generators/             # type → docx mappers
```

## Use with Cursor

Keep this folder in the workspace. Ask for a design doc; the agent should:

1. Write/update a JSON content file under `examples/` (or a feature folder)
2. Run `npm run generate -- ...`
3. Hand you the `.docx` from `output/`

## Add a new document type later

1. Add `src/schemas/<type>.js`
2. Add `src/generators/<type>.js`
3. Register it in `src/index.js` under `GENERATORS`
