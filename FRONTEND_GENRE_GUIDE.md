# 🎯 Guide Frontend - Ajout du Champ Genre dans les Mockups

## 📋 Vue d'ensemble

Ce guide fournit les endpoints, requests et responses pour intégrer le champ `genre` dans les mockups côté frontend.

## 🎯 Genres Disponibles

```javascript
const GENRES = {
  HOMME: 'HOMME',    // Mockups pour hommes
  FEMME: 'FEMME',    // Mockups pour femmes
  BEBE: 'BEBE',      // Mockups pour bébés/enfants
  UNISEXE: 'UNISEXE' // Mockups pour tous (valeur par défaut)
};
```

## 🔗 Endpoints Disponibles

### 1. **POST /mockups** - Créer un mockup avec genre

**Request:**
```javascript
const createMockup = async (mockupData) => {
  const response = await fetch('http://localhost:3004/mockups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'T-shirt Homme Classic',
      description: 'T-shirt basique pour homme en coton',
      price: 5000,
      status: 'draft',
      isReadyProduct: false,
      genre: 'HOMME', // ← NOUVEAU CHAMP
      categories: ['T-shirts', 'Homme'],
      sizes: ['S', 'M', 'L', 'XL'],
      colorVariations: [
        {
          name: 'Noir',
          colorCode: '#000000',
          images: [
            {
              view: 'Front',
              delimitations: [
                {
                  x: 10,
                  y: 10,
                  width: 80,
                  height: 80,
                  name: 'Zone principale'
                }
              ]
            }
          ]
        }
      ]
    })
  });
  
  return await response.json();
};
```

**Response:**
```json
{
  "id": 123,
  "name": "T-shirt Homme Classic",
  "description": "T-shirt basique pour homme en coton",
  "price": 5000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "HOMME",
  "categories": [
    {
      "id": 1,
      "name": "T-shirts"
    },
    {
      "id": 2,
      "name": "Homme"
    }
  ],
  "colorVariations": [
    {
      "id": 1,
      "name": "Noir",
      "colorCode": "#000000",
      "images": [...]
    }
  ],
  "sizes": [
    {
      "id": 1,
      "sizeName": "S"
    },
    {
      "id": 2,
      "sizeName": "M"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. **GET /mockups/by-genre/:genre** - Récupérer les mockups par genre

**Request:**
```javascript
const getMockupsByGenre = async (genre) => {
  const response = await fetch(`http://localhost:3004/mockups/by-genre/${genre}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  return await response.json();
};

// Exemples d'utilisation
const hommeMockups = await getMockupsByGenre('HOMME');
const femmeMockups = await getMockupsByGenre('FEMME');
const bebeMockups = await getMockupsByGenre('BEBE');
const unisexeMockups = await getMockupsByGenre('UNISEXE');
```

**Response:**
```json
[
  {
    "id": 123,
    "name": "T-shirt Homme Classic",
    "description": "T-shirt basique pour homme en coton",
    "price": 5000,
    "status": "draft",
    "isReadyProduct": false,
    "genre": "HOMME",
    "categories": [...],
    "colorVariations": [...],
    "sizes": [...],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": 124,
    "name": "Polo Homme Sport",
    "description": "Polo sport pour homme",
    "price": 6000,
    "status": "published",
    "isReadyProduct": false,
    "genre": "HOMME",
    "categories": [...],
    "colorVariations": [...],
    "sizes": [...],
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
]
```

### 3. **GET /mockups/genres** - Récupérer tous les genres disponibles

**Request:**
```javascript
const getAvailableGenres = async () => {
  const response = await fetch('http://localhost:3004/mockups/genres', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  return await response.json();
};

const genres = await getAvailableGenres();
console.log('Genres disponibles:', genres);
// Output: ['HOMME', 'FEMME', 'BEBE', 'UNISEXE']
```

**Response:**
```json
["HOMME", "FEMME", "BEBE", "UNISEXE"]
```

### 4. **GET /mockups** - Récupérer tous les mockups avec filtre par genre

**Request:**
```javascript
const getAllMockups = async (genre = null) => {
  const url = genre 
    ? `http://localhost:3004/mockups?genre=${genre}`
    : 'http://localhost:3004/mockups';
    
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  return await response.json();
};

// Tous les mockups
const allMockups = await getAllMockups();

// Mockups filtrés par genre
const hommeMockups = await getAllMockups('HOMME');
const femmeMockups = await getAllMockups('FEMME');
```

**Response:**
```json
[
  {
    "id": 123,
    "name": "T-shirt Homme Classic",
    "description": "T-shirt basique pour homme en coton",
    "price": 5000,
    "status": "draft",
    "isReadyProduct": false,
    "genre": "HOMME",
    "categories": [...],
    "colorVariations": [...],
    "sizes": [...],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### 5. **PATCH /mockups/:id** - Mettre à jour un mockup avec genre

**Request:**
```javascript
const updateMockup = async (id, updateData) => {
  const response = await fetch(`http://localhost:3004/mockups/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'T-shirt Femme Élégant',
      genre: 'FEMME', // ← NOUVEAU CHAMP
      price: 6000
    })
  });
  
  return await response.json();
};

