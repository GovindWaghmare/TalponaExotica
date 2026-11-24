const fs = require('fs');
const path = require('path');

// 1. Update Malvides @font-face in CSS/style.css
let styleCss = fs.readFileSync('CSS/style.css', 'utf8');

if (!styleCss.includes('Malvides.woff2')) {
  styleCss = styleCss.replace(
    /src:\s*url\(['"]\.\.\/Assets\/Fonts\/Malvides\.otf['"]\)\s*format\(['"]opentype['"]\);/,
    `src: url('../Assets/Fonts/Malvides.woff2') format('woff2'),\n       url('../Assets/Fonts/Malvides.otf') format('opentype');`
  );
}

// Add hero picture/img support if not present
if (!styleCss.includes('.hero-slide-picture')) {
  const heroRule = `
/* Hero Responsive Image Architecture for LCP */
.hero-slide-picture {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.hero-slide-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1);
  will-change: transform;
}
`;
  styleCss = styleCss.replace('.hero-slide-bg {', heroRule + '\n.hero-slide-bg {');
}

fs.writeFileSync('CSS/style.css', styleCss, 'utf8');

// 2. Update Room CSS files for Malvides.woff2
const roomCssDir = 'CSS/rooms';
for (const rf of fs.readdirSync(roomCssDir)) {
  if (rf.endsWith('.css')) {
    const rpath = path.join(roomCssDir, rf);
    let rcss = fs.readFileSync(rpath, 'utf8');
    if (!rcss.includes('Malvides.woff2')) {
      rcss = rcss.replace(
        /src:\s*url\(['"]\.\.\/\.\.\/Assets\/Fonts\/Malvides\.otf['"]\)\s*format\(['"]opentype['"]\);/,
        `src: url('../../Assets/Fonts/Malvides.woff2') format('woff2'),\n       url('../../Assets/Fonts/Malvides.otf') format('opentype');`
      );
      fs.writeFileSync(rpath, rcss, 'utf8');
    }
  }
}

function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

// 3. Minify CSS/style.css, Components/Header.css, Components/Footer.css
const headerCss = fs.readFileSync('Components/Header.css', 'utf8');
const footerCss = fs.readFileSync('Components/Footer.css', 'utf8');

const combined = styleCss + '\n' + headerCss + '\n' + footerCss;
const minCombined = minify(combined);

fs.writeFileSync('CSS/main.min.css', minCombined, 'utf8');
fs.writeFileSync('CSS/style.min.css', minify(styleCss), 'utf8');
fs.writeFileSync('Components/Header.min.css', minify(headerCss), 'utf8');
fs.writeFileSync('Components/Footer.min.css', minify(footerCss), 'utf8');

// Minify page specific CSS files
const pageCssFiles = ['about.css', 'accommodation.css', 'contact.css', 'gallery.css'];
for (const pcf of pageCssFiles) {
  const p = path.join('CSS', pcf);
  if (fs.existsSync(p)) {
    const minP = p.replace('.css', '.min.css');
    fs.writeFileSync(minP, minify(fs.readFileSync(p, 'utf8')), 'utf8');
  }
}

// Minify room css files
for (const rf of fs.readdirSync(roomCssDir)) {
  if (rf.endsWith('.css') && !rf.endsWith('.min.css')) {
    const rpath = path.join(roomCssDir, rf);
    const minRpath = rpath.replace('.css', '.min.css');
    fs.writeFileSync(minRpath, minify(fs.readFileSync(rpath, 'utf8')), 'utf8');
  }
}

console.log('Combined minified CSS generated: CSS/main.min.css (', (minCombined.length / 1024).toFixed(1), 'KB )');
