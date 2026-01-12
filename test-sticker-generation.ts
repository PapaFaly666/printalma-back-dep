import { StickerGeneratorService } from './src/sticker/services/sticker-generator.service';
import * as fs from 'fs';
import * as path from 'path';

async function testStickerGeneration() {
  console.log('🧪 Test de génération de sticker\n');

  const generator = new StickerGeneratorService();

  // URL d'une image de test (remplacez par une vraie URL de votre Cloudinary)
  const testImageUrl = 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1734909188/vendor-designs/test_design.png';

  try {
    console.log('📥 Test 1: Génération sticker autocollant glossy-white');
    const buffer1 = await generator.createStickerFromDesign(
      testImageUrl,
      'autocollant',
      'glossy-white',
      '10 cm x 10 cm'
    );

    const outputPath1 = path.join(__dirname, 'test-sticker-glossy.png');
    fs.writeFileSync(outputPath1, buffer1);
    console.log(`✅ Sticker glossy sauvegardé: ${outputPath1}`);
    console.log(`   Taille: ${buffer1.length} bytes\n`);

    console.log('📥 Test 2: Génération sticker autocollant white');
    const buffer2 = await generator.createStickerFromDesign(
      testImageUrl,
      'autocollant',
      'white',
      '10 cm x 10 cm'
    );

    const outputPath2 = path.join(__dirname, 'test-sticker-white.png');
    fs.writeFileSync(outputPath2, buffer2);
    console.log(`✅ Sticker white sauvegardé: ${outputPath2}`);
    console.log(`   Taille: ${buffer2.length} bytes\n`);

    console.log('📥 Test 3: Génération sticker autocollant CIRCLE');
    const buffer3 = await generator.createStickerFromDesign(
      testImageUrl,
      'autocollant',
      'glossy-white',
      '10 cm x 10 cm',
      'CIRCLE'
    );

    const outputPath3 = path.join(__dirname, 'test-sticker-circle.png');
    fs.writeFileSync(outputPath3, buffer3);
    console.log(`✅ Sticker circle sauvegardé: ${outputPath3}`);
    console.log(`   Taille: ${buffer3.length} bytes\n`);

    console.log('✅ Tous les tests réussis ! Vérifiez les images générées.');
    console.log('\n📝 Vérifications à faire:');
    console.log('   1. La bordure blanche est visible et bien positionnée');
    console.log('   2. Les couleurs du design sont préservées');
    console.log('   3. L\'ombre portée est visible');
    console.log('   4. Pour glossy: l\'effet brillant est présent');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error(error.stack);
  }
}

testStickerGeneration();
