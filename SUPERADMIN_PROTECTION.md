# 🛡️ Protection des Comptes SUPERADMIN et Messages Informatifs

## 📋 **Vue d'Ensemble**

Ce document détaille les protections spéciales mises en place pour les comptes SUPERADMIN et les améliorations des messages d'information pour les utilisateurs lors des tentatives de connexion sur le système PrintAlma.

---

## 🔒 **Protections Implémentées**

### 1. **🚫 Aucun Verrouillage Automatique**

Les comptes SUPERADMIN ne peuvent **jamais** être verrouillés automatiquement, même après de multiples tentatives de connexion échouées.

#### 📍 **Localisation du Code**
- **Fichier** : `src/auth/auth.service.ts`
- **Méthode** : `login()`
- **Lignes** : 37-60

#### 🔧 **Implémentation**
```typescript
// Vérifier si le compte est verrouillé (SAUF pour les SUPERADMIN)
if (user.locked_until && user.locked_until > new Date() && user.role !== Role.SUPERADMIN) {
    const remainingTime = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
    const hours = Math.floor(remainingTime / 60);
    const minutes = remainingTime % 60;
    
    let timeMessage = '';
    if (hours > 0) {
        timeMessage = `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } else {
        timeMessage = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    throw new UnauthorizedException(`🔒 Votre compte est temporairement verrouillé. Temps restant : ${timeMessage}`);
}

// ⭐ PROTECTION SUPERADMIN : Ne jamais verrouiller les comptes SUPERADMIN
if (user.role === Role.SUPERADMIN) {
    // Pour les SUPERADMIN, on incrémente seulement le compteur pour les logs/statistiques
    // mais on ne verrouille jamais le compte
    await this.prisma.user.update({
        where: { id: user.id },
        data: { login_attempts: user.login_attempts + 1 },
    });

    console.warn(`🚨 Tentative de connexion échouée pour SUPERADMIN: ${user.email} (${user.login_attempts + 1} tentatives)`);
    throw new UnauthorizedException('Identifiants invalides');
}
```

### 2. **🚫 Aucune Désactivation de Compte**

Les comptes SUPERADMIN ne peuvent **jamais** être désactivés via l'API.

#### 📍 **Localisation du Code**
- **Fichier** : `src/auth/auth.service.ts`
- **Méthode** : `toggleClientStatus()`
- **Lignes** : 298-301

#### 🔧 **Implémentation**
```typescript
// ⭐ PROTECTION SUPERADMIN : Ne jamais permettre la désactivation d'un SUPERADMIN
if (client.role === Role.SUPERADMIN) {
    throw new BadRequestException('Impossible de modifier le statut d\'un compte SUPERADMIN');
}
```

---

## 📢 **Messages Informatifs pour Utilisateurs**

### **💬 Messages de Tentatives Échouées**

Le système affiche maintenant des messages informatifs lors des échecs de connexion :

#### **Exemple de Progression :**
1. **1ère tentative échouée** : `❌ Identifiants invalides. Il vous reste 4 tentatives.`
2. **2ème tentative échouée** : `❌ Identifiants invalides. Il vous reste 3 tentatives.`
3. **3ème tentative échouée** : `❌ Identifiants invalides. Il vous reste 2 tentatives.`
4. **4ème tentative échouée** : `❌ Identifiants invalides. Il vous reste 1 tentative.`
5. **5ème tentative échouée** : `❌ Identifiants invalides. ⚠️ Dernière tentative avant verrouillage.`
6. **6ème tentative échouée** : `🔒 Trop de tentatives échouées. Votre compte est verrouillé pour 30 minutes.`

### **⏰ Messages de Compte Verrouillé**

Quand un utilisateur tente de se connecter avec un compte verrouillé :

#### **Formats de Temps Supportés :**
- `🔒 Votre compte est temporairement verrouillé. Temps restant : 29 minutes`
- `🔒 Votre compte est temporairement verrouillé. Temps restant : 1h 15min`
- `🔒 Votre compte est temporairement verrouillé. Temps restant : 2h`
- `🔒 Votre compte est temporairement verrouillé. Temps restant : 1 minute`

---

## 🔓 **Déblocage Manuel des Comptes**

### **Nouvelle Fonctionnalité Admin**

Les administrateurs peuvent maintenant débloquer manuellement les comptes verrouillés.

#### 📍 **Endpoint**
```
PUT /auth/admin/unlock-account/:id
```

#### 🔧 **Implémentation**
```typescript
/**
 * Débloquer manuellement un compte utilisateur (réservé aux admins)
 */
