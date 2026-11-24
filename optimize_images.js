const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processImages() {
  const assetsDir = path.resolve('Assets');
  console.log('Starting image optimisation in:', assetsDir);

  const heroImages = [
    'Images/hero-slide-1.jpg',
    'Images/hero-slide-2.jpg',
    'Images/hero-slide-3.jpg',
    'Images/hero-slide-4.jpg',
    'Images/inner-hero-about.jpg',
    'Images/inner-hero-contact.jpg',
    'Images/inner-hero-gallery.jpg',
    'Images/inner-hero-rooms.jpg',
    'Images/cta-bg.jpg',
    'Images/resort-video-poster.jpg'
  ];

  // 1. Process Hero Images & Video Poster (Desktop + Mobile variants)
  for (const rel of heroImages) {
    const src = path.join(assetsDir, rel);
    if (!fs.existsSync(src)) {
      console.warn('Missing:', src);
      continue;
    }
    const meta = await sharp(src).metadata();
    const baseName = rel.replace(/\.[^.]+$/, '');
    
    // Desktop WebP (max 1600w, quality 82)
    const outDesktop = path.join(assetsDir, `${baseName}.webp`);
    await sharp(src)
      .resize({ width: Math.min(meta.width || 1600, 1600), withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(outDesktop);
      
    // Mobile WebP (max 750w, quality 80)
    const outMobile = path.join(assetsDir, `${baseName}-m.webp`);
    await sharp(src)
      .resize({ width: 750, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(outMobile);

    const origSize = fs.statSync(src).size / 1024;
    const deskSize = fs.statSync(outDesktop).size / 1024;
    const mobSize = fs.statSync(outMobile).size / 1024;
    console.log(`Hero: ${rel} (${origSize.toFixed(1)} KB) -> Desktop: ${deskSize.toFixed(1)} KB, Mobile: ${mobSize.toFixed(1)} KB`);
  }

  // 2. Process All Other Images in Images/, Rooms/, Gallery/
  const subDirs = ['Images', 'Rooms', 'Gallery'];
  for (const dir of subDirs) {
    const fullDir = path.join(assetsDir, dir);
    const files = fs.readdirSync(fullDir);
    for (const file of files) {
      if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
        const rel = `${dir}/${file}`;
        if (heroImages.includes(rel)) continue; // already handled
        
        const src = path.join(fullDir, file);
        const meta = await sharp(src).metadata();
        const baseName = rel.replace(/\.[^.]+$/, '');
        const outWebp = path.join(assetsDir, `${baseName}.webp`);
        
        // Quality 82, max width 1200
        await sharp(src)
          .resize({ width: Math.min(meta.width || 1200, 1200), withoutEnlargement: true })
          .webp({ quality: 82, effort: 6 })
          .toFile(outWebp);
          
        const origSize = fs.statSync(src).size / 1024;
        const webpSize = fs.statSync(outWebp).size / 1024;
        console.log(`Image: ${rel} (${origSize.toFixed(1)} KB) -> WebP: ${webpSize.toFixed(1)} KB`);
      }
    }
  }

  // 3. Process Logos
  const logoDir = path.join(assetsDir, 'Logo');
  for (const l of ['logo.png', 'logo-white.png']) {
    const src = path.join(logoDir, l);
    if (fs.existsSync(src)) {
      const baseName = l.replace(/\.[^.]+$/, '');
      const outWebp = path.join(logoDir, `${baseName}.webp`);
      await sharp(src)
        .resize({ width: 350, withoutEnlargement: true })
        .webp({ quality: 90, effort: 6 })
        .toFile(outWebp);
      const origSize = fs.statSync(src).size / 1024;
      const webpSize = fs.statSync(outWebp).size / 1024;
      console.log(`Logo: ${l} (${origSize.toFixed(1)} KB) -> WebP: ${webpSize.toFixed(1)} KB`);
    }
  }

  // 4. Process Icons (resize 512x512 icons to compact 96x96 webp)
  const iconDir = path.join(assetsDir, 'Icons');
  const iconFiles = fs.readdirSync(iconDir);
  for (const f of iconFiles) {
    if (f.endsWith('.webp') && !f.endsWith('-opt.webp')) {
      const src = path.join(iconDir, f);
      const tempOut = path.join(iconDir, f.replace('.webp', '-opt.webp'));
      await sharp(src)
        .resize({ width: 96, height: 96, fit: 'inside' })
        .webp({ quality: 85, effort: 6 })
        .toFile(tempOut);
      fs.renameSync(tempOut, src);
      const newSize = fs.statSync(src).size / 1024;
      console.log(`Icon: ${f} -> optimized ${newSize.toFixed(1)} KB`);
    }
  }

  console.log('Image optimisation complete!');
}

processImages().catch(err => {
  console.error('Optimisation failed:', err);
  process.exit(1);
});
