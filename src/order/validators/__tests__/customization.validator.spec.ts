import { CustomizationValidator } from '../customization.validator';

describe('CustomizationValidator', () => {
  describe('validateCustomizationData', () => {
    it('devrait valider des données correctes', () => {
      const validData = {
        customizationIds: { '12-45': 456 },
        designElementsByView: {
          '12-45': [
            {
              id: 'text_123',
              type: 'text',
              text: 'Mon Texte',
              x: 0.5,
              y: 0.3,
              width: 200,
              height: 50,
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#000000',
            },
          ],
        },
        delimitation: {
          x: 150.5,
          y: 200.3,
          width: 400,
          height: 500,
          coordinateType: 'PIXEL',
          referenceWidth: 1200,
          referenceHeight: 1500,
        },
        delimitations: [
          {
            viewId: 45,
            viewKey: '12-45',
            x: 150.5,
            y: 200.3,
            width: 400,
            height: 500,
            coordinateType: 'PIXEL',
            referenceWidth: 1200,
            referenceHeight: 1500,
          },
        ],
      };

      const result = CustomizationValidator.validateCustomizationData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait détecter le double wrapping d\'arrays', () => {
      const invalidData = {
        designElementsByView: {
          '12-45': [
            [
              // ❌ Double wrapping
              {
                id: 'text_123',
                type: 'text',
                text: 'Test',
                x: 0.5,
                y: 0.3,
                width: 200,
                height: 50,
                fontSize: 24,
                fontFamily: 'Arial',
                color: '#000000',
              },
            ],
          ],
        },
      };

      const result = CustomizationValidator.validateCustomizationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('DOUBLE WRAPPING détecté'))).toBe(true);
    });

    it('devrait détecter les valeurs de référence suspectes (800x800)', () => {
      const suspiciousData = {
        delimitation: {
          x: 150,
          y: 200,
          width: 400,
          height: 500,
          coordinateType: 'PIXEL',
          referenceWidth: 800, // ⚠️ Suspect
          referenceHeight: 800, // ⚠️ Suspect
        },
      };

      const result = CustomizationValidator.validateCustomizationData(suspiciousData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('dimensions de référence suspectes (800x800)'))).toBe(true);
    });

    it('devrait valider les coordonnées normalisées (0-1)', () => {
      const invalidData = {
        designElementsByView: {
          '12-45': [
            {
              id: 'text_123',
              type: 'text',
              text: 'Test',
              x: 1.5, // ❌ Hors limites
              y: 0.3,
              width: 200,
              height: 50,
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#000000',
            },
          ],
        },
      };

      const result = CustomizationValidator.validateCustomizationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Coordonnée x hors limites'))).toBe(true);
    });

    it('devrait valider les dimensions des éléments (10-2000 pixels)', () => {
      const invalidData = {
        designElementsByView: {
          '12-45': [
            {
              id: 'text_123',
              type: 'text',
              text: 'Test',
              x: 0.5,
              y: 0.3,
              width: 5, // ❌ Trop petit
              height: 50,
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#000000',
            },
          ],
        },
      };

      const result = CustomizationValidator.validateCustomizationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('width hors limites'))).toBe(true);
    });

    it('devrait vérifier la présence de l\'ID pour chaque élément', () => {
      const invalidData = {
        designElementsByView: {
          '12-45': [
            {
              // ❌ Pas d'ID
              type: 'text',
              text: 'Test',
              x: 0.5,
              y: 0.3,
              width: 200,
              height: 50,
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#000000',
            },
          ],
        },
      };

      const result = CustomizationValidator.validateCustomizationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('ID manquant'))).toBe(true);
    });

    it('devrait valider les champs requis pour les éléments texte', () => {
      const invalidData = {
        designElementsByView: {
          '12-45': [
            {
              id: 'text_123',
              type: 'text',
              text: 'Test',
              x: 0.5,
              y: 0.3,
              width: 200,
              height: 50,
              // ❌ Manque fontSize, fontFamily, color
            },
          ],
        },
      };

      const result = CustomizationValidator.validateCustomizationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait valider les champs requis pour les éléments image', () => {
      const invalidData = {
        designElementsByView: {
          '12-45': [
            {
              id: 'image_123',
              type: 'image',
              // ❌ Manque imageUrl
              x: 0.5,
              y: 0.3,
              width: 200,
              height: 50,
            },
          ],
        },
      };

      const result = CustomizationValidator.validateCustomizationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('URL d\'image manquante'))).toBe(true);
    });

    it('devrait vérifier la cohérence entre customizationIds et designElementsByView', () => {
      const invalidData = {
        customizationIds: { '12-45': 456, '12-46': 457 },
        designElementsByView: {
          '12-45': [
            {
              id: 'text_123',
              type: 'text',
              text: 'Test',
              x: 0.5,
              y: 0.3,
              width: 200,
              height: 50,
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#000000',
            },
          ],
          // ❌ Manque '12-46'
        },
      };

      const result = CustomizationValidator.validateCustomizationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Vues manquantes dans designElementsByView'))).toBe(true);
    });

    it('devrait valider le format des clés viewKey', () => {
      const invalidData = {
        customizationIds: { 'invalid-key': 456 }, // ❌ Format invalide
        designElementsByView: {
          'invalid-key': [],
        },
      };

      const result = CustomizationValidator.validateCustomizationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Format invalide'))).toBe(true);
    });

    it('devrait valider les delimitations array', () => {
      const invalidData = {
        delimitations: [
          {
            viewId: 45,
            viewKey: '12-45',
            x: 150,
            y: 200,
            width: 400,
            height: 500,
            // ❌ Manque coordinateType, referenceWidth, referenceHeight
          },
        ],
      };

      const result = CustomizationValidator.validateCustomizationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateOrThrow', () => {
    it('ne devrait pas lancer d\'exception pour des données valides', () => {
      const validData = {
        customizationIds: { '12-45': 456 },
        designElementsByView: {
          '12-45': [
            {
              id: 'text_123',
              type: 'text',
              text: 'Test',
              x: 0.5,
              y: 0.3,
              width: 200,
              height: 50,
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#000000',
            },
          ],
        },
      };

      expect(() => {
        CustomizationValidator.validateOrThrow(validData);
      }).not.toThrow();
    });

    it('devrait lancer une BadRequestException pour des données invalides', () => {
      const invalidData = {
        designElementsByView: {
          '12-45': [[]], // Double wrapping
        },
      };

      expect(() => {
        CustomizationValidator.validateOrThrow(invalidData);
      }).toThrow();
    });
  });
});
