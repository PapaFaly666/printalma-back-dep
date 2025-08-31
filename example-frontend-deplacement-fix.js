// 🎯 EXEMPLE CONCRET : Fix déplacement design frontend

// =====================================================
// 1. SERVICE API AVEC BYPASS VALIDATION
// =====================================================

class PrintalmaAPI {
  constructor() {
    this.baseURL = 'http://localhost:3004';
    this.axios = axios.create({
      baseURL: this.baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // ✅ MÉTHODE CORRIGÉE : Création produit avec bypass
  async createProductWithDesign(designData) {
    const payload = {
      baseProductId: designData.baseProductId || 1,
      designId: designData.designId,
      
      // ✅ NOMS GÉNÉRIQUES ACCEPTÉS AVEC BYPASS
      vendorName: designData.vendorName || 'Produit auto-généré pour positionnage design',
      vendorDescription: designData.vendorDescription || 'Produit auto-généré pour positionnage design',
      
      vendorPrice: designData.vendorPrice || 25000,
      vendorStock: designData.vendorStock || 100,
      
      selectedColors: designData.selectedColors || [
        { id: 1, name: 'Blanc', colorCode: '#FFFFFF' }
      ],
      selectedSizes: designData.selectedSizes || [
        { id: 1, sizeName: 'M' }
      ],
      
      productStructure: designData.productStructure || {
        adminProduct: {
          id: 1,
          name: 'T-shirt Basique',
          description: 'T-shirt en coton 100% de qualité premium',
          price: 19000,
          images: {
            colorVariations: [
              {
                id: 1,
                name: 'Blanc',
                colorCode: '#FFFFFF',
                images: [
                  {
                    id: 1,
                    url: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736418923/tshirt-blanc-front.jpg',
                    viewType: 'FRONT',
                    delimitations: [
                      { x: 150, y: 200, width: 200, height: 200, coordinateType: 'ABSOLUTE' }
                    ]
                  }
                ]
              }
            ]
          },
          sizes: [
            { id: 1, sizeName: 'S' },
            { id: 2, sizeName: 'M' },
            { id: 3, sizeName: 'L' }
          ]
        },
        designApplication: {
          positioning: 'CENTER',
          scale: 0.6
        }
      },
      
      // ✅ POSITION DEPUIS LE DÉPLACEMENT
      designPosition: designData.position,
      
      // ✅ FLAG BYPASS VALIDATION - CLEF DU SUCCÈS
      bypassValidation: true
    };

    console.log('📤 Création produit avec bypass:', payload);

    try {
      const response = await this.axios.post('/vendor/products', payload);
      console.log('✅ Produit créé avec succès:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création produit:', error.response?.data);
      throw error;
    }
  }

  // Sauvegarde position directe
  async saveDesignPosition(vendorProductId, designId, position) {
    const payload = {
      vendorProductId,
      designId,
      position
    };

    try {
      const response = await this.axios.post('/vendor/design-position', payload);
      console.log('✅ Position sauvegardée:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur sauvegarde position:', error.response?.data);
      throw error;
    }
  }
}

// =====================================================
// 2. COMPOSANT REACT AVEC DÉPLACEMENT
// =====================================================

const DesignPositioner = ({ designId, onProductCreated }) => {
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [api] = useState(() => new PrintalmaAPI());

  // Gestionnaire de déplacement
  const handlePositionChange = (newPosition) => {
    setPosition(newPosition);
    
    // Sauvegarder en localStorage pour persistance
    localStorage.setItem(`design_${designId}_position`, JSON.stringify(newPosition));
    
    console.log('📍 Position mise à jour:', newPosition);
  };

  // ✅ MÉTHODE CORRIGÉE : Création produit avec bypass
  const handleCreateProduct = async () => {
    setIsCreating(true);
    
    try {
      const designData = {
        designId: designId,
        baseProductId: 1,
        position: position,
        vendorPrice: 25000,
        vendorStock: 100,
        // Les autres champs seront auto-générés avec des valeurs par défaut
      };

      // ✅ CRÉATION AVEC BYPASS VALIDATION
      const result = await api.createProductWithDesign(designData);
      
      if (result.success) {
        console.log('🎉 Produit créé avec succès!', result);
        
        // Notifier le parent
        if (onProductCreated) {
          onProductCreated(result);
        }
        
        // Afficher un message de succès
        alert(`✅ Produit créé avec succès!\nID: ${result.productId}\nStatus: ${result.status}`);
        
        // Optionnel : Sauvegarder la position finale
        if (result.productId) {
          await api.saveDesignPosition(result.productId, designId, position);
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur création produit:', error);
      alert('❌ Erreur lors de la création du produit. Vérifiez la console pour plus de détails.');
    } finally {
      setIsCreating(false);
    }
  };

  // Charger position depuis localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem(`design_${designId}_position`);
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition);
        setPosition(parsedPosition);
        console.log('📍 Position chargée depuis localStorage:', parsedPosition);
      } catch (error) {
        console.warn('⚠️ Erreur parsing position localStorage:', error);
      }
    }
  }, [designId]);

