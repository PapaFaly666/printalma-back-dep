import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomizationService } from './customization.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

describe('CustomizationService - Text Elements with Newlines', () => {
  let service: CustomizationService;
  let prismaService: PrismaService;

  // Mock de PrismaService
  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    productCustomization: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  // Mock de CloudinaryService
  const mockCloudinaryService = {
    uploadImage: jest.fn(),
    uploadBase64: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomizationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<CustomizationService>(CustomizationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Preservation of newline characters', () => {
    it('should preserve newline characters (\\n) in text elements', async () => {
      const textWithNewlines = 'Ligne 1\nLigne 2\nLigne 3';

      const textElement = {
        id: 'text-1',
        type: 'text',
        x: 0.5,
        y: 0.3,
        width: 200,
        height: 80,
        rotation: 0,
        zIndex: 1,
        text: textWithNewlines,
        fontSize: 20,
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const dto = {
        productId: 1,
        colorVariationId: 5,
        viewId: 12,
        designElements: [textElement],
        sessionId: 'test-session-123',
      };

      // Mock product exists
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 1,
        price: 10000,
      });

      // Mock no existing customization
      mockPrismaService.productCustomization.findFirst.mockResolvedValue(null);

      // Mock create
      const mockCreated = {
        id: 1,
        ...dto,
        designElements: [textElement],
        elementsByView: { '5-12': [textElement] },
      };
      mockPrismaService.productCustomization.create.mockResolvedValue(mockCreated);

      const result = await service.upsertCustomization(dto);

      // Vérifier que le texte avec \n est préservé
      expect(result.designElements[0].text).toBe(textWithNewlines);
      expect(result.designElements[0].text).toContain('\n');
      expect(result.designElements[0].text.split('\n')).toHaveLength(3);
    });

    it('should handle text with multiple consecutive newlines', async () => {
      const textElement = {
        id: 'text-2',
        type: 'text',
        x: 0.5,
        y: 0.5,
        width: 300,
        height: 100,
        rotation: 0,
        zIndex: 1,
        text: 'Ligne 1\n\n\nLigne 4',
        fontSize: 16,
        fontFamily: 'Roboto',
        color: '#FF5733',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
      };

      const dto = {
        productId: 1,
        colorVariationId: 5,
        viewId: 12,
        designElements: [textElement],
        sessionId: 'test-session-456',
      };

      mockPrismaService.product.findUnique.mockResolvedValue({ id: 1, price: 10000 });
      mockPrismaService.productCustomization.findFirst.mockResolvedValue(null);
      mockPrismaService.productCustomization.create.mockResolvedValue({
        id: 2,
        ...dto,
        designElements: [textElement],
      });

      const result = await service.upsertCustomization(dto);

      // Vérifier que les \n multiples sont préservés
      expect(result.designElements[0].text).toBe('Ligne 1\n\n\nLigne 4');
      expect(result.designElements[0].text.split('\n')).toHaveLength(4);
    });

    it('should handle empty text (edge case)', async () => {
      const textElement = {
        id: 'text-3',
        type: 'text',
        x: 0.5,
        y: 0.5,
        width: 100,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: '',
        fontSize: 18,
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const dto = {
        productId: 1,
        colorVariationId: 5,
        viewId: 12,
        designElements: [textElement],
        sessionId: 'test-session-789',
      };

      mockPrismaService.product.findUnique.mockResolvedValue({ id: 1, price: 10000 });
      mockPrismaService.productCustomization.findFirst.mockResolvedValue(null);
      mockPrismaService.productCustomization.create.mockResolvedValue({
        id: 3,
        ...dto,
        designElements: [textElement],
      });

      const result = await service.upsertCustomization(dto);

      expect(result.designElements[0].text).toBe('');
    });

    it('should handle text with only newlines', async () => {
      const textElement = {
        id: 'text-4',
        type: 'text',
        x: 0.5,
        y: 0.5,
        width: 100,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: '\n\n\n',
        fontSize: 18,
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const dto = {
        productId: 1,
        colorVariationId: 5,
        viewId: 12,
        designElements: [textElement],
        sessionId: 'test-session-abc',
      };

      mockPrismaService.product.findUnique.mockResolvedValue({ id: 1, price: 10000 });
      mockPrismaService.productCustomization.findFirst.mockResolvedValue(null);
      mockPrismaService.productCustomization.create.mockResolvedValue({
        id: 4,
        ...dto,
        designElements: [textElement],
      });

      const result = await service.upsertCustomization(dto);

      expect(result.designElements[0].text).toBe('\n\n\n');
    });
  });

  describe('Automatic font size adjustment', () => {
    it('should store fontSize as provided (including decimals)', async () => {
      const textElement = {
        id: 'text-5',
        type: 'text',
        x: 0.5,
        y: 0.7,
        width: 300,
        height: 60,
        rotation: -15,
        zIndex: 3,
        text: 'Text with auto-adjusted size',
        fontSize: 16.5, // Taille ajustée automatiquement par le frontend
        fontFamily: 'Montserrat',
        color: '#3498DB',
        fontWeight: 'normal',
        fontStyle: 'italic',
        textDecoration: 'underline',
        textAlign: 'center',
      };

      const dto = {
        productId: 1,
        colorVariationId: 5,
        viewId: 12,
        designElements: [textElement],
        sessionId: 'test-session-def',
      };

      mockPrismaService.product.findUnique.mockResolvedValue({ id: 1, price: 10000 });
      mockPrismaService.productCustomization.findFirst.mockResolvedValue(null);
      mockPrismaService.productCustomization.create.mockResolvedValue({
        id: 5,
        ...dto,
        designElements: [textElement],
      });

      const result = await service.upsertCustomization(dto);

      // Vérifier que la taille de police n'est pas arrondie
      expect(result.designElements[0].fontSize).toBe(16.5);
    });
  });

  describe('Special characters in text', () => {
    it('should handle emojis in text', async () => {
      const textElement = {
        id: 'text-6',
        type: 'text',
        x: 0.5,
        y: 0.5,
        width: 200,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: "J'adore ❤️ ce produit!",
        fontSize: 20,
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const dto = {
        productId: 1,
        colorVariationId: 5,
        viewId: 12,
        designElements: [textElement],
        sessionId: 'test-session-emoji',
      };

      mockPrismaService.product.findUnique.mockResolvedValue({ id: 1, price: 10000 });
      mockPrismaService.productCustomization.findFirst.mockResolvedValue(null);
      mockPrismaService.productCustomization.create.mockResolvedValue({
        id: 6,
        ...dto,
        designElements: [textElement],
      });

      const result = await service.upsertCustomization(dto);

      expect(result.designElements[0].text).toBe("J'adore ❤️ ce produit!");
    });

    it('should handle accented characters', async () => {
      const textElement = {
        id: 'text-7',
        type: 'text',
        x: 0.5,
        y: 0.5,
        width: 200,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: 'Café français à été',
        fontSize: 20,
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const dto = {
        productId: 1,
        colorVariationId: 5,
        viewId: 12,
        designElements: [textElement],
        sessionId: 'test-session-accent',
      };

      mockPrismaService.product.findUnique.mockResolvedValue({ id: 1, price: 10000 });
      mockPrismaService.productCustomization.findFirst.mockResolvedValue(null);
      mockPrismaService.productCustomization.create.mockResolvedValue({
        id: 7,
        ...dto,
        designElements: [textElement],
      });

      const result = await service.upsertCustomization(dto);

      expect(result.designElements[0].text).toBe('Café français à été');
    });

    it('should handle symbols and special characters', async () => {
      const textElement = {
        id: 'text-8',
        type: 'text',
        x: 0.5,
        y: 0.5,
        width: 200,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: 'Prix: 10€ (TVA 20%)',
        fontSize: 20,
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const dto = {
        productId: 1,
        colorVariationId: 5,
        viewId: 12,
        designElements: [textElement],
        sessionId: 'test-session-symbols',
      };

      mockPrismaService.product.findUnique.mockResolvedValue({ id: 1, price: 10000 });
      mockPrismaService.productCustomization.findFirst.mockResolvedValue(null);
      mockPrismaService.productCustomization.create.mockResolvedValue({
        id: 8,
        ...dto,
        designElements: [textElement],
      });

      const result = await service.upsertCustomization(dto);

      expect(result.designElements[0].text).toBe('Prix: 10€ (TVA 20%)');
    });
  });

  describe('Validation tests', () => {
    it('should validate text element correctly', () => {
      const validElement = {
        id: 'text-valid',
        type: 'text',
        x: 0.5,
        y: 0.3,
        width: 200,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: 'Valid text\nwith newline',
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const result = service.validateDesignElements([validElement]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject fontSize outside valid range', () => {
      const invalidElement = {
        id: 'text-invalid',
        type: 'text',
        x: 0.5,
        y: 0.3,
        width: 200,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: 'Invalid font size',
        fontSize: 5, // Too small (min is 10)
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const result = service.validateDesignElements([invalidElement]);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('fontSize'))).toBe(true);
    });

    it('should reject invalid color format', () => {
      const invalidElement = {
        id: 'text-invalid-color',
        type: 'text',
        x: 0.5,
        y: 0.3,
        width: 200,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: 'Invalid color',
        fontSize: 20,
        fontFamily: 'Arial',
        color: 'red', // Invalid format (should be #RRGGBB)
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const result = service.validateDesignElements([invalidElement]);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('color'))).toBe(true);
    });

    it('should reject invalid fontWeight', () => {
      const invalidElement = {
        id: 'text-invalid-weight',
        type: 'text',
        x: 0.5,
        y: 0.3,
        width: 200,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: 'Invalid weight',
        fontSize: 20,
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'extra-bold', // Invalid
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const result = service.validateDesignElements([invalidElement]);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('fontWeight'))).toBe(true);
    });

    it('should reject invalid textAlign', () => {
      const invalidElement = {
        id: 'text-invalid-align',
        type: 'text',
        x: 0.5,
        y: 0.3,
        width: 200,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: 'Invalid align',
        fontSize: 20,
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'justify', // Invalid (should be left, center, or right)
      };

      const result = service.validateDesignElements([invalidElement]);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('textAlign'))).toBe(true);
    });

    it('should validate coordinates are between 0 and 1', () => {
      const invalidElement = {
        id: 'text-invalid-coords',
        type: 'text',
        x: 1.5, // Invalid (> 1)
        y: -0.1, // Invalid (< 0)
        width: 200,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: 'Invalid coordinates',
        fontSize: 20,
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const result = service.validateDesignElements([invalidElement]);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('x must be'))).toBe(true);
      expect(result.errors.some(e => e.includes('y must be'))).toBe(true);
    });

    it('should validate required fields', () => {
      const invalidElement = {
        id: 'text-missing-fields',
        type: 'text',
        x: 0.5,
        y: 0.3,
        width: 200,
        height: 50,
        rotation: 0,
        zIndex: 1,
        text: 'Missing fontFamily',
        fontSize: 20,
        // fontFamily: missing
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const result = service.validateDesignElements([invalidElement]);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('fontFamily'))).toBe(true);
    });
  });
});
