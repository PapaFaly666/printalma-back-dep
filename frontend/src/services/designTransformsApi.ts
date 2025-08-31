import axios, { AxiosInstance } from 'axios';

export interface RawTransforms {
  [index: string]: {
    x: number;
    y: number;
    scale?: number;
    rotation?: number;
  };
}

export interface SaveTransformsPayload {
  productId: number;
  designUrl: string;
  transforms: RawTransforms;
  lastModified?: number;
}

export interface LoadTransformsResponse {
  success: boolean;
  data: {
    productId: number;
    designUrl: string;
    transforms: RawTransforms;
    lastModified: number;
  } | null;
}

/**
 * Axios instance configured for the backend running on localhost:3004.
 * Using `withCredentials` so that the `auth_token` cookie (if any) is sent automatically.
 */
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3004',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * POST /vendor/design-transforms/save
 * Sauvegarde les transformations d'un design pour un produit vendeur.
 */
export async function saveDesignTransforms(payload: SaveTransformsPayload) {
  await api.post('/vendor/design-transforms/save', payload);
}

/**
 * GET /vendor/design-transforms/:productId?designUrl=...
 * Récupère les transformations enregistrées pour un produit + design.
 */
export async function loadDesignTransforms(
  productId: number,
  designUrl: string
): Promise<RawTransforms | null> {
  const { data } = await api.get<LoadTransformsResponse>(
    `/vendor/design-transforms/${productId}`,
    { params: { designUrl } }
  );

  return data?.data?.transforms ?? null;
} 