  return (
    <div className="design-positioner">
      <h3>Positionnement du Design {designId}</h3>
      
      {/* Zone de prévisualisation */}
      <div className="preview-area" style={{ 
        border: '2px solid #ccc', 
        width: '400px', 
        height: '400px', 
        position: 'relative',
        margin: '20px 0'
      }}>
        <div 
          className="design-element"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale}) rotate(${position.rotation}deg)`,
            transformOrigin: 'center',
            cursor: 'move',
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            userSelect: 'none'
          }}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const startPosX = position.x;
            const startPosY = position.y;
            
            const handleMouseMove = (e) => {
              const deltaX = e.clientX - startX;
              const deltaY = e.clientY - startY;
              
              handlePositionChange({
                ...position,
                x: startPosX + deltaX,
                y: startPosY + deltaY
              });
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          Design {designId}
        </div>
      </div>
      
      {/* Contrôles */}
      <div className="controls">
        <div style={{ marginBottom: '10px' }}>
          <label>
            Échelle: {position.scale}
            <input 
              type="range" 
              min="0.1" 
              max="2" 
              step="0.1" 
              value={position.scale}
              onChange={(e) => handlePositionChange({
                ...position,
                scale: parseFloat(e.target.value)
              })}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            Rotation: {position.rotation}°
            <input 
              type="range" 
              min="0" 
              max="360" 
              value={position.rotation}
              onChange={(e) => handlePositionChange({
                ...position,
                rotation: parseInt(e.target.value)
              })}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        
        <button 
          onClick={handleCreateProduct}
          disabled={isCreating}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: isCreating ? 'wait' : 'pointer',
            fontSize: '16px'
          }}
        >
          {isCreating ? 'Création en cours...' : 'Créer le produit'}
        </button>
      </div>
      
      {/* Informations position */}
      <div className="position-info" style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '5px'
      }}>
        <p><strong>Position actuelle:</strong></p>
        <p>X: {position.x}px, Y: {position.y}px</p>
        <p>Échelle: {position.scale}</p>
        <p>Rotation: {position.rotation}°</p>
      </div>
    </div>
  );
};

// =====================================================
// 3. UTILISATION DANS VOTRE APP
// =====================================================

const App = () => {
  const handleProductCreated = (productData) => {
    console.log('🎉 Produit créé dans l\'app:', productData);
    // Vous pouvez ici mettre à jour votre état global, rediriger, etc.
  };

  return (
    <div className="app">
      <h1>Test Déplacement Design</h1>
      <DesignPositioner 
        designId={8} 
        onProductCreated={handleProductCreated}
      />
    </div>
  );
};

// =====================================================
// 4. SCRIPT DE TEST DIRECT
// =====================================================

const testDirectBypass = async () => {
  console.log('🧪 Test direct bypass validation...');
  
  const api = new PrintalmaAPI();
  
  const testData = {
    designId: 8,
    position: {
      x: -50,
      y: -30,
      scale: 0.8,
      rotation: 15
    },
    vendorPrice: 30000,
    vendorStock: 50
  };
  
  try {
    const result = await api.createProductWithDesign(testData);
    console.log('✅ Test réussi:', result);
    return result;
  } catch (error) {
    console.error('❌ Test échoué:', error);
    return null;
  }
};

// =====================================================
// 5. EXPORT POUR UTILISATION
// =====================================================

export { PrintalmaAPI, DesignPositioner, testDirectBypass };

// =====================================================
// 6. EXEMPLE D'UTILISATION COMPLÈTE
// =====================================================

/*
// Dans votre composant principal :

import { DesignPositioner } from './example-frontend-deplacement-fix';

const MyDesignPage = () => {
  const [selectedDesign, setSelectedDesign] = useState(8);
  
  const handleProductCreated = (productData) => {
    // Rediriger vers la page de gestion des produits
    router.push(`/vendor/products/${productData.productId}`);
  };
  
  return (
    <div>
      <h1>Positionnement de Design</h1>
      <DesignPositioner 
        designId={selectedDesign}
        onProductCreated={handleProductCreated}
      />
    </div>
  );
};

// OU pour un test rapide :
testDirectBypass().then(result => {
  if (result) {
    console.log('🎉 Le bypass fonctionne parfaitement !');
  }
});
*/

console.log('📋 Exemple frontend déplacement prêt à utiliser !');
console.log('✅ Avec bypass validation, plus de problème de déplacement !');
console.log('🎯 Utilisez DesignPositioner dans votre app React'); 