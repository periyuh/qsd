// Run with: node files-list.js
const fs = require("fs");
const path = require("path");

const rootDir = __dirname; // now it points to the current folder
const outputFile = path.join(__dirname, "file-list.txt");

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      fileList.push(path.relative(rootDir, fullPath));
    }
  }
  return fileList;
}

const files = walk(rootDir);
fs.writeFileSync(outputFile, files.join("\n"), "utf-8");

console.log(`✅ File list written to ${outputFile}`);
