const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// Replace the <style> block with <link>
content = content.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="styles.css">');

// Replace the specific <script> block at the end (the one with setLang and cookie functions)
// We will match the script that contains "function setLang(lang)" up to </script>
content = content.replace(/<script>\s*function setLang[\s\S]*?<\/script>/, '<script src="script.js"></script>');

fs.writeFileSync('index.html', content);
console.log("Replaced inline CSS and JS with external links in index.html");
