const fs = require('fs');
const html = fs.readFileSync('test.html', 'utf8');
const bodyStart = html.indexOf('<body');
const mainEnd = html.indexOf('</main>');

// Let's get the header part.
console.log(html.substring(bodyStart, html.indexOf('<main') + 500));
