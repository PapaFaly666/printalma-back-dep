/**
 * Unified Design Position Calculator
 * Provides consistent design positioning calculations across all endpoints
 */

export interface DesignPosition {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  constraints?: {
    minScale?: number;
    maxScale?: number;
  };
  designWidth: number;
  designHeight: number;
}

export interface DesignPositionData {
  designId: number;
  position: DesignPosition;
  createdAt: string;
  updatedAt: string;
}

export interface StandardDelimitation {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE';
}

/**
 * Calculate consistent design position based on stored data
 * Used by ALL endpoints to ensure consistency
 */
export function calculateDesignPosition(
  designId: number,
  storedPosition?: any,
  designCloudinaryUrl?: string,
  designCategory?: string
): DesignPosition {
  let designWidth = 1200;
  let designHeight = 1200;
  let x = 0;
  let y = 0;
  let scale = 0.85;
  let rotation = 0;

  // Priority 1: Use stored position data if available
  if (storedPosition) {
    try {
      const positionData = typeof storedPosition === 'string' 
        ? JSON.parse(storedPosition) 
        : storedPosition;

      // Extract coordinates
      if (typeof positionData.x === 'number') x = positionData.x;
      if (typeof positionData.y === 'number') y = positionData.y;
      if (typeof positionData.scale === 'number') scale = positionData.scale;
      if (typeof positionData.rotation === 'number') rotation = positionData.rotation;

      // Extract design dimensions
      if (positionData.designWidth && positionData.designHeight) {
        designWidth = positionData.designWidth;
        designHeight = positionData.designHeight;
      }
    } catch (error) {
      console.warn(`⚠️ [DESIGN-CALC] Failed to parse position data for design ${designId}:`, error.message);
    }
  }

  // Priority 2: Extract dimensions from Cloudinary URL if no stored dimensions
  if ((designWidth === 1200 && designHeight === 1200) && designCloudinaryUrl) {
    const dimensions = extractDimensionsFromCloudinaryUrl(designCloudinaryUrl);
    if (dimensions) {
      designWidth = dimensions.width;
      designHeight = dimensions.height;
    }
  }

  // Priority 3: Estimate based on design category
  if ((designWidth === 1200 && designHeight === 1200) && designCategory) {
    const estimatedDimensions = estimateDimensionsByCategory(designCategory);
    designWidth = estimatedDimensions.width;
    designHeight = estimatedDimensions.height;
  }

  return {
    x,
    y,
    scale,
    rotation,
    constraints: {
      minScale: 0.1,
      maxScale: 2.0
    },
    designWidth,
    designHeight
  };
}

/**
 * Format design position data consistently for API responses
 */
export function formatDesignPositions(
  productDesignPositions: any[]
): DesignPositionData[] {
  if (!productDesignPositions || productDesignPositions.length === 0) {
    return [];
  }

  return productDesignPositions.map((pdp) => {
    const position = calculateDesignPosition(
      pdp.designId,
      pdp.position,
      pdp.design?.cloudinaryUrl,
      pdp.design?.category
    );

    return {
      designId: pdp.designId,
      position,
      createdAt: pdp.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: pdp.updatedAt?.toISOString() || new Date().toISOString()
    };
  });
}

/**
 * Extract dimensions from Cloudinary URL patterns
 */
function extractDimensionsFromCloudinaryUrl(url: string): { width: number; height: number } | null {
  // Try multiple Cloudinary URL patterns
  const patterns = [
    /\/w_(\d+),h_(\d+)/,
    /\/w_(\d+)\/h_(\d+)/,
    /\/w_(\d+)_h_(\d+)/,
    /\/w_(\d+),ar_\d+:\d+,c_fill,g_auto,h_(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        width: parseInt(match[1]),
        height: parseInt(match[2])
      };
    }
  }

  return null;
}

/**
 * Estimate design dimensions based on category
 */
function estimateDimensionsByCategory(category: string): { width: number; height: number } {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('logo')) {
    return { width: 512, height: 512 };
  }
  
  if (lowerCategory.includes('illustration')) {
    return { width: 800, height: 600 };
  }
  
  if (lowerCategory.includes('text') || lowerCategory.includes('quote')) {
    return { width: 600, height: 200 };
  }
  
  // Default dimensions
  return { width: 600, height: 600 };
}