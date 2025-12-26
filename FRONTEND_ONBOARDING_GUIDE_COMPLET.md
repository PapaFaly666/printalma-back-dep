# 🎨 Guide Frontend - Onboarding Vendeur Complet

## 📋 Vue d'ensemble

Ce guide vous explique comment implémenter côté frontend :
1. ✅ Le processus d'onboarding (3 étapes)
2. ✅ L'affichage des numéros de téléphone
3. ✅ La modification des numéros
4. ✅ La vérification du statut d'onboarding
5. ✅ L'affichage du profil complet

---

## 🗂️ Structure des fichiers à créer

```
src/
├── services/
│   └── vendorOnboardingService.ts          # Service API
├── pages/
│   └── vendor/
│       ├── VendorOnboardingPage.tsx        # Page d'onboarding (3 étapes)
│       └── VendorProfilePage.tsx           # Page de profil (affichage + modification)
├── components/
│   └── vendor/
│       ├── PhoneNumbersList.tsx            # Liste des numéros
│       ├── PhoneNumbersEdit.tsx            # Édition des numéros
│       └── SocialMediaLinks.tsx            # Liens réseaux sociaux
└── utils/
    └── phoneValidation.ts                  # Validateurs téléphones sénégalais
```

---

## 1️⃣ Service API - vendorOnboardingService.ts

```typescript
// src/services/vendorOnboardingService.ts

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface PhoneNumber {
  number: string;
  isPrimary: boolean;
}

export interface SocialMedia {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';
  url: string;
}

export interface OnboardingData {
  phones: PhoneNumber[];
  socialMedia?: SocialMedia[];
  profileImage: File;
}

export interface ProfileData {
  profileImage: string | null;
  phones: Array<{
    id: number;
    number: string;
    isPrimary: boolean;
  }>;
  socialMedia: Array<{
    platform: string;
    url: string;
    username?: string;
  }>;
}

export const vendorOnboardingService = {
  /**
   * Compléter l'onboarding vendeur
   */
  async completeOnboarding(data: OnboardingData) {
    const formData = new FormData();

    // Ajouter les numéros de téléphone
    formData.append('phones', JSON.stringify(data.phones));

    // Ajouter les réseaux sociaux si fournis
    if (data.socialMedia && data.socialMedia.length > 0) {
      formData.append('socialMedia', JSON.stringify(data.socialMedia));
    }

    // Ajouter l'image de profil
    formData.append('profileImage', data.profileImage);

    const response = await axios.post(
      `${API_BASE_URL}/api/vendor/complete-onboarding`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      }
    );

    return response.data;
  },

  /**
   * Vérifier le statut de complétion du profil
   */
  async getProfileStatus() {
    const response = await axios.get(
      `${API_BASE_URL}/api/vendor/profile-status`,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Récupérer les informations d'onboarding
   */
  async getOnboardingInfo(): Promise<{ success: boolean; data: ProfileData }> {
    const response = await axios.get(
      `${API_BASE_URL}/api/vendor/onboarding-info`,
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Mettre à jour les numéros de téléphone
   */
  async updatePhones(phones: PhoneNumber[]) {
    const response = await axios.put(
      `${API_BASE_URL}/api/vendor/update-phones`,
      { phones },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    return response.data;
  },
};
```

---

## 2️⃣ Validateurs - phoneValidation.ts

```typescript
// src/utils/phoneValidation.ts

/**
 * Valider un numéro de téléphone sénégalais
 * Formats acceptés: +221XXXXXXXXX, 221XXXXXXXXX, 7XXXXXXXX, 3XXXXXXXX
 */
export function validateSenegalPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  const phoneRegex = /^(\+?221|221)?[73][0-9]{8}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Normaliser un numéro de téléphone sénégalais
 * Retourne au format +221XXXXXXXXX
 */
export function normalizeSenegalPhone(phone: string): string {
  let cleaned = phone.replace(/[\s-]/g, '');

  if (!cleaned.startsWith('+221') && !cleaned.startsWith('221')) {
    cleaned = '+221' + cleaned;
  } else if (cleaned.startsWith('221') && !cleaned.startsWith('+221')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Formater pour l'affichage : +221 77 123 45 67
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizeSenegalPhone(phone);
  // +221771234567 -> +221 77 123 45 67
  return normalized.replace(/(\+221)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
}

/**
 * Valider qu'il y a exactement un numéro principal
 */
export function validatePrimaryPhone(phones: Array<{ isPrimary: boolean }>): boolean {
  const primaryCount = phones.filter(p => p.isPrimary).length;
  return primaryCount === 1;
}

/**
 * Vérifier les doublons
 */
export function hasPhoneDuplicates(phones: Array<{ number: string }>): boolean {
  const normalized = phones.map(p => normalizeSenegalPhone(p.number));
  const unique = new Set(normalized);
  return unique.size !== normalized.length;
}
```

