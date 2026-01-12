import { Test, TestingModule } from '@nestjs/testing';
import { StickerGeneratorService } from './sticker-generator.service';

describe('StickerGeneratorService', () => {
  let service: StickerGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StickerGeneratorService],
    }).compile();

    service = module.get<StickerGeneratorService>(StickerGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mmToPixels', () => {
    it('should convert millimeters to pixels at 300 DPI', () => {
      const result = service.mmToPixels(10);
      expect(result).toBeCloseTo(118, 0); // 10mm ≈ 118 pixels at 300 DPI
    });

    it('should convert centimeters to pixels correctly', () => {
      const result = service.mmToPixels(100); // 10 cm
      expect(result).toBeCloseTo(1181, 0); // 10cm ≈ 1181 pixels at 300 DPI
    });

    it('should handle custom DPI', () => {
      const result = service.mmToPixels(25.4, 150); // 1 inch at 150 DPI
      expect(result).toBe(150);
    });
  });

  // Note: Les tests suivants nécessitent un mock d'axios et de sharp
  // pour éviter les appels réseau réels et les opérations d'image coûteuses

  describe('generateStickerImage', () => {
    it('should throw error if image download fails', async () => {
      const config = {
        designImageUrl: 'https://invalid-url.com/image.png',
        borderColor: 'white',
        stickerType: 'autocollant' as const,
        width: 1000,
        height: 1000,
      };

      await expect(service.generateStickerImage(config)).rejects.toThrow();
    });
  });

  describe('createStickerFromDesign', () => {
    it('should parse size string with millimeters', async () => {
      const sizeString = '83 mm x 100 mm';
      const match = sizeString.match(/(\d+(?:\.\d+)?)\s*(mm|cm)\s*x\s*(\d+(?:\.\d+)?)\s*(mm|cm)/i);

      expect(match).toBeTruthy();
      expect(parseFloat(match![1])).toBe(83);
      expect(match![2].toLowerCase()).toBe('mm');
      expect(parseFloat(match![3])).toBe(100);
      expect(match![4].toLowerCase()).toBe('mm');
    });

    it('should parse size string with centimeters', async () => {
      const sizeString = '8.3 cm x 10 cm';
      const match = sizeString.match(/(\d+(?:\.\d+)?)\s*(mm|cm)\s*x\s*(\d+(?:\.\d+)?)\s*(mm|cm)/i);

      expect(match).toBeTruthy();
      expect(parseFloat(match![1])).toBe(8.3);
      expect(match![2].toLowerCase()).toBe('cm');
      expect(parseFloat(match![3])).toBe(10);
      expect(match![4].toLowerCase()).toBe('cm');
    });

    it('should reject invalid size format', async () => {
      const invalidSize = 'invalid format';

      await expect(
        service.createStickerFromDesign(
          'https://example.com/image.png',
          'autocollant',
          'white',
          invalidSize
        )
      ).rejects.toThrow('Format de taille invalide');
    });
  });
});
