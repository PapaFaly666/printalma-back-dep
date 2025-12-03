# 🚚 Guide Frontend - Intégration du Système de Livraison

Ce document explique comment intégrer le système de livraison dynamique côté **frontend** pour envoyer correctement les données au backend lors de la création d'une commande.

---

## 📋 Vue d'ensemble

Le système de livraison permet aux clients de :
1. **Sélectionner un pays** de destination (Sénégal ou international)
2. **Choisir une ville/région** de livraison
3. **Voir les transporteurs disponibles** pour leur zone avec tarifs et délais
4. **Sélectionner leur transporteur** préféré

Ces informations doivent être envoyées au backend dans l'objet `deliveryInfo` lors de la création de la commande.

---

## 🔧 Structure des Données à Envoyer

### Format Complet

```typescript
interface DeliveryInfo {
  // Type de livraison (OBLIGATOIRE)
  deliveryType: 'city' | 'region' | 'international';

  // Localisation (selon le type)
  cityId?: string;              // Si deliveryType = 'city'
  cityName?: string;
  regionId?: string;            // Si deliveryType = 'region'
  regionName?: string;
  zoneId?: string;              // Si deliveryType = 'international'
  zoneName?: string;
  countryCode?: string;         // Code ISO du pays (ex: "SN", "FR", "US")
  countryName?: string;

  // Transporteur sélectionné (OBLIGATOIRE)
  transporteurId: string;       // ID du transporteur choisi
  transporteurName?: string;    // Nom pour affichage
  transporteurLogo?: string;    // URL du logo

  // Tarification (OBLIGATOIRE)
  zoneTarifId: string;          // ID du tarif appliqué
  deliveryFee: number;          // Montant en XOF
  deliveryTime?: string;        // Ex: "24-48h", "2-3 jours"

  // Métadonnées optionnelles
  metadata?: {
    availableCarriers?: Array<{
      transporteurId: string;
      name: string;
      fee: number;
      time: string;
    }>;
    selectedAt?: string;        // ISO timestamp
    calculationDetails?: any;
  };
}
```

---

## 📝 Exemples par Type de Livraison

### 1. Livraison en Ville (Dakar)

```typescript
const deliveryInfo: DeliveryInfo = {
  deliveryType: 'city',

  // Localisation
  cityId: 'uuid-city-dakar',
  cityName: 'Dakar',
  countryCode: 'SN',
  countryName: 'Sénégal',

  // Transporteur
  transporteurId: 'uuid-transporteur-dhl',
  transporteurName: 'DHL Express',
  transporteurLogo: 'https://api.printalma.com/uploads/logos/dhl.png',

  // Tarification
  zoneTarifId: 'uuid-tarif-dakar-dhl',
  deliveryFee: 3000,
  deliveryTime: '24-48h',

  // Métadonnées
  metadata: {
    availableCarriers: [
      { transporteurId: 'uuid-dhl', name: 'DHL Express', fee: 3000, time: '24-48h' },
      { transporteurId: 'uuid-ups', name: 'UPS', fee: 3500, time: '48-72h' }
    ],
    selectedAt: new Date().toISOString()
  }
};
```

### 2. Livraison en Région (Sénégal)

```typescript
const deliveryInfo: DeliveryInfo = {
  deliveryType: 'region',

  // Localisation
  regionId: 'uuid-region-thies',
  regionName: 'Thiès',
  countryCode: 'SN',
  countryName: 'Sénégal',

  // Transporteur
  transporteurId: 'uuid-transporteur-senegal-post',
  transporteurName: 'La Poste Sénégal',
  transporteurLogo: 'https://api.printalma.com/uploads/logos/poste.png',

  // Tarification
  zoneTarifId: 'uuid-tarif-thies-poste',
  deliveryFee: 5000,
  deliveryTime: '2-3 jours',

  metadata: {
    selectedAt: new Date().toISOString()
  }
};
```

### 3. Livraison Internationale

