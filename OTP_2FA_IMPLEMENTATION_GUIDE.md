# Guide d'implémentation de l'authentification à deux facteurs (2FA) avec OTP par email

## Vue d'ensemble

Ce système ajoute une couche de sécurité supplémentaire pour les comptes **Administrateurs**, **Super Administrateurs** et **Vendeurs**. Lors de la connexion, un code OTP à 6 chiffres est envoyé par email et doit être saisi pour finaliser la connexion.

## Architecture

### Backend (NestJS + Prisma)

#### 1. Modèle de données

**Table `login_otps`** :
- `id` : Identifiant unique
- `user_id` : ID de l'utilisateur
- `code` : Code OTP à 6 chiffres
- `expires_at` : Date d'expiration (10 minutes)
- `verified` : Boolean indiquant si le code a été vérifié
- `attempts` : Nombre de tentatives (max 3)
- `ip_address` : Adresse IP de la requête
- `user_agent` : User agent du navigateur
- `created_at` : Date de création
- `used_at` : Date d'utilisation

#### 2. Services

**OtpService** (`src/auth/otp/otp.service.ts`) :
- `generateOTP()` : Génère un code à 6 chiffres
- `createOTP(userId, ipAddress, userAgent)` : Crée et enregistre un OTP
- `verifyOTP(userId, code)` : Vérifie un code OTP
- `invalidateUserOTPs(userId)` : Invalide les anciens OTP
- `shouldUseOTP(role)` : Détermine si l'OTP est requis pour un rôle

**MailService** (`src/core/mail/mail.service.ts`) :
- `sendLoginOTP(email, firstName, code)` : Envoie l'email avec le code OTP

#### 3. Flux d'authentification modifié

**AuthService** (`src/auth/auth.service.ts`) :

1. **login(loginDto)** :
   - Vérifie email + mot de passe
   - Si l'utilisateur est Admin/SuperAdmin/Vendeur :
     - Génère un code OTP
     - Envoie l'email
     - Retourne `{ otpRequired: true, userId, email, message }`
   - Sinon (client normal) :
     - Retourne le token JWT directement

2. **verifyOtpAndLogin(verifyOtpDto)** :
   - Vérifie le code OTP
   - Si valide : génère et retourne le token JWT
   - Si invalide : lance une exception

#### 4. Endpoints API

**POST /auth/login** :
- Body: `{ email, password }`
- Réponses :
  - `{ otpRequired: true, email, message }` : OTP requis
  - `{ user: {...} }` : Connexion directe (clients)
  - `{ mustChangePassword: true, userId }` : Changement de mot de passe requis

**POST /auth/verify-otp** :
- Body: `{ email, code }`
- Réponse : `{ user: {...} }` + cookie JWT

#### 5. Sécurité

- **Expiration** : 10 minutes
- **Tentatives** : Maximum 3 tentatives par code
- **Invalidation** : Les anciens codes sont automatiquement invalidés lors de la création d'un nouveau
- **Tracking** : IP et User-Agent enregistrés pour audit
- **One-time use** : Un code ne peut être utilisé qu'une seule fois

---

### Frontend (React + TypeScript)

#### 1. Page de vérification OTP

**OtpVerificationPage.tsx** (`src/pages/auth/OtpVerificationPage.tsx`) :
- Interface de saisie du code à 6 chiffres
- Auto-focus et navigation automatique entre les champs
- Support du copier-coller
- Compte à rebours de 10 minutes
- Gestion des erreurs
- Redirection vers le dashboard après vérification

#### 2. Modifications des pages de login

**AdminLoginPage.tsx** :
```typescript
if (data.otpRequired) {
  navigate('/admin/verify-otp', {
    state: {
      email: formData.email,
      from: '/admin/dashboard'
    }
  });
  return;
}
```

**VendorLoginClassicPage.tsx** :
```typescript
if (data.otpRequired) {
  navigate('/vendeur/verify-otp', {
    state: {
      email: formData.email,
      from: '/vendeur/dashboard'
    }
  });
  return;
}
```