async unlockUserAccount(userId: number) {
    // Récupérer l'utilisateur
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    // Vérifier si le compte est verrouillé
    const isLocked = user.locked_until && user.locked_until > new Date();
    
    if (!isLocked && user.login_attempts === 0) {
        return { message: 'Le compte n\'est pas verrouillé' };
    }
    
    // Débloquer le compte
    await this.prisma.user.update({
        where: { id: userId },
        data: {
            locked_until: null,
            login_attempts: 0,
            updated_at: new Date()
        }
    });
    
    return { message: 'Compte débloqué avec succès' };
}
```

#### 📝 **Réponses API**

**Succès (compte débloqué) :**
```json
{
    "message": "Compte débloqué avec succès",
    "user": {
        "id": 123,
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "status": "unlocked"
    },
    "unlockedAt": "2024-01-15T10:30:00.000Z"
}
```

**Compte non verrouillé :**
```json
{
    "message": "Le compte n'est pas verrouillé",
    "user": {
        "id": 123,
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "status": "already_unlocked"
    }
}
```

---

## 📊 **Monitoring et Logging**

### **🔍 Surveillance des Tentatives Échouées**

Même si les SUPERADMIN ne sont pas verrouillés, toutes les tentatives de connexion échouées sont :

1. **📈 Comptabilisées** dans la base de données
2. **📝 Loggées** avec un niveau WARNING
3. **🚨 Identifiées** spécifiquement comme tentatives SUPERADMIN

#### **Format du Log**
```
🚨 Tentative de connexion échouée pour SUPERADMIN: admin@printalma.com (5 tentatives)
🔓 Compte débloqué manuellement: user@example.com (ID: 123)
```

---

## 🎯 **Endpoints Mis à Jour**

### **1. POST /auth/login**
- ✅ **Protection** : Aucun verrouillage automatique pour SUPERADMIN
- ✅ **Messages** : Information sur tentatives restantes
- ✅ **Format** : Temps de verrouillage lisible (heures/minutes)
- ✅ **Progressif** : Messages dégressifs (4 → 3 → 2 → 1 → 0)

### **2. PUT /auth/admin/clients/:id/toggle-status**
- ✅ **Protection** : Impossible de désactiver un SUPERADMIN
- ✅ **Erreur** : `400 Bad Request` avec message explicite
- ✅ **Message** : "Impossible de modifier le statut d'un compte SUPERADMIN"

### **3. PUT /auth/admin/unlock-account/:id** *(NOUVEAU)*
- ✅ **Fonction** : Déblocage manuel d'un compte
- ✅ **Autorisation** : Admin/SUPERADMIN uniquement
- ✅ **Réponse** : Statut détaillé du déblocage
- ✅ **Logging** : Événement loggé avec détails

---

## 🧪 **Tests Automatisés**

### **Script de Test Principal**
```bash
# Tester les messages progressifs
node test-login-attempts.js

