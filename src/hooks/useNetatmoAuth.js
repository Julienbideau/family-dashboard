import { useState, useEffect, useCallback } from 'react';

const NETATMO_CLIENT_ID = import.meta.env.VITE_NETATMO_CLIENT_ID;
const STORAGE_KEY = 'netatmo_tokens';

export function useNetatmoAuth() {
  const [tokens, setTokens] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les tokens du localStorage au démarrage
  useEffect(() => {
    const storedTokens = localStorage.getItem(STORAGE_KEY);
    if (storedTokens) {
      try {
        const parsed = JSON.parse(storedTokens);
        // Vérifier si le token n'est pas expiré
        if (parsed.expires_at && parsed.expires_at > Date.now()) {
          setTokens(parsed);
        } else if (parsed.refresh_token) {
          // Token expiré, essayer de le rafraîchir
          refreshToken(parsed.refresh_token);
        } else {
          // Token expiré et pas de refresh token
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to parse stored tokens:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Sauvegarder les tokens dans le localStorage
  const saveTokens = useCallback((tokenData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenData));
    setTokens(tokenData);
  }, []);

  // Démarrer le flux OAuth
  const startOAuthFlow = useCallback(() => {
    if (!NETATMO_CLIENT_ID) {
      console.error('VITE_NETATMO_CLIENT_ID not configured');
      return;
    }

    const redirectUri = `${window.location.origin}/netatmo-callback`;
    const scope = 'read_station';
    const state = Math.random().toString(36).substring(7);

    // Sauvegarder le state pour vérification au retour
    sessionStorage.setItem('netatmo_oauth_state', state);

    const authUrl = `https://api.netatmo.com/oauth2/authorize?client_id=${NETATMO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

    window.location.href = authUrl;
  }, []);

  // Échanger le code contre un token
  const exchangeCode = useCallback(async (code, state) => {
    const savedState = sessionStorage.getItem('netatmo_oauth_state');

    // Vérifier le state pour la sécurité
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    sessionStorage.removeItem('netatmo_oauth_state');

    const redirectUri = `${window.location.origin}/netatmo-callback`;

    const response = await fetch('/.netlify/functions/netatmo-callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, redirectUri })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to exchange code');
    }

    const result = await response.json();
    saveTokens(result.data);
    return result.data;
  }, [saveTokens]);

  // Rafraîchir le token
  const refreshToken = useCallback(async (refreshTokenValue) => {
    try {
      const response = await fetch('/.netlify/functions/netatmo-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const result = await response.json();
      saveTokens(result.data);
      return result.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // En cas d'échec, supprimer les tokens et forcer une nouvelle auth
      localStorage.removeItem(STORAGE_KEY);
      setTokens(null);
      throw error;
    }
  }, [saveTokens]);

  // Obtenir un token valide (refresh automatique si nécessaire)
  const getValidToken = useCallback(async () => {
    if (!tokens) {
      return null;
    }

    // Si le token expire dans moins de 5 minutes, le rafraîchir
    if (tokens.expires_at && tokens.expires_at < Date.now() + (5 * 60 * 1000)) {
      if (tokens.refresh_token) {
        const newTokens = await refreshToken(tokens.refresh_token);
        return newTokens.access_token;
      }
      return null;
    }

    return tokens.access_token;
  }, [tokens, refreshToken]);

  // Se déconnecter
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTokens(null);
  }, []);

  return {
    tokens,
    isAuthenticated: !!tokens,
    isLoading,
    startOAuthFlow,
    exchangeCode,
    getValidToken,
    logout
  };
}
