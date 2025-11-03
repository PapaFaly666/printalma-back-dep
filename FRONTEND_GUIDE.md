# 🎨 Guide Frontend - API Designers PrintAlma

## 🚀 Démarrage rapide

### URLs de l'API

```typescript
const API_URL = 'http://localhost:3004';

// Endpoints publics
GET  /designers/health          // Health check
GET  /designers/featured        // 6 designers en vedette

// Endpoints admin (JWT requis)
GET    /designers/admin         // Liste tous
POST   /designers/admin         // Créer
PUT    /designers/admin/:id     // Modifier
DELETE /designers/admin/:id     // Supprimer
PUT    /designers/featured/update  // Update featured (6 IDs)
```

---

## 📝 Types TypeScript

```typescript
interface Designer {
  id: number;
  name: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  featuredOrder: number | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    firstName: string;
    lastName: string;
  };
}
```

---

## 🔧 Service API

```typescript
// services/designers.service.ts
class DesignersService {
  private getToken = () => localStorage.getItem('authToken');
  private headers = () => ({ Authorization: `Bearer ${this.getToken()}` });

  // PUBLIC - Designers en vedette
  async getFeatured(): Promise<Designer[]> {
    const res = await fetch('http://localhost:3004/designers/featured');
    return res.json();
  }

  // ADMIN - Liste complète
  async getAll(): Promise<{ designers: Designer[]; total: number }> {
    const res = await fetch('http://localhost:3004/designers/admin', {
      headers: this.headers()
    });
    return res.json();
  }

  // ADMIN - Créer
  async create(data: { name: string; bio?: string; avatar?: File }): Promise<Designer> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.bio) formData.append('bio', data.bio);
    if (data.avatar) formData.append('avatar', data.avatar);

    const res = await fetch('http://localhost:3004/designers/admin', {
      method: 'POST',
      headers: this.headers(),
      body: formData,
    });
    return res.json();
  }

  // ADMIN - Modifier
  async update(id: number, data: any): Promise<Designer> {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) formData.append(key, data[key]);
    });

    const res = await fetch(`http://localhost:3004/designers/admin/${id}`, {
      method: 'PUT',
      headers: this.headers(),
      body: formData,
    });
    return res.json();
  }

  // ADMIN - Supprimer
  async delete(id: number): Promise<void> {
    await fetch(`http://localhost:3004/designers/admin/${id}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
  }

  // ADMIN - Update featured (EXACTEMENT 6 IDs)
  async updateFeatured(ids: string[]): Promise<Designer[]> {
    const res = await fetch('http://localhost:3004/designers/featured/update', {
      method: 'PUT',
      headers: {
        ...this.headers(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ designerIds: ids }),
    });
    return res.json();
  }
}

export const designersService = new DesignersService();
```

---

## 🎨 Composant React - Featured (Public)

```tsx
// Page d'accueil
import { useEffect, useState } from 'react';

export function FeaturedDesigners() {
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    designersService.getFeatured()
      .then(setDesigners)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold text-center mb-12">
        Nos Designers
      </h2>
      <div className="grid grid-cols-3 gap-8">
        {designers.map(d => (
          <div key={d.id} className="bg-white rounded-lg shadow p-6">
            {d.avatarUrl && (
              <img src={d.avatarUrl} alt={d.name} className="w-24 h-24 rounded-full mx-auto mb-4" />
            )}
            <h3 className="text-xl font-semibold text-center">
              {d.displayName || d.name}
            </h3>
            {d.bio && <p className="text-gray-600 text-sm mt-2">{d.bio}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## 📊 Composant Admin - Liste

```tsx
export function DesignersAdmin() {
  const [designers, setDesigners] = useState([]);

  useEffect(() => {
    loadDesigners();
  }, []);

  const loadDesigners = async () => {
    const { designers } = await designersService.getAll();
    setDesigners(designers);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Supprimer "${name}" ?`)) {
      await designersService.delete(id);
      loadDesigners();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Designers</h2>
      <table className="w-full">
        <thead>
          <tr>
            <th>Avatar</th>
            <th>Nom</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {designers.map(d => (
            <tr key={d.id}>
              <td>
                {d.avatarUrl && <img src={d.avatarUrl} className="h-10 w-10 rounded-full" />}
              </td>
              <td>{d.displayName || d.name}</td>
              <td>{d.isActive ? '✅' : '❌'}</td>
              <td>
                <button onClick={() => handleDelete(d.id, d.name)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## ✏️ Formulaire Création

```tsx
export function DesignerForm() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<File>();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await designersService.create({ name, bio, avatar });
    alert('Designer créé!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Nom *</label>
        <input
          required
          minLength={2}
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border rounded px-4 py-2"
        />
      </div>

      <div>
        <label>Bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          className="w-full border rounded px-4 py-2"
        />
      </div>

      <div>
        <label>Avatar</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setAvatar(e.target.files?.[0])}
        />
      </div>

      <button className="bg-blue-600 text-white px-6 py-2 rounded">
        Créer
      </button>
    </form>
  );
}
```

---

## ⭐ Gestion Featured (6 designers)

```tsx
export function FeaturedManager() {
  const [designers, setDesigners] = useState([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    loadDesigners();
  }, []);

  const loadDesigners = async () => {
    const { designers } = await designersService.getAll();
    setDesigners(designers);

    // Charger les featured actuels
    const featured = designers
      .filter(d => d.isFeatured)
      .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))
      .map(d => String(d.id));
    setSelected(featured);
  };

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else {
      if (selected.length >= 6) return alert('Max 6 designers');
      setSelected([...selected, id]);
    }
  };

  const save = async () => {
    if (selected.length !== 6) return alert('Exactement 6 requis');
    await designersService.updateFeatured(selected);
    alert('Mis à jour!');
    loadDesigners();
  };

  return (
    <div>
      <h2>Designers en Vedette ({selected.length}/6)</h2>
      <button onClick={save} disabled={selected.length !== 6}>
        Enregistrer
      </button>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {designers.filter(d => d.isActive).map(d => (
          <div
            key={d.id}
            onClick={() => toggle(String(d.id))}
            className={`p-4 border rounded cursor-pointer ${
              selected.includes(String(d.id)) ? 'bg-blue-100' : ''
            }`}
          >
            <input type="checkbox" checked={selected.includes(String(d.id))} readOnly />
            <span className="ml-2">{d.displayName || d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔒 Authentification

```typescript
// Après login
localStorage.setItem('authToken', token);

// Logout
localStorage.removeItem('authToken');

// Vérifier auth
const isAuthenticated = () => !!localStorage.getItem('authToken');
```

---

## ⚠️ Erreurs courantes

```typescript
// Gestion d'erreurs
try {
  await designersService.create(data);
} catch (error) {
  if (error.message.includes('401')) {
    // Token expiré
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    alert('Accès refusé - Admin requis');
  } else {
    alert(error.message);
  }
}
```

---

## ✅ Checklist

- [ ] Service API créé
- [ ] Types définis
- [ ] Composant Featured (public)
- [ ] Composant Liste admin
- [ ] Composant Formulaire
- [ ] Composant Featured Manager
- [ ] JWT stocké après login
- [ ] Gestion erreurs

---

## 🎯 Points clés

1. **Featured**: Exactement 6 designers
2. **Upload**: FormData (pas JSON)
3. **Auth**: Bearer token
4. **Max avatar**: 10MB
5. **Formats**: JPG, PNG, GIF, WEBP, SVG

Bon dev! 🚀
