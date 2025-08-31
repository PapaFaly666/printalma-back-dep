# 🚀 Frontend Prompt – Intégration du Système de Transformation « V2 »

## TL;DR (copiez/collez à votre équipe 🚀)
> Nous disposons maintenant d’un **système de transformation** qui dissocie totalement le _positionnement de design_ (temporaire) de la **création réelle de produit**.  
> • **Mode TRANSFORMATION** : appels rapides, pas de validation, réponse `status: "TRANSFORMATION"`.  
> • **Mode PRODUIT RÉEL** : noms sérieux, réponse `status: "PUBLISHED" | "DRAFT" | "PENDING"`.  
> Utilisez les quatre endpoints :
> 1. `POST  /vendor/products`      ⟵ création (auto-détection du mode)  
> 2. `GET   /vendor/transformations`  ⟵ liste des transformations  
> 3. `POST  /vendor/transformations/:id/publish` ⟵ convertir en produit réel  
> 4. `DELETE /vendor/transformations/cleanup`    ⟵ nettoyage automatique (optionnel)

---

## 1️⃣ Règles de détection automatique
Le backend bascule automatiquement en `status = "TRANSFORMATION"` lorsque **au moins deux** conditions sont vraies :
1. **Nom auto-généré** : regex `/produit.*auto.*g.*/i` …  
2. **Position non–standard** : `x≠0 || y≠0 || scale≠1 || rotation≠0`.  
3. **Prix par défaut** : `25000` (centimes CFA)  
4. **Stock par défaut** : `100`

Si vous voulez forcer le mode transformation côté front (dev), mettez simplement un nom auto-généré **et** une position ≠ 0 ; le reste peut être vide.

## 2️⃣ Flow UI recommandé
1. **Éditeur de design**
   1.1 L’utilisateur déplace/redimensionne le design → collecter `{x,y,scale,rotation}`.  
   1.2 Envoyer `POST /vendor/products` avec **nom auto-généré** _(ex : « Produit auto-généré pour positionnement design »)_ + la position.  
   1.3 Recevoir :
```json
{
  "status": "TRANSFORMATION",
  "transformationId": 14,
  "positionId": "21_10"
}
```
   1.4 Stocker `transformationId` + `positionId` dans l’état local (ou Redux) pour continuer l’édition sans recharger.

2. **Preview produit**
   - Récupérer la **liste** `GET /vendor/transformations` pour afficher tous les prototypes en attente.

3. **Validation finale**
   - L’utilisateur saisit un **nom + description + prix réels** → appeler  
     `POST /vendor/transformations/:id/publish` avec le payload :
```jsonc
{
  "name": "T-shirt Dragon Noir Premium",
  "description": "Dragon vectoriel haute résolution.",
  "price": 40000,
  "stock": 30,
  "selectedColors": [{ "id": 3, "name": "Noir", "colorCode": "#000000" }],
  "selectedSizes" : [{ "id": 2, "sizeName": "M" }]
}
```
   - Réponse :
```json
{
  "status": "PUBLISHED",
  "productId": 122,
  "message": "Produit \"T-shirt Dragon Noir Premium\" créé avec succès"
}
```

## 3️⃣ Exemples de code (React + Axios)
### Hook `useSaveTransformation`
```tsx
import axios from 'axios';

export const useSaveTransformation = () => {
  const save = async ({ baseProductId, designId, position }) => {
    const res = await axios.post('/vendor/products', {
      baseProductId,
      designId,
      vendorName: 'Produit auto-généré pour positionnement design',
      vendorDescription: 'Temp',
      vendorPrice: 25000,
      vendorStock: 100,
      selectedColors: [],
      selectedSizes: [],
      productStructure: {/* …adminProduct minimal… */},
      designPosition: position
    }, { withCredentials: true });
    return res.data; // { status: 'TRANSFORMATION', transformationId, … }
  };
  return save;
};
```

### Hook `usePublishProduct`
```tsx
export const usePublishProduct = () => {
  const publish = async (transformationId, payload) => {
    const res = await axios.post(`/vendor/transformations/${transformationId}/publish`, payload, {
      withCredentials: true
    });
    return res.data; // { status: 'PUBLISHED', productId }
  };
  return publish;
};
```

