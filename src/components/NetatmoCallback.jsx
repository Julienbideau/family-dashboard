import React, { useEffect, useState } from 'react';
import { useNetatmoAuth } from '../hooks/useNetatmoAuth';

function NetatmoCallback() {
  const { exchangeCode } = useNetatmoAuth();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      // Récupérer le code et le state de l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setError(`Erreur d'authentification: ${error}`);
        setIsProcessing(false);
        return;
      }

      if (!code) {
        setError('Code d\'autorisation manquant');
        setIsProcessing(false);
        return;
      }

      try {
        await exchangeCode(code, state);
        // Rediriger vers la page d'accueil après succès
        window.location.href = '/';
      } catch (err) {
        console.error('Failed to exchange code:', err);
        setError(err.message);
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [exchangeCode]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>Erreur d'authentification</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <div className="spinner"></div>
        <p>Connexion à Netatmo en cours...</p>
      </div>
    );
  }

  return null;
}

export default NetatmoCallback;
