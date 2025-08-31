/**
 * Delimitation Converter Utility
 * Converts delimitations to consistent percentage format
 */

export interface StandardDelimitation {
  id?: number;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE';
}

export interface ImageWithDelimitations {
  id: number;
  url: string;
  view: string;
  naturalWidth: number;
  naturalHeight: number;
  delimitations: StandardDelimitation[];
}

/**
 * Convert pixel delimitations to percentage format
 */
export function convertToPercentage(
  pixelDelimitation: {
    id?: number;
    name?: string;
    x: number;
    y: number;
    width: number;
    height: number;
  },
  imageWidth: number,
  imageHeight: number
): StandardDelimitation {
  // Ensure image dimensions are valid
  if (imageWidth <= 0 || imageHeight <= 0) {
    console.warn('⚠️ [DELIMITATION-CONVERTER] Invalid image dimensions:', { imageWidth, imageHeight });
    return {
      ...pixelDelimitation,
      coordinateType: 'PERCENTAGE'
    };
  }

  return {
    id: pixelDelimitation.id,
    name: pixelDelimitation.name,
    x: Math.round((pixelDelimitation.x / imageWidth) * 100 * 100) / 100, // Round to 2 decimals
    y: Math.round((pixelDelimitation.y / imageHeight) * 100 * 100) / 100,
    width: Math.round((pixelDelimitation.width / imageWidth) * 100 * 100) / 100,
    height: Math.round((pixelDelimitation.height / imageHeight) * 100 * 100) / 100,
    coordinateType: 'PERCENTAGE'
  };
}

/**
 * Ensure all delimitations are in percentage format
 */
export function standardizeDelimitations(
  delimitations: any[],
  imageWidth: number,
  imageHeight: number
): StandardDelimitation[] {
  if (!delimitations || delimitations.length === 0) {
    return [];
  }

  return delimitations.map(delim => {
    // If already in percentage format, keep as is
    if (delim.coordinateType === 'PERCENTAGE') {
      return {
        id: delim.id,
        name: delim.name,
        x: delim.x,
        y: delim.y,
        width: delim.width,
        height: delim.height,
        coordinateType: 'PERCENTAGE'
      };
    }

    // Convert from pixels to percentage
    return convertToPercentage(delim, imageWidth, imageHeight);
  });
}

/**
 * Process image data to ensure consistent delimitation format
 */
export function processImageDelimitations(
  images: any[]
): ImageWithDelimitations[] {
  if (!images || images.length === 0) {
    return [];
  }

  return images.map(img => ({
    id: img.id,
    url: img.url,
    view: img.view,
    naturalWidth: img.naturalWidth || 800, // Default fallback
    naturalHeight: img.naturalHeight || 600, // Default fallback
    delimitations: standardizeDelimitations(
      img.delimitations || [],
      img.naturalWidth || 800,
      img.naturalHeight || 600
    )
  }));
}

/**
 * Validate delimitation coordinates
 */
export function validateDelimitation(delimitation: StandardDelimitation): boolean {
  // Check if coordinates are within valid percentage range (0-100)
  const isValidRange = (value: number) => value >= 0 && value <= 100;

  return (
    isValidRange(delimitation.x) &&
    isValidRange(delimitation.y) &&
    isValidRange(delimitation.width) &&
    isValidRange(delimitation.height) &&
    delimitation.coordinateType === 'PERCENTAGE'
  );
}

/**
 * Convert percentage back to pixels (for internal calculations)
 */
export function convertToPixels(
  percentageDelimitation: StandardDelimitation,
  imageWidth: number,
  imageHeight: number
): {
  id?: number;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    id: percentageDelimitation.id,
    name: percentageDelimitation.name,
    x: Math.round((percentageDelimitation.x / 100) * imageWidth),
    y: Math.round((percentageDelimitation.y / 100) * imageHeight),
    width: Math.round((percentageDelimitation.width / 100) * imageWidth),
    height: Math.round((percentageDelimitation.height / 100) * imageHeight)
  };
}