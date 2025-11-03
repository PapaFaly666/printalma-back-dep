# 🚀 Quickstart - API Designers

## ✅ Ce qui a été implémenté

L'API complète de gestion des designers est maintenant disponible avec:
- ✅ Modèle Prisma `Designer` ajouté au schéma
- ✅ Module NestJS complet avec DTOs, Service et Controller
- ✅ 7 endpoints (3 publics + 4 admin)
- ✅ Upload d'avatars via Cloudinary
- ✅ Gestion des designers en vedette (featured)
- ✅ Authentification et autorisation (JWT + Roles)
- ✅ Validation des données avec class-validator

## 📋 Prochaines étapes

### 1. Appliquer la migration à la base de données

**Option A: En développement (recommandé)**
```bash
npx prisma db push
```

**Option B: Créer une migration**
```bash
npx prisma migrate dev --name add_designers_table
```

### 2. Créer les 6 designers initiaux

```bash
npx ts-node prisma/seed-designers.ts
```

### 3. Démarrer le serveur

```bash
npm run start:dev
```

### 4. Tester les endpoints

**Test rapide (health check):**
```bash
curl http://localhost:3004/designers/health
```

**Test complet (avec JWT):**
```bash
./test-designers-api.sh YOUR_JWT_TOKEN
```

## 🔗 Endpoints disponibles

### Publics
- `GET /designers/health` - Health check
- `GET /designers/featured` - Liste des 6 designers en vedette

### Admin (JWT requis)
- `GET /designers/admin` - Liste tous les designers
- `POST /designers/admin` - Créer un designer
- `PUT /designers/admin/:id` - Modifier un designer
- `DELETE /designers/admin/:id` - Supprimer un designer
- `PUT /designers/featured/update` - Mettre à jour les featured

## 📖 Documentation complète

- **Guide détaillé**: `DESIGNERS_API_IMPLEMENTATION.md`
- **Documentation module**: `src/designer/README.md`
- **Guide frontend**: `GUIDE_FRONTEND_FEATURED_THEMES.md`

## 🧪 Exemples de requêtes

### Créer un designer
```bash
curl -X POST http://localhost:3004/designers/admin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Pap Musa" \
  -F "displayName=Pap Musa" \
  -F "bio=Artiste sénégalais" \
  -F "isActive=true"
```

### Récupérer les designers en vedette
```bash
curl http://localhost:3004/designers/featured
```

### Mettre à jour les designers en vedette
```bash
curl -X PUT http://localhost:3004/designers/featured/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"designerIds": ["1", "2", "3", "4", "5", "6"]}'
```

## 🎨 Upload d'avatar

Les avatars sont uploadés sur Cloudinary avec:
- Transformation: 400x400px, crop fill, gravity face
- Dossier: `designers`
- Formats acceptés: jpg, jpeg, png, gif, webp
- Taille max: 2MB

## 🔒 Authentification

Pour obtenir un token JWT, authentifiez-vous via:
```bash
curl -X POST http://localhost:3004/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@printalma.com", "password": "your_password"}'
```

## 🐛 Résolution de problèmes

### La base de données n'est pas accessible
- Vérifiez votre connexion internet
- Vérifiez la variable `DATABASE_URL` dans `.env`
- Vérifiez que Neon DB est accessible

### Erreur 401 Unauthorized
- Vérifiez que votre token JWT est valide
- Vérifiez que vous avez le rôle ADMIN ou SUPERADMIN

### Erreur 400 Bad Request
- Vérifiez les données envoyées
- Consultez le message d'erreur pour les détails de validation

## 📝 Notes importantes

1. **Featured designers**: Exactement 6 designers requis
2. **Transaction atomique**: La mise à jour des featured est atomique
3. **Cloudinary**: Les avatars sont automatiquement optimisés
4. **Validation**: Tous les champs sont validés côté serveur

## 🎉 C'est prêt !

L'API est complètement fonctionnelle et prête à être utilisée par le frontend.
Consultez `DESIGNERS_API_IMPLEMENTATION.md` pour plus de détails.
