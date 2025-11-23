import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AirQualityCard from './AirQualityCard';
import TransportCard from './TransportCard';
import {
  Calendar,
  Newspaper,
  Trash2,
  Clock,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
  CloudRain,
  Sun,
  CloudSnow
} from 'lucide-react';

const Dashboard = () => {
  const { logout, secureApiCall } = useAuth();
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Données statiques pour les autres widgets (peuvent être remplacées par de vraies APIs)
  const [currentDate] = useState(new Date());
  const [newsItems] = useState([
    { id: 1, title: "Réunion de famille dimanche", date: "Dans 3 jours" },
    { id: 2, title: "Anniversaire de Maman", date: "Dans 2 semaines" },
    { id: 3, title: "Vacances d'été", date: "Dans 1 mois" }
  ]);

  const [trashSchedule] = useState({
    next: "Jeudi",
    type: "Recyclage",
    days: 2
  });

  // Gestion de la connexion Internet
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Charger les données météo
  const fetchWeatherData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await secureApiCall('/get-netatmo');
      setWeatherData(data.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données météo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();

    // Rafraîchissement automatique toutes les 5 minutes
    const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (date) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWeatherIcon = () => {
    if (!weatherData) return <Sun className="weather-icon" />;

    const temp = weatherData.outdoor?.temperature || 20;
    if (temp < 5) return <CloudSnow className="weather-icon" />;
    if (temp < 15) return <CloudRain className="weather-icon" />;
    return <Sun className="weather-icon" />;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Family Dashboard</h1>
          <div className="status-bar">
            {isOnline ? (
              <span className="status online">
                <Wifi size={16} /> En ligne
              </span>
            ) : (
              <span className="status offline">
                <WifiOff size={16} /> Hors ligne
              </span>
            )}
            {lastUpdate && (
              <span className="last-update">
                <Clock size={14} />
                Mis à jour à {formatTime(lastUpdate)}
              </span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button onClick={fetchWeatherData} className="refresh-button" disabled={isLoading}>
            <RefreshCw className={isLoading ? 'spinning' : ''} />
          </button>
          <button onClick={logout} className="logout-button">
            <LogOut />
            Déconnexion
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Widget Météo et Qualité de l'air */}
        <div className="widget widget-large">
          {isLoading && !weatherData ? (
            <div className="loading-state">
              <RefreshCw className="spinning" />
              <p>Chargement des données...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={fetchWeatherData} className="retry-button">
                Réessayer
              </button>
            </div>
          ) : weatherData ? (
            <AirQualityCard data={weatherData} />
          ) : null}
        </div>

        {/* Widget Date et Heure */}
        <div className="widget widget-date">
          <div className="widget-header">
            <Calendar />
            <h3>Date & Heure</h3>
          </div>
          <div className="widget-content">
            <div className="date-display">
              <p className="current-date">{formatDate(currentDate)}</p>
              <p className="current-time">{formatTime(currentDate)}</p>
            </div>
            {getWeatherIcon()}
          </div>
        </div>

        {/* Widget Poubelles */}
        <div className="widget widget-trash">
          <div className="widget-header">
            <Trash2 />
            <h3>Collecte des déchets</h3>
          </div>
          <div className="widget-content">
            <div className="trash-info">
              <p className="next-collection">
                <strong>{trashSchedule.next}</strong>
              </p>
              <p className="collection-type">{trashSchedule.type}</p>
              <p className="days-remaining">Dans {trashSchedule.days} jours</p>
            </div>
            <div className={`trash-icon ${trashSchedule.type.toLowerCase()}`}>
              <Trash2 size={40} />
            </div>
          </div>
        </div>

        {/* Widget Actualités familiales */}
        <div className="widget widget-news">
          <div className="widget-header">
            <Newspaper />
            <h3>Actualités familiales</h3>
          </div>
          <div className="widget-content">
            <div className="news-list">
              {newsItems.map(item => (
                <div key={item.id} className="news-item">
                  <p className="news-title">{item.title}</p>
                  <p className="news-date">{item.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget Transport */}
        <div className="widget widget-transport">
          <TransportCard />
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: white;
          padding: 20px 30px;
          border-radius: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header-left h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          color: #1a202c;
        }

        .status-bar {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .status.online {
          background: #c6f6d5;
          color: #22543d;
        }

        .status.offline {
          background: #fed7d7;
          color: #742a2a;
        }

        .last-update {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #718096;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .refresh-button,
        .logout-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .refresh-button {
          background: #edf2f7;
          color: #4a5568;
        }

        .refresh-button:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .logout-button {
          background: #feb2b2;
          color: #742a2a;
        }

        .logout-button:hover {
          background: #fc8181;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .widget {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .widget:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
        }

        .widget-large {
          grid-column: span 2;
        }

        .widget-transport {
          padding: 0;
          background: transparent;
          box-shadow: none;
        }

        .widget-transport:hover {
          transform: none;
        }

        .widget-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }

        .widget-header h3 {
          margin: 0;
          font-size: 18px;
          color: #2d3748;
        }

        .widget-content {
          padding-top: 10px;
        }

        .loading-state,
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #718096;
        }

        .retry-button {
          margin-top: 15px;
          padding: 8px 20px;
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .retry-button:hover {
          background: #3182ce;
        }

        /* Widget Date */
        .widget-date .widget-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .date-display .current-date {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 5px 0;
        }

        .date-display .current-time {
          font-size: 24px;
          font-weight: 300;
          color: #4a5568;
          margin: 0;
        }

        .weather-icon {
          width: 60px;
          height: 60px;
          color: #fbbf24;
        }

        /* Widget Poubelles */
        .widget-trash .widget-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .trash-info p {
          margin: 5px 0;
        }

        .next-collection {
          font-size: 20px;
          color: #2d3748;
        }

        .collection-type {
          color: #4a5568;
          font-size: 14px;
        }

        .days-remaining {
          color: #718096;
          font-size: 12px;
        }

        .trash-icon {
          padding: 15px;
          border-radius: 50%;
        }

        .trash-icon.recyclage {
          background: #c6f6d5;
          color: #22543d;
        }

        .trash-icon.ordures {
          background: #fed7d7;
          color: #742a2a;
        }

        /* Widget News */
        .news-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .news-item {
          padding: 12px;
          background: #f7fafc;
          border-radius: 8px;
          border-left: 3px solid #4299e1;
        }

        .news-title {
          margin: 0 0 5px 0;
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }

        .news-date {
          margin: 0;
          font-size: 12px;
          color: #718096;
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 10px;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 15px;
            padding: 15px;
          }

          .header-left,
          .header-actions {
            width: 100%;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .widget-large {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;