#### 3. Routes à ajouter

Dans votre fichier de routes (généralement `App.tsx` ou `routes.tsx`) :

```typescript
import OtpVerificationPage from './pages/auth/OtpVerificationPage';

// Dans vos routes
<Route path="/admin/verify-otp" element={<OtpVerificationPage />} />
<Route path="/vendeur/verify-otp" element={<OtpVerificationPage />} />
```

---

## Installation et configuration

### 1. Backend

#### Étape 1 : Appliquer la migration SQL

```bash
cd /home/pfdev/Bureau/PrintalmaProject/printalma-back-dep
psql <DATABASE_URL> -f migrations/add-login-otp.sql
```

Ou utilisez votre client PostgreSQL préféré pour exécuter le contenu du fichier.

#### Étape 2 : Générer le client Prisma

```bash
npx prisma generate
```

#### Étape 3 : Vérifier la configuration email

Assurez-vous que votre configuration email (SMTP) est correcte dans le fichier `.env` :

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@printalma.com
```

#### Étape 4 : Redémarrer le serveur

```bash
npm run start:dev
```

### 2. Frontend

#### Étape 1 : Ajouter les routes

Modifiez votre fichier de routes pour inclure :

```typescript
<Route path="/admin/verify-otp" element={<OtpVerificationPage />} />
<Route path="/vendeur/verify-otp" element={<OtpVerificationPage />} />
```

#### Étape 2 : Tester

1. Essayez de vous connecter en tant qu'admin
2. Vérifiez votre boîte email
3. Saisissez le code OTP
4. Vous devriez être redirigé vers le dashboard

---

## Flux utilisateur

### Scénario 1 : Admin se connecte

1. **Page de login** : Saisit email + mot de passe
2. **Backend** : Valide les credentials, génère l'OTP, envoie l'email
3. **Frontend** : Redirige vers `/admin/verify-otp`
4. **Email** : L'admin reçoit un email avec le code à 6 chiffres
5. **Page OTP** : L'admin saisit le code
6. **Backend** : Vérifie le code, génère le JWT
7. **Frontend** : Redirige vers `/admin/dashboard`

### Scénario 2 : Vendeur se connecte

Même flux que pour l'admin, mais avec redirection vers `/vendeur/dashboard`.

### Scénario 3 : Client se connecte

1. **Page de login** : Saisit email + mot de passe
2. **Backend** : Valide les credentials, génère directement le JWT (pas d'OTP)
3. **Frontend** : Redirige vers le compte client

---

## Personnalisation

### Modifier la durée d'expiration

Dans `src/auth/otp/otp.service.ts` :

```typescript
private readonly OTP_EXPIRY_MINUTES = 10; // Changer ici
```

### Modifier le nombre de tentatives

Dans `src/auth/otp/otp.service.ts` :

```typescript
private readonly MAX_ATTEMPTS = 3; // Changer ici
```

### Ajouter/Retirer des rôles nécessitant l'OTP

Dans `src/auth/otp/otp.service.ts` :

```typescript
shouldUseOTP(role: string): boolean {
  const rolesRequiringOTP = ['ADMIN', 'SUPERADMIN', 'VENDOR']; // Modifier ici
  return rolesRequiringOTP.includes(role);
}
```

### Personnaliser l'email

Modifiez la méthode `sendLoginOTP` dans `src/core/mail/mail.service.ts`.

---

## Tests

### Test manuel

1. **Connexion admin** :
   ```bash
   curl -X POST http://localhost:3004/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "password123"}'
   ```

   Réponse attendue :
   ```json
   {
     "otpRequired": true,
     "userId": 1,
     "email": "admin@example.com",
     "message": "Un code de vérification a été envoyé à votre adresse email"
   }
   ```

2. **Vérification OTP** :
   ```bash
   curl -X POST http://localhost:3004/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "code": "123456"}'
   ```

   Réponse attendue :
   ```json
   {
     "user": {
       "id": 1,
       "email": "admin@example.com",
       "role": "ADMIN",
       ...
     }
   }
   ```

---

## Dépannage

### Problème : Email non reçu

**Solutions** :
1. Vérifier la configuration SMTP dans `.env`
2. Vérifier les logs du serveur : `tail -f logs/application.log`
3. Vérifier le dossier spam
4. Tester l'envoi d'email avec un autre service (Mailtrap, SendGrid, etc.)

### Problème : Code invalide même si correct

**Solutions** :
1. Vérifier que le code n'a pas expiré (10 minutes)
2. Vérifier que l'email est correct
3. Vérifier dans la base de données : `SELECT * FROM login_otps WHERE user_id = X ORDER BY created_at DESC;`

### Problème : Erreur "relation login_otps does not exist"

**Solution** :
Appliquer la migration SQL :
```bash
psql <DATABASE_URL> -f migrations/add-login-otp.sql
```

### Problème : Trop de tentatives

**Solution** :
Le code est invalidé après 3 tentatives incorrectes. L'utilisateur doit se reconnecter pour générer un nouveau code.

---

## Sécurité

### Bonnes pratiques implémentées

✅ **Code à usage unique** : Chaque code ne peut être utilisé qu'une seule fois
✅ **Expiration courte** : 10 minutes seulement
✅ **Limitation des tentatives** : Maximum 3 tentatives par code
✅ **Invalidation automatique** : Les anciens codes sont invalidés lors de la création d'un nouveau
✅ **Tracking** : IP et User-Agent enregistrés pour audit
✅ **Nettoyage automatique** : Les codes expirés peuvent être supprimés via un cron job
✅ **Protection contre le brute force** : Système de verrouillage de compte existant

### Recommandations supplémentaires

- [ ] Implémenter un rate limiting sur `/auth/login` et `/auth/verify-otp`
- [ ] Ajouter un système d'alertes par email en cas de tentatives suspectes
- [ ] Logger tous les événements liés à l'OTP pour audit
- [ ] Implémenter un backup code système
- [ ] Ajouter une option "Se souvenir de cet appareil pendant 30 jours"

---

## Maintenance

### Nettoyer les OTP expirés

Créer un cron job pour nettoyer régulièrement les OTP expirés :

```typescript
// Dans un service de cron
@Cron('0 0 * * *') // Tous les jours à minuit
async cleanupExpiredOTPs() {
  await this.otpService.cleanExpiredOTPs();
}
```

### Monitoring

Surveiller :
- Nombre d'OTP générés par jour
- Taux de succès de vérification
- Nombre de tentatives échouées
- Temps moyen de vérification

---

## FAQ

**Q : Puis-je désactiver l'OTP pour certains admins ?**
R : Oui, modifiez la méthode `shouldUseOTP` pour ajouter des exceptions basées sur l'ID utilisateur ou un flag dans la base de données.

**Q : Puis-je utiliser SMS au lieu d'email ?**
R : Oui, remplacez `sendLoginOTP` dans `MailService` par un appel à un service SMS (Twilio, etc.).

**Q : L'OTP fonctionne-t-il hors ligne ?**
R : Non, l'OTP nécessite une connexion internet pour recevoir l'email et vérifier le code.

**Q : Que se passe-t-il si l'utilisateur ferme le navigateur ?**
R : Le code reste valide jusqu'à expiration. L'utilisateur doit se reconnecter pour générer un nouveau code.

---

## Support

Pour toute question ou problème :
1. Vérifier les logs : `tail -f logs/application.log`
2. Vérifier la base de données : `SELECT * FROM login_otps;`
3. Consulter ce guide
4. Contacter l'équipe de développement

---

## Changelog

### Version 1.0.0 (02/03/2026)
- ✅ Implémentation initiale de l'OTP par email
- ✅ Support pour Admin, SuperAdmin et Vendeurs
- ✅ Interface de vérification OTP dans le frontend
- ✅ Email de notification avec design personnalisé
- ✅ Système de sécurité complet (expiration, tentatives, tracking)
