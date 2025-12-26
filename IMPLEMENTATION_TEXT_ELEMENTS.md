# Implémentation Backend - Éléments de Texte avec Formatage Avancé

## Vue d'ensemble

Ce document résume l'implémentation backend pour les éléments de texte personnalisés avec support complet de :
- ✅ Retours à la ligne (caractères `\n`)
- ✅ Ajustement automatique de la taille de police
- ✅ Toutes les propriétés de formatage de texte
- ✅ Caractères spéciaux (emojis, accents, symboles)

## Statut de l'implémentation

### ✅ Complété

1. **Modèle Prisma** - Le modèle `ProductCustomization` existe déjà avec :
   - Champ `designElements` de type `Json` pour stocker les éléments
   - Champ `elementsByView` de type `Json` pour le support multi-vues
   - Tous les champs nécessaires (userId, sessionId, productId, colorVariationId, viewId, etc.)

2. **DTOs de validation** - Fichiers dans `/src/customization/dto/` :
   - `TextElementDto` - Validation complète des éléments de texte
   - `ImageElementDto` - Validation des éléments d'image
   - `CreateCustomizationDto` - DTO principal pour créer/mettre à jour des customisations
   - `UpdateCustomizationDto` - DTO pour les mises à jour partielles

3. **Service de customisation** - `/src/customization/customization.service.ts` :
   - Méthode `upsertCustomization()` - Crée ou met à jour une customisation
   - Méthode `validateDesignElements()` - **AMÉLIORÉE** avec validations strictes conformes à la spec
   - Support complet des retours à la ligne sans transformation
   - Préservation des caractères spéciaux (UTF-8)

4. **Controller REST** - `/src/customization/customization.controller.ts` :
   - `POST /customizations` - Créer/mettre à jour une customisation
   - `GET /customizations/:id` - Récupérer par ID
   - `GET /customizations/user/me` - Customisations de l'utilisateur connecté
   - `GET /customizations/session/:sessionId` - Customisations des guests
   - `GET /customizations/product/:productId/draft` - Draft pour un produit
   - `POST /customizations/upload-image` - Upload d'image
   - `POST /customizations/migrate` - Migration guest → utilisateur

5. **Tests unitaires** - `/src/customization/customization.service.spec.ts` :
   - ✅ 15 tests qui passent tous
   - Tests de préservation des `\n`
   - Tests de caractères spéciaux
   - Tests de validation stricte

## Points clés de l'implémentation

### 1. Préservation des retours à la ligne

**Le service NE MODIFIE PAS le contenu du champ `text`**. Les caractères `\n` sont :
- Stockés tels quels dans PostgreSQL (champ JSON)
- Récupérés sans transformation
- Validés sans modification

```typescript
// Exemple de texte avec retours à la ligne
{
  "text": "Ligne 1\nLigne 2\nLigne 3"
}
```

### 2. Validation stricte selon la spécification

La méthode `validateDesignElements()` vérifie :

**Champs communs (tous types) :**
- `id` : string (obligatoire)
- `type` : "text" | "image" (obligatoire)
- `x`, `y` : number entre 0 et 1 (obligatoire)
- `width`, `height` : number > 0 (obligatoire)
- `rotation` : number (obligatoire)
- `zIndex` : number (obligatoire)

**Champs spécifiques au texte :**
- `text` : string (peut être vide, peut contenir `\n`)
- `fontSize` : number entre **10 et 100** ✅ (spec respectée)
- `fontFamily` : string non vide (obligatoire)
- `color` : format hex strict `#RRGGBB` (obligatoire)
- `fontWeight` : "normal" | "bold" (obligatoire)
- `fontStyle` : "normal" | "italic" (obligatoire)
- `textDecoration` : "none" | "underline" (obligatoire)
- `textAlign` : "left" | "center" | "right" (obligatoire)

### 3. Support des nombres décimaux pour fontSize

Le service accepte et stocke les valeurs décimales :
```typescript
{
  "fontSize": 16.5  // ✅ Accepté et stocké tel quel
}
```

### 4. Encodage UTF-8

PostgreSQL est configuré en UTF-8, ce qui permet de stocker :
- Emojis : `"J'adore ❤️ ce produit!"`
- Accents : `"Café français à été"`
- Symboles : `"Prix: 10€ (TVA 20%)"`

## Structure de la base de données

### Table `product_customizations`

```sql
CREATE TABLE product_customizations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(255),
  product_id INTEGER NOT NULL REFERENCES products(id),
  color_variation_id INTEGER NOT NULL,
  view_id INTEGER NOT NULL,
  design_elements JSONB NOT NULL,        -- Format simple (compatibilité)
  elements_by_view JSONB,                -- Format multi-vues
  size_selections JSONB,
  delimitations JSONB,
  preview_image_url VARCHAR(500),
  total_price DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  order_id INTEGER REFERENCES orders(id),
  vendor_product_id INTEGER REFERENCES vendor_products(id),
  timestamp BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX idx_customizations_product ON product_customizations(product_id);
CREATE INDEX idx_customizations_session ON product_customizations(session_id);
CREATE INDEX idx_customizations_user ON product_customizations(user_id);
CREATE INDEX idx_customizations_status ON product_customizations(status);
CREATE INDEX idx_customizations_design_elements ON product_customizations USING GIN (design_elements);
```

## API Endpoints

### POST /customizations

Créer ou mettre à jour une customisation.

