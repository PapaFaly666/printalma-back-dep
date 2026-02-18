# Guide Frontend - Génération d'Images Finales

Ce guide explique comment gérer l'affichage du temps de génération des images finales (`finalUrlImage`) lors de la création d'un produit vendeur avec un design.

---

## 📡 Endpoint de Création de Produit

**POST** `/api/vendeur/publish-product`

---

## 📊 Structure de la Réponse - Propriété `timing`

La réponse inclut une propriété `timing` qui fournit toutes les informations nécessaires pour afficher une progression à l'utilisateur.

```typescript
{
  success: true,
  productId: 123,
  message: "Produit créé avec design...",
  timing: {
    // Temps total de génération (ms)
    totalGenerationTime: 12500,

    // Nombre de couleurs
    totalColors: 4,
    colorsProcessed: 4,
    colorsRemaining: 0,

    // Temps moyen par couleur (ms) - pour l'estimation
    averageTimePerColor: 3125,

    // Temps estimé restant (ms)
    estimatedRemainingTime: 0,

    // Détails par couleur
    colorTimings: [
      { colorName: "Blanc", duration: 3000, success: true },
      { colorName: "Blue", duration: 3200, success: true },
      { colorName: "Rouge", duration: 3100, success: true },
      { colorName: "Noir", duration: 3200, success: true }
    ],

    // Temps estimé par image (ms) - pour guide frontend
    estimatedTimePerImage: 3125,

    // Pourcentage de complétion
    completionPercentage: 100
  }
}
```

---

## 🎯 Utilisation Recommandée

### 1. **Afficher une estimation de temps AVANT la création**

Avant d'appeler l'endpoint, informez l'utilisateur du temps estimé :

```typescript
// Temps moyen observé : ~3 secondes par couleur
const AVERAGE_TIME_PER_COLOR = 3000; // ms

// Calculer le temps estimé
function getEstimatedTime(colorCount: number): string {
  const totalMs = colorCount * AVERAGE_TIME_PER_COLOR;
  const totalSeconds = Math.round(totalMs / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds} secondes`;
  } else {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} min ${seconds} sec`;
  }
}

// Exemple d'utilisation
const selectedColorsCount = selectedColors.length;
const estimatedTime = getEstimatedTime(selectedColorsCount);

// Afficher dans l'UI
showMessage(`Création du produit en cours... Temps estimé : ${estimatedTime}`);
```

### 2. **Pendant la création - État de chargement**

Pendant que la requête est en cours, affichez un indicateur de progression :

```typescript
// Pendant l'attente de la réponse
setIsLoading(true);
setLoadingMessage(`Génération des images pour ${selectedColors.length} couleurs...`);

// Optionnel : Afficher un spinner avec message
<LoadingSpinner
  text={`Génération des images (${selectedColors.length} couleurs)...`}
  subText="Cela peut prendre quelques secondes par couleur"
/>
```

### 3. **Après la réponse - Afficher le résultat**

Une fois la réponse reçue, vous pouvez :

```typescript
const response = await createProduct(productData);

if (response.success) {
  const { timing } = response;

  // Afficher les statistiques de génération
  console.log(`Génération terminée en ${timing.totalGenerationTime}ms`);
  console.log(`${timing.colorsProcessed}/${timing.totalColors} couleurs traitées`);

  // Détails par couleur
  timing.colorTimings.forEach(color => {
    if (color.success) {
      console.log(`✅ ${color.colorName}: ${color.duration}ms`);
    } else {
      console.log(`❌ ${color.colorName}: échoué`);
    }
  });

  showSuccessMessage(`Produit créé avec succès !`);
}
```

---

## 🎨 Exemples d'UI Composants

### Exemple 1 : Simple Toast Message

```typescript
// Avant la création
toast.info(`Création en cours... environ ${selectedColors.length * 3} secondes`);

// Après succès
toast.success(`Produit créé en ${Math.round(response.timing.totalGenerationTime / 1000)}s !`);
```

### Exemple 2 : Barre de Progression