# Tester les protections SUPERADMIN
node test-superadmin-protection.js
```

### **Test 1 : Messages Progressifs**

Le script `test-login-attempts.js` vérifie :
- ✅ Décompte correct des tentatives restantes
- ✅ Progression décroissante (5 → 4 → 3 → 2 → 1 → 0)
- ✅ Message de dernière tentative
- ✅ Format du temps de verrouillage
- ✅ Fonctionnalité de déblocage

### **Test 2 : Protection SUPERADMIN**

Le script `test-superadmin-protection.js` vérifie :
- ✅ Aucun verrouillage après multiples tentatives
- ✅ Messages d'erreur sans indication de statut spécial
- ✅ Protection contre la désactivation
- ✅ Logging des tentatives

---

## 🎨 **Exemples d'Interface Frontend**

### **Affichage des Messages d'Erreur**

```javascript
// Frontend - Gestion des erreurs de connexion
try {
    const response = await authService.login(email, password);
    // Connexion réussie
} catch (error) {
    if (error.response?.status === 401) {
        const message = error.response.data.message;
        
        if (message.includes('Il vous reste')) {
            // Afficher avec icône d'avertissement
            showWarning(message);
        } else if (message.includes('Dernière tentative')) {
            // Afficher avec icône critique
            showCriticalWarning(message);
        } else if (message.includes('verrouillé')) {
            // Afficher avec icône de verrouillage et timer
            showLockMessage(message);
        } else {
            // Erreur générique
            showError(message);
        }
    }
}
```

### **Interface Admin - Déblocage**

```javascript
// Frontend - Débloquer un compte
async function unlockAccount(userId) {
    try {
        const response = await authService.unlockAccount(userId);
        
        if (response.user.status === 'unlocked') {
            showSuccess(`Compte de ${response.user.email} débloqué avec succès`);
            refreshUsersList();
        } else if (response.user.status === 'already_unlocked') {
            showInfo(`Le compte de ${response.user.email} n'était pas verrouillé`);
        }
    } catch (error) {
        showError('Erreur lors du déblocage du compte');
    }
}
```

---

## ⚠️ **Considérations de Sécurité**

### **🔐 Bonnes Pratiques**

1. **📧 Email de Contact** : Utilisez des emails d'entreprise vérifiés pour les SUPERADMIN
2. **🔑 Mots de Passe Forts** : Exigez des mots de passe complexes (>= 12 caractères)
3. **🔄 Rotation** : Changez les mots de passe SUPERADMIN régulièrement
4. **📱 2FA** : Implémentez l'authentification à deux facteurs (future amélioration)
5. **📊 Monitoring** : Surveillez activement les tentatives d'accès
6. **🔓 Déblocage** : Utilisez le déblocage manuel avec parcimonie

### **🚨 Alertes Recommandées**

1. **> 5 tentatives échouées** en 5 minutes sur un SUPERADMIN
2. **Connexion depuis une nouvelle IP** pour un SUPERADMIN
3. **Tentative de modification** du statut d'un SUPERADMIN
4. **Déblocages fréquents** du même compte (possible attaque)

---

## 🔧 **Configuration d'Urgence**

### **En Cas de Problème**

Si un SUPERADMIN est accidentellement affecté par un problème :

#### **1. Vérification Directe en Base**
```sql
-- Vérifier le statut d'un SUPERADMIN
SELECT id, email, status, locked_until, login_attempts 
FROM "User" 
WHERE email = 'superadmin@printalma.com';
```

#### **2. Réparation Manuelle**
```sql
-- Débloquer et réactiver un SUPERADMIN
UPDATE "User" 
SET 
    status = true,
    locked_until = NULL,
    login_attempts = 0,
    updated_at = NOW()
WHERE email = 'superadmin@printalma.com' AND role = 'SUPERADMIN';
```

#### **3. Déblocage via API**
```bash
# Débloquer un compte via l'API (nécessite token admin)
curl -X PUT http://localhost:3004/auth/admin/unlock-account/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📝 **Historique des Modifications**

| Date | Version | Modification | Auteur |
|------|---------|--------------|--------|
| 2024-01-15 | 1.0 | Protection contre le verrouillage automatique | Assistant IA |
| 2024-01-15 | 1.1 | Protection contre la désactivation | Assistant IA |
| 2024-01-15 | 1.2 | Messages informatifs et déblocage manuel | Assistant IA |

---

## 📞 **Support Technique**

En cas de problème avec un compte SUPERADMIN ou le système de verrouillage :

1. **🔍 Vérifiez** les logs de l'application
2. **📊 Consultez** la base de données directement
3. **🛠️ Utilisez** l'endpoint de déblocage admin
4. **🛠️ Appliquez** les solutions de réparation manuelle si nécessaire
5. **📝 Documentez** l'incident pour améliorer la sécurité

---

**⚠️ IMPORTANT : Ces protections sont critiques pour la sécurité du système. Ne les modifiez jamais sans une révision de sécurité complète.** 