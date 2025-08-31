/*
 * Utility – Compute overlay rectangle for a delimitation on a displayed image.
 *
 * This helper is **frontend-oriented** and purely illustrative. You can copy it
 * in your React/Vue/Angular project without modification.
 */

export interface DelimitationPayload {
  x: number;               // Raw X (pixels on original image or %*referenceWidth)
  y: number;               // Raw Y
  width: number;           // Raw Width
  height: number;          // Raw Height
  referenceWidth: number;  // Native image width
  referenceHeight: number; // Native image height
}

export interface OverlayRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Compute the absolute rectangle (in viewport pixels) for an overlay.
 *
 * @param payload – Delimitation data returned by the backend.
 * @param imgRect – DOMRect of the <img> element (use getBoundingClientRect()).
 */
export function computeOverlayRect(
  payload: DelimitationPayload,
  imgRect: DOMRect,
): OverlayRect {
  const scaleX = imgRect.width / payload.referenceWidth;
  const scaleY = imgRect.height / payload.referenceHeight;

  return {
    left: imgRect.left + payload.x * scaleX,
    top: imgRect.top + payload.y * scaleY,
    width: payload.width * scaleX,
    height: payload.height * scaleY,
  };
}

/**
 * Same as computeOverlayRect but returns coordinates centred on the overlay.
 */
export function computeOverlayCenter(
  payload: DelimitationPayload,
  imgRect: DOMRect,
): { centerX: number; centerY: number; width: number; height: number } {
  const rect = computeOverlayRect(payload, imgRect);
  return {
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height,
  };
} 