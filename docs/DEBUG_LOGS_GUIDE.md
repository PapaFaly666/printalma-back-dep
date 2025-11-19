# Guide de Debug - Logs Backend

## Comment analyser les logs

Après avoir redémarré le backend avec les dernières modifications, vous verrez des logs détaillés.

---

## Logs à surveiller lors d'une sauvegarde

### 1. Réception au contrôleur

```
📥 Received customization request:
  - productId: 5
  - colorVariationId: 13
  - viewId: 13
  - designElements: 1 elements          ← Doit être > 0
  - designElements type: object
  - First element: {"id":"element-...
```

**✅ Si vous voyez `1 elements`**: Les données arrivent correctement au contrôleur.

**❌ Si vous voyez `0 elements` ou `NOT AN ARRAY`**: Le problème est dans le frontend ou dans le body parser.

---

### 2. Réception au service

```
📥 DTO reçu dans service:
  - designElements type: object
  - designElements isArray: true
  - designElements length: 1            ← Doit être > 0
  - Premier élément: {"id":"element-...
```

**✅ Si `length: 1`**: Le DTO passe correctement les données.

**❌ Si `length: 0`**: Le DTO ou le ValidationPipe transforme/supprime les données.

---

### 3. Données à sauvegarder

```
📦 Data to save:
  - designElements count: 1             ← Doit être > 0
  - First element keys: id, type, x, y, width, height, rotation, zIndex...
```

**✅ Si `count: 1` avec toutes les clés**: Les données sont prêtes pour Prisma.

**❌ Si `count: 0`**: Les données sont perdues dans la préparation.

---

### 4. Après sauvegarde Prisma

```
[Nest] LOG [CustomizationService] Mise à jour personnalisation existante: 31

✅ Updated draft 31:
  - designElements in DB: [{"id":"element-1763495036578-88fw6uiz5","type":"image",...}]
  - Length: 1                            ← CRITIQUE: Doit être > 0
```

**✅ Si vous voyez le JSON complet et `Length: 1`**: Prisma a sauvegardé correctement!

**❌ Si vous voyez `[]` ou `[[]]` ou `Length: 0`**: Prisma a sauvegardé des données vides!

---

## Scénarios et diagnostics

### Scénario 1: Données perdues au contrôleur

```
📥 Received customization request:
  - designElements: 0 elements
⚠️ designElements is empty or undefined!
```

**Diagnostic**: Le frontend n'envoie pas les données correctement.

**Action**: Vérifier le code frontend qui fait `fetch()` ou `axios.post()`.

---

### Scénario 2: Données perdues au service

```
📥 Received customization request:
  - designElements: 1 elements          ✅

📥 DTO reçu dans service:
  - designElements length: 0            ❌
```

**Diagnostic**: Le DTO ou le ValidationPipe supprime les données.

**Actions**:
1. Vérifier que le DTO n'a pas de `@Transform()` qui casse les données
2. Vérifier le `ValidationPipe` dans `main.ts` - `whitelist: true` peut causer des problèmes
3. Essayer de désactiver temporairement la validation:

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: false,  // Temporaire pour tester
  transform: true,
}));
```

---

### Scénario 3: Données perdues à la préparation

```
📥 DTO reçu dans service:
  - designElements length: 1            ✅

📦 Data to save:
  - designElements count: 0             ❌
```

**Diagnostic**: La préparation des données pour Prisma écrase ou transforme mal.

**Action**: Vérifier le code qui construit `updateData` et `createData` dans le service.

---

### Scénario 4: Données perdues par Prisma

```
📦 Data to save:
  - designElements count: 1             ✅
  - First element keys: id, type, ...

✅ Updated draft 31:
  - designElements in DB: []            ❌
  - Length: 0
```

**Diagnostic**: Prisma sauvegarde mal le champ JSON.

**Actions**:
1. Vérifier le schéma Prisma:
```prisma
model ProductCustomization {
  designElements Json @map("design_elements")  // Doit être Json, pas String!
}
```

2. Régénérer le client Prisma:
```bash
npx prisma generate
npx prisma migrate dev
```

3. Vérifier directement en base de données:
```sql
SELECT id, design_elements FROM product_customizations WHERE id = 31;
```

Si le champ est vide en BDD, le problème est Prisma ou le schéma.

---

### Scénario 5: Données sauvegardées mais mal relues

```
✅ Updated draft 31:
  - designElements in DB: [{"id":"element-..."}]
  - Length: 1                            ✅
