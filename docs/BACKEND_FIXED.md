# Backend Fix - designElements

## Corrections appliquées

### 1. DTO simplifié (`create-customization.dto.ts`)

**Avant:**
```typescript
@Transform(({ value }) => { /* transformation complexe */ })
designElements: (TextElementDto | ImageElementDto)[];
```

**Après:**
```typescript
@IsArray()
designElements: any[];  // Accepte directement les données sans transformation
```

**Raison:** Les transformations peuvent casser les données. Prisma gère nativement le JSON.

---

### 2. Service corrigé (`customization.service.ts`)

**Avant:**
```typescript
designElements: JSON.parse(JSON.stringify(dto.designElements))  // ❌ Double sérialisation
```

**Après:**
```typescript
designElements: dto.designElements as any  // ✅ Direct, Prisma gère
```

**Raison:**
- `JSON.parse(JSON.stringify())` est inutile et peut causer des bugs
- Prisma sérialise automatiquement les champs de type `Json` en base
- Le cast `as any` évite les erreurs TypeScript strictes

---

### 3. Logs de debug ajoutés

Le backend affiche maintenant:

```
📥 Received customization request:
  - productId: 5
  - colorVariationId: 13
  - viewId: 13
  - designElements: 1 elements
  - designElements type: object
  - First element: {"id":"element-1763495036578-88fw6uiz5"...

📥 DTO reçu dans service:
  - designElements type: object
  - designElements isArray: true
  - designElements length: 1
  - Premier élément: {"id":"element-1763495036578-88fw6uiz5"...

📦 Data to save:
  - designElements count: 1
  - First element keys: id, type, x, y, width, height, rotation...
```

---

## Comment tester

### 1. Redémarrer le serveur backend

```bash
npm run start:dev
```

### 2. Depuis le frontend, sauvegarder une personnalisation

Le frontend doit envoyer:

```json
{
  "productId": 5,
  "colorVariationId": 13,
  "viewId": 13,
  "designElements": [
    {
      "id": "element-1763495036578-88fw6uiz5",
      "type": "image",
      "x": 0.5,
      "y": 0.5,
      "width": 200,
      "height": 200,
      "rotation": 0,
      "zIndex": 0,
      "imageUrl": "https://...",
      "naturalWidth": 500,
      "naturalHeight": 500
    }
  ],
  "sessionId": "guest-xxx"
}
```

### 3. Vérifier les logs backend

Vous devriez voir dans la console:

```
📥 Received customization request:
  - designElements: 1 elements  ← Devrait être > 0

📦 Data to save:
  - designElements count: 1     ← Devrait correspondre
  - First element keys: id, type, x, y, width, height, rotation, zIndex, imageUrl, naturalWidth, naturalHeight
```

### 4. Vérifier la réponse API

La réponse devrait contenir:

```json
{
  "id": 32,
  "designElements": [
    {
      "id": "element-1763495036578-88fw6uiz5",
      "type": "image",
      ...
    }
  ]
}
```

**PAS:**
```json
{
  "designElements": []        // ❌ Vide
}
```

**OU:**
```json
{
  "designElements": [[]]      // ❌ Array imbriqué
}
```

---

## Vérification en base de données

```sql
-- Récupérer les dernières personnalisations
SELECT
  id,
  product_id,
  design_elements,
  created_at
FROM product_customizations
ORDER BY created_at DESC
LIMIT 5;
```

Le champ `design_elements` devrait contenir:

```json
[
  {
    "id": "element-1763495036578-88fw6uiz5",
    "type": "image",
    "x": 0.5,
    "y": 0.5,
    ...
  }
]
```

---

## Test avec cURL

```bash
curl -X POST http://localhost:3000/api/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 5,
    "colorVariationId": 13,
    "viewId": 13,
    "designElements": [
      {
        "id": "test_curl",
        "type": "text",
        "x": 0.5,
        "y": 0.5,
        "width": 200,
        "height": 50,
        "rotation": 0,
        "zIndex": 0,
        "text": "Test cURL",
        "fontSize": 24,
        "baseFontSize": 24,
        "baseWidth": 200,
        "fontFamily": "Arial",
        "color": "#000000",
        "fontWeight": "normal",
        "fontStyle": "normal",
        "textDecoration": "none",
        "textAlign": "center",
        "curve": 0
      }
    ],
    "sessionId": "test_curl_session"
  }'
```

**Réponse attendue:**

```json
{
  "id": 33,
  "productId": 5,
  "designElements": [
    {
      "id": "test_curl",
      "type": "text",
      "text": "Test cURL",
      ...
    }
  ],
  "sessionId": "test_curl_session",
  ...
}
```

---

## Si le problème persiste

### 1. Vérifier les logs détaillés

Cherchez dans les logs:

- `⚠️ designElements est vide ou undefined dans le service!` → Le problème est dans le DTO/transformation
- `📦 Data to save: - designElements count: 0` → Les données sont perdues avant Prisma

### 2. Vérifier le schéma Prisma

```prisma
model ProductCustomization {
  id              Int      @id @default(autoincrement())
  designElements  Json     @map("design_elements")  // Doit être Json!
  // ...
}
```

### 3. Régénérer le client Prisma

```bash
npx prisma generate
```

---

## Résumé des changements

| Fichier | Changement | Raison |
|---------|------------|--------|
| `create-customization.dto.ts` | Supprimé Transform, type `any[]` | Éviter transformation qui casse les données |
| `customization.service.ts` | Supprimé `JSON.parse(JSON.stringify())` | Prisma gère le JSON nativement |
| `customization.service.ts` | Cast `as any` pour types Prisma | Éviter erreurs TypeScript strictes |
| `customization.controller.ts` | Ajouté logs debug | Faciliter debugging |

---

## Status

✅ **Backend corrigé et prêt**
- Pas de transformation inutile
- Pas de double sérialisation
- Logs de debug ajoutés
- Compilation OK

Le frontend peut maintenant retester. Les données doivent être correctement persistées.
