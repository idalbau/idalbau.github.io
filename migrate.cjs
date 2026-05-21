const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    
    // Extract metadata
    const titleMatch = content.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : '';
    
    const descMatch = content.match(/<meta name="description"\s+content="(.*?)">/i) || content.match(/<meta name="description" content="(.*?)">/i);
    const description = descMatch ? descMatch[1].replace(/"/g, '\\"') : '';

    const keywordsMatch = content.match(/<meta name="keywords"\s+content="(.*?)">/i);
    const keywords = keywordsMatch ? keywordsMatch[1].replace(/"/g, '\\"') : '';

    const ogTitleMatch = content.match(/<meta property="og:title"\s+content="(.*?)">/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].replace(/"/g, '\\"') : '';

    const ogDescMatch = content.match(/<meta property="og:description"\s+content="(.*?)">/i);
    const ogDesc = ogDescMatch ? ogDescMatch[1].replace(/"/g, '\\"') : '';

    const canonicalMatch = content.match(/<link rel="canonical"\s+href="(.*?)"/i);
    const canonical = canonicalMatch ? canonicalMatch[1] : '';

    // Determine language from filename or html tag
    const isGerman = file.endsWith('-de.html') || file === 'ueber-uns.html' || file === 'projektbeispiele.html' || file === 'abdichtungen-bozen.html' || file === 'badsanierung-meran.html' || file === 'vielen-dank.html';
    const lang = isGerman ? 'de' : 'it';

    // Extract content between header and footer
    // Handle different cases
    let mainContent = '';
    
    const headerEndIndex = content.indexOf('</header>');
    const footerStartIndex = content.indexOf('<!-- ================= FOOTER ================= -->');
    const footerTagIndex = content.indexOf('<footer>');

    const endIdx = footerStartIndex !== -1 ? footerStartIndex : footerTagIndex;

    if (headerEndIndex !== -1 && endIdx !== -1) {
        mainContent = content.substring(headerEndIndex + 9, endIdx).trim();
    } else {
        // Fallback: Just take everything in body except scripts
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            mainContent = bodyMatch[1].trim();
        } else {
            mainContent = content;
        }
    }

    // Generate Astro file content
    const astroContent = `---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout 
  title="${title}"
  description="${description}"
  ${keywords ? `keywords="${keywords}"` : ''}
  ${ogTitle ? `ogTitle="${ogTitle}"` : ''}
  ${ogDesc ? `ogDescription="${ogDesc}"` : ''}
  ${canonical ? `canonicalUrl="${canonical}"` : ''}
  lang="${lang}"
>
  ${mainContent}
</BaseLayout>
`;

    // Ensure the filename maps directly (Astro automatically handles routing)
    // We want index.html -> index.astro, index-de.html -> index-de.astro
    // The build.format = 'file' will take care of outputting .html
    const astroFilename = file.replace('.html', '.astro');
    const outputPath = path.join(__dirname, 'src', 'pages', astroFilename);
    
    // Create pages dir if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'src', 'pages'))) {
        fs.mkdirSync(path.join(__dirname, 'src', 'pages'), { recursive: true });
    }

    fs.writeFileSync(outputPath, astroContent, 'utf-8');
    console.log(`Migrated ${file} to src/pages/${astroFilename}`);
});

console.log('Migration complete!');
