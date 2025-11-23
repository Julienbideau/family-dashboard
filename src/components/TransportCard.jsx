import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Train, RefreshCw, AlertCircle, Clock } from 'lucide-react';

const TransportCard = () => {
  const { secureApiCall } = useAuth();
  const [trams, setTrams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchTramData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await secureApiCall('/get-tan');
      if (data.success) {
        setTrams(data.trams || []);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Erreur lors du chargement des horaires:', err);
      setError('Impossible de charger les horaires');
      setTrams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTramData();
    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(fetchTramData, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTempsDisplay = (temps) => {
    if (temps.includes('proche')) {
      return { value: 'Proche', unit: '' };
    }
    if (temps.includes('mn')) {
      const minutes = temps.replace(' mn', '');
      return { value: minutes, unit: 'min' };
    }
    return { value: temps, unit: '' };
  };

  if (isLoading && trams.length === 0) {
    return (
      <div className="transport-card loading">
        <div className="card-header">
          <Train className="header-icon" />
          <h3>Tram Ligne 1 - Beaujoire</h3>
        </div>
        <div className="loading-content">
          <RefreshCw className="spinning" />
          <p>Chargement des horaires...</p>
        </div>
      </div>
    );
  }

  if (error && trams.length === 0) {
    return (
      <div className="transport-card error">
        <div className="card-header">
          <Train className="header-icon" />
          <h3>Tram Ligne 1 - Beaujoire</h3>
        </div>
        <div className="error-content">
          <AlertCircle />
          <p>{error}</p>
          <button onClick={fetchTramData} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const nextTram = trams[0];
  const followingTram = trams[1];

  return (
    <div className="transport-card">
      <div className="card-header">
        <div className="header-left">
          <Train className="header-icon" />
          <div>
            <h3>Tram Ligne 1</h3>
            <span className="stop-name">Arrêt Beaujoire</span>
          </div>
        </div>
        <button
          onClick={fetchTramData}
          className="refresh-button"
          disabled={isLoading}
          aria-label="Rafraîchir"
        >
          <RefreshCw className={isLoading ? 'spinning' : ''} />
        </button>
      </div>

      <div className="tram-content">
        {nextTram ? (
          <>
            <div className="next-tram">
              <div className="direction">
                <span className="label">Direction</span>
                <span className="destination">{nextTram.destination}</span>
              </div>
              <div className="time-display">
                {(() => {
                  const display = getTempsDisplay(nextTram.temps);
                  return (
                    <>
                      <span className="time-value">{display.value}</span>
                      {display.unit && <span className="time-unit">{display.unit}</span>}
                    </>
                  );
                })()}
              </div>
            </div>

            {followingTram && (
              <div className="following-tram">
                <div className="divider"></div>
                <div className="following-info">
                  <Clock size={14} />
                  <span>Suivant: </span>
                  <strong>{followingTram.temps}</strong>
                  {trams.length > 2 && (
                    <span className="more"> • puis {trams[2].temps}</span>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-tram">
            <AlertCircle />
            <p>Aucun tram prévu</p>
          </div>
        )}
      </div>

      {lastUpdate && (
        <div className="card-footer">
          <span className="update-time">
            Mis à jour à {formatTime(lastUpdate)}
          </span>
        </div>
      )}

      <style jsx>{`
        .transport-card {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          color: white;
          min-height: 200px;
          display: flex;
          flex-direction: column;
        }

        .transport-card.loading,
        .transport-card.error {
          justify-content: center;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon {
          width: 24px;
          height: 24px;
          color: #fbbf24;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .stop-name {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .refresh-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          padding: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .refresh-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loading-content,
        .error-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          padding: 20px;
          color: rgba(255, 255, 255, 0.8);
        }

        .retry-button {
          padding: 8px 20px;
          background: #fbbf24;
          color: #1a1a2e;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .retry-button:hover {
          background: #f59e0b;
          transform: translateY(-2px);
        }

        .tram-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .next-tram {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .direction {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .direction .label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .destination {
          font-size: 18px;
          font-weight: 600;
          color: #fbbf24;
        }

        .time-display {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .time-value {
          font-size: 48px;
          font-weight: 700;
          line-height: 1;
          color: white;
        }

        .time-unit {
          font-size: 18px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.8);
        }

        .divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .following-tram {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .following-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .following-info strong {
          color: white;
          font-weight: 600;
        }

        .more {
          color: rgba(255, 255, 255, 0.6);
        }

        .no-tram {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 30px;
          color: rgba(255, 255, 255, 0.6);
        }

        .card-footer {
          margin-top: auto;
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: flex-end;
        }

        .update-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        @media (max-width: 768px) {
          .transport-card {
            padding: 15px;
          }

          .time-value {
            font-size: 36px;
          }

          .destination {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default TransportCard;