const updatedMockup = await updateMockup(123, {
  name: 'T-shirt Femme Élégant',
  genre: 'FEMME',
  price: 6000
});
```

**Response:**
```json
{
  "id": 123,
  "name": "T-shirt Femme Élégant",
  "description": "T-shirt basique pour homme en coton",
  "price": 6000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "FEMME",
  "categories": [...],
  "colorVariations": [...],
  "sizes": [...],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

### 6. **GET /mockups/:id** - Récupérer un mockup par ID

**Request:**
```javascript
const getMockupById = async (id) => {
  const response = await fetch(`http://localhost:3004/mockups/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  return await response.json();
};

const mockup = await getMockupById(123);
```

**Response:**
```json
{
  "id": 123,
  "name": "T-shirt Homme Classic",
  "description": "T-shirt basique pour homme en coton",
  "price": 5000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "HOMME",
  "categories": [...],
  "colorVariations": [...],
  "sizes": [...],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## 🎨 Exemples d'Intégration Frontend

### Formulaire de Création de Mockup

```javascript
const CreateMockupForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    status: 'draft',
    isReadyProduct: false,
    genre: 'UNISEXE', // ← Valeur par défaut
    categories: [],
    sizes: [],
    colorVariations: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await createMockup(formData);
      console.log('Mockup créé:', response);
    } catch (error) {
      console.error('Erreur création mockup:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nom du mockup"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />
      
      <input
        type="number"
        placeholder="Prix"
        value={formData.price}
        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
      />
      
      {/* ← NOUVEAU: Sélecteur de genre */}
      <select
        value={formData.genre}
        onChange={(e) => setFormData({...formData, genre: e.target.value})}
      >
        <option value="UNISEXE">Unisexe</option>
        <option value="HOMME">Homme</option>
        <option value="FEMME">Femme</option>
        <option value="BEBE">Bébé</option>
      </select>
      
      <button type="submit">Créer Mockup</button>
    </form>
  );
};
```

### Filtrage par Genre

```javascript
const MockupList = () => {
  const [mockups, setMockups] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('ALL');

  useEffect(() => {
    const fetchMockups = async () => {
      try {
        let response;
        if (selectedGenre === 'ALL') {
          response = await getAllMockups();
        } else {
          response = await getMockupsByGenre(selectedGenre);
        }
        setMockups(response);
      } catch (error) {
        console.error('Erreur récupération mockups:', error);
      }
    };

    fetchMockups();
  }, [selectedGenre]);

  return (
    <div>
      {/* Filtre par genre */}
      <select
        value={selectedGenre}
        onChange={(e) => setSelectedGenre(e.target.value)}
      >
        <option value="ALL">Tous les genres</option>
        <option value="HOMME">Homme</option>
        <option value="FEMME">Femme</option>
        <option value="BEBE">Bébé</option>
        <option value="UNISEXE">Unisexe</option>
      </select>

      {/* Liste des mockups */}
      <div className="mockup-grid">
        {mockups.map(mockup => (
          <div key={mockup.id} className="mockup-card">
            <h3>{mockup.name}</h3>
            <p>{mockup.description}</p>
            <p>Prix: {mockup.price} FCFA</p>
            <span className={`genre-badge genre-${mockup.genre.toLowerCase()}`}>
              {mockup.genre}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🎯 Validation des Erreurs

### Erreurs Possibles

```javascript
// Genre invalide
{
  "statusCode": 400,
  "message": ["Le genre doit être \"HOMME\", \"FEMME\", \"BEBE\" ou \"UNISEXE\""],
  "error": "Bad Request"
}

// isReadyProduct = true (interdit pour les mockups)
{
  "statusCode": 400,
  "message": "Les mockups doivent avoir isReadyProduct: false",
  "error": "Bad Request"
}

// Mockup introuvable
{
  "statusCode": 404,
  "message": "Mockup 123 introuvable",
  "error": "Not Found"
}
```

## 🎨 CSS pour les Badges de Genre

```css
.genre-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.genre-homme {
  background-color: #3b82f6;
  color: white;
}

.genre-femme {
  background-color: #ec4899;
  color: white;
}

.genre-bebe {
  background-color: #f59e0b;
  color: white;
}

.genre-unisexe {
  background-color: #6b7280;
  color: white;
}
```

## ✅ Checklist d'Intégration

- [x] Ajouter le champ `genre` dans les formulaires de création
- [x] Ajouter le champ `genre` dans les formulaires de mise à jour
- [x] Afficher le genre dans les listes de mockups
- [x] Implémenter le filtrage par genre
- [x] Ajouter les badges de genre avec CSS
- [x] Gérer les erreurs de validation
- [x] Tester tous les endpoints

---

**Note** : Tous les endpoints nécessitent une authentification admin (`Authorization: Bearer <admin-token>`). Le champ `genre` est optionnel lors de la création et prend la valeur `UNISEXE` par défaut. 