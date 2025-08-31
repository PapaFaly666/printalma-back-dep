# Configuration de l'Application PrintAlma

## Variables d'environnement requises

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/printalma?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# Email Configuration (SMTP)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASS="your-app-password-or-oauth-token"
MAIL_FROM="your-email@gmail.com"

# Application Configuration
NODE_ENV="development"
```

## Configuration Email (Gmail)

### Étapes pour configurer Gmail :

1. **Activez l'authentification à deux facteurs** sur votre compte Gmail
2. **Générez un mot de passe d'application** :
   - Allez dans les paramètres de votre compte Google
   - Sécurité → Authentification à 2 facteurs → Mots de passe d'application
   - Générez un nouveau mot de passe pour "Mail"
   - Utilisez ce mot de passe dans `MAIL_PASS`

### Configuration alternative (autres fournisseurs) :

```env
# Pour Outlook/Hotmail
MAIL_HOST="smtp-mail.outlook.com"
MAIL_PORT=587

# Pour Yahoo
MAIL_HOST="smtp.mail.yahoo.com"
MAIL_PORT=587

# Pour un serveur SMTP personnalisé
MAIL_HOST="your-smtp-server.com"
MAIL_PORT=587
```

## Configuration de la base de données

### PostgreSQL local :
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/printalma?schema=public"
```

### PostgreSQL distant :
```env
DATABASE_URL="postgresql://username:password@your-server.com:5432/printalma?schema=public"
```

## Démarrage de l'application

1. **Installez les dépendances** :
   ```bash
   npm install
   ```

2. **Configurez la base de données** :
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Démarrez l'application** :
   ```bash
   npm run start:dev
   ```

## Test de la configuration

### Tester la génération de mots de passe :
```http
GET http://localhost:3000/mail/test-password-generation
```

### Tester l'envoi d'emails :
```http
POST http://localhost:3000/mail/test-send-email
Content-Type: application/json

{
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User"
}
```

## Sécurité

⚠️ **Important** :
- Ne jamais commiter le fichier `.env` dans Git
- Utilisez des mots de passe forts pour JWT_SECRET
- Utilisez des mots de passe d'application pour les emails
- En production, utilisez des variables d'environnement sécurisées

## Dépannage

### Erreur d'envoi d'email :
1. Vérifiez vos identifiants SMTP
2. Assurez-vous que l'authentification à 2 facteurs est activée
3. Utilisez un mot de passe d'application, pas votre mot de passe principal
4. Vérifiez que le port SMTP est correct (587 pour la plupart des fournisseurs)

### Erreur de base de données :
1. Vérifiez que PostgreSQL est démarré
2. Vérifiez les identifiants de connexion
3. Assurez-vous que la base de données existe
4. Exécutez les migrations Prisma 