**Request Body :**
```json
{
  "productId": 1,
  "colorVariationId": 5,
  "viewId": 12,
  "sessionId": "session-abc123",
  "designElements": [
    {
      "id": "text-1703521234567",
      "type": "text",
      "x": 0.5,
      "y": 0.3,
      "width": 200,
      "height": 80,
      "rotation": 0,
      "zIndex": 1,
      "text": "Ligne 1\nLigne 2\nLigne 3",
      "fontSize": 20,
      "fontFamily": "Arial",
      "color": "#000000",
      "fontWeight": "bold",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "center"
    }
  ]
}
```

**Response (201 Created) :**
```json
{
  "id": 123,
  "productId": 1,
  "colorVariationId": 5,
  "viewId": 12,
  "designElements": [...],
  "elementsByView": {
    "5-12": [...]
  },
  "sessionId": "session-abc123",
  "status": "draft",
  "createdAt": "2025-01-26T10:30:00Z",
  "updatedAt": "2025-01-26T10:30:00Z"
}
```

### GET /customizations/product/:productId/draft

Récupérer la customisation draft pour un produit.

**Query Parameters :**
- `sessionId` : ID de session (pour les guests)

**Response (200 OK) :**
```json
{
  "id": 123,
  "productId": 1,
  "designElements": [
    {
      "id": "text-1",
      "text": "Mon texte\navec retour à la ligne",
      "fontSize": 18,
      ...
    }
  ],
  ...
}
```

## Tests

### Exécuter les tests

```bash
# Tous les tests de customisation
npm test -- customization.service.spec.ts

# Mode watch
npm test -- customization.service.spec.ts --watch
```

### Couverture des tests

Les tests couvrent :
1. ✅ Préservation des `\n` simples
2. ✅ Préservation des `\n` multiples consécutifs
3. ✅ Gestion du texte vide
4. ✅ Texte contenant uniquement des `\n`
5. ✅ Tailles de police décimales
6. ✅ Emojis
7. ✅ Caractères accentués
8. ✅ Symboles spéciaux
9. ✅ Validation de fontSize (10-100)
10. ✅ Validation de color (format hex)
11. ✅ Validation de fontWeight
12. ✅ Validation de textAlign
13. ✅ Validation des coordonnées (0-1)
14. ✅ Validation des champs obligatoires

**Résultat :**
```
Test Suites: 1 passed
Tests:       15 passed
Time:        3.68 s
```

## Checklist de conformité à la spec

- [x] Table `product_customizations` avec champ JSONB `design_elements`
- [x] Validation des éléments de texte implémentée
- [x] Préservation des `\n` dans le champ `text` vérifiée
- [x] Encodage UTF-8 configuré dans la base de données
- [x] Endpoint POST `/customizations` fonctionnel
- [x] Endpoint GET `/customizations/product/:productId/draft` fonctionnel
- [x] Tests unitaires pour les retours à la ligne
- [x] Tests unitaires pour les caractères spéciaux
- [x] Validation stricte fontSize (10-100)
- [x] Validation stricte de toutes les propriétés de texte

## Exemples d'utilisation

### Créer une customisation avec texte multiligne

```typescript
const response = await fetch('/customizations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 1,
    colorVariationId: 5,
    viewId: 12,
    sessionId: 'guest-xyz',
    designElements: [
      {
        id: `text-${Date.now()}`,
        type: 'text',
        x: 0.5,
        y: 0.3,
        width: 250,
        height: 100,
        rotation: 0,
        zIndex: 1,
        text: "Bonjour\nComment allez-vous?\nBien merci!",
        fontSize: 22,
        fontFamily: 'Roboto',
        color: '#FF5733',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center'
      }
    ]
  })
});

const data = await response.json();
console.log('Customisation créée:', data.id);
```

### Récupérer une customisation draft

```typescript
const response = await fetch(
  '/customizations/product/1/draft?sessionId=guest-xyz'
);

const draft = await response.json();
if (draft) {
  console.log('Draft trouvé:', draft.id);
  console.log('Texte avec retours à la ligne:', draft.designElements[0].text);
}
```

## Notes importantes

1. **Ne jamais modifier le contenu de `text`** - Le service préserve les `\n` exactement comme reçus
2. **Ne jamais arrondir `fontSize`** - Les nombres décimaux sont acceptés
3. **Encodage UTF-8** - Tous les caractères spéciaux sont supportés
4. **Validation stricte** - Toutes les propriétés sont validées selon la spec
5. **Support multi-vues** - Le champ `elementsByView` permet de gérer plusieurs vues

## Fichiers modifiés/créés

### Modifiés
- `/src/customization/customization.service.ts` - Amélioration de la validation

### Créés
- `/src/customization/customization.service.spec.ts` - Tests unitaires complets
- `/IMPLEMENTATION_TEXT_ELEMENTS.md` - Cette documentation

### Existants (non modifiés)
- `/prisma/schema.prisma` - Modèle `ProductCustomization` déjà correct
- `/src/customization/customization.controller.ts` - Endpoints déjà implémentés
- `/src/customization/dto/create-customization.dto.ts` - DTOs déjà corrects
- `/src/customization/customization.module.ts` - Module déjà configuré

## Migration

Aucune migration nécessaire car :
- Le modèle Prisma était déjà correct
- Les champs JSON supportent déjà les `\n`
- L'encodage UTF-8 est déjà configuré

## Support

Pour toute question sur cette implémentation :
- Code backend : `/src/customization/`
- Tests : `/src/customization/customization.service.spec.ts`
- Schéma DB : `/prisma/schema.prisma` (ligne 944-980)
- Documentation spec : Fournie par le frontend

---

**Version:** 1.0
**Date d'implémentation:** 2025-01-26
**Status:** ✅ Complet et testé
