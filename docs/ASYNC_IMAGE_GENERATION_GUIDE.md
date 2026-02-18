# Guide Frontend - Génération d'Images Asynchrone

Ce guide explique comment implémenter la nouvelle architecture de génération d'images asynchrone pour résoudre le problème de blocage UI lors de la création de produits.

---

## 🎯 Problème Résolu

### Avant (Synchrone - Bloquant)
- Temps de réponse : 15-30 secondes
- UI complètement bloquée pendant la génération
- Mauvaise expérience utilisateur
- Risk de timeout navigateur

### Après (Asynchrone - Non-bloquant)
- Temps de réponse : < 1 seconde
- UI reste responsive
- Meilleure expérience utilisateur
- Pas de risk de timeout

---

## 📡 Endpoint de Création de Produit

**POST** `/api/vendeur/publish-product`

---

## 🔄 Nouveau Flux de Traitement

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. POST /publish-product
                              │    (avec données produit + design)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│  1. Crée le produit (status: PROCESSING)                        │
│  2. Sauvegarde les images admin de référence                    │
│  3. Lance la génération d'images en ARRIÈRE-PLAN                │
│  4. Répond IMMÉDIATEMENT (< 1s)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 2. Réponse immédiate
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  • Affiche message "Génération en cours..."                     │
│  • Redirige vers la page produit                                │
│  • Optionnel: Poll le statut pour mise à jour UI                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Arrière-plan (backend)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKGROUND WORKER                            │
│  • Génère les images pour chaque couleur (parallèle)            │
│  • Upload vers Cloudinary                                       │
│  • Sauvegarde en BDD                                            │
│  • Met à jour le statut -> PUBLISHED ou ERROR                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Structure de la Réponse

### Réponse Immédiate (status: PROCESSING)

```typescript
{
  success: true,
  productId: 123,
  message: "Produit créé avec design \"Dragon\". Génération des images en cours...",
  status: "PROCESSING",
  needsValidation: false,
  imagesProcessed: 0,
  structure: "admin_product_preserved",
  designUrl: "https://res.cloudinary.com/.../design.png",
  designId: 42,
  isDesignReused: true,
  finalImageUrl: null, // Sera rempli quand la génération sera terminée

  // ⏱️ Timing: Estimations pour le frontend
  timing: {
    totalGenerationTime: 0,        // Pas encore terminé
    totalColors: 4,                // Nombre de couleurs à traiter
    colorsProcessed: 0,            // Pas encore traité
    colorsRemaining: 4,            // Toutes à traiter
    averageTimePerColor: 3000,     // Estimation: 3s par couleur
    estimatedRemainingTime: 12000, // Temps estimé total: 12s
    colorTimings: [],              // Vide car pas encore commencé
    estimatedTimePerImage: 3000,
    completionPercentage: 0        // 0% car traitement asynchrone
  },

  // 🚀 Async Processing: Informations pour le frontend
  asyncProcessing: {
    enabled: true,
    estimatedTimePerColor: 3000,
    message: "Les images sont en cours de génération en arrière-plan pour 4 couleur(s)..."
  }
}
```

---

## 🎨 Implémentation Frontend

### 1. **Création de Produit avec UI Non-Bloquante**

```typescript
// services/product.service.ts
export async function createVendorProduct(productData: VendorProductDto) {
  // 1. Afficher l'UI de chargement AVANT l'envoi
  showLoadingModal({
    title: "Création du produit",
    message: "Transmission des données...",
    showSpinner: true
  });

  try {
    // 2. Envoyer la requête
    const response = await api.post('/api/vendeur/publish-product', productData);

    if (response.data.success) {
      const { productId, status, timing, asyncProcessing } = response.data;

      // 3. Mettre à jour le message avec les infos de traitement
      if (status === 'PROCESSING' && asyncProcessing?.enabled) {
        updateLoadingModal({
          title: "Produit créé !",
          message: asyncProcessing.message,
          showProgress: true,
          estimatedTime: timing.estimatedRemainingTime
        });

        // 4. Rediriger vers la page produit après un court délai
        setTimeout(() => {
          hideLoadingModal();
          router.push(`/vendor/products/${productId}`);
        }, 1500);
      } else {
        // Fallback pour l'ancien mode synchrone (si désactivé)
        hideLoadingModal();
        router.push(`/vendor/products/${productId}`);
      }

      return response.data;
    }
  } catch (error) {
    hideLoadingModal();
    showError("Erreur lors de la création du produit");
    throw error;
  }
}
```

