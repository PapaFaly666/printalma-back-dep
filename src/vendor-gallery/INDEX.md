# 📚 Documentation - Système de Galerie Vendeur

Bienvenue dans la documentation du système de galerie vendeur PrintAlma.

---

## 📖 Guides disponibles

### 1. [README.md](./README.md) - Documentation technique complète
**Pour qui**: Développeurs Backend, Architectes

**Contenu**:
- ✅ Modèles de données (Prisma)
- ✅ Contraintes et validations
- ✅ Structure des dossiers
- ✅ Optimisations implémentées
- ✅ Sécurité
- ✅ Codes d'erreur
- ✅ Tests recommandés
- ✅ Maintenance

**Quand l'utiliser**: Pour comprendre l'architecture et l'implémentation backend

---

### 2. [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Référence complète des endpoints
**Pour qui**: Développeurs Frontend, Testeurs, Intégrateurs

**Contenu**:
- ✅ Liste exhaustive de tous les endpoints
- ✅ Paramètres de requête détaillés
- ✅ Exemples de réponses
- ✅ Codes HTTP
- ✅ Exemples cURL
- ✅ Configuration Postman

**Quand l'utiliser**: Pour connaître les URLs exactes et tester les API

---

### 3. [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) - Guide d'intégration Frontend
**Pour qui**: Développeurs Frontend (React, Next.js, Vue, Angular)

**Contenu**:
- ✅ Types TypeScript complets
- ✅ Service API client
- ✅ Hooks React personnalisés
- ✅ Composants React exemples
- ✅ Gestion des erreurs
- ✅ Bonnes pratiques
- ✅ Checklist d'intégration

**Quand l'utiliser**: Pour intégrer le système dans votre application frontend

---

### 4. [EXAMPLES.md](./EXAMPLES.md) - Exemples de requêtes
**Pour qui**: Tous développeurs

**Contenu**:
- ✅ Exemples cURL
- ✅ Exemples Postman
- ✅ Exemples JavaScript/TypeScript
- ✅ Exemples React/Next.js
- ✅ Collection Postman complète
- ✅ Exemples de réponses et erreurs

**Quand l'utiliser**: Pour tester rapidement et copier-coller du code

---

### 5. [GALLERY_IMPLEMENTATION_SUMMARY.md](../GALLERY_IMPLEMENTATION_SUMMARY.md) - Résumé de l'implémentation
**Pour qui**: Chefs de projet, Product Owners, Développeurs

**Contenu**:
- ✅ Vue d'ensemble de l'implémentation
- ✅ Fichiers créés
- ✅ Fonctionnalités implémentées
- ✅ Tests de build
- ✅ Prochaines étapes recommandées

**Quand l'utiliser**: Pour avoir une vision globale du projet

---

## 🚀 Quick Start

### Pour les développeurs Frontend

1. **Lire d'abord**: [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)
2. **Référence API**: [API_ENDPOINTS.md](./API_ENDPOINTS.md)
3. **Exemples**: [EXAMPLES.md](./EXAMPLES.md)

### Pour les développeurs Backend

1. **Architecture**: [README.md](./README.md)
2. **Résumé**: [GALLERY_IMPLEMENTATION_SUMMARY.md](../GALLERY_IMPLEMENTATION_SUMMARY.md)

### Pour tester rapidement

1. **Endpoints**: [API_ENDPOINTS.md](./API_ENDPOINTS.md)
2. **Exemples**: [EXAMPLES.md](./EXAMPLES.md)

---

## 🎯 Cas d'usage par rôle

### Développeur Frontend React/Next.js
```
1. Lire FRONTEND_INTEGRATION_GUIDE.md
2. Copier les types TypeScript
3. Copier le service API
4. Adapter les composants React à votre projet
5. Tester avec les exemples de EXAMPLES.md
```

### Développeur Mobile (React Native, Flutter)
```
1. Lire API_ENDPOINTS.md pour connaître les endpoints
2. Utiliser les types TypeScript comme référence
3. Adapter le service API à votre plateforme
4. Tester avec les exemples cURL de EXAMPLES.md
```

### Testeur QA
```
1. Lire API_ENDPOINTS.md
2. Importer la collection Postman de EXAMPLES.md
3. Tester tous les endpoints
4. Vérifier les codes d'erreur du README.md
```

### Product Owner / Chef de projet
```
1. Lire GALLERY_IMPLEMENTATION_SUMMARY.md
2. Consulter les fonctionnalités implémentées
3. Voir les prochaines étapes recommandées
```

---

## 📊 Structure du code source