```typescript
const deliveryInfo: DeliveryInfo = {
  deliveryType: 'international',

  // Localisation
  zoneId: 'uuid-zone-afrique-ouest',
  zoneName: 'Afrique de l\'Ouest',
  countryCode: 'CI',  // Côte d'Ivoire
  countryName: 'Côte d\'Ivoire',

  // Transporteur
  transporteurId: 'uuid-transporteur-fedex',
  transporteurName: 'FedEx International',
  transporteurLogo: 'https://api.printalma.com/uploads/logos/fedex.png',

  // Tarification
  zoneTarifId: 'uuid-tarif-afrique-ouest-fedex',
  deliveryFee: 15000,
  deliveryTime: '5-7 jours',

  metadata: {
    availableCarriers: [
      { transporteurId: 'uuid-fedex', name: 'FedEx', fee: 15000, time: '5-7 jours' },
      { transporteurId: 'uuid-dhl', name: 'DHL', fee: 18000, time: '4-6 jours' }
    ],
    selectedAt: new Date().toISOString()
  }
};
```

---

## 🔨 Implémentation dans ModernOrderFormPage

### Étape 1: États Existants

Vous avez déjà ces états dans votre composant :

```typescript
const [deliveryType, setDeliveryType] = useState<'city' | 'region' | 'international'>('city');
const [selectedCity, setSelectedCity] = useState<City | null>(null);
const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
const [selectedZone, setSelectedZone] = useState<InternationalZone | null>(null);
const [availableCarriers, setAvailableCarriers] = useState<Array<{
  transporteur: Transporteur;
  tarif: ZoneTarif;
}>>([]);
const [selectedCarrier, setSelectedCarrier] = useState<string>('');
const [deliveryFee, setDeliveryFee] = useState<number>(0);
const [deliveryTime, setDeliveryTime] = useState<string>('');
```

### Étape 2: Fonction de Construction

Ajoutez cette fonction pour construire l'objet `deliveryInfo` :

```typescript
const buildDeliveryInfo = (): DeliveryInfo | null => {
  // Trouver le transporteur sélectionné
  const selectedCarrierData = availableCarriers.find(
    c => c.transporteur.id.toString() === selectedCarrier
  );

  if (!selectedCarrierData) {
    console.error('❌ Aucun transporteur sélectionné');
    return null;
  }

  // Construire l'objet de base
  const deliveryInfo: any = {
    deliveryType: deliveryType,
    transporteurId: selectedCarrierData.transporteur.id,
    transporteurName: selectedCarrierData.transporteur.name,
    transporteurLogo: selectedCarrierData.transporteur.logoUrl,
    zoneTarifId: selectedCarrierData.tarif.id,
    deliveryFee: parseFloat(selectedCarrierData.tarif.prixTransporteur.toString()),
    deliveryTime: `${selectedCarrierData.tarif.delaiLivraisonMin}-${selectedCarrierData.tarif.delaiLivraisonMax} jours`,
    countryCode: formData.country || 'SN'
  };

  // Ajouter les infos spécifiques selon le type de livraison
  if (deliveryType === 'city' && selectedCity) {
    deliveryInfo.cityId = selectedCity.id;
    deliveryInfo.cityName = selectedCity.nom;
    deliveryInfo.countryName = 'Sénégal';
  } else if (deliveryType === 'region' && selectedRegion) {
    deliveryInfo.regionId = selectedRegion.id;
    deliveryInfo.regionName = selectedRegion.nom;
    deliveryInfo.countryName = 'Sénégal';
  } else if (deliveryType === 'international' && selectedZone) {
    deliveryInfo.zoneId = selectedZone.id;
    deliveryInfo.zoneName = selectedZone.nom;
    // Le countryName sera trouvé via le code pays
    deliveryInfo.countryName = getCountryNameByCode(formData.country) || formData.country;
  } else {
    console.error('❌ Données de localisation manquantes');
    return null;
  }

  // Ajouter les métadonnées avec les transporteurs disponibles
  deliveryInfo.metadata = {
    availableCarriers: availableCarriers.map(ac => ({
      transporteurId: ac.transporteur.id,
      name: ac.transporteur.name,
      fee: parseFloat(ac.tarif.prixTransporteur.toString()),
      time: `${ac.tarif.delaiLivraisonMin}-${ac.tarif.delaiLivraisonMax} jours`
    })),
    selectedAt: new Date().toISOString()
  };

  console.log('🚚 [DeliveryInfo] Construit:', deliveryInfo);
  return deliveryInfo;
};
```

### Étape 3: Validation Avant Envoi

Ajoutez cette fonction de validation :

