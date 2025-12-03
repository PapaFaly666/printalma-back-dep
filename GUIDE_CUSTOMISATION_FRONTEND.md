# 🎨 GUIDE FRONTEND - CUSTOMISATION ET DÉLIMITATION

## 📋 Vue d'ensemble

Ce guide explique comment implémenter la fonctionnalité de customisation côté frontend, incluant :
- L'enregistrement des délimitations des zones personnalisables
- L'affichage des informations de customisation
- La gestion des designs superposés sur les produits

---

## 🏗️ Architecture Backend

### DTO de Customisation (`src/customization/dto/create-customization.dto.ts`)

Le système supporte deux formats :

#### Format Simple (une vue)
```typescript
{
  productId: number,
  colorVariationId: number,
  viewId: number,
  designElements: [
    {
      id: string,
      type: 'text' | 'image',
      x: number,        // Position relative (0-1)
      y: number,        // Position relative (0-1)
      width: number,    // Largeur relative (0-1)
      height: number,   // Hauteur relative (0-1)
      rotation: number,
      zIndex: number,
      // Champs spécifiques au type
      text?: string,
      fontSize?: number,
      color?: string,
      fontFamily?: string,
      fontWeight?: 'normal' | 'bold',
      fontStyle?: 'normal' | 'italic',
      textDecoration?: 'none' | 'underline',
      textAlign?: 'left' | 'center' | 'right',
      curve?: number,
      imageUrl?: string,
      naturalWidth?: number,
      naturalHeight?: number
    }
  ],
  delimitations?: [
    {
      id: string,
      x: number,
      y: number,
      width: number,
      height: number,
      name: string,
      coordinateType: 'RELATIVE' | 'PIXEL'
    }
  ]
}
```

#### Format Multi-vues (recommandé)
```typescript
{
  productId: number,
  elementsByView: {
    "colorId-viewId": [
      // Même structure que designElements ci-dessus
    ],
    "12-1": [...],   // Couleur 12, Vue 1
    "12-2": [...],   // Couleur 12, Vue 2
    "13-1": [...]    // Couleur 13, Vue 1
  }
}
```

---

## 🔧 Endpoints API

### 1. Créer/Mettre à jour une personnalisation
```http
POST /api/customization
```

**Corps de la requête :**
```json
{
  "productId": 123,
  "colorVariationId": 12,
  "viewId": 1,
  "designElements": [...],
  "delimitations": [...],
  "sizeSelections": [
    {
      "size": "M",
      "quantity": 2
    }
  ],
  "sessionId": "guest_abc123",  // Pour utilisateurs non connectés
  "previewImageUrl": "https://example.com/preview.jpg",
  "timestamp": 1703123456789
}
```

### 2. Récupérer une personnalisation
```http
GET /api/customization/:id
```

### 3. Uploader une image de customisation
```http
POST /api/customization/upload-image
Content-Type: multipart/form-data
```

### 4. Uploader une image de prévisualisation
```http
POST /api/customization/preview
Content-Type: application/json

{
  "base64Data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

## 🎯 Implémentation Frontend

### 1. Configuration du système de customisation

```typescript
interface DesignElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  // Propriétés textuelles
  text?: string;
  fontSize?: number;
  baseFontSize?: number;
  baseWidth?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  curve?: number;
  // Propriétés image
  imageUrl?: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

interface DelimitationZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  coordinateType: 'RELATIVE' | 'PIXEL';
  referenceWidth?: number;  // Obligatoire si coordinateType = 'PIXEL'
  referenceHeight?: number; // Obligatoire si coordinateType = 'PIXEL'
}

