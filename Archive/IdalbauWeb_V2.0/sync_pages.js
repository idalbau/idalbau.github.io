const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync('index.html', 'utf8');

// Extract sections from index.html
const topBarMatch = indexHtml.match(/<!-- ================= 1\. TOP BAR[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/) || indexHtml.match(/<div class="top-bar">[\s\S]*?<\/div>/);
const headerMatch = indexHtml.match(/<header>[\s\S]*?<\/header>/);
const footerMatch = indexHtml.match(/<footer>[\s\S]*?<\/footer>/);
const ogMatch = indexHtml.match(/<!-- Open Graph \/ Facebook -->[\s\S]*?<!-- Twitter -->[\s\S]*?<meta property="twitter:image" content="[^"]*">/);

const topBar = topBarMatch ? topBarMatch[0] : '';
const header = headerMatch ? headerMatch[0] : '';
const footer = footerMatch ? footerMatch[0] : '';
const ogTags = ogMatch ? ogMatch[0] : '';

// For other pages, change href="#servizi" to href="index.html#servizi" in the header
const headerForOthers = header.replace(/href="#servizi"/g, 'href="index.html#servizi"');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'index-draft01.html');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace top bar
    if (topBar) {
        if (content.match(/<!-- ================= 1\. TOP BAR[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/)) {
            content = content.replace(/<!-- ================= 1\. TOP BAR[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, topBar);
        } else if (content.match(/<div class="top-bar">[\s\S]*?<\/div>/)) {
             content = content.replace(/<div class="top-bar">[\s\S]*?<\/div>/, topBar);
        }
    }

    // Replace header
    if (header) {
        content = content.replace(/<header>[\s\S]*?<\/header>/, headerForOthers);
    }

    // Replace footer
    if (footer) {
        content = content.replace(/<footer>[\s\S]*?<\/footer>/, footer);
    }

    // Replace inline styles
    content = content.replace(/<style>[\s\S]*?<\/style>/g, '<link rel="stylesheet" href="styles.css">');

    // Add external stylesheet if missing
    if (!content.includes('href="styles.css"')) {
        content = content.replace('</head>', '    <link rel="stylesheet" href="styles.css">\n</head>');
    }

    // Clean up internal scripts that are now in script.js
    content = content.replace(/<script>[\s\S]*?<\/script>/g, (match) => {
        if (match.includes('setLang') || match.includes('accettaCookie') || match.includes('cookieAccettati')) {
            return '';
        }
        return match;
    });
    
    // Ensure script.js is at the end
    if (!content.includes('src="script.js"')) {
        content = content.replace('</body>', '    <script src="script.js"></script>\n</body>');
    }

    // Add google site verification
    if (!content.includes('google-site-verification')) {
        content = content.replace('</title>', '</title>\n    <meta name="google-site-verification" content="HLD8cy2vvzONBcl6k59KqzrnBDxmYVXYlsPNJVeZzLU" />');
    }

    // Add OG tags if missing
    if (ogTags && !content.includes('og:type')) {
        content = content.replace('</title>', '</title>\n\n    ' + ogTags);
    }

    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
}
