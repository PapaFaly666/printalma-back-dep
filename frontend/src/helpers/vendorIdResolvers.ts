export interface VendorProductLite {
  id: number;
  baseProductId: number;
}

export interface VendorDesignLite {
  id: number;
  imageUrl: string;
}

/**
 * Résout le vrai vendorProductId à partir d'un objet produit issu du catalogue.
 * - Si l'ID fourni est déjà un vendorProduct.id appartenant au vendeur ➜ on le renvoie tel quel.
 * - Sinon on le considère comme baseProductId et on cherche le vendorProduct correspondant.
 * - Retourne `null` si aucune correspondance.
 */
export function resolveVendorProductId(
  product: { id: number; baseProductId?: number } | null | undefined,
  vendorProducts: VendorProductLite[] | null | undefined
): number | null {
  if (!product || !vendorProducts?.length) return null;

  // 1️⃣ L'ID est déjà un vendorProduct.id présent
  if (vendorProducts.some(vp => vp.id === product.id)) {
    return product.id;
  }

  // 2️⃣ L'ID représente peut-être un baseProductId
  const match = vendorProducts.find(vp => vp.baseProductId === product.id);
  if (match) return match.id;

  // 3️⃣ Dernier fallback : product.baseProductId présent
  if (product.baseProductId) {
    const match2 = vendorProducts.find(vp => vp.baseProductId === product.baseProductId);
    if (match2) return match2.id;
  }

  return null; // Échec ➜ le Debugger front prendra le relais
}

/**
 * Résout le vrai designId à utiliser.
 * - Si l'ID existe déjà pour le vendeur ➜ OK.
 * - Sinon on tente la correspondance via imageUrl (migration).
 * - Si le vendeur n'a qu'un design ➜ on le choisit.
 * Retourne `null` si aucune correspondance trouvée.
 */
export function resolveVendorDesignId(
  design: { id?: number; imageUrl?: string } | null | undefined,
  vendorDesigns: VendorDesignLite[] | null | undefined
): number | null {
  if (!vendorDesigns?.length) return null;

  // 1️⃣ ID valide
  if (design?.id && vendorDesigns.some(d => d.id === design.id)) {
    return design.id;
  }

  // 2️⃣ Correspondance imageUrl
  if (design?.imageUrl) {
    const found = vendorDesigns.find(d => d.imageUrl === design.imageUrl);
    if (found) return found.id;
  }

  // 3️⃣ Un seul design ➜ on le renvoie
  if (vendorDesigns.length === 1) {
    return vendorDesigns[0].id;
  }

  return null;
} 