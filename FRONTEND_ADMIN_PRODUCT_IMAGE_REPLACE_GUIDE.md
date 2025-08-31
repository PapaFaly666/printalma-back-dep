# Guide Frontend : Remplacement d’une Image Couleur d’un Produit Admin (Mockup)

Ce guide explique comment remplacer une image couleur existante d’un produit admin sans changer son id, en uploadant une nouvelle image et en mettant à jour l’objet image dans le PATCH. Le backend conservera l’id de l’image et remplacera seulement l’url/publicId.

---

## 1. Objectif
- Permettre à l’admin de remplacer l’image d’une couleur (ProductImage) sans changer son id en base.
- Le backend met à jour l’image existante (même id), seule l’image Cloudinary change.

---

## 2. Workflow côté frontend

1. **L’admin choisit une nouvelle image pour une couleur existante**
2. **Upload la nouvelle image** via l’endpoint dédié :
   ```js
   const { url, publicId } = await uploadColorImage(productId, colorId, file);
   // Endpoint : POST /products/:productId/colors/:colorId/images
   ```
3. **Dans le state**, remplace les champs `url` et `publicId` de l’image existante (même `id`) :
   ```js
   setColorVariations(prev =>
     prev.map(color =>
       color.id === colorId
         ? {
             ...color,
             images: color.images.map(img =>
               img.id === imageId
                 ? { ...img, url, publicId } // on remplace juste url/publicId
                 : img
             )
           }
         : color
     )
   );
   ```
4. **Lors du PATCH produit**, envoie l’image avec son `id` et les nouveaux champs :
   ```js
   images: [
     {
       id: 17, // id de l'image existante
       url: "nouvelle_url_cloudinary",
       publicId: "nouveau_publicId_cloudinary",
       view: "Front",
       delimitations: [...]
     }
   ]
   ```
5. **Le backend** mettra à jour l’image existante (même id), seule l’image Cloudinary sera remplacée.

---

## 3. Exemple de fonction d’upload et de mapping

```js
async function handleReplaceImage(productId, colorId, imageId, file) {
  // 1. Upload la nouvelle image
  const { url, publicId } = await uploadColorImage(productId, colorId, file);
  // 2. Mets à jour l’image dans le state
  setColorVariations(prev =>
    prev.map(color =>
      color.id === colorId
        ? {
            ...color,
            images: color.images.map(img =>
              img.id === imageId ? { ...img, url, publicId } : img
            )
          }
        : color
    )
  );
}
```

---

## 4. À retenir
- **Toujours conserver l’id de l’image** lors du remplacement
- **Seuls les champs `url` et `publicId` changent**
- **Le backend mettra à jour l’image existante, sans créer de doublon**

---

## 5. Ressources utiles
- [FRONTEND_ADMIN_PRODUCT_IMAGE_PAYLOAD_GUIDE.md](FRONTEND_ADMIN_PRODUCT_IMAGE_PAYLOAD_GUIDE.md)
- [FRONTEND_ADMIN_PRODUCT_UPDATE_FULL_GUIDE.md](FRONTEND_ADMIN_PRODUCT_UPDATE_FULL_GUIDE.md)

---

**Pour toute question ou exemple détaillé, demande-le !** 
 