### 2. **Composant Modal de Chargement**

```typescript
// components/ProductCreationModal.tsx
interface ProductCreationModalProps {
  isOpen: boolean;
  message?: string;
  estimatedTime?: number;
  showProgress?: boolean;
}

export function ProductCreationModal({
  isOpen,
  message = "Création en cours...",
  estimatedTime,
  showProgress = false
}: ProductCreationModalProps) {
  // Formatage du temps estimé
  const formatTime = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds} secondes`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <div className="product-creation-modal">
        {/* Spinner animé */}
        <div className="spinner-container">
          <Spinner size="large" />
        </div>

        {/* Message principal */}
        <h3 className="modal-title">Création du Produit</h3>
        <p className="modal-message">{message}</p>

        {/* Temps estimé */}
        {estimatedTime && (
          <div className="estimated-time">
            <ClockIcon />
            <span>Temps estimé : {formatTime(estimatedTime)}</span>
          </div>
        )}

        {/* Indicateur de progression */}
        {showProgress && (
          <div className="progress-indicator">
            <div className="pulse-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
            <p className="progress-text">
              Les images sont en cours de génération en arrière-plan...
            </p>
          </div>
        )}

        {/* Info */}
        <div className="modal-info">
          <InfoIcon />
          <p>
            Vous pouvez fermer cette fenêtre. La génération des images
            continuera en arrière-plan.
          </p>
        </div>
      </div>
    </Modal>
  );
}
```

### 3. **Vérification du Statut (Optionnel - Polling)**

```typescript
// hooks/useProductStatus.ts
export function useProductStatus(productId: number) {
  const [status, setStatus] = useState<ProductStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await api.get(`/api/vendeur/products/${productId}`);
      setStatus(response.data.status);

      // Si le produit est encore en traitement, continuer le polling
      if (response.data.status === 'PROCESSING') {
        setIsPolling(true);
        setTimeout(checkStatus, 2000); // Poll toutes les 2 secondes
      } else {
        setIsPolling(false);
      }
    } catch (error) {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    if (productId) {
      checkStatus();
    }
  }, [productId]);

  return { status, isPolling };
}

