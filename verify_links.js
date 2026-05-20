const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
console.log(`Auditing repository at: ${ROOT_DIR}\n`);

const htmlFiles = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('.html'));

const errors = [];
const warnings = [];
const hreflangMappings = {};  // {file: {lang: url}}
const canonicalMappings = {}; // {file: url}
const GA4_ID = 'G-FXXM8ZF82P';

// Keep track of which pages are IT and which are DE
const itPages = [
    'index.html', 'chi-siamo.html', 'portfolio.html', 
    'ristrutturazione-bagno-merano.html', 'impermeabilizzazioni-bolzano.html', 
    'grazie.html', 'impressum.html', 'privacy-policy.html', 'cookie-policy.html'
];
const dePages = [
    'index-de.html', 'ueber-uns.html', 'projektbeispiele.html', 
    'badsanierung-meran.html', 'abdichtungen-bozen.html', 
    'vielen-dank.html', 'impressum-de.html', 'privacy-policy-de.html', 'cookie-policy-de.html'
];

for (const file of htmlFiles) {
    const filePath = path.join(ROOT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    console.log(`=== Checking ${file} ===`);
    
    // 1. Check <html lang="...">
    const langMatch = content.match(/<html\s+lang=["']([^"']+)["']/i);
    let lang = '';
    if (!langMatch) {
        errors.push(`[${file}] Missing <html lang='...'> attribute.`);
    } else {
        lang = langMatch[1];
        console.log(`  - Language: ${lang}`);
        if (lang !== 'it' && lang !== 'de') {
            warnings.push(`[${file}] Language attribute '${lang}' is not 'it' or 'de'.`);
        }
    }

    // 2. Check GA4 tracking script
    const gaScriptPresent = content.includes(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`);
    const gaConfigPresent = content.includes(`gtag('config', '${GA4_ID}')`) || content.includes(`gtag("config", "${GA4_ID}")`);
    
    if (!gaScriptPresent) {
        errors.push(`[${file}] GA4 tracking script with ID ${GA4_ID} not found in HTML head.`);
    }
    if (!gaConfigPresent) {
        errors.push(`[${file}] GA4 gtag('config', '${GA4_ID}') initialization not found.`);
    }

    // 3. Check Canonical and Alternate Links
    if (file !== '404.html') {
        const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
        if (!canonicalMatch) {
            errors.push(`[${file}] Missing <link rel='canonical'> tag.`);
        } else {
            canonicalMappings[file] = canonicalMatch[1];
        }

        const alternates = [];
        const altRegex1 = /<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']\s+href=["']([^"']+)["']/gi;
        const altRegex2 = /<link\s+hreflang=["']([^"']+)["']\s+rel=["']alternate["']\s+href=["']([^"']+)["']/gi;
        
        let match;
        while ((match = altRegex1.exec(content)) !== null) {
            alternates.push({ lang: match[1], href: match[2] });
        }
        while ((match = altRegex2.exec(content)) !== null) {
            alternates.push({ lang: match[1], href: match[2] });
        }
        
        hreflangMappings[file] = {};
        for (const alt of alternates) {
            hreflangMappings[file][alt.lang] = alt.href;
        }
            
        console.log(`  - Alternates:`, hreflangMappings[file]);
        if (!hreflangMappings[file]['it']) {
            errors.push(`[${file}] Missing hreflang='it' alternate link.`);
        }
        if (!hreflangMappings[file]['de']) {
            errors.push(`[${file}] Missing hreflang='de' alternate link.`);
        }
    }

    // 4. Check Internal Links
    const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["']/gi;
    let anchorMatch;
    while ((anchorMatch = anchorRegex.exec(content)) !== null) {
        const link = anchorMatch[1];
        
        // Ignore external links, mailto, tel, hashes
        if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('#')) {
            if (link.includes('idalbau.github.io')) {
                const parts = link.split('idalbau.github.io/');
                const pathPart = parts[parts.length - 1].split('#')[0];
                if (pathPart && !htmlFiles.includes(pathPart) && pathPart !== '') {
                    errors.push(`[${file}] Link to domain page '${link}' points to non-existent local file '${pathPart}'.`);
                }
            }
            continue;
        }
        
        const localFile = link.split('?')[0].split('#')[0];
        if (!localFile) continue;
            
        const localPath = path.join(ROOT_DIR, localFile);
        if (!fs.existsSync(localPath)) {
            errors.push(`[${file}] Link '${link}' points to non-existent file '${localFile}'.`);
        }
    }

    // 5. Check Forms and Redirects
    const formRegex = /<form\s+[^>]*action=["']([^"']+)["']/gi;
    let formMatch;
    while ((formMatch = formRegex.exec(content)) !== null) {
        const formAction = formMatch[1];
        if (formAction.includes('web3forms.com')) {
            const redirectRegex = /<input\s+type=["']hidden["']\s+name=["']redirect["']\s+value=["']([^"']+)["']/i;
            const redirectMatch = content.match(redirectRegex);
            if (!redirectMatch) {
                errors.push(`[${file}] Form submits to Web3Forms but has no redirect URL.`);
            } else {
                const redirectUrl = redirectMatch[1];
                const expectedRedirect = lang === 'it' ? 'grazie.html' : 'vielen-dank.html';
                if (!redirectUrl.includes(expectedRedirect)) {
                    errors.push(`[${file}] Form redirect is '${redirectUrl}', expected to contain '${expectedRedirect}' for language '${lang}'.`);
                }
            }
            
            // Check for Privacy Policy link matching form language
            const privacyRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>Privacy Policy<\/a>/i;
            const privacyMatch = content.match(privacyRegex);
            if (privacyMatch) {
                const privacyLink = privacyMatch[1];
                const expectedPrivacy = lang === 'it' ? 'privacy-policy.html' : 'privacy-policy-de.html';
                if (privacyLink !== expectedPrivacy) {
                    errors.push(`[${file}] GDPR form links to privacy policy '${privacyLink}', but expected '${expectedPrivacy}' for language '${lang}'.`);
                }
            }
        }
    }

    // 6. Check WhatsApp Float Button Widget
    const waRegex = /<a\s+[^>]*href=["']https:\/\/wa\.me\/[^"']+["']([^>]*)>/gi;
    let waMatch;
    while ((waMatch = waRegex.exec(content)) !== null) {
        const tagAttributes = waMatch[1];
        if (!tagAttributes.includes('target="_blank"')) {
            errors.push(`[${file}] WhatsApp float link missing target='_blank'.`);
        }
        if (!tagAttributes.includes('rel="noopener noreferrer"') && !tagAttributes.includes('rel="noreferrer noopener"')) {
            errors.push(`[${file}] WhatsApp float link missing rel='noopener noreferrer'.`);
        }
        if (!tagAttributes.includes('gtag') && !tagAttributes.includes('onclick')) {
            errors.push(`[${file}] WhatsApp float link missing onClick GA4 tracking event.`);
        }
        
        // Find text content inside the tag
        const escapedWaHref = waMatch[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const textRegex = new RegExp(`<a\\s+[^>]*href=["']https:\\/\\/wa\\.me\\/[^"']+["'][^>]*>([\\s\\S]*?)<\\/a>`, 'i');
        const waFullMatch = content.match(textRegex);
        if (waFullMatch) {
            const innerText = waFullMatch[1].toLowerCase();
            if (lang === 'it' && !innerText.includes('scrivici')) {
                warnings.push(`[${file}] WhatsApp text for IT page doesn't contain 'Scrivici' (got: '${innerText.trim()}').`);
            } else if (lang === 'de' && !innerText.includes('schreiben') && !innerText.includes('kontakt')) {
                warnings.push(`[${file}] WhatsApp text for DE page doesn't contain 'Schreiben Sie uns' (got: '${innerText.trim()}').`);
            }
        }
    }
}

