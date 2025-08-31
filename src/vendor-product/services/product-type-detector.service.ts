import { Injectable } from '@nestjs/common';

export interface DesignPositioning {
  x: number;       // Position X en pourcentage (0-100)
  y: number;       // Position Y en pourcentage (0-100)
  width: number;   // Largeur en pourcentage (0-100)
  height: number;  // Hauteur en pourcentage (0-100)
  rotation: number; // Rotation en degrés
}

@Injectable()
export class ProductTypeDetectorService {
  
  /**
   * Détecte le type de produit basé sur son nom
   */
  detectProductType(productName: string): string {
    const name = productName.toLowerCase();
    
    // T-shirts et tops
    if (name.includes('t-shirt') || name.includes('tshirt') || name.includes('tee')) {
      return 'tshirt';
    }
    
    // Sweats et hoodies
    if (name.includes('hoodie') || name.includes('sweat') || name.includes('pull')) {
      return 'hoodie';
    }
    
    // Mugs et tasses
    if (name.includes('mug') || name.includes('tasse') || name.includes('cup')) {
      return 'mug';
    }
    
    // Casquettes et chapeaux
    if (name.includes('casquette') || name.includes('cap') || name.includes('hat') || name.includes('chapeau')) {
      return 'cap';
    }
    
    // Sacs
    if (name.includes('sac') || name.includes('bag') || name.includes('tote')) {
      return 'bag';
    }
    
    // Coques de téléphone
    if (name.includes('coque') || name.includes('case') || name.includes('phone')) {
      return 'phonecase';
    }
    
    // Stickers
    if (name.includes('sticker') || name.includes('autocollant')) {
      return 'sticker';
    }
    
    // Posters et affiches
    if (name.includes('poster') || name.includes('affiche') || name.includes('print')) {
      return 'poster';
    }
    
    return 'default';
  }
  
  /**
   * Retourne le positionnement par défaut selon le type de produit
   */
  getDefaultPositioning(productType: string): DesignPositioning {
    const templates: Record<string, DesignPositioning> = {
      // T-shirt : position poitrine, légèrement vers le haut
      tshirt: { 
        x: 50, 
        y: 35, 
        width: 25, 
        height: 30, 
        rotation: 0 
      },
      
      // Hoodie : position plus haute et plus petite
      hoodie: { 
        x: 50, 
        y: 30, 
        width: 20, 
        height: 25, 
        rotation: 0 
      },
      
      // Mug : position centrale et plus large
      mug: { 
        x: 50, 
        y: 50, 
        width: 40, 
        height: 40, 
        rotation: 0 
      },
      
      // Casquette : position frontale, plus large et moins haute
      cap: { 
        x: 50, 
        y: 35, 
        width: 35, 
        height: 20, 
        rotation: 0 
      },
      
      // Sac : position centrale généreuse
      bag: { 
        x: 50, 
        y: 45, 
        width: 35, 
        height: 35, 
        rotation: 0 
      },
      
      // Coque téléphone : position centrale, adaptée au format
      phonecase: { 
        x: 50, 
        y: 50, 
        width: 60, 
        height: 40, 
        rotation: 0 
      },
      
      // Sticker : position centrale, format carré
      sticker: { 
        x: 50, 
        y: 50, 
        width: 80, 
        height: 80, 
        rotation: 0 
      },
      
      // Poster : position centrale, format portrait
      poster: { 
        x: 50, 
        y: 50, 
        width: 70, 
        height: 60, 
        rotation: 0 
      },
      
      // Par défaut : position centrale standard
      default: { 
        x: 50, 
        y: 50, 
        width: 30, 
        height: 30, 
        rotation: 0 
      }
    };
    
    return templates[productType] || templates.default;
  }
  
  /**
   * Retourne des positions prédéfinies pour un type de produit
   */
  getPresetPositions(productType: string): Record<string, DesignPositioning> {
    const basePosition = this.getDefaultPositioning(productType);
    
    switch (productType) {
      case 'tshirt':
        return {
          center: basePosition,
          chest: { ...basePosition, y: 30 },
          lower: { ...basePosition, y: 55 },
          small: { ...basePosition, width: 15, height: 20 },
          large: { ...basePosition, width: 35, height: 40 }
        };
        
      case 'hoodie':
        return {
          center: basePosition,
          chest: { ...basePosition, y: 25 },
          pocket: { ...basePosition, y: 60, width: 15, height: 15 },
          back: { ...basePosition, y: 40, width: 30, height: 35 }
        };
        
      case 'mug':
        return {
          center: basePosition,
          left: { ...basePosition, x: 30 },
          right: { ...basePosition, x: 70 },
          wrap: { ...basePosition, width: 70, height: 30 }
        };
        
      case 'cap':
        return {
          center: basePosition,
          front: { ...basePosition, y: 30 },
          side: { ...basePosition, x: 25, width: 25, height: 15 },
          back: { ...basePosition, y: 45 }
        };
        
      default:
        return {
          center: basePosition,
          top: { ...basePosition, y: 25 },
          bottom: { ...basePosition, y: 75 },
          left: { ...basePosition, x: 25 },
          right: { ...basePosition, x: 75 }
        };
    }
  }
  
  /**
   * Retourne la description du type de produit
   */
  getProductTypeDescription(productType: string): string {
    const descriptions: Record<string, string> = {
      tshirt: 'T-shirt - Position poitrine optimisée',
      hoodie: 'Sweat à capuche - Position haute',
      mug: 'Mug - Position centrale',
      cap: 'Casquette - Position frontale',
      bag: 'Sac - Position centrale généreuse',
      phonecase: 'Coque téléphone - Format adapté',
      sticker: 'Sticker - Format carré',
      poster: 'Poster - Format portrait',
      default: 'Produit standard - Position centrale'
    };
    
    return descriptions[productType] || descriptions.default;
  }
} 
/* Duplicate implementations below were commented out to avoid redeclaration errors. */ 
 
 
 
 
 