// Utilisation dans un composant de page produit
function ProductPage({ productId }: { productId: number }) {
  const { status, isPolling } = useProductStatus(productId);

  return (
    <div>
      {/* Afficher un badge si le produit est en cours de traitement */}
      {status === 'PROCESSING' && (
        <div className="processing-badge">
          <Spinner size="small" />
          <span>Génération des images en cours...</span>
        </div>
      )}

      {/* Afficher une erreur si la génération a échoué */}
      {status === 'ERROR' && (
        <div className="error-badge">
          <ErrorIcon />
          <span>Erreur lors de la génération des images</span>
          <button onClick={() => retryGeneration(productId)}>
            Réessayer
          </button>
        </div>
      )}

      {/* Contenu du produit... */}
    </div>
  );
}
```

### 4. **Affichage des Produits avec Statut**

```typescript
// components/ProductCard.tsx
interface ProductCardProps {
  product: {
    id: number;
    name: string;
    status: 'PUBLISHED' | 'DRAFT' | 'PROCESSING' | 'ERROR';
    finalImageUrl: string | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const getStatusBadge = () => {
    switch (product.status) {
      case 'PROCESSING':
        return (
          <div className="status-badge processing">
            <Spinner size="small" />
            <span>En cours de génération...</span>
          </div>
        );

      case 'ERROR':
        return (
          <div className="status-badge error">
            <ErrorIcon />
            <span>Erreur de génération</span>
          </div>
        );

      case 'PUBLISHED':
        if (!product.finalImageUrl) {
          return (
            <div className="status-badge warning">
              <WarningIcon />
              <span>Images manquantes</span>
            </div>
          );
        }
        return (
          <div className="status-badge success">
            <CheckIcon />
            <span>Publié</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="product-card">
      {getStatusBadge()}

      {/* Image du produit */}
      {product.finalImageUrl ? (
        <img src={product.finalImageUrl} alt={product.name} />
      ) : (
        <div className="placeholder-image">
          {product.status === 'PROCESSING' ? (
            <SkeletonLoader />
          ) : (
            <NoImageIcon />
          )}
        </div>
      )}

      <h3>{product.name}</h3>
    </div>
  );
}
```

---

## 🎨 Styles CSS Recommandés

```css
/* Modal de création */
.product-creation-modal {
  text-align: center;
  padding: 2rem;
}

.spinner-container {
  margin-bottom: 1.5rem;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.modal-message {
  color: #666;
  margin-bottom: 1rem;
}

.estimated-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #0066cc;
  font-weight: 500;
  margin-bottom: 1rem;
}

.progress-indicator {
  margin: 1.5rem 0;
}

.pulse-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.pulse-dots .dot {
  width: 8px;
  height: 8px;
  background-color: #0066cc;
  border-radius: 50%;
  animation: pulse 1.4s infinite;
}

.pulse-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.pulse-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #f0f7ff;
  border-radius: 8px;
  color: #0066cc;
  font-size: 0.875rem;
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.processing {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.error {
  background-color: #f8d7da;
  color: #721c24;
}

.status-badge.success {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.warning {
  background-color: #fff3cd;
  color: #856404;
}

/* Processing badge sur la page produit */
.processing-badge {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background-color: #fff3cd;
  color: #856404;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

## 📋 Checklist d'Implémentation

- [ ] Mettre à jour l'appel API pour gérer la réponse immédiate
- [ ] Créer le modal de chargement avec message informatif
- [ ] Afficher le temps estimé basé sur `timing.estimatedRemainingTime`
- [ ] Implémenter la redirection vers la page produit après création
- [ ] Ajouter un indicateur de statut sur la page produit (PROCESSING/ERROR)
- [ ] Implémenter le polling optionnel pour les mises à jour de statut
- [ ] Gérer les cas d'erreur (status: ERROR)
- [ ] Tester avec différents nombres de couleurs

---

## ⚡ Performance

| Métrique | Avant (Synchrone) | Après (Asynchrone) |
|----------|-------------------|---------------------|
| Temps de réponse | 15-30 secondes | < 1 seconde |
| UI bloquée | Oui | Non |
| Expérience utilisateur | Médiocre | Excellente |
| Risk de timeout | Oui | Non |

---

## 🔧 Gestion des Erreurs

### Cas: Status ERROR

Si le statut du produit est `ERROR`, cela signifie que la génération des images a échoué. Voici comment gérer ce cas :

```typescript
// Fonction pour réessayer la génération
async function retryGeneration(productId: number) {
  try {
    // Appeler un endpoint de retry (à implémenter côté backend)
    const response = await api.post(`/api/vendeur/products/${productId}/retry-generation`);

    if (response.data.success) {
      showSuccess("Génération relancée avec succès");
      // Rafraîchir la page ou le statut
    }
  } catch (error) {
    showError("Erreur lors de la relance de la génération");
  }
}
```

---

## 🆘 Support

Pour toute question ou problème, contactez l'équipe backend.

---

## 📚 Références

- [Guide Frontend - Timing](./FRONTEND_TIMING_GUIDE.md)
- [Documentation API Swagger](http://localhost:3000/api)
