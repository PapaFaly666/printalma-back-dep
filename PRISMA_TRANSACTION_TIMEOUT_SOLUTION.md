# Solution des Timeouts de Transaction Prisma

Ce document explique les causes et solutions des erreurs de timeout de transaction Prisma.

---

## 🚨 Problèmes Identifiés

### 1. **Erreur Originale : Transaction Timeout**
```
Transaction API error: Transaction already closed: A query cannot be executed on an expired transaction. The timeout for this transaction was 5000 ms, however 5200 ms passed since the start of the transaction.
```

### 2. **Erreur Suivante : Unable to Start Transaction**
```
Transaction API error: Unable to start a transaction in the given time.
```

---

## 🔧 Solutions Implémentées

### 1. **Séparation Upload/Transaction**
**Problème :** Les uploads Cloudinary dans la transaction causaient des timeouts.

**Solution :**
```typescript
// ❌ AVANT : Upload dans la transaction
return this.prisma.$transaction(async (tx) => {
  const uploadResult = await this.cloudinaryService.uploadImage(imageFile); // Lent !
  // ... autres opérations DB
});

// ✅ APRÈS : Upload avant la transaction
const uploadedImages = new Map();
for (const image of images) {
  const uploadResult = await this.cloudinaryService.uploadImage(imageFile);
  uploadedImages.set(image.fileId, uploadResult);
}

return this.prisma.$transaction(async (tx) => {
  // Seulement les opérations DB rapides
});
```

### 2. **Configuration Prisma Optimisée**
```typescript
super({
  transactionOptions: {
    maxWait: 10000, // 10s pour démarrer une transaction
    timeout: 30000, // 30s pour exécuter une transaction
  },
});
```

### 3. **Configuration PostgreSQL**
```sql
SET statement_timeout = '30000';           -- 30 secondes max par requête
SET lock_timeout = '10000';                -- 10 secondes pour les locks
SET idle_in_transaction_session_timeout = '60000'; -- 1 minute inactivité
```

### 4. **Mécanisme de Retry Automatique**
```typescript
async executeWithRetry<T>(
  operation: (prisma: PrismaService) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation(this);
    } catch (error) {
      if (isRetryableError(error) && attempt < maxRetries) {
        await wait(1000 * attempt); // Backoff exponentiel
        continue;
      }
      throw error;
    }
  }
}
```

---

## 📊 Monitoring et Debug

### 1. **Health Check**
```typescript
const isHealthy = await prismaService.healthCheck();
console.log('DB Status:', isHealthy ? '✅' : '❌');
```

### 2. **Statistiques Connexions**
```typescript
const stats = await prismaService.getConnectionStats();
console.log('DB Connections:', stats);
```

### 3. **Logs Améliorés**
```typescript
// Configuration
log: ['warn', 'error']

// Logs automatiques
console.log('✅ Prisma connected to PostgreSQL successfully');
console.warn('⚠️ Database operation failed (attempt 1/3)');
console.warn('⏳ Retrying in 1 seconds...');
```

---

## 🎯 Utilisation dans le Code

### ProductService Mis à Jour
```typescript
async create(dto: CreateProductDto, files: Express.Multer.File[]) {
  // 1. Upload des images AVANT transaction
  const uploadedImages = await this.uploadAllImages(files, dto);
  
  // 2. Transaction avec retry automatique
  return this.prisma.executeWithRetry(async (prisma) => {
    return prisma.$transaction(async (tx) => {
      // Seulement opérations DB rapides
      const product = await tx.product.create({...});
      // ... autres opérations DB
      return product;
    });
  });
}
```

---

## ⚠️ Bonnes Pratiques

### 1. **À FAIRE**
- ✅ Uploader les fichiers AVANT les transactions
- ✅ Utiliser le retry automatique pour les erreurs temporaires
- ✅ Configurer des timeouts appropriés
- ✅ Monitor les connexions DB
- ✅ Séparer les opérations lentes des transactions

### 2. **À ÉVITER**
- ❌ Appels réseau (uploads, APIs) dans les transactions
- ❌ Opérations longues dans les transactions
- ❌ Pas de gestion d'erreur pour les timeouts
- ❌ Transactions imbriquées complexes
- ❌ Ignorer les warnings de connexion

---

## 🚀 Résultats Attendus

### Performances Améliorées
- **Avant :** 5+ secondes pour création produit avec timeout
- **Après :** < 2 secondes pour création produit sans timeout

### Fiabilité
- **Retry automatique** pour erreurs temporaires
- **Monitoring actif** des connexions
- **Configuration robuste** pour PostgreSQL

### Maintenance
- **Logs clairs** pour diagnostiquer les problèmes
- **Health checks** pour monitorer l'état
- **Stats connexions** pour optimiser la configuration

---

## 🔗 Variables d'Environnement Recommandées

```env
# PostgreSQL optimisé
DATABASE_URL="postgresql://user:password@localhost:5432/printalma_db?connection_limit=20&pool_timeout=10"

# Application
NODE_ENV=production
LOG_LEVEL=warn

# Timeouts
DB_STATEMENT_TIMEOUT=30000
DB_LOCK_TIMEOUT=10000
DB_IDLE_TIMEOUT=60000
```

---

> ✅ **Problème résolu !** Les erreurs de timeout de transaction ne devraient plus se produire avec ces optimisations.
