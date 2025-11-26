import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNetatmoAuth } from '../hooks/useNetatmoAuth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secretCode, setSecretCode] = useState(null);

  // Intégration de l'authentification Netatmo
  const netatmoAuth = useNetatmoAuth();

  // Vérifier si un code est stocké au chargement
  useEffect(() => {
    const storedCode = localStorage.getItem('family-dashboard-secret');
    if (storedCode) {
      // Vérifier que le code est toujours valide
      validateCode(storedCode)
        .then(isValid => {
          if (isValid) {
            setSecretCode(storedCode);
            setIsAuthenticated(true);
          } else {
            // Code invalide, le supprimer
            localStorage.removeItem('family-dashboard-secret');
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour valider un code
  const validateCode = async (code) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/.netlify/functions';
      const response = await axios.get(`${apiUrl}/get-netatmo`, {
        headers: {
          'x-app-secret': code
        }
      });
      return response.status === 200;
    } catch (error) {
      if (error.response?.status === 401) {
        return false;
      }
      // En cas d'autre erreur (réseau, serveur), on considère le code comme potentiellement valide
      console.error('Erreur de validation:', error);
      return true;
    }
  };

  // Fonction de connexion
  const login = async (code) => {
    setError(null);
    setIsLoading(true);

    try {
      const isValid = await validateCode(code);

      if (isValid) {
        // Stocker le code
        localStorage.setItem('family-dashboard-secret', code);
        setSecretCode(code);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        setError('Code incorrect');
        return { success: false, error: 'Code incorrect' };
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion');
      return { success: false, error: 'Erreur de connexion' };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('family-dashboard-secret');
    setSecretCode(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // Fonction pour faire des appels API sécurisés avec support Netatmo OAuth
  const secureApiCall = async (endpoint, options = {}) => {
    if (!secretCode) {
      throw new Error('Non authentifié');
    }

    const apiUrl = import.meta.env.VITE_API_URL || '/.netlify/functions';

    // Préparer les headers
    const headers = {
      ...options.headers,
      'x-app-secret': secretCode
    };

    // Ajouter le token Netatmo si disponible
    if (endpoint === '/get-netatmo' && netatmoAuth.isAuthenticated) {
      try {
        const token = await netatmoAuth.getValidToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get Netatmo token:', error);
      }
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await axios(`${apiUrl}${endpoint}`, config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.error || '';

        // Si c'est une erreur d'authentification Netatmo, lancer le flux OAuth
        if (errorMessage.includes('Netatmo authentication required') && !netatmoAuth.isAuthenticated) {
          netatmoAuth.startOAuthFlow();
          // Ne pas throw d'erreur - la redirection vers Netatmo va se faire
          // On retourne une promesse qui ne se résout jamais car la page va changer
          return new Promise(() => {});
        }

        // Sinon, c'est le code secret qui est invalide
        logout();
        throw new Error('Session expirée');
      }
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    secureApiCall,
    netatmoAuth // Exposer les fonctions Netatmo pour usage avancé si besoin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};