```

Mais le frontend reçoit:
```javascript
designElements: []  // ❌
```

**Diagnostic**: Le problème est dans la sérialisation de la réponse HTTP.

**Actions**:
1. Vérifier le Network tab dans les DevTools:
   - Request body doit contenir les données
   - Response body doit aussi les contenir

2. Si la response ne contient pas les données, vérifier les intercepteurs NestJS ou les pipes de transformation.

---

## Commande pour voir les logs en temps réel

```bash
# Dans le terminal backend
npm run start:dev

# Ou avec logs plus détaillés
LOG_LEVEL=debug npm run start:dev
```

Puis effectuez une sauvegarde depuis le frontend et observez les logs.

---

## Vérification en base de données

### PostgreSQL

```sql
-- Voir la dernière personnalisation
SELECT
  id,
  product_id,
  design_elements,
  jsonb_array_length(design_elements) as element_count,
  created_at,
  updated_at
FROM product_customizations
ORDER BY updated_at DESC
LIMIT 1;
```

**Résultat attendu:**
```
id | product_id | design_elements                                    | element_count | created_at | updated_at
---+------------+----------------------------------------------------+---------------+------------+------------
31 | 5          | [{"id":"element-...","type":"image",...}]          | 1             | ...        | ...
```

**Si `element_count` est 0 ou NULL**: Prisma n'a pas sauvegardé les données.

---

## Checklist complète

Quand vous faites une sauvegarde, vérifiez dans l'ordre:

- [ ] Frontend envoie: `designElements: Array(1)` ✅
- [ ] Contrôleur reçoit: `designElements: 1 elements` ✅
- [ ] Service reçoit: `designElements length: 1` ✅
- [ ] Data prepared: `designElements count: 1` ✅
- [ ] Prisma saved: `Length: 1` avec le JSON complet ✅
- [ ] Frontend reçoit en réponse: `designElements: [{...}]` ✅

Si l'un de ces points échoue, vous savez exactement où est le problème.

---

## Test minimal

### 1. Créer un endpoint de test

Ajoutez dans `customization.controller.ts`:

```typescript
@Post('test-json')
async testJson(@Body() body: any) {
  console.log('Received body:', body);
  console.log('designElements:', body.designElements);

  // Sauvegarder directement sans DTO
  const result = await this.customizationService.testDirectSave(body);
  console.log('Saved result:', result);

  return result;
}
```

Dans `customization.service.ts`:

```typescript
async testDirectSave(data: any) {
  const result = await this.prisma.productCustomization.create({
    data: {
      productId: data.productId,
      colorVariationId: data.colorVariationId,
      viewId: data.viewId,
      designElements: data.designElements as any,
      sessionId: data.sessionId || 'test',
      status: 'draft'
    }
  });

  console.log('Direct save result:', {
    id: result.id,
    designElements: result.designElements,
    length: Array.isArray(result.designElements) ? result.designElements.length : 'N/A'
  });

  return result;
}
```

### 2. Tester avec cURL

```bash
curl -X POST http://localhost:3000/api/customizations/test-json \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 5,
    "colorVariationId": 13,
    "viewId": 13,
    "designElements": [{"id":"test","type":"text","x":0.5,"y":0.5,"width":200,"height":50,"rotation":0,"zIndex":0,"text":"Test","fontSize":24,"baseFontSize":24,"baseWidth":200,"fontFamily":"Arial","color":"#000000","fontWeight":"normal","fontStyle":"normal","textDecoration":"none","textAlign":"center","curve":0}]
  }'
```

Si ce test fonctionne, le problème est dans le DTO/validation. Si ce test échoue, le problème est Prisma ou le schéma.

---

## Support

Partagez les logs complets si le problème persiste:
1. Logs backend (tout ce qui apparaît avec 📥, 📦, ✅)
2. Screenshot du Network tab (Request + Response)
3. Résultat de la requête SQL en base de données