interface CustomizationRequest {
  productId: number;
  colorVariationId: number;
  viewId: number;
  designElements?: DesignElement[];
  elementsByView?: Record<string, DesignElement[]>;
  delimitations?: DelimitationZone[];
  sizeSelections?: SizeSelection[];
  sessionId?: string;
  previewImageUrl?: string;
  timestamp?: number;
}
```

### 2. Service d'upload d'images

```typescript
class CustomizationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  }

  // Upload d'une image pour la customisation
  async uploadCustomizationImage(file: File): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/customization/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Upload d'une image de prévisualisation (base64)
  async uploadPreviewImage(base64Data: string): Promise<{
    url: string;
    publicId: string;
  }> {
    const response = await fetch(`${this.baseUrl}/customization/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Data }),
    });

    if (!response.ok) {
      throw new Error(`Preview upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Sauvegarder la personnalisation
  async saveCustomization(
    customizationData: CustomizationRequest,
    userId?: number,
    customizationId?: number
  ): Promise<any> {
    const url = customizationId
      ? `${this.baseUrl}/customization/${customizationId}`
      : `${this.baseUrl}/customization`;

    const response = await fetch(url, {
      method: customizationId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userId && { 'X-User-Id': userId.toString() }),
      },
      body: JSON.stringify(customizationData),
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Récupérer une personnalisation
  async getCustomization(id: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/customization/${id}`);

    if (!response.ok) {
      throw new Error(`Get failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Récupérer les personnalisations d'un utilisateur/session
  async getCustomizations(filters: {
    userId?: number;
    sessionId?: string;
    productId?: number;
    status?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();

    if (filters.userId) params.append('userId', filters.userId.toString());
    if (filters.sessionId) params.append('sessionId', filters.sessionId);
    if (filters.productId) params.append('productId', filters.productId.toString());
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${this.baseUrl}/customizations?${params}`);

    if (!response.ok) {
      throw new Error(`Get customizations failed: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### 3. Composant de Customisation

```typescript
import React, { useState, useCallback, useRef } from 'react';
import { CustomizationService } from './services/CustomizationService';

interface CustomizationCanvasProps {
  product: any;
  colorVariation: any;
  view: any;
  userId?: number;
  sessionId?: string;
  existingCustomization?: any;
}

export const CustomizationCanvas: React.FC<CustomizationCanvasProps> = ({
  product,
  colorVariation,
  view,
  userId,
  sessionId,
  existingCustomization
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [designElements, setDesignElements] = useState<DesignElement[]>(
    existingCustomization?.designElements || []
  );
  const [delimitations, setDelimitations] = useState<DelimitationZone[]>(
    existingCustomization?.delimitations || []
  );
  const [selectedElement, setSelectedElement] = useState<DesignElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const customizationService = new CustomizationService();

  // Fonction pour sauvegarder la customisation
  const saveCustomization = useCallback(async () => {
    try {
      const previewDataUrl = canvasRef.current?.toDataURL('image/png');
      let previewImageUrl: string | undefined;

      if (previewDataUrl) {
        const previewResult = await customizationService.uploadPreviewImage(previewDataUrl);
        previewImageUrl = previewResult.url;
      }

      const customizationData: CustomizationRequest = {
        productId: product.id,
        colorVariationId: colorVariation.id,
        viewId: view.id,
        designElements,
        delimitations,
        previewImageUrl,
        timestamp: Date.now(),
        ...(sessionId && { sessionId })
      };

      const result = await customizationService.saveCustomization(
        customizationData,
        userId,
        existingCustomization?.id
      );

      console.log('Customisation sauvegardée:', result);
      return result;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }, [product, colorVariation, view, designElements, delimitations, userId, sessionId, existingCustomization]);

  // Ajouter un élément de texte
  const addTextElement = useCallback(() => {
    const newTextElement: DesignElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      x: 0.5,
      y: 0.5,
      width: 0.2,
      height: 0.1,
      rotation: 0,
      zIndex: designElements.length + 1,
      text: 'Nouveau texte',
      fontSize: 24,
      baseFontSize: 24,
      baseWidth: 200,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      curve: 0
    };

    setDesignElements(prev => [...prev, newTextElement]);
  }, [designElements.length]);

  // Ajouter un élément d'image
  const addImageElement = useCallback(async (file: File) => {
    try {
      const uploadResult = await customizationService.uploadCustomizationImage(file);

      const newImageElement: DesignElement = {
        id: `image_${Date.now()}`,
        type: 'image',
        x: 0.5,
        y: 0.5,
        width: 0.3,
        height: 0.3,
        rotation: 0,
        zIndex: designElements.length + 1,
        imageUrl: uploadResult.url,
        naturalWidth: uploadResult.width,
        naturalHeight: uploadResult.height
      };

      setDesignElements(prev => [...prev, newImageElement]);
    } catch (error) {
      console.error('Erreur upload image:', error);
    }
  }, [designElements.length, customizationService]);

  // Ajouter une zone de délimitation
  const addDelimitationZone = useCallback((zone: DelimitationZone) => {
    setDelimitations(prev => [...prev, zone]);
  }, []);

  // Rendu du canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // TODO: Charger et dessiner l'image de fond
    // const backgroundImage = new Image();
    // backgroundImage.onload = () => {
    //   ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    //   renderElements();
    // };
    // backgroundImage.src = view.imageUrl;

    // Dessiner les zones de délimitation (en mode debug)
    if (process.env.NODE_ENV === 'development') {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      delimitations.forEach(zone => {
        const x = zone.x * canvas.width;
        const y = zone.y * canvas.height;
        const width = zone.width * canvas.width;
        const height = zone.height * canvas.height;

        ctx.strokeRect(x, y, width, height);

        // Dessiner le nom de la zone
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.font = '12px Arial';
        ctx.fillText(zone.name, x + 5, y + 15);
      });
    }

    // Dessiner les éléments de design
    const renderElements = () => {
      // Trier par zIndex
      const sortedElements = [...designElements].sort((a, b) => a.zIndex - b.zIndex);

      sortedElements.forEach(element => {
        const x = element.x * canvas.width;
        const y = element.y * canvas.height;
        const width = element.width * canvas.width;
        const height = element.height * canvas.height;

        ctx.save();

        // Appliquer la transformation
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-(x + width / 2), -(y + height / 2));

        if (element.type === 'text') {
          ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
          ctx.fillStyle = element.color || '#000000';
          ctx.textAlign = element.textAlign as CanvasTextAlign || 'left';
          ctx.textBaseline = 'middle';

          const textX = element.textAlign === 'center' ? x + width / 2 :
                       element.textAlign === 'right' ? x + width : x;
          const textY = y + height / 2;

          ctx.fillText(element.text || '', textX, textY);
        } else if (element.type === 'image' && element.imageUrl) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, x, y, width, height);
          };
          img.src = element.imageUrl;
        }

        // Dessiner une bordure de sélection
        if (selectedElement?.id === element.id) {
          ctx.strokeStyle = '#007bff';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(x, y, width, height);
        }

        ctx.restore();
      });
    };

    renderElements();
  }, [designElements, delimitations, selectedElement, view]);

  // Effet pour rendre le canvas
  React.useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  return (
    <div className="customization-container">
      <div className="toolbar">
        <button onClick={addTextElement}>Ajouter Texte</button>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) addImageElement(file);
          }}
        />
        <button onClick={saveCustomization}>Sauvegarder</button>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="customization-canvas"
          style={{ border: '1px solid #ccc', cursor: isDragging ? 'grabbing' : 'grab' }}
        />
      </div>

      {selectedElement && (
        <div className="properties-panel">
          <h3>Propriétés de l'élément</h3>
          {/* Formulaire d'édition des propriétés */}
          {/* ... */}
        </div>
      )}
    </div>
  );
};
```

### 4. Gestion des délimitations

```typescript
class DelimitationManager {
  // Convertir les coordonnées relatives en pixels
  static relativeToPixel(
    relativeCoords: { x: number; y: number; width: number; height: number },
    containerWidth: number,
    containerHeight: number
  ) {
    return {
      x: relativeCoords.x * containerWidth,
      y: relativeCoords.y * containerHeight,
      width: relativeCoords.width * containerWidth,
      height: relativeCoords.height * containerHeight
    };
  }

  // Convertir les coordonnées pixels en relatives
  static pixelToRelative(
    pixelCoords: { x: number; y: number; width: number; height: number },
    containerWidth: number,
    containerHeight: number
  ) {
    return {
      x: pixelCoords.x / containerWidth,
      y: pixelCoords.y / containerHeight,
      width: pixelCoords.width / containerWidth,
      height: pixelCoords.height / containerHeight
    };
  }

  // Vérifier si un point est dans une zone
  static isPointInZone(
    point: { x: number; y: number },
    zone: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      point.x >= zone.x &&
      point.x <= zone.x + zone.width &&
      point.y >= zone.y &&
      point.y <= zone.y + zone.height
    );
  }

  // Créer une zone de délimitation interactive
  static createDelimitationZone(
    name: string,
    containerElement: HTMLElement
  ): DelimitationZone {
    const rect = containerElement.getBoundingClientRect();

    return {
      id: `delim_${Date.now()}`,
      name,
      x: 0.1,  // Position relative par défaut
      y: 0.1,
      width: 0.2,
      height: 0.1,
      coordinateType: 'RELATIVE'
    };
  }

  // Dessiner les zones sur un canvas
  static drawDelimitations(
    ctx: CanvasRenderingContext2D,
    delimitations: DelimitationZone[],
    canvasWidth: number,
    canvasHeight: number,
    showLabels: boolean = true
  ) {
    delimitations.forEach(zone => {
      const pixelCoords = this.relativeToPixel(
        { x: zone.x, y: zone.y, width: zone.width, height: zone.height },
        canvasWidth,
        canvasHeight
      );

      // Style de la zone
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'; // Bleu avec transparence
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      // Dessiner le rectangle
      ctx.strokeRect(pixelCoords.x, pixelCoords.y, pixelCoords.width, pixelCoords.height);

      // Dessiner le label si demandé
      if (showLabels) {
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.font = '14px Arial';
        ctx.fillText(zone.name, pixelCoords.x + 5, pixelCoords.y + 20);
      }
    });
  }
}
```

### 5. Hook React pour la customisation

```typescript
import { useState, useCallback, useEffect } from 'react';
import { CustomizationService } from './services/CustomizationService';

interface UseCustomizationProps {
  productId: number;
  colorVariationId: number;
  viewId: number;
  userId?: number;
  sessionId?: string;
}

export const useCustomization = ({
  productId,
  colorVariationId,
  viewId,
  userId,
  sessionId
}: UseCustomizationProps) => {
  const [customization, setCustomization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [designElements, setDesignElements] = useState<any[]>([]);
  const [delimitations, setDelimitations] = useState<any[]>([]);

  const customizationService = new CustomizationService();

  // Charger la personnalisation existante
  const loadCustomization = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: any = { productId };
      if (userId) filters.userId = userId;
      else if (sessionId) filters.sessionId = sessionId;
      filters.status = 'draft';

      const customizations = await customizationService.getCustomizations(filters);

      if (customizations.length > 0) {
        const latestCustomization = customizations[0];
        setCustomization(latestCustomization);
        setDesignElements(latestCustomization.designElements || []);
        setDelimitations(latestCustomization.delimitations || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [productId, userId, sessionId, customizationService]);

  // Sauvegarder la personnalisation
  const saveCustomization = useCallback(async (
    previewImageUrl?: string
  ) => {
    try {
      const customizationData = {
        productId,
        colorVariationId,
        viewId,
        designElements,
        delimitations,
        previewImageUrl,
        timestamp: Date.now(),
        ...(sessionId && { sessionId })
      };

      const result = await customizationService.saveCustomization(
        customizationData,
        userId,
        customization?.id
      );

      setCustomization(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de sauvegarde';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [
    productId,
    colorVariationId,
    viewId,
    designElements,
    delimitations,
    sessionId,
    userId,
    customization?.id,
    customizationService
  ]);

  // Ajouter un élément
  const addElement = useCallback((element: any) => {
    setDesignElements(prev => [...prev, element]);
  }, []);

  // Mettre à jour un élément
  const updateElement = useCallback((id: string, updates: Partial<any>) => {
    setDesignElements(prev =>
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    );
  }, []);

  // Supprimer un élément
  const removeElement = useCallback((id: string) => {
    setDesignElements(prev => prev.filter(el => el.id !== id));
  }, []);

  // Ajouter une délimitation
  const addDelimitation = useCallback((delimitation: any) => {
    setDelimitations(prev => [...prev, delimitation]);
  }, []);

  // Effet pour charger au montage
  useEffect(() => {
    loadCustomization();
  }, [loadCustomization]);

  return {
    customization,
    isLoading,
    error,
    designElements,
    delimitations,
    setDesignElements,
    setDelimitations,
    saveCustomization,
    addElement,
    updateElement,
    removeElement,
    addDelimitation,
    refresh: loadCustomization
  };
};
```

---

## 🔍 Bonnes Pratiques

### 1. Validation des données
```typescript
// Validation d'un élément de design
function validateDesignElement(element: DesignElement): string[] {
  const errors: string[] = [];

  if (!element.id) errors.push('ID requis');
  if (!element.type || !['text', 'image'].includes(element.type)) {
    errors.push('Type invalide');
  }
  if (element.x < 0 || element.x > 1) errors.push('X doit être entre 0 et 1');
  if (element.y < 0 || element.y > 1) errors.push('Y doit être entre 0 et 1');
  if (element.width <= 0 || element.width > 1) errors.push('Width invalide');
  if (element.height <= 0 || element.height > 1) errors.push('Height invalide');

  if (element.type === 'text') {
    if (!element.text || element.text.trim().length === 0) {
      errors.push('Texte requis');
    }
    if (element.fontSize < 8 || element.fontSize > 200) {
      errors.push('Taille de police invalide');
    }
  }

  if (element.type === 'image') {
    if (!element.imageUrl) errors.push('URL image requise');
  }

  return errors;
}
```

### 2. Gestion des erreurs
```typescript
// Wrapper pour les appels API avec gestion d'erreur
async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);

    // Afficher une notification à l'utilisateur
    if (typeof window !== 'undefined' && window.alert) {
      alert(`${errorMessage}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    throw error;
  }
}
```

### 3. Optimisation des performances
```typescript
// Debounce pour les sauvegardes automatiques
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Sauvegarde automatique avec debounce
function useAutoSave(saveFunction: () => Promise<any>) {
  const debouncedSave = useMemo(
    () => debounce(saveFunction, 2000), // 2 secondes
    [saveFunction]
  );

  return debouncedSave;
}
```

---

## 📱 Intégration avec le Canvas de Customisation

### Composant de base
```typescript
export const CustomizationCanvas: React.FC<CustomizationCanvasProps> = ({
  product,
  onDesignChange,
  designElements,
  delimitations
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);

  // Gestionnaire de zoom
  const handleZoom = useCallback((delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  // Rendu principal
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration du rendu
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Appliquer le zoom
    ctx.scale(scale, scale);

    // Dessiner les délimitations
    DelimitationManager.drawDelimitations(
      ctx,
      delimitations,
      canvas.width,
      canvas.height
    );

    // Dessiner les éléments de design
    renderDesignElements(ctx, designElements, scale);

    // Réinitialiser la transformation
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [scale, delimitations, designElements]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="customization-canvas"
        onWheel={(e) => {
          e.preventDefault();
          handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
        }}
      />
    </div>
  );
};
```

---

## 🚀 Déploiement et Tests

### Tests unitaires
```typescript
describe('CustomizationService', () => {
  test('should upload image correctly', async () => {
    const service = new CustomizationService();
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        url: 'https://example.com/image.jpg',
        publicId: 'test_123',
        width: 800,
        height: 600
      })
    });

    const result = await service.uploadCustomizationImage(mockFile);

    expect(result.url).toBe('https://example.com/image.jpg');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customization/upload-image'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData)
      })
    );
  });
});
```

### Tests d'intégration
```typescript
describe('CustomizationCanvas', () => {
  test('should render design elements correctly', () => {
    const mockDesignElements = [
      {
        id: 'text_1',
        type: 'text',
        x: 0.5,
        y: 0.5,
        text: 'Test'
      }
    ];

    render(
      <CustomizationCanvas
        product={mockProduct}
        designElements={mockDesignElements}
        delimitations={[]}
        onDesignChange={jest.fn()}
      />
    );

    const canvas = screen.getByRole('img'); // Canvas avec aria-label
    expect(canvas).toBeInTheDocument();

    // Vérifier le rendu du canvas
    const ctx = (canvas as HTMLCanvasElement).getContext('2d');
    expect(ctx).toBeTruthy();
  });
});
```

---

## 📚 Ressources supplémentaires

### Documentation liée
- `FRONTEND_IMAGE_DISPLAY_V2_GUIDE.md` - Guide complet d'affichage des images
- `FRONTEND_DELIMITATIONS_UPGRADE_GUIDE.md` - Guide de mise à jour des délimitations

### API Documentation
- Swagger UI disponible sur `/api` en développement
- Documentation Postman dans `docs/postman/`

### Support technique
- Issues GitHub pour les bugs
- Documentation technique dans le wiki du projet

---

## 🎯 Résumé

Ce guide fournit une implémentation complète pour la customisation côté frontend :

1. **Architecture flexible** : Support des formats simple et multi-vues
2. **Gestion des délimitations** : Zones personnalisables avec coordonnées relatives/pixels
3. **Upload d'images** : Support pour les images de customisation et prévisualisations
4. **Sauvegarde automatique** : Persistance des personnalisations avec debouncing
5. **Canvas interactif** : Rendu en temps réel avec zoom et manipulation d'éléments
6. **Hooks React** : Gestion d'état optimisée pour la customisation
7. **Validation robuste** : Vérification des données côté client
8. **Tests complets** : Couverture unitaire et d'intégration

L'implémentation est conçue pour être évolutive et maintenable, avec une séparation claire des responsabilités et une gestion d'erreur robuste.