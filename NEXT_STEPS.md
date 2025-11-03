# 🚀 Prochaines Étapes - API Designers

## Étape 1: Appliquer la migration à la base de données

La table `designers` doit être créée dans votre base de données PostgreSQL.

### Option A: Utiliser db push (Recommandé pour le développement)

```bash
npx prisma db push
```

Cette commande va:
- ✅ Créer la table `designers`
- ✅ Ajouter les indexes optimisés
- ✅ Créer la relation avec la table `users`

### Option B: Créer une migration (Recommandé pour la production)

```bash
npx prisma migrate dev --name add_designers_table
```

Si vous rencontrez des erreurs, utilisez:
```bash
npx prisma migrate reset
# Puis
npx prisma migrate deploy
```

---

## Étape 2: Générer le client Prisma

Le client Prisma doit être régénéré avec le nouveau modèle Designer.

```bash
npx prisma generate
```

Cette commande a déjà été exécutée, mais vous pouvez la relancer si nécessaire.

---

## Étape 3: Créer les données initiales (seed)

Le script `seed-designers.ts` va créer 6 designers par défaut.

```bash
npx ts-node prisma/seed-designers.ts
```

**Important**: Vous devez avoir au moins un utilisateur avec le rôle ADMIN ou SUPERADMIN dans votre base de données.

### Si vous n'avez pas d'admin

Créez-en un via la console Prisma:

```bash
npx prisma studio
```

Ou via SQL:
```sql
-- Créer un utilisateur admin si nécessaire
INSERT INTO users (
  first_name,
  last_name,
  email,
  password,
  role,
  status,
  user_status,
  email_verified
) VALUES (
  'Admin',
  'PrintAlma',
  'admin@printalma.com',
  -- Mot de passe hashé (à remplacer par votre hash bcrypt)
  '$2b$10$yourHashedPasswordHere',
  'SUPERADMIN',
  true,
  'ACTIVE',
  true
);
```

---

## Étape 4: Démarrer le serveur

```bash
# Mode développement avec hot-reload
npm run start:dev

# Ou mode production
npm run build
npm run start:prod
```

Le serveur sera accessible sur: `http://localhost:3004`

---

## Étape 5: Tester les endpoints

### Test rapide (Health check)

```bash
curl http://localhost:3004/designers/health
```

**Réponse attendue:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-31T12:00:00.000Z"
}
```

### Test des designers featured (Public)

```bash
curl http://localhost:3004/designers/featured
```

**Réponse attendue:** Tableau de 6 designers

### Test complet avec script automatisé

```bash
# D'abord, authentifiez-vous pour obtenir un JWT
curl -X POST http://localhost:3004/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@printalma.com", "password": "votre_mot_de_passe"}'

# Copiez le token retourné, puis:
./test-designers-api.sh YOUR_JWT_TOKEN
```

---

## Étape 6: Intégration avec le frontend

### Endpoints à utiliser dans le frontend

#### Page d'accueil (affichage des designers)
```typescript
// GET /designers/featured
const response = await fetch('http://localhost:3004/designers/featured');
const designers = await response.json();
```

#### Page admin - Liste des designers
```typescript
// GET /designers/admin
const response = await fetch('http://localhost:3004/designers/admin', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
const { designers, total } = await response.json();
```

#### Page admin - Créer un designer
```typescript
// POST /designers/admin
const formData = new FormData();
formData.append('name', 'Nouveau Designer');
formData.append('displayName', 'Display Name');
formData.append('bio', 'Description du designer');
formData.append('avatar', fileInput.files[0]); // Fichier image
formData.append('isActive', 'true');

const response = await fetch('http://localhost:3004/designers/admin', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: formData
});
const designer = await response.json();
```

#### Page admin - Modifier un designer
```typescript
// PUT /designers/admin/:id
const formData = new FormData();
formData.append('name', 'Nom modifié');
formData.append('bio', 'Bio mise à jour');

const response = await fetch(`http://localhost:3004/designers/admin/${id}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: formData
});
```

#### Page admin - Mettre à jour les featured
```typescript
// PUT /designers/featured/update
const response = await fetch('http://localhost:3004/designers/featured/update', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    designerIds: ['1', '2', '3', '4', '5', '6']
  })
});
const updatedDesigners = await response.json();
```

---

## Étape 7: Configuration CORS (si nécessaire)

Si votre frontend est sur un domaine différent, ajoutez le domaine dans `main.ts`:

```typescript
// src/main.ts
app.enableCors({
  origin: [
    'http://localhost:5174',
    'https://printalma-website-dep.onrender.com',
    'https://votre-domaine.com' // Ajoutez votre domaine
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

## Étape 8: Déploiement

### Avant de déployer

1. Vérifiez que toutes les variables d'environnement sont configurées
2. Appliquez les migrations sur la base de production
3. Testez tous les endpoints

### Déploiement sur Render

```bash
# Committer les changements
git add .
git commit -m "feat: Add designers API"
git push origin main

# Render va automatiquement déployer si configuré
```

### Migration sur la production

```bash
# Sur le serveur de production
npx prisma migrate deploy

# Puis seed si nécessaire
npx ts-node prisma/seed-designers.ts
```

---

## Dépannage

### Problème: "Table designers does not exist"
**Solution:** Exécutez `npx prisma db push`

### Problème: "No admin user found" lors du seed
**Solution:** Créez un utilisateur admin d'abord

### Problème: 401 Unauthorized
**Solution:**
- Vérifiez que votre token JWT est valide
- Vérifiez que l'utilisateur a le rôle ADMIN ou SUPERADMIN

### Problème: Cloudinary upload failed
**Solution:**
- Vérifiez les credentials Cloudinary dans `cloudinary.service.ts`
- Les credentials sont déjà configurés, mais assurez-vous qu'ils sont valides

### Problème: "Exactly 6 designers must be selected"
**Solution:** Le frontend doit envoyer exactement 6 IDs de designers

---

## Support

Pour toute question ou problème:

1. Consultez la documentation: `DESIGNERS_API_IMPLEMENTATION.md`
2. Vérifiez les logs du serveur
3. Utilisez le script de test: `./test-designers-api.sh`

---

## Checklist finale

- [ ] Migration appliquée (`npx prisma db push`)
- [ ] Client Prisma généré (`npx prisma generate`)
- [ ] Données initiales créées (`npx ts-node prisma/seed-designers.ts`)
- [ ] Serveur démarré (`npm run start:dev`)
- [ ] Health check OK (`curl http://localhost:3004/designers/health`)
- [ ] Endpoint featured OK (`curl http://localhost:3004/designers/featured`)
- [ ] Tests admin passent (`./test-designers-api.sh YOUR_TOKEN`)
- [ ] CORS configuré pour le frontend
- [ ] Frontend peut accéder aux endpoints
- [ ] Déployé en production (si applicable)

---

**Bon développement ! 🎉**
