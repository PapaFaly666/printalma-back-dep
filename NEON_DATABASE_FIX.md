# Fix : Base de données Neon inaccessible

## Problème
```
Can't reach database server at ep-hidden-river-aduafitn-pooler.c-2.us-east-1.aws.neon.tech:5432
```

## Cause
Les bases de données Neon **gratuites** se mettent automatiquement en **pause** après 5 minutes d'inactivité.

## Solution 1 : Réactiver la base de données Neon (RECOMMANDÉ)

### Étapes :

1. **Aller sur Neon Dashboard**
   - Visitez : [https://console.neon.tech](https://console.neon.tech)
   - Connectez-vous avec votre compte

2. **Sélectionner votre projet**
   - Trouvez le projet `neondb` ou celui qui contient `ep-hidden-river-aduafitn`

3. **Réactiver la base de données**
   - Si elle est en pause, vous verrez un bouton **"Resume"** ou **"Wake up"**
   - Cliquez dessus
   - Attendez 10-30 secondes que la base redémarre

4. **Vérifier la connexion**
   ```bash
   # Depuis le terminal
   curl -I https://ep-hidden-river-aduafitn-pooler.c-2.us-east-1.aws.neon.tech:5432
   ```

5. **Redémarrer votre application**
   ```bash
   npm run start:dev
   ```

## Solution 2 : Utiliser une base de données locale PostgreSQL

Pour éviter les interruptions pendant le développement, vous pouvez utiliser une base de données PostgreSQL locale.

### Installation PostgreSQL (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Créer une base de données locale
```bash
# Se connecter en tant que postgres
sudo -u postgres psql

# Dans psql, créer la base et l'utilisateur
CREATE DATABASE printalma_dev;
CREATE USER printalma_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE printalma_dev TO printalma_user;
\q
```

### Modifier le .env pour utiliser la base locale
```env
# Commenter la DATABASE_URL Neon
#DATABASE_URL="postgresql://neondb_owner:npg_0sgo5NeipWTz@ep-hidden-river-aduafitn-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Ajouter l'URL locale
DATABASE_URL="postgresql://printalma_user:votre_mot_de_passe@localhost:5432/printalma_dev"
```

### Migrer le schéma
```bash
npx prisma migrate dev
npx prisma db seed  # Si vous avez des seeds
```

## Solution 3 : Augmenter le timeout Neon (Plan payant)

Si vous avez besoin que la base reste active en permanence, vous devez passer au plan payant de Neon qui :
- Ne met jamais la base en pause
- Offre de meilleures performances
- Coûte environ 19$/mois

## Vérification rapide de l'état

Pour savoir si votre base Neon est active :
```bash
# Test de connexion
psql "postgresql://neondb_owner:npg_0sgo5NeipWTz@ep-hidden-river-aduafitn-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

Si la connexion échoue après 30 secondes, la base est en pause.

## Notes importantes

- ⏰ Neon gratuit : pause après **5 minutes** d'inactivité
- 🔄 Temps de réveil : **10-30 secondes**
- 💾 Les données sont **conservées** même quand la base est en pause
- 🚀 Pour le développement local : privilégiez PostgreSQL local
- 🌐 Pour la production : Neon ou autre service cloud actif
