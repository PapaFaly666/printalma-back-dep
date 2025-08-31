import React, { useState } from 'react';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
  address: '',
  shop_name: '',
  profilePhoto: null,
};

export default function VendorProfileEdit() {
  const [values, setValues] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [emailChangeMsg, setEmailChangeMsg] = useState('');
  const [emailChangeError, setEmailChangeError] = useState('');

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setValues({ ...values, profilePhoto: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      const res = await fetch('/auth/vendor/profile', {
        method: 'PUT',
        headers: {
          // 'Authorization': `Bearer ${token}` // décommente si besoin
        },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccess('Profil mis à jour !');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setEmailChangeMsg('');
    setEmailChangeError('');
    try {
      const res = await fetch('/auth/vendor/request-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // décommente si besoin
        },
        body: JSON.stringify({ newEmail, currentPassword })
      });
      if (!res.ok) throw new Error(await res.text());
      setEmailChangeMsg('Un email de confirmation a été envoyé à votre nouvelle adresse.');
      setNewEmail('');
      setCurrentPassword('');
    } catch (err) {
      setEmailChangeError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2>Modifier mon profil vendeur</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input name="firstName" placeholder="Prénom" value={values.firstName} onChange={handleChange} />
        <input name="lastName" placeholder="Nom" value={values.lastName} onChange={handleChange} />
        <input name="email" placeholder="Email" value={values.email} onChange={handleChange} />
        <input name="phone" placeholder="Téléphone" value={values.phone} onChange={handleChange} />
        <input name="country" placeholder="Pays" value={values.country} onChange={handleChange} />
        <input name="address" placeholder="Adresse" value={values.address} onChange={handleChange} />
        <input name="shop_name" placeholder="Nom de la boutique" value={values.shop_name} onChange={handleChange} />
        <input type="file" name="profilePhoto" onChange={handleFileChange} />
        <button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
      <hr style={{ margin: '40px 0' }} />
      <h3>🔒 Modifier votre adresse email</h3>
      <form onSubmit={handleChangeEmail} style={{ marginBottom: 20 }}>
        <input
          type="email"
          name="newEmail"
          placeholder="Nouvelle adresse email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          required
        />
        <input
          type="password"
          name="currentPassword"
          placeholder="Mot de passe actuel"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
        />
        <button type="submit">Envoyer le lien de confirmation</button>
      </form>
      {emailChangeMsg && <div style={{ color: 'green' }}>{emailChangeMsg}</div>}
      {emailChangeError && <div style={{ color: 'red' }}>{emailChangeError}</div>}
    </div>
  );
} 