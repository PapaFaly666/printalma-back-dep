import axios, { AxiosInstance } from 'axios';

export interface DesignPosition {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  constraints?: {
    adaptive?: boolean;
    [key: string]: any;
  };
}

/**
 * Service HTTP pré-configuré pour communiquer avec le backend (port 3000).
 * – `withCredentials: true` transmet automatiquement le cookie `auth_token`.
 */
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Récupère la position d'un design pour un produit vendeur.
 */
export async function getDesignPosition(
  vendorProductId: number,
  designId: number
): Promise<DesignPosition | null> {
  const { data } = await api.get(
    `/vendor-products/${vendorProductId}/designs/${designId}/position/direct`
  );
  return data?.data ?? null;
}

/**
 * Sauvegarde / upsert la position d'un design pour un produit vendeur.
 */
export async function saveDesignPosition(
  vendorProductId: number,
  designId: number,
  position: DesignPosition
): Promise<void> {
  await api.put(
    `/vendor-products/${vendorProductId}/designs/${designId}/position/direct`,
    position
  );
}

/**
 * Exemple d'utilisation :
 *
 * const vpId  = resolveVendorProductId(product, vendorProducts);
 * const desId = resolveVendorDesignId(design, vendorDesigns);
 * if (vpId && desId) {
 *   const pos = await getDesignPosition(vpId, desId);
 *   // ... afficher le design
 * }
 */ 
 
 
 
 