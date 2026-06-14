const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'my-art-tools', 'src', 'StationWall.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove the orphaned notification code block
const badCode = /\s+const [submittingCommentId, setSubmittingCommentId\] = useState\(null\);\s*\n[\s\S]*?if \(notifPanelRef[\s\S]*?\}, \[showNotifPanel\]\);/;

// More specific approach: find and replace the exact lines
const lines = content.split('\n');
let newLines = [];
let skipUntil = -1;

for (let i = 0; i < lines.length; i++) {
  if (i >= 48 && i <= 57 && lines[i].includes('notifPanelRef') || 
      lines[i].includes('showNotifPanel') ||
      lines[i].includes('handleClickOutsideNotif')) {
    // Skip these orphaned lines
    continue;
  }
  // Add API_BASE after submittingCommentId line if missing
  if (lines[i].includes('submittingCommentId') && lines[i].includes('useState(null)')) {
    newLines.push(lines[i]);
    // Check if next non-empty line has API_BASE
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (!lines[j].includes('API_BASE')) {
      newLines.push('');
      newLines.push("  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';");
    }
    continue;
  }
  newLines.push(lines[i]);
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('Fixed StationWall.jsx - removed orphaned notification code');