```typescript
const validateDeliveryInfo = (): boolean => {
  // Vérifier qu'un transporteur est sélectionné
  if (!selectedCarrier || deliveryFee === 0) {
    setErrors(prev => ({
      ...prev,
      delivery: 'Veuillez sélectionner un mode de livraison'
    }));
    return false;
  }

  // Vérifier la localisation selon le type
  if (deliveryType === 'city' && !selectedCity) {
    setErrors(prev => ({
      ...prev,
      delivery: 'Veuillez sélectionner une ville'
    }));
    return false;
  }

  if (deliveryType === 'region' && !selectedRegion) {
    setErrors(prev => ({
      ...prev,
      delivery: 'Veuillez sélectionner une région'
    }));
    return false;
  }

  if (deliveryType === 'international' && !selectedZone) {
    setErrors(prev => ({
      ...prev,
      delivery: 'Veuillez sélectionner une zone de livraison'
    }));
    return false;
  }

  return true;
};
```

### Étape 4: Modification de handleSubmit

Modifiez votre fonction `handleSubmit` :

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setErrors({});

  try {
    // 1. VALIDATION DE LA LIVRAISON
    if (!validateDeliveryInfo()) {
      setIsSubmitting(false);
      return;
    }

    // 2. CONSTRUCTION DES INFOS DE LIVRAISON
    const deliveryInfo = buildDeliveryInfo();
    if (!deliveryInfo) {
      setErrors(prev => ({
        ...prev,
        delivery: 'Erreur lors de la construction des informations de livraison'
      }));
      setIsSubmitting(false);
      return;
    }

    // 3. CONSTRUCTION DES ORDER ITEMS
    const orderItems = createOrderItems();
    if (orderItems.length === 0) {
      setErrors(prev => ({
        ...prev,
        items: 'Aucun article dans le panier'
      }));
      setIsSubmitting(false);
      return;
    }

    // 4. CALCUL DU TOTAL (PRODUITS + LIVRAISON)
    const subtotal = orderItems.reduce((sum, item) =>
      sum + (item.unitPrice * item.quantity), 0
    );
    const totalAmount = subtotal + deliveryInfo.deliveryFee;

    console.log('💰 [Order] Calcul du total:', {
      subtotal,
      deliveryFee: deliveryInfo.deliveryFee,
      totalAmount
    });

    // 5. CONSTRUCTION DE LA REQUÊTE
    const orderRequest: OrderRequest = {
      email: formData.email,
      shippingDetails: {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        street: formData.address,
        city: formData.city,
        region: formData.city,
        postalCode: formData.postalCode || undefined,
        country: formData.country,
      },
      phoneNumber: formData.phone,
      notes: formData.notes || undefined,
      orderItems: orderItems,
      paymentMethod: 'PAYDUNYA',
      initiatePayment: true,
      totalAmount: totalAmount, // Total calculé (produits + livraison)
      deliveryInfo: deliveryInfo // 🚚 AJOUTER LES INFOS DE LIVRAISON
    };

    console.log('📦 [Order] Requête complète:', orderRequest);

    // 6. ENVOI AU BACKEND
    const orderResponse = orderService.isUserAuthenticated()
      ? await orderService.createOrderWithPayment(orderRequest)
      : await orderService.createGuestOrder(orderRequest);

    console.log('✅ [Order] Commande créée:', orderResponse);

    // 7. REDIRECTION VERS PAIEMENT
    if (orderResponse.payment?.redirect_url) {
      window.location.href = orderResponse.payment.redirect_url;
    } else {
      // Succès sans paiement (ex: paiement à la livraison)
      navigate(`/order-success/${orderResponse.data.orderNumber}`);
    }

  } catch (error: any) {
    console.error('❌ [Order] Erreur:', error);
    setErrors(prev => ({
      ...prev,
      submit: error.message || 'Erreur lors de la création de la commande'
    }));
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## ✅ Checklist d'Intégration

### Avant l'envoi
- [ ] Un transporteur est sélectionné (`selectedCarrier` non vide)
- [ ] Les frais de livraison sont calculés (`deliveryFee > 0`)
- [ ] La localisation est définie selon le type :
  - [ ] `deliveryType === 'city'` → `selectedCity` non null
  - [ ] `deliveryType === 'region'` → `selectedRegion` non null
  - [ ] `deliveryType === 'international'` → `selectedZone` non null

### Construction de deliveryInfo
- [ ] `deliveryType` est défini
- [ ] `transporteurId` est présent (requis)
- [ ] `zoneTarifId` est présent (requis)
- [ ] `deliveryFee` est un nombre positif (requis)
- [ ] Les IDs de localisation sont corrects selon le type
- [ ] Les noms sont inclus pour affichage

### Dans la requête
- [ ] `orderRequest.deliveryInfo` est ajouté
- [ ] `orderRequest.totalAmount` inclut les frais de livraison
- [ ] Le calcul est : `totalAmount = subtotal + deliveryFee`

---

## 🐛 Gestion d'Erreurs

### Erreurs Côté Frontend

```typescript
// Erreur: Transporteur non sélectionné
if (!selectedCarrier) {
  setErrors({ delivery: 'Veuillez sélectionner un transporteur' });
  return;
}

// Erreur: Localisation manquante
if (deliveryType === 'city' && !selectedCity) {
  setErrors({ delivery: 'Veuillez sélectionner une ville' });
  return;
}

// Erreur: Frais de livraison invalides
if (deliveryFee <= 0) {
  setErrors({ delivery: 'Les frais de livraison sont invalides' });
  return;
}
```

### Erreurs Côté Backend

Le backend peut retourner ces erreurs :

```typescript
// 400 Bad Request - Données invalides
{
  "statusCode": 400,
  "message": "Données de livraison invalides",
  "errors": [
    "Transporteur non spécifié",
    "ID de ville manquant pour livraison en ville",
    "Frais de livraison invalides"
  ]
}

// 400 Bad Request - Transporteur invalide
{
  "statusCode": 400,
  "message": "Transporteur invalide",
  "errors": [
    "Transporteur introuvable",
    "Transporteur inactif ou désactivé"
  ]
}

// 400 Bad Request - Tarif invalide
{
  "statusCode": 400,
  "message": "Tarif invalide",
  "errors": [
    "Tarif de livraison introuvable",
    "Tarif ne correspond pas au transporteur sélectionné"
  ]
}

// 400 Bad Request - Frais incorrects
{
  "statusCode": 400,
  "message": "Données de livraison invalides",
  "errors": [
    "Frais de livraison incorrects. Attendu: 3000 XOF, Reçu: 2500 XOF"
  ]
}
```

Gérez ces erreurs :

```typescript
try {
  const orderResponse = await orderService.createOrderWithPayment(orderRequest);
  // Succès
} catch (error: any) {
  if (error.response?.status === 400) {
    const errorData = error.response.data;

    // Afficher les erreurs de validation
    if (errorData.errors && Array.isArray(errorData.errors)) {
      setErrors({
        delivery: errorData.errors.join('\n')
      });
    } else {
      setErrors({
        delivery: errorData.message || 'Erreur de validation de la livraison'
      });
    }
  } else {
    // Autre erreur
    setErrors({
      submit: 'Erreur lors de la création de la commande'
    });
  }
}
```

---

## 🔍 Logs de Debug

Ajoutez ces logs pour faciliter le debugging :

```typescript
// Lors de la sélection du transporteur
const handleCarrierSelect = (carrierId: string) => {
  setSelectedCarrier(carrierId);

  const carrier = availableCarriers.find(c => c.transporteur.id === carrierId);
  if (carrier) {
    console.log('🚚 Transporteur sélectionné:', {
      id: carrier.transporteur.id,
      name: carrier.transporteur.name,
      fee: carrier.tarif.prixTransporteur,
      time: `${carrier.tarif.delaiLivraisonMin}-${carrier.tarif.delaiLivraisonMax} jours`
    });

    setDeliveryFee(parseFloat(carrier.tarif.prixTransporteur.toString()));
    setDeliveryTime(`${carrier.tarif.delaiLivraisonMin}-${carrier.tarif.delaiLivraisonMax} jours`);
  }
};

// Avant la construction de deliveryInfo
console.log('🚚 État de la livraison:', {
  deliveryType,
  selectedCity: selectedCity?.nom,
  selectedRegion: selectedRegion?.nom,
  selectedZone: selectedZone?.nom,
  selectedCarrier,
  deliveryFee,
  availableCarriersCount: availableCarriers.length
});

// Après construction de deliveryInfo
const deliveryInfo = buildDeliveryInfo();
console.log('📦 DeliveryInfo construit:', deliveryInfo);

// Avant envoi
console.log('🚀 Envoi de la commande:', {
  itemsCount: orderItems.length,
  subtotal,
  deliveryFee: deliveryInfo.deliveryFee,
  totalAmount,
  hasDeliveryInfo: !!deliveryInfo
});
```

---

## 📊 Exemple Complet d'Intégration

Voici un exemple complet de fonction `handleSubmit` avec tout intégré :

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setErrors({});

  try {
    console.log('=== DÉBUT CRÉATION COMMANDE ===');

    // 1. VALIDATION LIVRAISON
    console.log('1️⃣ Validation de la livraison...');
    if (!validateDeliveryInfo()) {
      console.error('❌ Validation livraison échouée');
      setIsSubmitting(false);
      return;
    }
    console.log('✅ Validation livraison OK');

    // 2. CONSTRUCTION DELIVERY INFO
    console.log('2️⃣ Construction deliveryInfo...');
    const deliveryInfo = buildDeliveryInfo();
    if (!deliveryInfo) {
      console.error('❌ Construction deliveryInfo échouée');
      setErrors({ delivery: 'Erreur lors de la construction des infos de livraison' });
      setIsSubmitting(false);
      return;
    }
    console.log('✅ DeliveryInfo construit:', deliveryInfo);

    // 3. CONSTRUCTION ORDER ITEMS
    console.log('3️⃣ Construction des articles...');
    const orderItems = createOrderItems();
    console.log(`✅ ${orderItems.length} article(s) créé(s)`);

    // 4. CALCUL TOTAL
    console.log('4️⃣ Calcul du total...');
    const subtotal = orderItems.reduce((sum, item) =>
      sum + (item.unitPrice * item.quantity), 0
    );
    const totalAmount = subtotal + deliveryInfo.deliveryFee;
    console.log('💰 Calculs:', {
      subtotal,
      deliveryFee: deliveryInfo.deliveryFee,
      totalAmount
    });

    // 5. CONSTRUCTION REQUÊTE
    console.log('5️⃣ Construction de la requête...');
    const orderRequest: OrderRequest = {
      email: formData.email,
      shippingDetails: {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        street: formData.address,
        city: formData.city,
        region: formData.city,
        postalCode: formData.postalCode || undefined,
        country: formData.country,
      },
      phoneNumber: formData.phone,
      notes: formData.notes || undefined,
      orderItems: orderItems,
      paymentMethod: 'PAYDUNYA',
      initiatePayment: true,
      totalAmount: totalAmount,
      deliveryInfo: deliveryInfo // 🚚 INFO LIVRAISON
    };

    console.log('📦 Requête complète:', {
      email: orderRequest.email,
      itemsCount: orderRequest.orderItems.length,
      totalAmount: orderRequest.totalAmount,
      deliveryType: orderRequest.deliveryInfo?.deliveryType,
      transporteur: orderRequest.deliveryInfo?.transporteurName,
      deliveryFee: orderRequest.deliveryInfo?.deliveryFee
    });

    // 6. ENVOI AU BACKEND
    console.log('6️⃣ Envoi au backend...');
    const orderResponse = orderService.isUserAuthenticated()
      ? await orderService.createOrderWithPayment(orderRequest)
      : await orderService.createGuestOrder(orderRequest);

    console.log('✅ Commande créée avec succès:', {
      orderNumber: orderResponse.data.orderNumber,
      orderId: orderResponse.data.id,
      totalAmount: orderResponse.data.totalAmount,
      deliveryFee: orderResponse.data.deliveryFee
    });

    // 7. REDIRECTION
    console.log('7️⃣ Redirection vers paiement...');
    if (orderResponse.payment?.redirect_url) {
      console.log('🔗 URL de paiement:', orderResponse.payment.redirect_url);
      window.location.href = orderResponse.payment.redirect_url;
    } else {
      console.log('✅ Commande créée sans paiement immédiat');
      navigate(`/order-success/${orderResponse.data.orderNumber}`);
    }

    console.log('=== FIN CRÉATION COMMANDE ===');

  } catch (error: any) {
    console.error('=== ERREUR CRÉATION COMMANDE ===');
    console.error('❌ Erreur:', error);
    console.error('❌ Message:', error.message);
    console.error('❌ Response:', error.response?.data);

    // Gérer les erreurs de validation
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData.errors && Array.isArray(errorData.errors)) {
        setErrors({
          delivery: errorData.errors.join('\n')
        });
      } else {
        setErrors({
          delivery: errorData.message || 'Erreur de validation'
        });
      }
    } else {
      setErrors({
        submit: error.message || 'Erreur lors de la création de la commande'
      });
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 🎯 Points Importants

### ⚠️ À NE PAS FAIRE

❌ **NE PAS** envoyer `deliveryFee` dans `totalAmount` puis l'ajouter à nouveau
```typescript
// MAUVAIS
const totalAmount = orderItems.reduce(...) + deliveryFee;
orderRequest.totalAmount = totalAmount + deliveryFee; // ❌ Double comptage!
```

❌ **NE PAS** envoyer des IDs numériques si le backend attend des UUID string
```typescript
// MAUVAIS
deliveryInfo.transporteurId = 123; // ❌ Devrait être un string UUID
```

❌ **NE PAS** oublier de valider la localisation selon le type
```typescript
// MAUVAIS
if (deliveryType === 'city') {
  // Mais selectedCity est null!
}
```

### ✅ À FAIRE

✅ **Calculer le total correctement**
```typescript
const subtotal = orderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
const totalAmount = subtotal + deliveryInfo.deliveryFee;
```

✅ **Convertir les IDs en string si nécessaire**
```typescript
deliveryInfo.transporteurId = selectedCarrier.transporteur.id.toString();
```

✅ **Valider avant de construire**
```typescript
if (!selectedCity && deliveryType === 'city') {
  setErrors({ delivery: 'Sélectionnez une ville' });
  return;
}
```

✅ **Logger pour debugging**
```typescript
console.log('🚚 DeliveryInfo:', deliveryInfo);
console.log('💰 Total:', totalAmount);
```

---

## 🧪 Tests à Effectuer

### Test 1: Livraison en Ville
1. Sélectionner "Sénégal"
2. Choisir une ville (ex: Dakar)
3. Sélectionner un transporteur
4. Vérifier que `deliveryInfo.deliveryType === 'city'`
5. Vérifier que `deliveryInfo.cityId` est présent
6. Créer la commande
7. ✅ Vérifier dans la BDD que les champs `delivery_city_id` et `delivery_city_name` sont remplis

### Test 2: Livraison en Région
1. Sélectionner "Sénégal"
2. Choisir une région (ex: Thiès)
3. Sélectionner un transporteur
4. Vérifier que `deliveryInfo.deliveryType === 'region'`
5. Vérifier que `deliveryInfo.regionId` est présent
6. Créer la commande
7. ✅ Vérifier dans la BDD que les champs `delivery_region_id` et `delivery_region_name` sont remplis

### Test 3: Livraison Internationale
1. Sélectionner un pays international (ex: France)
2. Choisir une zone (ex: Europe)
3. Sélectionner un transporteur
4. Vérifier que `deliveryInfo.deliveryType === 'international'`
5. Vérifier que `deliveryInfo.zoneId` est présent
6. Créer la commande
7. ✅ Vérifier dans la BDD que les champs `delivery_zone_id` et `delivery_zone_name` sont remplis

### Test 4: Calcul du Total
1. Ajouter des produits pour 25000 XOF
2. Sélectionner livraison à 3000 XOF
3. Vérifier console : `totalAmount === 28000`
4. Créer la commande
5. ✅ Vérifier dans la BDD que `total_amount === 28000` et `delivery_fee === 3000`

### Test 5: Validation d'Erreurs
1. Essayer de créer commande sans sélectionner transporteur
2. ✅ Vérifier message d'erreur : "Veuillez sélectionner un mode de livraison"
3. Sélectionner transporteur avec tarif incorrect (modifier manuellement)
4. Créer commande
5. ✅ Vérifier erreur backend : "Frais de livraison incorrects"

---

## 📞 Support

Si vous rencontrez des erreurs :

1. **Vérifier les logs** dans la console navigateur et serveur
2. **Vérifier les données** envoyées dans l'onglet Network
3. **Vérifier la réponse** du backend pour les messages d'erreur détaillés
4. **Consulter ce guide** pour les formats de données corrects

---

## 📚 Références

- **Backend Guide:** `GUIDE_LIVRAISON_FRONTEND.md`
- **Backend API:** `src/order/dto/create-order.dto.ts`
- **Validators:** `src/order/validators/delivery.validator.ts`
- **Enrichers:** `src/order/helpers/delivery-enricher.helper.ts`

---

**Version:** 1.0
**Date:** 28 Novembre 2025
**Auteur:** Guide Intégration Frontend - Système de Livraison
