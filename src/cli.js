#!/usr/bin/env node
/**
 * CLI for generating Word design docs from JSON content files.
 * Usage: npm run generate -- --type backend-design --input path/to/content.json --out output
 */
const fs = require('fs');
const path = require('path');
const { generate, listTypes } = require('./index');

function printHelp() {
  console.log(`
doc-generator — generate Word (.docx) design documents

Usage:
  node src/cli.js --type <type> --input <file.json> [--out <dir>] [--name <file.docx>]

Options:
  --type, -t     Document type (${listTypes().join(' | ')})
  --input, -i    Path to JSON content file
  --out, -o      Output directory (default: output)
  --name, -n     Output file name (optional)
  --help, -h     Show help

Examples:
  npm run generate -- --type backend-design --input examples/backend-design.example.json
  npm run generate:example
`);
}

function parseArgs(argv) {
  const args = {
    type: null,
    input: null,
    out: 'output',
    name: null,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case '--type':
      case '-t':
        args.type = next;
        i += 1;
        break;
      case '--input':
      case '-i':
        args.input = next;
        i += 1;
        break;
      case '--out':
      case '-o':
        args.out = next;
        i += 1;
        break;
      case '--name':
      case '-n':
        args.name = next;
        i += 1;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        break;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.type || !args.input) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  let content;
  try {
    content = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse JSON: ${err.message}`);
    process.exit(1);
  }

  try {
    const outputPath = await generate({
      type: args.type,
      content,
      outputDir: args.out,
      fileName: args.name,
    });
    console.log(`Generated: ${outputPath}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