---

## 3️⃣ Composant - PhoneNumbersList.tsx

```tsx
// src/components/vendor/PhoneNumbersList.tsx

import React from 'react';
import { Phone, Star } from 'lucide-react';
import { formatPhoneDisplay } from '../../utils/phoneValidation';

interface PhoneNumber {
  id?: number;
  number: string;
  isPrimary: boolean;
}

interface PhoneNumbersListProps {
  phones: PhoneNumber[];
  onEdit?: () => void;
  showEditButton?: boolean;
}

export const PhoneNumbersList: React.FC<PhoneNumbersListProps> = ({
  phones,
  onEdit,
  showEditButton = true,
}) => {
  // Trier : numéro principal en premier
  const sortedPhones = [...phones].sort((a, b) =>
    a.isPrimary ? -1 : b.isPrimary ? 1 : 0
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Numéros de téléphone
        </h3>
        {showEditButton && onEdit && (
          <button
            onClick={onEdit}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Modifier
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sortedPhones.map((phone, index) => (
          <div
            key={phone.id || index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {formatPhoneDisplay(phone.number)}
                </p>
                {phone.isPrimary && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    Numéro principal
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {phones.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            Aucun numéro de téléphone enregistré
          </p>
        )}
      </div>
    </div>
  );
};
```

---

## 4️⃣ Composant - PhoneNumbersEdit.tsx

