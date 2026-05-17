const fs = require('fs');
const topBarMatch = fs.readFileSync('index.html', 'utf8').match(/<!-- ================= 1\. TOP BAR[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
const topBar = topBarMatch[0];
const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'index-draft01.html');
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('class="top-bar"')) {
        content = content.replace('<header>', topBar + '\n\n    <header>');
        fs.writeFileSync(file, content);
        console.log('Added top-bar to ' + file);
    }
}