// 7. Check Bidirectional Hreflang Alternates
console.log('\n=== Verifying Bidirectional Alternates ===');
for (const [file, mapping] of Object.entries(hreflangMappings)) {
    // 404 pages or policy pages might not be mapped in alternates but standard ones should be
    // Actually, it's good to check standard pages
    for (const [altLang, altUrl] of Object.entries(mapping)) {
        const parts = altUrl.split('idalbau.github.io/');
        let targetFilename = parts[parts.length - 1].split('#')[0];
        if (!targetFilename || targetFilename === '') {
            targetFilename = 'index.html';
        }
            
        if (!htmlFiles.includes(targetFilename)) {
            errors.push(`[${file}] Alternate URL '${altUrl}' maps to non-existent local file '${targetFilename}'.`);
            continue;
        }
            
        const targetMapping = hreflangMappings[targetFilename] || {};
        const sourceLang = itPages.includes(file) ? 'it' : 'de';
        
        const backLink = targetMapping[sourceLang] || '';
        const backParts = backLink.split('idalbau.github.io/');
        let backFilename = backParts[backParts.length - 1].split('#')[0];
        if (!backFilename || backFilename === '') {
            backFilename = 'index.html';
        }
            
        if (backFilename !== file) {
            errors.push(`[${file}] Alternate mapping to '${targetFilename}' is not bidirectional. '${targetFilename}' alternates map back to '${backFilename}' instead of '${file}'.`);
        }
    }
}

