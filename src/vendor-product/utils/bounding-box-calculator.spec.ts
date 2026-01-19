/**
 * 🧪 Tests de l'utilitaire de calcul de bounding box
 *
 * Ces tests valident que les calculs correspondent exactement
 * aux exemples de la documentation BOUNDING_BOX_IMPLEMENTATION.md
 */

import {
  calculateAbsoluteBoundingBox,
  calculatePositionConstraints,
  calculateCompletePositioning,
  validateDesignTransform,
  type DesignTransform,
  type Delimitation,
} from './bounding-box-calculator';

describe('BoundingBoxCalculator', () => {
  describe('calculateAbsoluteBoundingBox', () => {
    /**
     * Test 1: Design Centré
     *
     * Données de la doc:
     * - x: 0, y: 0, designScale: 0.8
     * - delimitationWidth: 400, delimitationHeight: 400
     * - Délimitation: x=100, y=100, width=400, height=400
     *
     * Résultat attendu: left=140, top=140, width=320, height=320
     */
    it('Test 1: Design Centré', () => {
      const transform: DesignTransform = {
        x: 0,
        y: 0,
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 400,
        delimitationHeight: 400,
      };

      const delimitation = {
        x: 100,
        y: 100,
        width: 400,
        height: 400,
      };

      const bbox = calculateAbsoluteBoundingBox(delimitation, transform);

      // Vérifications selon la doc
      const containerWidth = 400 * 0.8; // 320
      const centerX = 100 + 400 / 2; // 300
      const left = 300 + 0 - 160; // 140

      expect(bbox.width).toBe(320);
      expect(bbox.height).toBe(320);
      expect(bbox.left).toBe(140);
      expect(bbox.top).toBe(140);
    });

    /**
     * Test 2: Design dans le Coin Supérieur Gauche
     *
     * Données de la doc:
     * - x: -40, y: -40, designScale: 0.8
     * - delimitationWidth: 400, delimitationHeight: 400
     * - Délimitation: x=100, y=100, width=400, height=400
     *
     * Résultat attendu: left=100, top=100 (coin de la délimitation)
     */
    it('Test 2: Design dans le Coin Supérieur Gauche', () => {
      const transform: DesignTransform = {
        x: -40,
        y: -40,
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 400,
        delimitationHeight: 400,
      };

      const delimitation = {
        x: 100,
        y: 100,
        width: 400,
        height: 400,
      };

      const bbox = calculateAbsoluteBoundingBox(delimitation, transform);

      // Calcul selon la doc
      const containerWidth = 320;
      const centerX = 300;
      const left = 300 + (-40) - 160; // 100

      expect(bbox.left).toBe(100);
      expect(bbox.top).toBe(100);
    });

    /**
     * Test 3: Design dans le Coin Inférieur Droit
     *
     * Données de la doc:
     * - x: 40, y: 40, designScale: 0.8
     * - delimitationWidth: 400, delimitationHeight: 400
     * - Délimitation: x=100, y=100, width=400, height=400
     *
     * Résultat attendu: left=180, top=180
     */
    it('Test 3: Design dans le Coin Inférieur Droit', () => {
      const transform: DesignTransform = {
        x: 40,
        y: 40,
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 400,
        delimitationHeight: 400,
      };

      const delimitation = {
        x: 100,
        y: 100,
        width: 400,
        height: 400,
      };

      const bbox = calculateAbsoluteBoundingBox(delimitation, transform);

      // Calcul selon la doc
      const left = 300 + 40 - 160; // 180

      expect(bbox.left).toBe(180);
      expect(bbox.top).toBe(180);

      // Vérifier que c'est bien le coin inférieur droit
      // 100 (début délim) + 400 (largeur) - 320 (conteneur) = 180 ✅
      expect(bbox.left).toBe(100 + 400 - 320);
    });

    /**
     * Test 4: Design avec offset personnalisé (exemple de la doc)
     *
     * Données de la doc (Exemple Concret):
     * - x: 50, y: -30, designScale: 0.8
     * - delimitationWidth: 400, delimitationHeight: 400
     * - Délimitation: x=100, y=100, width=400, height=400
     *
     * Résultat attendu: left=190, top=110, width=320, height=320
     */
    it('Test 4: Design avec offset personnalisé', () => {
      const transform: DesignTransform = {
        x: 50,
        y: -30,
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 400,
        delimitationHeight: 400,
      };

      const delimitation = {
        x: 100,
        y: 100,
        width: 400,
        height: 400,
      };

      const bbox = calculateAbsoluteBoundingBox(delimitation, transform);

      // Calcul détaillé selon la doc
      const containerWidth = 400 * 0.8; // 320
      const containerHeight = 400 * 0.8; // 320
      const centerX = 100 + 400 / 2; // 300
      const centerY = 100 + 400 / 2; // 300
      const left = 300 + 50 - 160; // 190
      const top = 300 + (-30) - 160; // 110

      expect(bbox.left).toBe(190);
      expect(bbox.top).toBe(110);
      expect(bbox.width).toBe(320);
      expect(bbox.height).toBe(320);
    });
  });

  describe('calculatePositionConstraints', () => {
    /**
     * Test: Calcul des contraintes
     *
     * Données: delimitationWidth=400, delimitationHeight=400, designScale=0.8
     * containerWidth = 320
     *
     * Résultat attendu:
     * maxX = (400 - 320) / 2 = 40
     * minX = -40
     * maxY = 40
     * minY = -40
     */
    it('Calcule correctement les contraintes min/max', () => {
      const constraints = calculatePositionConstraints(400, 400, 0.8);

      expect(constraints.maxX).toBe(40);
      expect(constraints.minX).toBe(-40);
      expect(constraints.maxY).toBe(40);
      expect(constraints.minY).toBe(-40);
    });

    /**
     * Test: Contraintes avec scale différent
     */
    it('Calcule les contraintes avec scale=0.5', () => {
      const constraints = calculatePositionConstraints(400, 400, 0.5);

      // containerWidth = 400 * 0.5 = 200
      // maxX = (400 - 200) / 2 = 100
      expect(constraints.maxX).toBe(100);
      expect(constraints.minX).toBe(-100);
      expect(constraints.maxY).toBe(100);
      expect(constraints.minY).toBe(-100);
    });
  });

  describe('calculateCompletePositioning', () => {
    /**
     * Test: Calcul complet avec délimitation PIXEL
     *
     * Note: calculateCompletePositioning utilise delimInPixels pour calculer les centres
     * donc le résultat dépend de la position de la délimitation (x, y)
     */
    it('Calcule toutes les informations de positionnement (PIXEL)', () => {
      const delimitation: Delimitation = {
        x: 100,
        y: 100,
        width: 400,
        height: 400,
        coordinateType: 'PIXEL',
      };

      const transform: DesignTransform = {
        x: 0, // Centré pour simplifier
        y: 0,
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 400,
        delimitationHeight: 400,
      };

      const result = calculateCompletePositioning(
        delimitation,
        transform,
        1200,
        1200
      );

      // Vérifications
      expect(result.boundingBox.left).toBe(140); // 300 - 160
      expect(result.boundingBox.top).toBe(140);
      expect(result.boundingBox.width).toBe(320);
      expect(result.boundingBox.height).toBe(320);

      expect(result.constraints.maxX).toBe(40);
      expect(result.constraints.minX).toBe(-40);

      expect(result.containerDimensions.width).toBe(320);
      expect(result.containerDimensions.height).toBe(320);

      expect(result.centerDelimitation.x).toBe(300);
      expect(result.centerDelimitation.y).toBe(300);

      expect(result.centerContainer.x).toBe(300); // 300 + 0
      expect(result.centerContainer.y).toBe(300); // 300 + 0
    });

    /**
     * Test: Calcul complet avec délimitation PERCENTAGE
     */
    it('Calcule toutes les informations de positionnement (PERCENTAGE)', () => {
      const delimitation: Delimitation = {
        x: 10, // 10% de 1200 = 120px
        y: 10, // 10% de 1200 = 120px
        width: 30, // 30% de 1200 = 360px
        height: 30, // 30% de 1200 = 360px
        coordinateType: 'PERCENTAGE',
      };

      const transform: DesignTransform = {
        x: 0,
        y: 0,
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 360, // Largeur en pixels absolus
        delimitationHeight: 360,
      };

      const result = calculateCompletePositioning(
        delimitation,
        transform,
        1200,
        1200
      );

      // Vérifier la conversion en pixels
      expect(result.delimInPixels.x).toBe(120);
      expect(result.delimInPixels.y).toBe(120);
      expect(result.delimInPixels.width).toBe(360);
      expect(result.delimInPixels.height).toBe(360);

      // Conteneur = 360 * 0.8 = 288
      expect(result.containerDimensions.width).toBe(288);
      expect(result.containerDimensions.height).toBe(288);

      // Centre délimitation = 120 + 360/2 = 300
      expect(result.centerDelimitation.x).toBe(300);
      expect(result.centerDelimitation.y).toBe(300);

      // Bounding box centrée: 300 - 288/2 = 156
      expect(result.boundingBox.left).toBe(156);
      expect(result.boundingBox.top).toBe(156);
    });

    /**
     * Test: Application des contraintes
     */
    it('Applique les contraintes sur une position hors limites', () => {
      const delimitation: Delimitation = {
        x: 100,
        y: 100,
        width: 400,
        height: 400,
        coordinateType: 'PIXEL',
      };

      // Position demandée hors limites (x=100, limite max=40)
      const transform: DesignTransform = {
        x: 100, // Trop loin à droite
        y: -100, // Trop loin en haut
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 400,
        delimitationHeight: 400,
      };

      const result = calculateCompletePositioning(
        delimitation,
        transform,
        1200,
        1200
      );

      // Vérifier que la position est contrainte
      expect(result.constrainedPosition.x).toBe(40); // maxX
      expect(result.constrainedPosition.y).toBe(-40); // minY
    });
  });

  describe('validateDesignTransform', () => {
    it('Valide un transform correct', () => {
      const transform: DesignTransform = {
        x: 0,
        y: 0,
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 400,
        delimitationHeight: 400,
      };

      expect(() => validateDesignTransform(transform)).not.toThrow();
    });

    it('Rejette un transform sans delimitationWidth', () => {
      const transform = {
        x: 0,
        y: 0,
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationHeight: 400,
      } as any;

      expect(() => validateDesignTransform(transform)).toThrow(
        'delimitationWidth et delimitationHeight sont obligatoires'
      );
    });

    it('Rejette un transform avec delimitationWidth <= 0', () => {
      const transform: DesignTransform = {
        x: 0,
        y: 0,
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 0,
        delimitationHeight: 400,
      };

      // La validation vérifie d'abord !delimitationWidth (qui est vrai pour 0)
      expect(() => validateDesignTransform(transform)).toThrow(
        'delimitationWidth et delimitationHeight sont obligatoires'
      );
    });

    it('Rejette un designScale invalide (> 1)', () => {
      const transform: DesignTransform = {
        x: 0,
        y: 0,
        designScale: 1.5,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 400,
        delimitationHeight: 400,
      };

      expect(() => validateDesignTransform(transform)).toThrow(
        'designScale invalide'
      );
    });

    it('Rejette un designScale invalide (<= 0)', () => {
      const transform: DesignTransform = {
        x: 0,
        y: 0,
        designScale: 0,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 400,
        delimitationHeight: 400,
      };

      expect(() => validateDesignTransform(transform)).toThrow(
        'designScale invalide'
      );
    });
  });

  describe('Tests Edge Cases', () => {
    it('Gère correctement un design avec scale=1 (100%)', () => {
      const transform: DesignTransform = {
        x: 0,
        y: 0,
        designScale: 1,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 400,
        delimitationHeight: 400,
      };

      const delimitation = {
        x: 100,
        y: 100,
        width: 400,
        height: 400,
      };

      const bbox = calculateAbsoluteBoundingBox(delimitation, transform);

      // Conteneur = délimitation complète
      expect(bbox.width).toBe(400);
      expect(bbox.height).toBe(400);
      expect(bbox.left).toBe(100);
      expect(bbox.top).toBe(100);

      // Contraintes = 0 (aucun mouvement possible)
      const constraints = calculatePositionConstraints(400, 400, 1);
      expect(constraints.maxX).toBe(0);
      // -0 est techniquement égal à 0 en JavaScript, mais toBe utilise Object.is
      // qui fait la distinction. On utilise toBeCloseTo pour éviter ce problème.
      expect(constraints.minX).toBeCloseTo(0);
    });

    it('Gère correctement un design avec scale très petit (0.1)', () => {
      const constraints = calculatePositionConstraints(400, 400, 0.1);

      // containerWidth = 400 * 0.1 = 40
      // maxX = (400 - 40) / 2 = 180
      expect(constraints.maxX).toBe(180);
      expect(constraints.minX).toBe(-180);
    });

    it('Gère correctement des dimensions non carrées', () => {
      const transform: DesignTransform = {
        x: 0,
        y: 0,
        designScale: 0.8,
        rotation: 0,
        positionUnit: 'PIXEL',
        delimitationWidth: 800, // Rectangle
        delimitationHeight: 400,
      };

      const delimitation = {
        x: 100,
        y: 100,
        width: 800,
        height: 400,
      };

      const bbox = calculateAbsoluteBoundingBox(delimitation, transform);

      // Conteneur : 800*0.8 x 400*0.8 = 640 x 320
      expect(bbox.width).toBe(640);
      expect(bbox.height).toBe(320);

      // Centre : 100 + 800/2 = 500, 100 + 400/2 = 300
      // Left: 500 - 640/2 = 180
      // Top: 300 - 320/2 = 140
      expect(bbox.left).toBe(180);
      expect(bbox.top).toBe(140);
    });
  });
});
