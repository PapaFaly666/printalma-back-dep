import React, { useState, useCallback } from 'react';
import axios from 'axios';

// Configuration d'axios pour inclure les cookies
axios.defaults.withCredentials = true;

const GalleryCreateComponent = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdGallery, setCreatedGallery] = useState(null);

  // Validation des images
  const validateImages = useCallback((files) => {
    const errors = [];

    if (files.length !== 5) {
      errors.push(`Vous devez sélectionner exactement 5 images (${files.length}/5)`);
      return errors;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    files.forEach((file, index) => {
      if (!validTypes.includes(file.type)) {
        errors.push(`L'image ${index + 1} (${file.name}) n'est pas un format valide`);
      }
      if (file.size > maxSize) {
        errors.push(`L'image ${index + 1} (${file.name}) est trop grande (max 10MB)`);
      }
    });

    return errors;
  }, []);

  // Gérer la sélection d'images
  const handleImageSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    const errors = validateImages(files);

    if (errors.length > 0) {
      setError(errors.join('. '));
      setImages([]);
      setPreviews([]);
      return;
    }

    setError('');
    setImages(files);

    // Créer les aperçus
    const previewPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previewPromises).then(previewUrls => {
      setPreviews(previewUrls);
    });
  }, [validateImages]);

  // Gérer les changements du formulaire
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Effacer les erreurs lors de la saisie
    if (name === 'title' && value.length >= 3) {
      setError('');
    }
  }, []);

  // Supprimer une image
  const removeImage = useCallback((index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    setImages(newImages);
    setPreviews(newPreviews);

    if (newImages.length !== 5) {
      setError('Vous devez avoir exactement 5 images');
    }
  }, [images, previews]);

  // Soumettre le formulaire
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (formData.title.length < 3) {
      setError('Le titre doit contenir au moins 3 caractères');
      setLoading(false);
      return;
    }

    if (images.length !== 5) {
      setError('Vous devez sélectionner exactement 5 images');
      setLoading(false);
      return;
    }

    try {
      // Créer FormData
      const data = new FormData();
      data.append('title', formData.title);

      if (formData.description) {
        data.append('description', formData.description);
      }

      // Ajouter les images
      images.forEach((image) => {
        data.append('images', image);
      });

      // Envoyer la requête
      const response = await axios.post('/vendor/galleries', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      setSuccess('Galerie créée avec succès!');
      setCreatedGallery(response.data.data);

      // Réinitialiser le formulaire
      setFormData({ title: '', description: '' });
      setImages([]);
      setPreviews([]);

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la création de la galerie';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, images]);

  return (
    <div className="gallery-create">
      <h2>Créer une nouvelle galerie</h2>

      <div className="info-box">
        <p><strong>Important:</strong> Vous devez sélectionner <strong>exactement 5 images</strong>.</p>
        <p>Formats acceptés: JPG, PNG, GIF, WebP (max 10MB par image)</p>
      </div>

      <form onSubmit={handleSubmit} className="gallery-form">
        <div className="form-group">
          <label htmlFor="title">Titre de la galerie *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            minLength={3}
            maxLength={100}
            placeholder="Ma nouvelle galerie"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            maxLength={500}
            placeholder="Description de votre galerie (optionnel)"
            className="form-control"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="images">Sélectionner 5 images *</label>
          <input
            type="file"
            id="images"
            name="images"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            required
            className="form-control"
          />
          {images.length > 0 && (
            <div className={`image-count ${images.length === 5 ? 'valid' : 'invalid'}`}>
              {images.length}/5 images sélectionnées
            </div>
          )}
        </div>

        {/* Aperçu des images */}
        {previews.length > 0 && (
          <div className="image-previews">
            <h4>Aperçu des images:</h4>
            <div className="preview-grid">
              {previews.map((preview, index) => (
                <div key={index} className="preview-item">
                  <span className="image-number">{index + 1}</span>
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeImage(index)}
                    aria-label="Supprimer l'image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages d'erreur/succès */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button
          type="submit"
          disabled={loading || images.length !== 5}
          className="btn btn-primary"
        >
          {loading ? 'Création en cours...' : 'Créer la galerie'}
        </button>
      </form>

      {/* Résultat de la création */}
      {createdGallery && (
        <div className="gallery-result">
          <h3>Galerie créée!</h3>
          <div className="gallery-info">
            <p><strong>ID:</strong> {createdGallery.id}</p>
            <p><strong>Titre:</strong> {createdGallery.title}</p>
            <p><strong>Statut:</strong> {createdGallery.status}</p>
            <p><strong>Images:</strong> {createdGallery.images.length} images uploadées</p>
          </div>

          <details>
            <summary>Voir les détails complets</summary>
            <pre>{JSON.stringify(createdGallery, null, 2)}</pre>
          </details>
        </div>
      )}

      <style jsx>{`
        .gallery-create {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .info-box {
          background: #f0f8ff;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          border-left: 4px solid #007bff;
        }

        .gallery-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 5px;
          font-weight: bold;
        }

        .form-control {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
        }

        .image-count {
          margin-top: 5px;
          font-weight: bold;
        }

        .image-count.valid {
          color: green;
        }

        .image-count.invalid {
          color: red;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .preview-item {
          position: relative;
          border: 1px solid #ddd;
          border-radius: 5px;
          overflow: hidden;
        }

        .preview-item img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .image-number {
          position: absolute;
          top: 5px;
          left: 5px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 12px;
        }

        .remove-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: red;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 18px;
        }

        .alert {
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        }

        .alert-error {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ffcdd2;
        }

        .alert-success {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #c8e6c9;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .gallery-result {
          margin-top: 30px;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 5px;
        }

        .gallery-info {
          margin: 15px 0;
        }

        .gallery-info p {
          margin: 5px 0;
        }

        details {
          margin-top: 15px;
        }

        summary {
          cursor: pointer;
          padding: 10px;
          background: #e0e0e0;
          border-radius: 3px;
        }

        pre {
          background: #2d2d2d;
          color: #fff;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default GalleryCreateComponent;