const fs = require('fs');
const path = require('path');

// Créer une image PNG de test basique (1x1 pixel transparent)
function createTestPNG() {
  const testImagePath = path.join(__dirname, 'test-logo.png');
  
  // PNG header + 1x1 pixel transparent
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk size
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 6 (RGBA), Compression: 0, Filter: 0, Interlace: 0
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0D, // IDAT chunk size
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, // Compressed data
    0x00, 0x00, 0x00, 0x00, // IEND chunk size
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  fs.writeFileSync(testImagePath, pngData);
  return testImagePath;
}

// Créer une image SVG de test plus réaliste
function createTestSVG() {
  const testSVGPath = path.join(__dirname, 'test-logo.svg');
  
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="100" cy="100" r="90" fill="url(#grad1)" stroke="#4a5568" stroke-width="2"/>
  
  <!-- Logo text -->
  <text x="100" y="110" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="24" font-weight="bold" fill="white">LOGO</text>
  
  <!-- Decorative elements -->
  <circle cx="70" cy="70" r="8" fill="#ffffff" opacity="0.8"/>
  <circle cx="130" cy="70" r="8" fill="#ffffff" opacity="0.8"/>
  <rect x="85" y="140" width="30" height="4" rx="2" fill="#ffffff" opacity="0.9"/>
</svg>`;
  
  fs.writeFileSync(testSVGPath, svgContent);
  return testSVGPath;
}

// Créer les deux types d'images
function createTestImages() {
  console.log('🎨 Création d\'images de test...');
  
  try {
    const pngPath = createTestPNG();
    const svgPath = createTestSVG();
    
    console.log(`✅ Image PNG créée: ${pngPath}`);
    console.log(`✅ Image SVG créée: ${svgPath}`);
    
    // Afficher la taille des fichiers
    const pngStats = fs.statSync(pngPath);
    const svgStats = fs.statSync(svgPath);
    
    console.log(`📊 Taille PNG: ${pngStats.size} bytes`);
    console.log(`📊 Taille SVG: ${svgStats.size} bytes`);
    
    return { pngPath, svgPath };
  } catch (error) {
    console.error('❌ Erreur lors de la création des images:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createTestImages();
}

module.exports = { createTestImages, createTestPNG, createTestSVG }; 