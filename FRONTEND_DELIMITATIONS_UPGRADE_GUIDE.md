# 📝 Guide Frontend – Mise à niveau du système de délimitations

> Version : 1.0 – 2025-05-21  
> Auteur : Équipe Backend PrintAlma

---

## 1️⃣ Contexte

Le backend stocke désormais **les dimensions de référence** (`referenceWidth`, `referenceHeight`) pour chaque délilmitation.  
Objectif : permettre au front de calculer l'échelle exacte entre la taille d'affichage et la taille native de l'image afin d'afficher des zones parfaitement alignées.

---

## 2️⃣ Récapitulatif des changements API

| Endpoint | Avant | Maintenant |
|----------|-------|------------|
| `POST /delimitations` | Champs `x,y,width,height,name,coordinateType` | Ajout **obligatoire** de `referenceWidth`, `referenceHeight` quand `coordinateType` vaut `PIXEL` (ou `ABSOLUTE`). |
| `GET /delimitations/image/:id` | Renvoyait les champs de base | Renvoie **toujours** `referenceWidth`, `referenceHeight` si disponibles.  
`coordinateType` peut valoir `PERCENTAGE` ou `PIXEL` (‼️ plus `ABSOLUTE`, le backend le mappe automatiquement). |
| `PUT /delimitations/:id` | — | Même contrat que le **POST**. Validation identique. |

### Exemple de création (PIXEL)
```jsonc
POST /delimitations
{
  "productImageId": 123,
  "delimitation": {
    "x": 665,
    "y": 407,
    "width": 662,
    "height": 790,
    "name": "Zone logo",
    "coordinateType": "PIXEL",
    "referenceWidth": 2000,
    "referenceHeight": 1600
  }
}
```

### Exemple de lecture
```jsonc
GET /delimitations/image/123
{
  "success": true,
  "imageId": 123,
  "naturalWidth": 2000,
  "naturalHeight": 1600,
  "delimitations": [
    {
      "id": 221,
      "x": 665,
      "y": 407,
      "width": 662,
      "height": 790,
      "name": "Zone logo",
      "coordinateType": "PIXEL",
      "referenceWidth": 2000,
      "referenceHeight": 1600
    }
  ],
  "count": 1
}
```

---

## 3️⃣ Règles de validation côté backend

1. **PIXEL** (`coordinateType = PIXEL` ou `ABSOLUTE`)  
   • `referenceWidth` & `referenceHeight` > 0 obligatoires.  
   • Aucune limite haute sur `x,y,width,height`.
2. **PERCENTAGE**  
   • Valeurs 0 ≤ `x,y` ≤ 100, 0 < `width,height` ≤ 100.  
   • `x + width ≤ 100` et `y + height ≤ 100`.

En cas de non-respect, l'API renvoie **400** avec un message explicite.

---

## 4️⃣ Calcul de l'échelle côté front

```ts
scaleX = displayedImageWidth  / referenceWidth;
scaleY = displayedImageHeight / referenceHeight;
```
*Si `referenceWidth/Height` sont absents (ancien enregistrement), affichez un ⚠️ dans l'UI et continuez avec l'ancienne approximation.*

---

## 5️⃣ Compatibilité ascendante

• Les anciennes délimitations déjà migrées vers le nouveau format **PERCENTAGE** restent inchangées.  
• Les enregistrements encore en pixels sont retournés avec `coordinateType = "PIXEL"` et leurs dimensions de référence pour un rendu parfait.  
• Aucun changement requis sur la logique existante quand `coordinateType = "PERCENTAGE"`.

---

## 6️⃣ Checklist d'intégration Frontend ✅

- [ ] Mettre à jour les types / interfaces (`Delimitation` → ajouter `referenceWidth`, `referenceHeight`).
- [ ] Adapter les formulaires de création / édition pour exiger ces champs en mode *PIXEL*.
- [ ] Utiliser les formules `scaleX/scaleY` ci-dessus dans `DelimitationPreviewImage`.
- [ ] Gérer le fallback (⚠️) quand les dimensions de référence sont absentes.
- [ ] Tester :  
  • Création en PIXEL  
  • Création en PERCENTAGE  
  • Lecture & affichage des deux types.

---

## 7️⃣ Questions fréquentes

**Q : Le backend retourne parfois `coordinateType = ABSOLUTE`, que faire ?**  
Aucune inquiétude, le backend le mappe désormais systématiquement en `PIXEL` dans les réponses. Si vous en voyez passer, contactez l'équipe backend.

**Q : Comment convertir une ancienne délimitation ?**  
Utilisez l'endpoint `/delimitations/:id/migrate` ou `/delimitations/migrate/product/:productId` selon le cas.

---

## 8️⃣ Contact

• Slack `#backend-api`  
• Email : dev@printalma.io  

Merci de mettre à jour votre code avant le **31/05/2025** pour garantir la meilleure expérience utilisateur ! 🙏 