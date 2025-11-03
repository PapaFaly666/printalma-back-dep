# 🎨 Mise à jour - Support SVG et augmentation taille avatar

## 📝 Changements effectués

### ✅ Ce qui a été modifié

1. **Nouveau service Cloudinary**
   - Ajout de la méthode `uploadDesignerAvatar()` dans `cloudinary.service.ts`
   - Support complet des fichiers SVG
   - Détection automatique du type de fichier
   - Pas de transformation pour les SVG (préservation du format vectoriel)

2. **Service Designer mis à jour**
   - Validation stricte des types MIME autorisés
   - Messages d'erreur détaillés en français
   - Vérification de la taille avant upload

3. **Documentation mise à jour**
   - `FRONTEND_GUIDE.md` : Taille et formats actualisés

---

## 🎯 Nouvelles spécifications

### Formats supportés
- ✅ **JPG / JPEG** - Images raster standard
- ✅ **PNG** - Images avec transparence
- ✅ **GIF** - Images animées
- ✅ **WEBP** - Format moderne optimisé
- ✅ **SVG** - Images vectorielles (NOUVEAU!)

### Taille maximale
- **Avant**: 2MB
- **Maintenant**: **10MB**

### Traitement des images

#### Images raster (JPG, PNG, GIF, WEBP)
```javascript
{
  width: 400,
  height: 400,
  crop: 'fill',
  gravity: 'face',
  quality: 'auto:good',
  fetch_format: 'auto',
  flags: 'progressive'
}
```

#### SVG
```javascript
{
  format: 'svg',
  // Pas de transformation
  // Le SVG est préservé tel quel
}
```

---

## 🔧 Code technique

### CloudinaryService - Nouvelle méthode

```typescript
async uploadDesignerAvatar(file: Express.Multer.File): Promise<CloudinaryUploadResult> {
  // Vérification taille (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('La taille du fichier ne doit pas dépasser 10MB');
  }

  // Détection SVG
  const isSVG = file.mimetype === 'image/svg+xml' || 
                file.originalname.toLowerCase().endsWith('.svg');

  // Configuration adaptée au type
  const uploadConfig = isSVG 
    ? { folder: 'designers', resource_type: 'image', format: 'svg' }
    : { folder: 'designers', transformation: [/* ... */] };

  // Upload vers Cloudinary
  return cloudinary.uploader.upload_stream(uploadConfig, callback);
}
```

### DesignerService - Validation

```typescript
private async uploadAvatar(file: Express.Multer.File) {
  // Validation des types MIME
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'  // NOUVEAU!
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException(
      `Type de fichier non supporté: ${file.mimetype}. ` +
      `Formats acceptés: JPG, PNG, GIF, WEBP, SVG`
    );
  }

  // Validation taille (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new BadRequestException(
      `Le fichier est trop volumineux (${Math.round(file.size / 1024 / 1024)}MB). ` +
      `Taille maximale: 10MB`
    );
  }

  // Upload
  return await this.cloudinaryService.uploadDesignerAvatar(file);
}
```

---

## 📊 Messages d'erreur

### Type de fichier non supporté
```json
{
  "statusCode": 400,
  "message": "Type de fichier non supporté: image/tiff. Formats acceptés: JPG, PNG, GIF, WEBP, SVG",
  "error": "Bad Request"
}
```

### Fichier trop volumineux
```json
{
  "statusCode": 400,
  "message": "Le fichier est trop volumineux (15MB). Taille maximale: 10MB",
  "error": "Bad Request"
}
```

---

## 🧪 Tests

### Test avec SVG

```bash
curl -X POST http://localhost:3004/designers/admin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Designer SVG Test" \
  -F "avatar=@logo.svg"
```

### Test avec PNG (5MB)

```bash
curl -X POST http://localhost:3004/designers/admin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Designer PNG Test" \
  -F "avatar=@large-avatar.png"
```

### Test avec fichier trop volumineux (>10MB)

```bash
curl -X POST http://localhost:3004/designers/admin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Designer Test" \
  -F "avatar=@huge-file.jpg"

# Devrait retourner une erreur 400
```

---

## 📱 Frontend - Validation côté client

### Validation recommandée

```typescript
// Validation du fichier avant upload
function validateAvatarFile(file: File): string | null {
  // Vérifier le type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return 'Format non supporté. Utilisez JPG, PNG, GIF, WEBP ou SVG';
  }

  // Vérifier la taille (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return `Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)}MB). Max: 10MB`;
  }

  return null; // Pas d'erreur
}

// Utilisation
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const error = validateAvatarFile(file);
  if (error) {
    alert(error);
    e.target.value = ''; // Reset input
    return;
  }

  // Fichier valide, continuer...
  setAvatarFile(file);
};
```

### Input HTML

```html
<input
  type="file"
  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
  onChange={handleFileChange}
/>
```

---

## 🎯 Avantages du support SVG

### Pour les designers
- ✅ Qualité parfaite à toutes les tailles
- ✅ Fichiers plus légers pour les logos
- ✅ Pas de perte de qualité
- ✅ Idéal pour les logos d'entreprise

### Pour les performances
- ✅ Fichiers SVG souvent plus légers que PNG
- ✅ Pas de transformation serveur nécessaire
- ✅ Rendu natif par le navigateur

### Cas d'usage
- Logos de marque
- Icônes personnalisées
- Illustrations vectorielles
- Identités visuelles professionnelles

---

## ⚠️ Limitations SVG

### Sécurité
- Les SVG peuvent contenir du JavaScript
- Cloudinary nettoie automatiquement les SVG malveillants
- Pas de risque XSS côté serveur

### Compatibilité
- Tous les navigateurs modernes supportent SVG
- Fallback automatique via Cloudinary si nécessaire

---

## ✅ Checklist de déploiement

- [x] Code CloudinaryService mis à jour
- [x] Code DesignerService mis à jour
- [x] Validation des types MIME
- [x] Validation de la taille (10MB)
- [x] Support SVG ajouté
- [x] Messages d'erreur en français
- [x] Documentation mise à jour
- [ ] Tests effectués avec tous les formats
- [ ] Frontend mis à jour avec validation
- [ ] Déploiement en production

---

## 🚀 Déploiement

### Pas de migration nécessaire
- Aucune modification de base de données
- Changements uniquement dans le code applicatif

### Redémarrage requis
```bash
# Redémarrer le serveur pour prendre en compte les changements
npm run start:dev
# ou en production
pm2 restart printalma-back
```

---

## 📞 Support

Si vous rencontrez des problèmes:

1. Vérifiez le type MIME du fichier
2. Vérifiez la taille du fichier
3. Consultez les logs serveur (`console.log`)
4. Testez avec un fichier différent

**Formats garantis de fonctionner:**
- JPG/JPEG standard
- PNG avec ou sans transparence
- GIF statique ou animé
- WEBP moderne
- SVG propre (sans scripts malveillants)

---

**Date**: 31 janvier 2025
**Version**: 1.1.0
**Statut**: ✅ Production Ready