// 8. Check Sitemap.xml validity
const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
    console.log('\n=== Auditing sitemap.xml ===');
    try {
        const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
            
        const expectedPagesInSitemap = [
            'index.html', 'chi-siamo.html', 'portfolio.html', 'ristrutturazione-bagno-merano.html', 'impermeabilizzazioni-bolzano.html',
            'index-de.html', 'ueber-uns.html', 'projektbeispiele.html', 'badsanierung-meran.html', 'abdichtungen-bozen.html'
        ];
        
        for (const p of expectedPagesInSitemap) {
            const pClean = p === 'index.html' ? '' : p;
            if (pClean === '') {
                if (!sitemapContent.includes('https://idalbau.github.io/')) {
                    errors.push(`[sitemap.xml] Missing reference to root URL https://idalbau.github.io/.`);
                }
            } else {
                if (!sitemapContent.includes(`https://idalbau.github.io/${p}`)) {
                    errors.push(`[sitemap.xml] Missing reference to page https://idalbau.github.io/${p}.`);
                }
            }
        }
                    
        // Check alternate links in sitemap.xml
        const alternateTagsCount = (sitemapContent.match(/xhtml:link/g) || []).length;
        console.log(`  - Found ${alternateTagsCount} alternate page links in sitemap.xml`);
        if (alternateTagsCount === 0) {
            errors.push('[sitemap.xml] Missing xhtml:link alternate tags.');
        }
            
    } catch (e) {
        errors.push(`Failed to parse sitemap.xml: ${e.message}`);
    }
} else {
    errors.push('Missing sitemap.xml in root directory!');
}

console.log('\n=== AUDIT RESULTS ===');
console.log(`Total Errors found: ${errors.length}`);
console.log(`Total Warnings found: ${warnings.length}`);

if (errors.length > 0) {
    console.log('\nERRORS:');
    errors.forEach(err => console.log(`❌ ${err}`));
}

if (warnings.length > 0) {
    console.log('\nWARNINGS:');
    warnings.forEach(warn => console.log(`⚠️ ${warn}`));
}

if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ All checks passed! No errors or warnings found. Excellent work!');
} else if (errors.length === 0) {
    console.log('\n✅ No blocker errors found! Just minor warnings.');
} else {
    process.exit(1);
}
