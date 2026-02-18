# Guide Frontend - Gestion du Contenu Page d'Accueil

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Concepts clés](#concepts-clés)
3. [Flux de travail complet](#flux-de-travail-complet)
4. [API Endpoints](#api-endpoints)
5. [Implémentation React](#implémentation-react)
6. [Gestion des erreurs](#gestion-des-erreurs)
7. [Bonnes pratiques](#bonnes-pratiques)

---

## Vue d'ensemble

Le système permet de gérer le contenu de la page d'accueil avec **3 sections** contenant un **nombre fixe d'items** :

| Section | Nombre d'items | Ce qui peut être modifié |
|---------|---------------|-------------------------|
| Designs Exclusifs | **6** | Nom + Image uniquement |
| Influenceurs Partenaires | **5** | Nom + Image uniquement |
| Merchandising Musical | **6** | Nom + Image uniquement |

⚠️ **IMPORTANT:**
- **ON NE PEUT PAS ajouter ou supprimer des items**
- Le nombre d'items est **FIXE** (6 + 5 + 6 = 17 items total)
- Chaque item a un **ID unique** qui ne change jamais
- Pour "remplacer" un vendeur, on modifie son nom et son image

---

## Concepts clés

### 1. IDs sont IMMUABLES

Chaque item a un ID unique (ex: `cmlasw4gb0000t86vz8n8g9kd`) qui:
- **Ne change jamais**
- **Est généré par le backend**
- **Doit être récupéré via GET /admin/content**
- **Doit être renvoyé tel quel lors de la mise à jour**

❌ **NE JAMAIS générer d'IDs côté frontend**
✅ **TOUJOURS utiliser les IDs reçus du backend**

### 2. Les images doivent être uploadées via Cloudinary

❌ **NE PAS utiliser:**
- URLs relatives (`/image.png`)
- URLs locales (`http://localhost:3000/...`)
- Data URLs (`data:image/png;base64,...`)

✅ **TOUJOURS utiliser:**
- L'URL retournée par `POST /admin/content/upload`

### 3. Workflow obligatoire

```
1. GET /admin/content → Récupérer les IDs existants
   ↓
2. Modifier nom/image (conserver les IDs)
   ↓
3. PUT /admin/content → Sauvegarder avec les MÊMES IDs
```

---

## Flux de travail complet

### Étape 1: Chargement initial (OBLIGATOIRE)

```
Frontend → GET /api/admin/content
          ↓
Backend → Retourne 17 items avec leurs IDs
          ↓
Frontend → Stocke le contenu avec les IDs
```

### Étape 2: Modification par l'utilisateur

```
Admin → Modifie le nom d'un item
      ↓
Admin → Clique sur "Changer l'image"
      ↓
Frontend → POST /api/admin/content/upload
          ↓
Backend → Retourne l'URL Cloudinary
          ↓
Frontend → Met à jour l'URL dans le state
          ⚠️ L'ID reste inchangé
```

### Étape 3: Sauvegarde

```
Frontend → PUT /api/admin/content
          ↓
Backend → Vérifie que les IDs existent
          ↓
Backend → Met à jour nom + image pour chaque ID
          ↓
Backend → Retourne "Succès"
```

---

## API Endpoints

### Base URL
```
https://api.printalma.com/api
```

### 1. GET /admin/content - Récupérer le contenu (OBLIGATOIRE)

**Pourquoi c'est OBLIGATOIRE:**
- Récupère les 17 items avec leurs IDs
- Ces IDs DOIVENT être utilisés pour la mise à jour
- Sans cette étape, vous aurez l'erreur "Certains IDs sont invalides"

**Response:**
```json
{
  "designs": [
    {
      "id": "cmlasw4gb0000t86vz8n8g9kd",
      "name": "Pap Musa",
      "imageUrl": "https://res.cloudinary.com/...",
      "order": 0
    },
    // ... 5 autres
  ],
  "influencers": [
    {
      "id": "cmlasw4gb0001t86vir6rz75j",
      "name": "Ebu Jomlong",
      "imageUrl": "https://...",
      "order": 0
    },
    // ... 4 autres
  ],
  "merchandising": [
    {
      "id": "cmlasw4gb0002t86v7afcbqhc",
      "name": "Bathie Drizzy",
      "imageUrl": "https://...",
      "order": 0
    },
    // ... 5 autres
  ]
}
```

### 2. POST /admin/content/upload - Upload d'image

**Query params:**
- `section`: `designs` | `influencers` | `merchandising`

**Request:** Multipart form-data
- `file`: Image (jpg, png, svg, webp, max 5MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/...",
    "publicId": "home_content/designers/abc123..."
  }
}
```

### 3. PUT /admin/content - Sauvegarder le contenu

**Request Body:**
```json
{
  "designs": [
    {
      "id": "cmlasw4gb0000t86vz8n8g9kd",
      "name": "Nouveau Nom",
      "imageUrl": "https://res.cloudinary.com/..."
    }
    // ... 6 items exactement
  ],
  "influencers": [
    // ... 5 items exactement
  ],
  "merchandising": [
    // ... 6 items exactement
  ]
}
```

**⚠️ Règles de validation:**
- Chaque item DOIT avoir un `id` valide
- Les IDs DOIVENT être ceux récupérés via GET
- Le nombre d'items DOIT être exact (6-5-6)
- Les URLs DOIVENT commencer par `http://` ou `https://`

**Erreurs possibles:**

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Certains IDs sont invalides` | IDs reçus != IDs en base | Faire GET d'abord |
| `Designs: 6 items requis` | Mauvais nombre d'items | Vérifier le count |
| `URL d'image invalide: /x_pap_musa.svg` | URL relative | Upload via Cloudinary |

---

## Implémentation React

### Hook personnalisé complet

```typescript
import { useState, useCallback, useEffect } from 'react';

interface ContentItem {
  id: string;
  name: string;
  imageUrl: string;
  order: number;
}

interface HomeContent {
  designs: ContentItem[];
  influencers: ContentItem[];
  merchandising: ContentItem[];
}

export const useHomeContentAdmin = (token: string) => {
  const [content, setContent] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⚠️ OBLIGATOIRE: Charger le contenu au montage
  useEffect(() => {
    loadContent();
  }, []);

  /**
   * Étape 1: Charger le contenu avec les IDs
   * ⚠️ Cette étape est OBLIGATOIRE avant toute modification
   */
  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📥 Chargement du contenu...');

      const response = await fetch('https://api.printalma.com/api/admin/content', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const data = await response.json();

      // Vérifier que nous avons bien 17 items
      const totalItems = data.designs.length + data.influencers.length + data.merchandising.length;
      if (totalItems !== 17) {
        console.warn(`⚠️ Nombre d'items inattendu: ${totalItems} (attendu: 17)`);
      }

      console.log('✅ Contenu chargé:', {
        designs: data.designs.length,
        influencers: data.influencers.length,
        merchandising: data.merchandising.length,
        sampleId: data.designs[0]?.id
      });

      setContent(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      console.error('❌ Erreur chargement:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Étape 2: Upload d'une image
   * Retourne l'URL Cloudinary à utiliser
   */
  const uploadImage = useCallback(async (
    file: File,
    section: 'designs' | 'influencers' | 'merchandising'
  ): Promise<string> => {
    setUploading(true);
    setError(null);

    try {
      // Validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Format non supporté. Utilisez JPG, PNG, SVG ou WEBP');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux (max 5MB)');
      }

      console.log(`📤 Upload image: ${file.name} (${Math.round(file.size / 1024)}KB) pour ${section}`);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `https://api.printalma.com/api/admin/content/upload?section=${section}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur upload');
      }

      const result = await response.json();
      console.log('✅ Upload réussi:', result.data.url);

      return result.data.url;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur upload';
      setError(errorMsg);
      console.error('❌ Erreur upload:', errorMsg);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [token]);

  /**
   * Met à jour un champ d'un item
   * ⚠️ L'ID n'est jamais modifié
   */
  const updateItem = useCallback((
    section: keyof HomeContent,
    index: number,
    field: 'name' | 'imageUrl',
    value: string
  ) => {
    if (!content) {
      console.error('❌ Pas de contenu chargé');
      return;
    }

    const item = content[section][index];
    console.log(`📝 Mise à jour item:`, {
      section,
      index,
      field,
      oldValue: item[field],
      newValue: value,
      id: item.id // L'ID reste inchangé
    });

    setContent({
      ...content,
      [section]: content[section].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    });
  }, [content]);

  /**
   * Étape 3: Sauvegarder le contenu
   * ⚠️ Les IDs DOIVENT être ceux récupérés au chargement
   */
  const saveContent = useCallback(async () => {
    if (!content) {
      setError('Aucun contenu à sauvegarder');
      return;
    }

    // Validation avant envoi
    const errors = validateContent(content);
    if (errors.length > 0) {
      setError(errors.join('\n'));
      console.error('❌ Erreurs de validation:', errors);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💾 Sauvegarde du contenu...');

      // Logger les IDs pour debug
      const allIds = [
        ...content.designs.map(d => d.id),
        ...content.influencers.map(i => i.id),
        ...content.merchandising.map(m => m.id)
      ];
      console.log('📋 IDs envoyés:', allIds);

      const response = await fetch('https://api.printalma.com/api/admin/content', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(content)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur sauvegarde:', errorData);

        // Message détaillé pour les IDs invalides
        if (errorData.message?.includes('IDs sont invalides')) {
          throw new Error(
            errorData.message + '\n\n' +
            '💡 Solution: Assurez-vous d\'avoir appelé GET /admin/content avant de modifier.\n' +
            'Les IDs doivent être récupérés depuis le backend, pas générés côté frontend.'
          );
        }

        throw new Error(errorData.message || 'Erreur sauvegarde');
      }

      const result = await response.json();
      console.log('✅ Sauvegarde réussie!');

      // Recharger pour s'assurer que tout est sync
      await loadContent();

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur sauvegarde';
      setError(errorMsg);
      console.error('❌ Erreur:', errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [content, token, loadContent]);

  return {
    // État
    content,
    loading,
    uploading,
    error,

    // Actions
    setContent,
    loadContent,    // ⚠️ OBLIGATOIRE avant toute modification
    uploadImage,
    updateItem,
    saveContent,    // ⚠️ Utilise les IDs du contenu chargé
  };
};

/**
 * Validation du contenu avant envoi
 */
function validateContent(content: HomeContent): string[] {
  const errors: string[] = [];

  // Vérifier les quantités
  if (content.designs.length !== 6) {
    errors.push(`Designs: 6 items requis (actuel: ${content.designs.length})`);
  }
  if (content.influencers.length !== 5) {
    errors.push(`Influenceurs: 5 items requis (actuel: ${content.influencers.length})`);
  }
  if (content.merchandising.length !== 6) {
    errors.push(`Merchandising: 6 items requis (actuel: ${content.merchandising.length})`);
  }

  // Vérifier les IDs
  const allItems = [
    ...content.designs,
    ...content.influencers,
    ...content.merchandising,
  ];

  allItems.forEach((item, index) => {
    if (!item.id) {
      errors.push(`Item #${index + 1}: L'ID est manquant`);
    }
    if (!item.name?.trim()) {
      errors.push(`Item ${item.id}: Le nom est requis`);
    }
    if (!item.imageUrl || !/^https?:\/\//.test(item.imageUrl)) {
      errors.push(`Item ${item.id}: L'URL de l'image est invalide (doit commencer par http:// ou https://)`);
    }
  });

  return errors;
}
```

### Composant Admin complet

```typescript
import React, { useEffect } from 'react';
import { useHomeContentAdmin } from './useHomeContentAdmin';

export const HomeContentAdminPage: React.FC = () => {
  const token = localStorage.getItem('token') || '';
  const {
    content,
    loading,
    uploading,
    error,
    loadContent,
    uploadImage,
    updateItem,
    saveContent,
  } = useHomeContentAdmin(token);

  // ⚠️ Le contenu est chargé automatiquement au montage du composant
  useEffect(() => {
    console.log('🔄 Composant monté, chargement du contenu...');
    loadContent();
  }, []);

  const handleImageUpload = async (
    file: File,
    section: 'designs' | 'influencers' | 'merchandising',
    index: number
  ) => {
    try {
      const cloudinaryUrl = await uploadImage(file, section);
      updateItem(section, index, 'imageUrl', cloudinaryUrl);
    } catch (err) {
      alert('Erreur upload: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  const handleSave = async () => {
    try {
      await saveContent();
      alert('✅ Contenu sauvegardé avec succès!');
    } catch (err) {
      alert('❌ Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  if (loading && !content) {
    return <div className="loading">Chargement du contenu...</div>;
  }

  if (error && !content) {
    return (
      <div className="error">
        <h3>Erreur de chargement</h3>
        <p>{error}</p>
        <button onClick={loadContent}>Réessayer</button>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="admin-home-content">
      <div className="header">
        <h1>Gestion du Contenu Page d'Accueil</h1>
        <div className="info-banner">
          <p>⚠️ <strong>IMPORTANT:</strong></p>
          <ul>
            <li>Le contenu est chargé automatiquement avec les IDs du backend</li>
            <li>Ne modifiez JAMAIS les IDs manuellement</li>
            <li>Les images doivent être uploadées via le bouton dédié</li>
            <li>17 items au total (6 designs + 5 influenceurs + 6 merchandising)</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      <SectionEditor
        title="Designs Exclusifs (6 items)"
        items={content.designs}
        sectionKey="designs"
        color="rgb(241, 209, 45)"
        onItemUpdate={updateItem}
        onImageUpload={handleImageUpload}
        uploading={uploading}
      />

      <SectionEditor
        title="Influenceurs Partenaires (5 items)"
        items={content.influencers}
        sectionKey="influencers"
        color="rgb(20, 104, 154)"
        onItemUpdate={updateItem}
        onImageUpload={handleImageUpload}
        uploading={uploading}
      />

      <SectionEditor
        title="Merchandising Musical (6 items)"
        items={content.merchandising}
        sectionKey="merchandising"
        color="rgb(230, 29, 44)"
        onItemUpdate={updateItem}
        onImageUpload={handleImageUpload}
        uploading={uploading}
      />

      <div className="actions">
        <button
          onClick={handleSave}
          disabled={loading || uploading}
          className="save-button"
        >
          {loading || uploading ? 'Traitement...' : '💾 Sauvegarder tout le contenu'}
        </button>
      </div>
    </div>
  );
};

interface SectionEditorProps {
  title: string;
  items: ContentItem[];
  sectionKey: 'designs' | 'influencers' | 'merchandising';
  color: string;
  onItemUpdate: (section: keyof HomeContent, index: number, field: 'name' | 'imageUrl', value: string) => void;
  onImageUpload: (file: File, section: 'designs' | 'influencers' | 'merchandising', index: number) => Promise<void>;
  uploading: boolean;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  title,
  items,
  sectionKey,
  color,
  onItemUpdate,
  onImageUpload,
  uploading,
}) => {
  return (
    <div className="section-editor">
      <h3 style={{ color }}>{title}</h3>

      {items.map((item, index) => (
        <div key={item.id} className="item-card">
          <div className="item-header">
            <span className="item-number">#{index + 1}</span>
            <span className="item-id">ID: {item.id}</span>
          </div>

          <div className="item-preview">
            <img src={item.imageUrl} alt={item.name} />
          </div>

          <div className="item-fields">
            <div className="field">
              <label>Nom</label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => onItemUpdate(sectionKey, index, 'name', e.target.value)}
                placeholder="Nom de l'item"
                maxLength={100}
              />
            </div>

            <div className="field">
              <label>Image URL (Cloudinary)</label>
              <input
                type="text"
                value={item.imageUrl}
                readOnly
                className="readonly-url"
              />
            </div>

            <div className="field">
              <label>Changer l'image</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImageUpload(file, sectionKey, index);
                  }
                }}
                disabled={uploading}
              />
              <small>Max 5MB - JPG, PNG, SVG, WEBP</small>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Gestion des erreurs

### Erreur: "Certains IDs sont invalides"

**Cause:** Les IDs envoyés ne correspondent pas à ceux en base de données

**Solution:**
```typescript
// ❌ NE PAS FAIRE - Générer ses propres IDs
const content = {
  designs: [
    { id: 'custom-id-1', name: '...', imageUrl: '...' }  // ❌ ID invalide
  ]
};

// ✅ À FAIRE - Récupérer les IDs depuis le backend
useEffect(() => {
  loadContent(); // Charge les IDs depuis GET /admin/content
}, []);

// Ensuite modifier sans changer les IDs
updateItem('designs', 0, 'name', 'Nouveau nom'); // ID conservé
```

### Erreur: "Designs: 6 items requis"

**Cause:** Le nombre d'items ne correspond pas

**Vérification:**
```typescript
const totalItems = content.designs.length +
                    content.influencers.length +
                    content.merchandising.length;

if (totalItems !== 17) {
  console.error('Nombre d\'items incorrect:', {
    designs: content.designs.length,
    influencers: content.influencers.length,
    merchandising: content.merchandising.length
  });
}
```

### Erreur: "URL d'image invalide"

**Cause:** L'URL ne commence pas par `http://` ou `https://`

**Solution:**
```typescript
// ❌ URLs invalides
imageUrl: '/image.png'           // Relative
imageUrl: 'data:image/png;base64...' // Data URL

// ✅ URL valide (depuis POST /admin/content/upload)
imageUrl: 'https://res.cloudinary.com/dsxab4qnu/...'
```

---

## Bonnes pratiques

### 1. Structure du state

```typescript
// ✅ Bon - Conserver la structure complète
interface HomeContentState {
  designs: ContentItem[];    // 6 items
  influencers: ContentItem[]; // 5 items
  merchandising: ContentItem[]; // 6 items
}

// ❌ Mauvais - Aplatir ou modifier la structure
interface BadState {
  items: ContentItem[]; // Perte de l'information de section
}
```

### 2. Gestion des IDs

```typescript
// ✅ Bon - Les IDs sont immuables
const updateItemName = (index: number, newName: string) => {
  const item = content.designs[index];
  // L'ID est conservé
  const updated = { ...item, name: newName };
};

// ❌ Mauvais - Modifier l'ID
const updateItemName = (index: number, newName: string) => {
  const newId = `custom-${Date.now()}`; // ❌ Ne JAMAIS faire ça
  const updated = { id: newId, name: newName };
};
```

### 3. Upload d'images

```typescript
// ✅ Bon - Upload puis mettre à jour l'URL
const handleUpload = async (file: File, index: number) => {
  const cloudinaryUrl = await uploadImage(file, 'designs');
  updateItem('designs', index, 'imageUrl', cloudinaryUrl);
};

// ❌ Mauvais - Utiliser une URL locale
const handleUpload = (file: File, index: number) => {
  const localUrl = URL.createObjectURL(file); // ❌ URL locale temporaire
  updateItem('designs', index, 'imageUrl', localUrl);
};
```

### 4. Validation avant sauvegarde

```typescript
const handleSave = async () => {
  // Validation
  const errors = [];

  // Vérifier les quantités
  if (content.designs.length !== 6) errors.push('Designs: 6 requis');
  if (content.influencers.length !== 5) errors.push('Influenceurs: 5 requis');
  if (content.merchandising.length !== 6) errors.push('Merchandising: 6 requis');

  // Vérifier les IDs
  content.designs.forEach((item, i) => {
    if (!item.id) errors.push(`Design #${i + 1}: ID manquant`);
  });

  // Vérifier les URLs
  const urlPattern = /^https?:\/\//;
  [...content.designs, ...content.influencers, ...content.merchandising].forEach((item, i) => {
    if (!urlPattern.test(item.imageUrl)) {
      errors.push(`Item ${item.id}: URL invalide`);
    }
  });

  if (errors.length > 0) {
    alert('Erreurs:\n' + errors.join('\n'));
    return;
  }

  await saveContent();
};
```

---

## Checklist d'intégration

Avant de mettre en production, vérifiez:

- [ ] Le contenu est chargé automatiquement via GET /admin/content
- [ ] Les IDs ne sont JAMAIS modifiés côté frontend
- [ ] Les images sont uploadées via POST /admin/content/upload
- [ ] Le nombre d'items est vérifié avant envoi (6-5-6)
- [ ] Les URLs commencent par http:// ou https://
- [ ] Un message d'erreur clair est affiché en cas de problème
- [ ] Le state est rechargé après sauvegarde réussie

---

## Débogage

### Logger les IDs

```typescript
// Avant envoi
console.log('📋 IDs envoyés:', {
  designs: content.designs.map(d => d.id),
  influencers: content.influencers.map(i => i.id),
  merchandising: content.merchandising.map(m => m.id)
});

// Après réponse erreur
if (error.message?.includes('IDs sont invalides')) {
  console.log('❌ IDs invalides. IDs envoyés vs attendus:');
  console.log('Envoyés:', allIds);
  console.log('Trouvés:', existingItems.map(i => i.id));
}
```

### Vérifier la structure

```typescript
// Vérifier que tous les champs sont présents
const verifyItem = (item: any, index: number, section: string) => {
  if (!item.id) console.error(`❌ ${section}[${index}]: ID manquant`);
  if (!item.name) console.error(`❌ ${section}[${index}]: Nom manquant`);
  if (!item.imageUrl) console.error(`❌ ${section}[${index}]: imageUrl manquant`);
  if (!item.order && item.order !== 0) console.warn(`⚠️ ${section}[${index}]: order manquant`);
};

content.designs.forEach((item, i) => verifyItem(item, i, 'designs'));
content.influencers.forEach((item, i) => verifyItem(item, i, 'influencers'));
content.merchandising.forEach((item, i) => verifyItem(item, i, 'merchandising'));
```

---

**Version:** 3.0.0
**Date:** 2026-02-06
**Pour:** Équipe Frontend

## ⚠️ RAPPELS IMPORTANTS

1. **TOUJOURS charger le contenu via GET /admin/content au montage**
2. **NE JAMAIS modifier les IDs côté frontend**
3. **TOUJOURS uploader les images via POST /admin/content/upload**
4. **VÉRIFIER que le nombre d'items est exact (6-5-6) avant sauvegarde**
5. **LES URLs doivent commencer par http:// ou https://**
