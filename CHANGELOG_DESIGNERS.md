# Changelog - API Designers

## Version 1.1.0 (31 janvier 2025) - Support SVG + 10MB

### ✨ Nouvelles fonctionnalités
- **Support SVG**: Les fichiers SVG sont maintenant acceptés pour les avatars
- **Augmentation taille**: Taille maximale passée de 2MB à 10MB
- **Détection automatique**: Le système détecte automatiquement si c'est un SVG
- **Préservation format**: Les SVG sont uploadés sans transformation

### 🔧 Modifications techniques
- Ajout méthode `uploadDesignerAvatar()` dans `CloudinaryService`
- Validation stricte des types MIME dans `DesignerService`
- Messages d'erreur détaillés en français
- Logs améliorés pour le débogage

### 📝 Formats supportés
- JPG / JPEG ✓
- PNG ✓
- GIF ✓
- WEBP ✓
- **SVG** ✓ (nouveau)

### 📦 Fichiers modifiés
- `src/core/cloudinary/cloudinary.service.ts`
- `src/designer/designer.service.ts`
- `FRONTEND_GUIDE.md`
- Ajout: `AVATAR_UPLOAD_UPDATE.md`

---

## Version 1.0.0 (31 janvier 2025) - Implémentation initiale

### ✨ Fonctionnalités initiales
- CRUD complet pour les designers
- Gestion de 6 designers en vedette
- Upload d'avatars via Cloudinary
- Authentification JWT
- Autorisation par rôles (ADMIN, SUPERADMIN)
- Transaction atomique pour les featured

### 🔗 Endpoints implémentés
- `GET /designers/health` - Health check
- `GET /designers/featured` - Liste featured (public)
- `GET /designers/admin` - Liste complète (admin)
- `POST /designers/admin` - Créer (admin)
- `PUT /designers/admin/:id` - Modifier (admin)
- `DELETE /designers/admin/:id` - Supprimer (admin)
- `PUT /designers/featured/update` - Update featured (admin)

### 🗄️ Base de données
- Nouvelle table `designers`
- 13 champs optimisés
- 4 indexes pour les performances
- Relations avec `users`

### 📚 Documentation
- `INDEX_DESIGNERS.md` - Navigation
- `NEXT_STEPS.md` - Guide de démarrage
- `DESIGNERS_QUICKSTART.md` - Guide rapide
- `DESIGNERS_API_IMPLEMENTATION.md` - Doc API
- `IMPLEMENTATION_COMPLETE.md` - Résumé
- `FRONTEND_GUIDE.md` - Guide frontend
- `src/designer/README.md` - Doc technique

### 🧪 Scripts
- `test-designers-api.sh` - Tests automatisés
- `prisma/seed-designers.ts` - Seed 6 designers

---

## Prochaines versions prévues

### Version 1.2.0 (À venir)
- [ ] Pagination pour la liste admin
- [ ] Recherche par nom/bio
- [ ] Statistiques d'utilisation
- [ ] Cache des designers featured
- [ ] Soft delete optionnel

### Version 1.3.0 (À venir)
- [ ] Historique des modifications (audit log)
- [ ] Support multilingue pour bio
- [ ] Galerie d'images pour les designers
- [ ] Liens réseaux sociaux

---

## Migration

### De 1.0.0 à 1.1.0
**Aucune migration nécessaire** - Changements uniquement dans le code applicatif.

**Actions requises:**
1. Redémarrer le serveur
2. Tester l'upload SVG
3. Mettre à jour le frontend (validation 10MB)

**Compatibilité:**
- ✅ Rétrocompatible avec les anciens avatars
- ✅ Les avatars JPG/PNG existants fonctionnent toujours
- ✅ Pas de changement pour les clients existants

---

## Support

Pour toute question ou problème:
1. Consultez `AVATAR_UPLOAD_UPDATE.md` pour les détails SVG
2. Consultez `NEXT_STEPS.md` pour la configuration
3. Consultez `FRONTEND_GUIDE.md` pour l'intégration

**Issues connues:** Aucune

**Performance:**
- Upload SVG: ~100-500ms
- Upload PNG (5MB): ~1-2s
- Validation: <10ms

---

**Maintenu par:** Équipe PrintAlma
**Licence:** Propriétaire
**Status:** ✅ Production Ready