## 4️⃣ Gestion des erreurs côté front
| Code | Scénario | Action front |
|------|----------|--------------|
| `400` | Données invalides (ex : nom auto-généré en mode produit réel) | Afficher message d’erreur directement sous le champ concerné |
| `403` | Design ou produit ne vous appartient pas | Redirection page 403 + toast |
| `409` | Doublon de transformation | Mettre à jour l’état avec la transformation existante |

## 5️⃣ UX / UI tips
1. **Autosave live** : déclenchez `saveTransformation` _onDragEnd_ ou _debounce(500 ms)_ pour un ressenti Figma-like.
2. **Badge « Prototype »** sur les cartes issues du mode transformation (`status: "TRANSFORMATION"`).
3. **CTA “Publier mon produit”** → ouvre modal avec les champs _nom, description, prix, stock_.
4. **Progress bar** : pendant `publishTransformation`, afficher _« Conversion en cours… »_ (P2002 = doublon déjà converti).
5. **Nettoyage auto** : planifiez un job cron front (optionnel) ou laissez le back : `DELETE /vendor/transformations/cleanup?olderThanDays=14`.

## 6️⃣ Cheatsheet des endpoints
```http
POST   /vendor/products                 # auto-détection TRANSFORMATION vs RÉEL
GET    /vendor/transformations          # liste des transformations
POST   /vendor/transformations/:id/publish   # conversion → produit
DELETE /vendor/transformations/cleanup?olderThanDays=14   # GC
```

## 7️⃣ Checklist Frontend « Go Live » ✅
- [ ] Création automatique de transformation lors du drag.  
- [ ] Liste “Mes prototypes” → `GET /vendor/transformations`.  
- [ ] Modal publication → `POST /vendor/transformations/:id/publish`.  
- [ ] Validation messages backend affichés proprement (toast + inline).  
- [ ] Clean UI : badge, état _PUBLISHED_ ↔ _TRANSFORMATION_.  
- [ ] Job de nettoyage (optionnel).

## 8️⃣ ⚠️ Erreurs fréquentes & comment les éviter
1. **Erreur 400 – « La description semble auto-générée »**  
   ↳ Vous avez envoyé un _nom/description_ auto-généré **sans position design** → le backend pense que c’est un produit réel, applique la validation stricte et rejette.  
   **Solution** :
   ```ts
   // Toujours inclure designPosition quand vous utilisez un nom auto-généré
   designPosition: { x: -10, y: 0, scale: 1, rotation: 0 }
   ```
   ou changez la description avant de publier.

2. **Prototype jamais converti**  
   ↳ Vous avez créé plusieurs transformations mais vous oubliez `publishTransformation` → vos produits restent en statut `TRANSFORMATION`.  
   **Solution** : montrer un badge/alerte “À publier”.

3. **Doublon de transformation (409)**  
   ↳ Vous sauvegardez en boucle la même position → le backend renvoie un 409.  
   **Solution** : si vous recevez `409`, rafraîchissez la liste ou stockez le `transformationId` déjà renvoyé.

---

## 9️⃣ Prompt ChatGPT pour générer un composant React (bonus) 🤖
> **Prompt prêt-à-coller** :
> ````markdown
> Crée un composant React TypeScript nommé `DesignTransformer` qui :
> 1. utilise Axios + SWR pour appeler `/vendor/products` en mode transformation (hook `useSaveTransformation`).
> 2. utilise `react-draggable` pour le déplacement et `react-zoom-pan-pinch` pour le scale/rotate, en sauvegardant la position toutes les 500 ms (debounce).
> 3. affiche la prévisualisation (mockup + design overlay) avec Canvas.
> 4. expose un bouton “Publier” qui ouvre un modal (Ant Design) recueillant nom/description/prix/stock puis appelle `/vendor/transformations/:id/publish` via hook `usePublishProduct`.
> 5. gère les erreurs 400/403/409 avec `antd` notification.
> 6. stylise le tout avec `styled-components` (support dark-mode).
> 7. accepte `baseProduct` & `design` en props et retourne `productId` une fois publié.
> ```
> Copiez ce prompt dans ChatGPT, il vous sortira un composant presque prêt à l’emploi 😉.
>
---

### Besoin d’aide ?
• Slack `#frontend-support`  
• `SOLUTION_TRANSFORMATION_SYSTEM_GUIDE.md`  
Happy coding ! 💙
