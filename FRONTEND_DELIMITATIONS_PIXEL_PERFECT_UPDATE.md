# 🖼️ Guide Frontend — Délimitations Pixel-Perfect (v2.2)

**Date :** 11 juin 2025  
**Backend API :** 2.2  
**Auteur :** Équipe Backend

---

## 1. Pourquoi ce changement ?
Lors de l’affichage d’une miniature, un simple calcul « % × largeur » génère parfois un léger décalage (≈ 2-3 px) par rapport à l’aperçu d’origine, car l’admin a dessiné la zone sur une image d’une taille différente.

Pour garantir un rendu exact quel que soit le redimensionnement, chaque délimitation porte désormais la taille **référence** de l’image sur laquelle elle a été créée :

* `referenceWidth`  – largeur en pixels
* `referenceHeight` – hauteur en pixels

Ces deux champs sont **toujours** renvoyés par l’API et **obligatoires** lorsque vous créez / éditez une zone.

---

## 2. Exemples de payloads
### 2.1 Récupération des zones d’une image
```jsonc
GET /api/delimitations/image/42
{
  "success": true,
  "imageId": 42,
  "naturalWidth": 2400,
  "naturalHeight": 3200,
  "delimitations": [
    {
      "id": 1,
      "x": 12.5,
      "y": 7,
      "width": 30,
      "height": 20,
      "rotation": 0,
      "coordinateType": "PERCENTAGE",
      "referenceWidth": 2400,
      "referenceHeight": 3200
    }
  ],
  "count": 1
}
```

### 2.2 Création / mise à jour
```jsonc
POST /api/delimitations
{
  "productImageId": 42,
  "delimitation": {
    "x": 15,
    "y": 20,
    "width": 40,
    "height": 25,
    "name": "Zone logo",
    "coordinateType": "PERCENTAGE",
    "referenceWidth": 1200,
    "referenceHeight": 1200
  }
}
```

---

## 3. Checklist d’intégration
1. **Toujours envoyer** `coordinateType = "PERCENTAGE"`.
2. **Toujours envoyer** `referenceWidth` & `referenceHeight` (> 0). Utilisez la taille du _canvas_ où l’admin trace la zone.
3. Avant envoi :
   * `0 ≤ x,y,width,height ≤ 100`
   * `x + width ≤ 100` et `y + height ≤ 100`
4. Lors de l’affichage, le calcul classique suffit : `(valuePct / 100) * displayedSize`.
   * Les champs de référence servent surtout à l’export PDF/print ou au recalcul exact hors miniature.
5. Anciennes zones : le backend les convertit automatiquement ; aucun correctif front requis.

---

## 4. Endpoints impactés
| Méthode | Route | Changement |
|---------|-------|------------|
| `GET` | `/api/delimitations/image/:imageId` | Chaque délimitation inclut `referenceWidth`/`referenceHeight`. |
| `POST` | `/api/delimitations` | Champs obligatoires à l’envoi. |
| `PUT` | `/api/delimitations/:id` | Même obligation en édition. |

---

## 5. FAQ rapide
**Q : Dois-je recalculer les positions avec `referenceWidth`/`Height` ?**  
**R :** Non pour un affichage courant ; oui si vous devez reproduire l’exact _canvas_ d’origine (export, règle, etc.).

**Q : Puis-je encore envoyer des pixels (`ABSOLUTE`) ?**  
**R :** Non. Toute tentative renvoie **400 Bad Request**.

---

> *Document généré – à distribuer à toute l’équipe Frontend.* 