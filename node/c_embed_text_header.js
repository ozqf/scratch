/*
Generate a C header file embedding the provided text file.
*/
function createHeaderFile(sourceText, headerFileName) {
    const varName = headerFileName.replace('.', '_');
    const headerGuard = varName.toUpperCase();
    // remove carriage returns
    sourceText = sourceText.replace(/\r/g, '');
    // escape double quotes
    sourceText = sourceText.replace(/"/g, '\\"');
    let output = `#ifndef ${headerGuard}\n`;
    output += `#define ${headerGuard}\n`;
    output += `static const char* ${varName} =\n`;
    const lines = sourceText.split("\n");
    lines.forEach(line => {
        output += `"${line}\\n"\n`;
    });
    output += `;\n#endif // ${headerGuard}\n`;
    return output;
}

function extractHeaderName(inputPath) {
    let name = inputPath.split("/").pop();
    name = name.split('.')[0];
    name += ".h";
    console.log(name);
    return name;
}

///////////////////////////////////////////////////
// Entry point
///////////////////////////////////////////////////
const fs = require("fs");
if (process.argv.length < 3) {
    console.log(`Too few args. specify input path, eg:`);
    console.log(`\tnode c_embed_text_header.js foo.txt`);
    return;
}
const INPUT_PATH = process.argv[2];
// const OUTPUT_PATH = process.argv[3];
const sourceText = fs.readFileSync(INPUT_PATH, "utf-8");
const headerFileName = extractHeaderName(INPUT_PATH);
console.log(`Embedding ${INPUT_PATH} in c header ${headerFileName}`);
const output = createHeaderFile(sourceText, headerFileName);
fs.writeFileSync(headerFileName, output);
