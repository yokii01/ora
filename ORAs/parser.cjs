const fs = require('fs');
let content = fs.readFileSync('old_climora.txt', 'utf-8').trim();
if (content.startsWith('"') && content.endsWith('"')) {
    content = JSON.parse(content);
}
fs.writeFileSync('parsed_old_climora.jsx', content, 'utf-8');
