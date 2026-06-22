const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'festivalsData.js');
let content = fs.readFileSync(filePath, 'utf8');

const batch1 = require('./src/lib/festivals_batch1.json');
const batch2 = require('./src/lib/festivals_batch2.json');

const newContent = JSON.stringify([...batch1, ...batch2], null, 2).slice(1, -1);
content = content.replace('];', newContent + '\n];');
fs.writeFileSync(filePath, content);
console.log('Merged new festivals successfully.');