```typescript
interface TimingInfo {
  totalColors: number;
  colorsProcessed: number;
  completionPercentage: number;
  estimatedRemainingTime: number;
}

function GenerationProgressBar({ timing }: { timing: TimingInfo }) {
  const remainingSeconds = Math.round(timing.estimatedRemainingTime / 1000);

  return (
    <div className="generation-progress">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${timing.completionPercentage}%` }}
        />
      </div>
      <div className="progress-text">
        {timing.colorsProcessed} / {timing.totalColors} couleurs traitées
      </div>
      {remainingSeconds > 0 && (
        <div className="remaining-time">
          Environ {remainingSeconds}s restantes
        </div>
      )}
    </div>
  );
}
```

### Exemple 3 : Carte de Statistiques Détaillées

```typescript
function GenerationStats({ timing }: { timing: TimingInfo }) {
  const formatTime = (ms: number) => `${Math.round(ms / 1000)}s`;

  return (
    <div className="stats-card">
      <h3>🎨 Génération des Images</h3>

      <div className="stat-row">
        <span>Temps total :</span>
        <span>{formatTime(timing.totalGenerationTime)}</span>
      </div>

      <div className="stat-row">
        <span>Temps moyen/couleur :</span>
        <span>{formatTime(timing.averageTimePerColor)}</span>
      </div>

      <div className="color-stats">
        {timing.colorTimings.map((color, index) => (
          <div key={index} className="color-stat">
            <span className={`status ${color.success ? 'success' : 'error'}`}>
              {color.success ? '✅' : '❌'}
            </span>
            <span>{color.colorName}</span>
            <span>{formatTime(color.duration)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ⚡ Performance et Temps Observés

Basé sur les tests en production :

| Nombre de Couleurs | Temps Estimé | Temps Observé |
|-------------------|--------------|---------------|
| 1 couleur | ~3 secondes | 2-4 secondes |
| 2 couleurs | ~6 secondes | 5-7 secondes |
| 4 couleurs | ~12 secondes | 10-15 secondes |
| 8 couleurs | ~24 secondes | 20-30 secondes |

**Note** : Le temps peut varier selon la complexité du design et la charge du serveur.

---

## 🔧 Gestion des Erreurs

Si une couleur échoue, elle sera marquée `success: false` dans `colorTimings` :

```typescript
timing.colorTimings.forEach(color => {
  if (!color.success) {
    console.warn(`Échec pour ${color.colorName}`);
    // Afficher un message à l'utilisateur
    showWarning(`L'image pour ${color.name} n'a pas pu être générée`);
  }
});
```

---

## 📝 Bonnes Pratiques

1. **Informez l'utilisateur AVANT** : Montrez toujours une estimation de temps avant de lancer la création
2. **Soyez patient** : Ne laissez pas l'utilisateur annuler trop facilement - la génération prend du temps
3. **Feedback visuel** : Utilisez des spinners, barres de progression ou messages clairs
4. **Gérez les erreurs** : Prévenez l'utilisateur si certaines couleurs échouent
5. **Animations** : Ajoutez des animations fluides pour rendre l'attente plus agréable

---

## 🚀 Exemple Complet d'Intégration

```typescript
// service/product.ts
export async function createVendorProduct(productData: VendorProductDto) {
  // Estimation avant envoi
  const colorCount = productData.selectedColors.length;
  const estimatedSeconds = Math.round((colorCount * 3000) / 1000);

  // Afficher le message de chargement
  showLoadingModal({
    title: "Création du produit",
    message: `Génération des images pour ${colorCount} couleur(s)...`,
    estimatedTime: `${estimatedSeconds} secondes`,
    showSpinner: true
  });

  try {
    const response = await api.post('/api/vendeur/publish-product', productData);

    // Mettre à jour avec les stats réelles
    updateLoadingModal({
      title: "Création réussie !",
      message: `Produit créé en ${Math.round(response.data.timing.totalGenerationTime / 1000)}s`,
      stats: response.data.timing
    });

    return response.data;
  } catch (error) {
    hideLoadingModal();
    showError("Erreur lors de la création du produit");
    throw error;
  }
}
```

---

## 📞 Support

Pour toute question ou problème, contactez l'équipe backend.
