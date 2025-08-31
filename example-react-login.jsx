// example-react-login.jsx
// Exemple d'utilisation React pour afficher les messages exacts du backend

import React, { useState } from 'react';
import authService from '../services/authService';

const LoginForm = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await authService.login(formData.email, formData.password);

            if (result.success) {
                console.log('✅ Connexion réussie:', result.user);
                // Redirection ou mise à jour état
            } else if (result.mustChangePassword) {
                console.log('🔑 Changement de mot de passe requis');
                // Redirection vers formulaire de changement de mot de passe
            } else {
                // ❌ Afficher l'erreur exacte du backend
                setError(result);
            }
        } catch (error) {
            setError({
                type: 'NETWORK_ERROR',
                message: 'Erreur de connexion au serveur'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null); // Effacer l'erreur quand l'utilisateur tape
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit}>
                <h2>🔐 Connexion PrintAlma</h2>
                
                <div className="form-group">
                    <label>📧 Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>🔑 Mot de passe:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                </div>

                {/* AFFICHAGE DU MESSAGE EXACT DU BACKEND */}
                {error && (
                    <div className={`error-message error-${error.error?.toLowerCase().replace('_', '-')}`}>
                        <div className="error-header">
                            <span className="error-icon">
                                {getErrorIcon(error.error)}
                            </span>
                            <span className="error-title">
                                {getErrorTitle(error.error)}
                            </span>
                        </div>
                        
                        <div className="error-content">
                            {/* MESSAGE EXACT DU BACKEND AFFICHÉ TEL QUEL */}
                            <p className="error-text">{error.message}</p>
                            
                            {/* INDICATEURS VISUELS BASÉS SUR LES DONNÉES EXTRAITES */}
                            {error.remainingAttempts !== null && (
                                <div className="attempts-indicator">
                                    <div className="attempts-dots">
                                        {[...Array(5)].map((_, i) => (
                                            <span 
                                                key={i}
                                                className={`attempt-dot ${
                                                    i < error.remainingAttempts ? 'available' : 'used'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="attempts-text">
                                        {error.remainingAttempts} tentative{error.remainingAttempts > 1 ? 's' : ''} restante{error.remainingAttempts > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                            
                            {/* TIMER DE DÉBLOCAGE */}
                            {error.remainingTime && (
                                <div className="lock-timer">
                                    <span className="timer-icon">⏰</span>
                                    <span className="timer-text">
                                        Déblocage dans : {error.remainingTime}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? '⏳ Connexion...' : 'Se connecter'}
                </button>
            </form>
        </div>
    );
};

// Fonctions d'aide pour l'affichage
function getErrorIcon(errorType) {
    const icons = {
        'ATTEMPTS_REMAINING_SAFE': '⚠️',
        'ATTEMPTS_REMAINING_WARNING': '🚨',
        'LAST_ATTEMPT': '💀',
        'ACCOUNT_LOCKED': '🔒',
        'ACCOUNT_DISABLED': '🚫',
        'INVALID_CREDENTIALS': '❌',
        'SERVER_DOWN': '🔌',
        'NETWORK_ERROR': '🌐'
    };
    return icons[errorType] || '⚠️';
}

function getErrorTitle(errorType) {
    const titles = {
        'ATTEMPTS_REMAINING_SAFE': 'Tentatives restantes',
        'ATTEMPTS_REMAINING_WARNING': 'Attention !',
        'LAST_ATTEMPT': 'Dernière chance !',
        'ACCOUNT_LOCKED': 'Compte verrouillé',
        'ACCOUNT_DISABLED': 'Compte désactivé',
        'INVALID_CREDENTIALS': 'Identifiants incorrects',
        'SERVER_DOWN': 'Serveur indisponible',
        'NETWORK_ERROR': 'Erreur de réseau'
    };
    return titles[errorType] || 'Erreur';
}

export default LoginForm;

/*
EXEMPLE DE RENDU POUR L'UTILISATEUR :

┌─────────────────────────────────────────┐
│ ⚠️  Tentatives restantes                │
├─────────────────────────────────────────┤
│ ❌ Email ou mot de passe incorrect.     │
│ Il vous reste 3 tentatives.             │
│                                         │
│ ● ● ● ○ ○  3 tentatives restantes      │
└─────────────────────────────────────────┘

PUIS APRÈS PLUSIEURS TENTATIVES :

┌─────────────────────────────────────────┐
│ 🔒 Compte verrouillé                    │
├─────────────────────────────────────────┤
│ 🔒 Votre compte est temporairement      │
│ verrouillé. Temps restant : 25 minutes  │
│                                         │
│ ⏰ Déblocage dans : 25 minutes          │
└─────────────────────────────────────────┘

POINTS CLÉS :
✅ Le message exact du backend est affiché
✅ Les indicateurs visuels sont ajoutés EN PLUS
✅ Pas de modification du texte original
✅ Extraction intelligente des données pour les visuels
*/ 