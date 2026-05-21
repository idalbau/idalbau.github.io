const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
fs.readdirSync(pagesDir).forEach(f => {
    const p = path.join(pagesDir, f);
    let c = fs.readFileSync(p, 'utf-8');
    c = c.replace(/<script src="script\.js"><\/script>/g, '');
    fs.writeFileSync(p, c);
});

const cssPath = path.join(__dirname, 'src', 'styles', 'global.css');
let css = fs.readFileSync(cssPath, 'utf-8');
css = css.replace(/url\(['"]?images\//g, 'url(\'/images/');
// Also fix hero.png if it exists to hero.webp (as seen in original HTML)
css = css.replace(/url\('\/images\/hero\.png'\)/g, 'url(\'/images/hero.webp\')');
fs.writeFileSync(cssPath, css);
console.log('Fixed paths and scripts');
