# Guide Frontend - Gestion des informations de livraison par pays

## Contexte
Le système de livraison a été modifié pour gérer différemment les commandes nationales (Sénégal) et internationales. Les informations de transporteur et de tarif ne sont maintenant obligatoires que pour les commandes hors Sénégal.

## Règles de validation

### 🇸🇳 Pour le Sénégal (commandes nationales)
- **deliveryInfo.transporteurId**: Non requis
- **deliveryInfo.zoneTarifId**: Non requis
- **deliveryInfo.deliveryFee**: Non requis
- **deliveryInfo.deliveryType**: Non requis (optionnel)
- Les autres champs de localisation (cityId, cityName, etc.) restent optionnels

### 🌍 Pour l'international (hors Sénégal)
- **deliveryInfo.transporteurId**: **Obligatoire**
- **deliveryInfo.zoneTarifId**: **Obligatoire**
- **deliveryInfo.deliveryFee**: **Obligatoire**
- **deliveryInfo.deliveryType**: Obligatoire (city, region, ou international)
- Les champs de localisation appropriés au type de livraison sont obligatoires

## Structure de l'objet deliveryInfo

```typescript
interface DeliveryInfo {
  // Type de livraison (obligatoire uniquement pour l'international)
  deliveryType?: 'city' | 'region' | 'international';

  // Localisation (obligatoire selon deliveryType pour l'international)
  cityId?: string;           // si deliveryType = 'city'
  cityName?: string;
  regionId?: string;         // si deliveryType = 'region'
  regionName?: string;
  zoneId?: string;           // si deliveryType = 'international'
  zoneName?: string;
  countryCode?: string;      // ex: 'SN', 'FR', 'US'
  countryName?: string;

  // Transporteur et tarif (obligatoires uniquement pour l'international)
  transporteurId?: string;   // ID du transporteur choisi
  transporteurName?: string;
  transporteurLogo?: string;
  zoneTarifId?: string;      // ID du tarif appliqué
  deliveryFee?: number;      // Frais de livraison en XOF
  deliveryTime?: string;      // ex: '24-48h'

  // Métadonnées (toujours optionnel)
  metadata?: {
    availableCarriers?: any[];
    selectedAt?: string;
    calculationDetails?: any;
  };
}
```

## Logique recommandée pour le frontend

### 1. Détection du pays
```typescript
const isSenegal = shippingDetails.address.country === 'Sénégal' ||
                  shippingDetails.address.countryCode === 'SN';
```

### 2. Construction de deliveryInfo selon le pays

#### Si Sénégal (national) :
```typescript
const deliveryInfo = {
  countryCode: 'SN',
  countryName: 'Sénégal'
  // Pas besoin de transporteurId, zoneTarifId, deliveryFee
};
```

#### Si international :
```typescript
const deliveryInfo = {
  deliveryType: selectedDeliveryType,
  cityId: selectedCity?.id,
  cityName: selectedCity?.name,
  countryCode: selectedCountry?.code,
  countryName: selectedCountry?.name,
  transporteurId: selectedCarrier?.id,
  transporteurName: selectedCarrier?.name,
  zoneTarifId: selectedTariff?.id,
  deliveryFee: calculatedDeliveryFee,
  deliveryTime: estimatedDeliveryTime
};
```

### 3. Validation côté frontend

```typescript
const validateDeliveryInfo = (deliveryInfo: DeliveryInfo, isInternational: boolean) => {
  const errors: string[] = [];

  if (isInternational) {
    if (!deliveryInfo.transporteurId) {
      errors.push('Veuillez sélectionner un transporteur');
    }
    if (!deliveryInfo.zoneTarifId) {
      errors.push('Veuillez sélectionner une zone de tarif');
    }
    if (!deliveryInfo.deliveryFee || deliveryInfo.deliveryFee <= 0) {
      errors.push('Les frais de livraison sont requis');
    }
    if (!deliveryInfo.deliveryType) {
      errors.push('Veuillez sélectionner un type de livraison');
    }
  }

  return errors;
};
```

### 4. Exemple d'intégration dans le formulaire

```typescript
const handleSubmit = async (formData: OrderFormData) => {
  const { shippingDetails, orderItems } = formData;

  // Détection du pays
  const isInternational = shippingDetails.address.country !== 'Sénégal' &&
                          shippingDetails.address.countryCode !== 'SN';

  // Construction de deliveryInfo
  let deliveryInfo: DeliveryInfo = {
    countryCode: shippingDetails.address.countryCode,
    countryName: shippingDetails.address.country
  };

  if (isInternational) {
    // Récupérer les transporteurs disponibles pour ce pays
    const carriers = await getAvailableCarriers(shippingDetails.address.countryCode);

    // Logique de sélection du transporteur et du tarif
    const selectedCarrier = carriers.find(c => c.id === selectedCarrierId);
    const selectedTariff = selectedCarrier?.tariffs.find(t => t.zoneId === selectedZoneId);

    deliveryInfo = {
      ...deliveryInfo,
      deliveryType: selectedDeliveryType,
      transporteurId: selectedCarrier?.id,
      transporteurName: selectedCarrier?.name,
      zoneTarifId: selectedTariff?.id,
      deliveryFee: selectedTariff?.price,
      deliveryTime: selectedTariff?.deliveryTime,
      // Ajouter les champs de localisation selon le type
      ...(selectedDeliveryType === 'city' && {
        cityId: selectedCity?.id,
        cityName: selectedCity?.name
      }),
      ...(selectedDeliveryType === 'region' && {
        regionId: selectedRegion?.id,
        regionName: selectedRegion?.name
      }),
      ...(selectedDeliveryType === 'international' && {
        zoneId: selectedInternationalZone?.id,
        zoneName: selectedInternationalZone?.name
      })
    };
  }

  // Validation
  const validationErrors = validateDeliveryInfo(deliveryInfo, isInternational);
  if (validationErrors.length > 0) {
    setErrors(validationErrors);
    return;
  }

  // Création de la commande
  const orderData = {
    ...formData,
    deliveryInfo: isInternational ? deliveryInfo : undefined
  };

  await createOrder(orderData);
};
```

## Points importants à considérer

1. **Ne pas envoyer deliveryInfo pour le Sénégal** : Vous pouvez soit ne pas inclure le champ `deliveryInfo` dans la requête, soit l'envoyer avec seulement les informations de pays (countryCode, countryName).

2. **Affichage conditionnel** dans l'interface :
   - Pour le Sénégal : Masquer les sections de sélection de transporteur et de tarif
   - Pour l'international : Afficher ces sections et les rendre obligatoires

3. **Coûts de livraison** :
   - Sénégal : Gérés selon votre logique actuelle (livraison gratuite ou frais fixes)
   - International : Calculés dynamiquement selon le transporteur et la zone sélectionnés

4. **Messages utilisateur** :
   - Clarifiez que la livraison au Sénégal ne nécessite pas de sélection de transporteur spécifique
   - Pour l'international, indiquez clairement les champs obligatoires

Cette approche simplifie considérablement le processus de commande pour les clients sénégalais tout en conservant la flexibilité pour les expéditions internationales.