```
src/vendor-gallery/
├── dto/                                    # Data Transfer Objects
│   ├── create-gallery.dto.ts              # DTO création
│   ├── update-gallery.dto.ts              # DTO mise à jour
│   ├── gallery-response.dto.ts            # DTO réponses
│   └── toggle-publish.dto.ts              # DTO publication
│
├── vendor-gallery.controller.ts           # Contrôleur vendeur
├── public-gallery.controller.ts           # Contrôleur public
├── vendor-gallery.service.ts              # Service métier
├── vendor-gallery.module.ts               # Module NestJS
│
└── Documentation/
    ├── README.md                          # Doc technique
    ├── API_ENDPOINTS.md                   # Référence API
    ├── FRONTEND_INTEGRATION_GUIDE.md      # Guide frontend
    ├── EXAMPLES.md                        # Exemples
    └── INDEX.md                           # Ce fichier
```

---

## 🔗 Liens utiles

### Documentation interactive
- **Swagger UI**: http://localhost:3000/api
- **Swagger JSON**: http://localhost:3000/api-json

### Endpoints principaux
- **Vendeur**: http://localhost:3000/vendor/galleries
- **Public**: http://localhost:3000/public/galleries

### Repository
- **Backend**: `/src/vendor-gallery/`
- **Migrations Prisma**: `/prisma/migrations/`
- **Schema Prisma**: `/prisma/schema.prisma`

---

## ❓ FAQ

### Q: Combien d'images par galerie ?
**R**: Exactement 5 images. Ni plus, ni moins.

### Q: Quels formats d'images sont acceptés ?
**R**: JPEG, PNG, WebP uniquement.

### Q: Quelle est la taille maximale par image ?
**R**: 5MB par image.

### Q: Les images sont-elles optimisées automatiquement ?
**R**: Oui, elles sont converties en WebP et optimisées via Cloudinary.

### Q: Peut-on publier une galerie avec moins de 5 images ?
**R**: Non, la validation empêche la publication si la galerie n'a pas exactement 5 images.

### Q: Les galeries supprimées sont-elles vraiment supprimées ?
**R**: C'est un soft delete. Le champ `deletedAt` est renseigné mais les données restent en base.

### Q: Où sont stockées les images ?
**R**: Sur Cloudinary dans le dossier `galleries/vendor_{vendorId}/`

### Q: Les endpoints publics nécessitent-ils une authentification ?
**R**: Non, `/public/galleries` est accessible sans authentification.

---

## 🛠️ Commandes utiles

### Démarrer le serveur
```bash
npm run start:dev
```

### Build
```bash
npm run build
```

### Générer le client Prisma
```bash
npx prisma generate
```

### Appliquer les migrations
```bash
npx prisma db push
```

### Voir la documentation Swagger
```bash
# Démarrer le serveur puis aller sur:
http://localhost:3000/api
```

---

## 📞 Support

Pour toute question ou problème:

1. **Documentation**: Consultez les guides ci-dessus
2. **Swagger**: http://localhost:3000/api pour la doc interactive
3. **Issues**: Créer une issue sur le repository
4. **Équipe**: Contacter l'équipe PrintAlma Dev

---

## 🎓 Tutoriels rapides

### Créer sa première galerie (Frontend)

```typescript
// 1. Importer le service
import { galleryService } from '@/services/galleryService';

// 2. Définir le token
galleryService.setAuthToken('YOUR_JWT_TOKEN');

// 3. Préparer les données
const data = {
  title: 'Ma première galerie',
  description: 'Test de création',
  images: [file1, file2, file3, file4, file5] // 5 fichiers File
};

// 4. Créer la galerie
try {
  const result = await galleryService.createGallery(data);
  console.log('Galerie créée:', result.data);
} catch (error) {
  console.error('Erreur:', error);
}
```

### Afficher les galeries publiques

```typescript
// 1. Importer le service
import { galleryService } from '@/services/galleryService';

// 2. Récupérer les galeries (pas besoin de token)
try {
  const result = await galleryService.getPublicGalleries(1, 12);
  console.log('Galeries:', result.data.galleries);
} catch (error) {
  console.error('Erreur:', error);
}
```

---

## ✅ Checklist de démarrage

### Pour les développeurs Frontend
- [ ] Lire le FRONTEND_INTEGRATION_GUIDE.md
- [ ] Copier les types TypeScript
- [ ] Créer le service API
- [ ] Tester un endpoint simple (getPublicGalleries)
- [ ] Implémenter le formulaire de création
- [ ] Tester la création d'une galerie
- [ ] Implémenter la liste des galeries
- [ ] Gérer les erreurs

### Pour les testeurs
- [ ] Lire API_ENDPOINTS.md
- [ ] Configurer Postman
- [ ] Tester tous les endpoints vendeur
- [ ] Tester tous les endpoints publics
- [ ] Vérifier les validations
- [ ] Vérifier les codes d'erreur
- [ ] Tester les cas limites

---

**Dernière mise à jour**: 2024-12-07
**Version**: 1.0.0
**Auteur**: PrintAlma Dev Team