```tsx
// src/components/vendor/PhoneNumbersEdit.tsx

import React, { useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import {
  validateSenegalPhone,
  normalizeSenegalPhone,
  validatePrimaryPhone,
  hasPhoneDuplicates,
} from '../../utils/phoneValidation';

interface PhoneNumber {
  number: string;
  isPrimary: boolean;
}

interface PhoneNumbersEditProps {
  initialPhones: PhoneNumber[];
  onSave: (phones: PhoneNumber[]) => Promise<void>;
  onCancel: () => void;
}

export const PhoneNumbersEdit: React.FC<PhoneNumbersEditProps> = ({
  initialPhones,
  onSave,
  onCancel,
}) => {
  const [phones, setPhones] = useState<PhoneNumber[]>(
    initialPhones.length > 0 ? initialPhones : [
      { number: '', isPrimary: true },
      { number: '', isPrimary: false },
    ]
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddPhone = () => {
    if (phones.length >= 3) {
      alert('Vous ne pouvez ajouter que 3 numéros maximum');
      return;
    }
    setPhones([...phones, { number: '', isPrimary: false }]);
  };

  const handleRemovePhone = (index: number) => {
    if (phones.length <= 2) {
      alert('Vous devez avoir au moins 2 numéros');
      return;
    }
    const newPhones = phones.filter((_, i) => i !== index);
    setPhones(newPhones);
  };

  const handlePhoneChange = (index: number, number: string) => {
    const newPhones = [...phones];
    newPhones[index].number = number;
    setPhones(newPhones);
  };

  const handleSetPrimary = (index: number) => {
    const newPhones = phones.map((phone, i) => ({
      ...phone,
      isPrimary: i === index,
    }));
    setPhones(newPhones);
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    // Vérifier le nombre de numéros
    if (phones.length < 2) {
      newErrors.push('Vous devez fournir au moins 2 numéros');
    }
    if (phones.length > 3) {
      newErrors.push('Vous ne pouvez pas fournir plus de 3 numéros');
    }

    // Vérifier que tous les numéros sont remplis et valides
    phones.forEach((phone, index) => {
      if (!phone.number.trim()) {
        newErrors.push(`Le numéro ${index + 1} est vide`);
      } else if (!validateSenegalPhone(phone.number)) {
        newErrors.push(
          `Le numéro ${index + 1} est invalide (format: +221XXXXXXXXX ou 7XXXXXXXX)`
        );
      }
    });

    // Vérifier qu'il y a exactement un numéro principal
    if (!validatePrimaryPhone(phones)) {
      newErrors.push('Vous devez désigner exactement un numéro comme principal');
    }

    // Vérifier les doublons
    if (hasPhoneDuplicates(phones)) {
      newErrors.push('Vous avez saisi le même numéro plusieurs fois');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Normaliser les numéros avant de sauvegarder
      const normalizedPhones = phones.map(phone => ({
        ...phone,
        number: normalizeSenegalPhone(phone.number),
      }));

      await onSave(normalizedPhones);
    } catch (error: any) {
      setErrors([error.response?.data?.message || 'Erreur lors de la sauvegarde']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Modifier les numéros de téléphone
      </h3>

      {/* Messages d'erreur */}
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Liste des numéros */}
      <div className="space-y-3 mb-4">
        {phones.map((phone, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={phone.number}
              onChange={(e) => handlePhoneChange(index, e.target.value)}
              placeholder="+221 77 123 45 67"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              type="button"
              onClick={() => handleSetPrimary(index)}
              className={`p-2 rounded-lg transition-colors ${
                phone.isPrimary
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={phone.isPrimary ? 'Numéro principal' : 'Définir comme principal'}
            >
              <Star
                className={`w-5 h-5 ${phone.isPrimary ? 'fill-yellow-400' : ''}`}
              />
            </button>

            {phones.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemovePhone(index)}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                title="Supprimer ce numéro"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bouton ajouter */}
      {phones.length < 3 && (
        <button
          type="button"
          onClick={handleAddPhone}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-5 h-5" />
          Ajouter un numéro
        </button>
      )}

      {/* Aide */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Format accepté :</strong> +221XXXXXXXXX ou 7XXXXXXXX
          <br />
          <strong>Nombre de numéros :</strong> Minimum 2, maximum 3
          <br />
          <strong>Numéro principal :</strong> Cliquez sur l'étoile ⭐
        </p>
      </div>

      {/* Boutons actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
};
```

---

## 5️⃣ Page - VendorProfilePage.tsx

```tsx
// src/pages/vendor/VendorProfilePage.tsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PhoneNumbersList } from '../../components/vendor/PhoneNumbersList';
import { PhoneNumbersEdit } from '../../components/vendor/PhoneNumbersEdit';
import { vendorOnboardingService, ProfileData } from '../../services/vendorOnboardingService';

export const VendorProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPhones, setEditingPhones] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await vendorOnboardingService.getOnboardingInfo();
      setProfile(response.data);
    } catch (error: any) {
      console.error('Erreur chargement profil:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhones = async (phones: Array<{ number: string; isPrimary: boolean }>) => {
    try {
      await vendorOnboardingService.updatePhones(phones);
      toast.success('Numéros mis à jour avec succès');
      setEditingPhones(false);
      await loadProfile(); // Recharger le profil
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Erreur lors du chargement du profil</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mon Profil Vendeur
        </h1>

        {/* Photo de profil */}
        {profile.profileImage && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Photo de profil
            </h3>
            <img
              src={profile.profileImage}
              alt="Photo de profil"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
            />
          </div>
        )}

        {/* Numéros de téléphone */}
        {editingPhones ? (
          <PhoneNumbersEdit
            initialPhones={profile.phones.map(p => ({
              number: p.number,
              isPrimary: p.isPrimary,
            }))}
            onSave={handleSavePhones}
            onCancel={() => setEditingPhones(false)}
          />
        ) : (
          <PhoneNumbersList
            phones={profile.phones}
            onEdit={() => setEditingPhones(true)}
            showEditButton={true}
          />
        )}

        {/* Réseaux sociaux */}
        {profile.socialMedia.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Réseaux sociaux
            </h3>
            <div className="space-y-2">
              {profile.socialMedia.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="capitalize font-medium text-gray-700">
                    {social.platform}
                  </span>
                  <span className="text-blue-600 text-sm">
                    @{social.username || 'Voir le profil'}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 6️⃣ Intégration dans les routes

```tsx
// src/App.tsx ou src/routes/index.tsx

import { VendorProfilePage } from './pages/vendor/VendorProfilePage';

// Ajouter la route
<Route path="/vendeur/profil" element={<VendorProfilePage />} />
```

---

## 🎨 Styles Tailwind utilisés

Tous les composants utilisent Tailwind CSS. Si vous n'avez pas Tailwind, voici les classes principales à adapter :

- `bg-white` → fond blanc
- `rounded-lg` → coins arrondis
- `shadow-sm` → ombre légère
- `p-6` → padding de 1.5rem
- `text-blue-600` → texte bleu
- `hover:bg-blue-700` → hover bleu foncé

---

## ✅ Checklist d'implémentation

- [ ] Créer `vendorOnboardingService.ts`
- [ ] Créer `phoneValidation.ts`
- [ ] Créer `PhoneNumbersList.tsx`
- [ ] Créer `PhoneNumbersEdit.tsx`
- [ ] Créer `VendorProfilePage.tsx`
- [ ] Ajouter la route `/vendeur/profil`
- [ ] Installer `lucide-react` : `npm install lucide-react`
- [ ] Installer `react-hot-toast` : `npm install react-hot-toast`
- [ ] Tester l'affichage des numéros
- [ ] Tester la modification des numéros

---

## 🧪 Test rapide

1. **Naviguer vers** `/vendeur/profil`
2. **Voir les numéros** enregistrés
3. **Cliquer sur "Modifier"**
4. **Modifier un numéro**, changer le principal
5. **Sauvegarder** et vérifier que ça fonctionne

---

**Le frontend est maintenant complet pour gérer les numéros de téléphone !** 🎉
