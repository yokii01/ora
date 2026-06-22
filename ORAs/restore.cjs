const fs = require('fs');

const transcriptPath = 'C:\\Users\\Yoghes\\.gemini\\antigravity\\brain\\b18d0b85-35a2-45f6-a743-ffee0b2cc23f\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(transcriptPath, 'utf-8');

const lines = fileContent.split('\n');
let fullContent = [];

for (const line of lines) {
  if (line.includes('view_file')) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'TOOL_RESPONSE' && data.content && data.content.includes('ClimoraUltra.jsx')) {
          const match = data.content.match(/Showing lines \d+ to \d+\n.*\n([\s\S]*?)The above content/);
          if (match && match[1]) {
             fullContent.push(match[1]);
          }
      }
    } catch(e){}
  }
}

let result = fullContent.join('');
// Remove line numbers like "123: "
result = result.replace(/^\d+: /gm, '');

fs.writeFileSync('C:\\Users\\Yoghes\\Downloads\\ORAs\\src\\pages\\ClimoraUltra.jsx', result);
console.log('Restored!');
