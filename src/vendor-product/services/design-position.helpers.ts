// src/vendor-product/services/design-position.helpers.ts

export const normalizePosition = (position: any) => {
    const p = position || {};
    return {
      x: p.x ?? 0,
      y: p.y ?? 0,
      scale: p.scale ?? 1,
      rotation: p.rotation ?? 0,
      designWidth: p.designWidth ?? p.design_width ?? 100, // Accepte les deux formats pour la migration
      designHeight: p.designHeight ?? p.design_height ?? 100, // Accepte les deux formats pour la migration
      constraints: p.constraints ?? {},
    };
  }; 