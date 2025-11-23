import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Clock, RefreshCw, AlertCircle } from 'lucide-react';

const CalendarCard = () => {
  const { secureApiCall } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetchCalendarEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await secureApiCall('/get-calendar');
      if (data.success) {
        setEvents(data.events || []);
        setIsDemo(data.isDemo || false);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Erreur lors du chargement du calendrier:', err);
      setError('Impossible de charger le calendrier');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
    // Rafraîchissement toutes les 5 minutes
    const interval = setInterval(fetchCalendarEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventColor = (event) => {
    // Couleurs en fonction du temps restant
    if (event.timeUntil === 'En cours') return '#ff7e00';
    if (event.timeUntil === 'Maintenant' || event.timeUntil?.includes('min')) return '#ff0000';
    if (event.timeUntil === 'Demain') return '#ffaa00';
    return '#4299e1';
  };

  if (isLoading && events.length === 0) {
    return (
      <div className="calendar-card loading">
        <div className="card-header">
          <Calendar className="header-icon" />
          <h3>Calendrier Familial</h3>
        </div>
        <div className="loading-content">
          <RefreshCw className="spinning" />
          <p>Chargement des événements...</p>
        </div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="calendar-card error">
        <div className="card-header">
          <Calendar className="header-icon" />
          <h3>Calendrier Familial</h3>
        </div>
        <div className="error-content">
          <AlertCircle />
          <p>{error}</p>
          <button onClick={fetchCalendarEvents} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-card">
      <div className="card-header">
        <div className="header-left">
          <Calendar className="header-icon" />
          <h3>Calendrier Familial</h3>
          {isDemo && <span className="demo-badge">Mode Démo</span>}
        </div>
        <button
          onClick={fetchCalendarEvents}
          className="refresh-button"
          disabled={isLoading}
          aria-label="Rafraîchir"
        >
          <RefreshCw className={isLoading ? 'spinning' : ''} />
        </button>
      </div>

      <div className="events-container">
        {events.length === 0 ? (
          <div className="no-events">
            <Calendar size={40} />
            <p>Aucun événement à venir</p>
          </div>
        ) : (
          <div className="events-list">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="event-item">
                <div
                  className="event-indicator"
                  style={{ backgroundColor: getEventColor(event) }}
                />
                <div className="event-content">
                  <div className="event-header">
                    <h4 className="event-title">{event.title}</h4>
                    <span className="event-time">{event.timeUntil}</span>
                  </div>
                  <div className="event-details">
                    {event.startTime && (
                      <span className="event-detail">
                        <Clock size={14} />
                        {event.startTime}
                      </span>
                    )}
                    {event.location && (
                      <span className="event-detail">
                        <MapPin size={14} />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
        .calendar-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .calendar-card.loading,
        .calendar-card.error {
          justify-content: center;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon {
          width: 24px;
          height: 24px;
          color: #4299e1;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          color: #2d3748;
        }

        .demo-badge {
          padding: 2px 8px;
          background: #fbbf24;
          color: #78350f;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .refresh-button {
          background: #edf2f7;
          border: none;
          border-radius: 8px;
          padding: 8px;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .refresh-button:hover:not(:disabled) {
          background: #e2e8f0;
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
          padding: 40px;
          color: #718096;
        }

        .retry-button {
          padding: 8px 20px;
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .retry-button:hover {
          background: #3182ce;
          transform: translateY(-2px);
        }

        .events-container {
          flex: 1;
          overflow-y: auto;
          min-height: 200px;
        }

        .no-events {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px;
          color: #a0aec0;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .event-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #f7fafc;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .event-item:hover {
          background: #edf2f7;
          transform: translateX(5px);
        }

        .event-indicator {
          width: 4px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .event-content {
          flex: 1;
          min-width: 0;
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 6px;
        }

        .event-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .event-time {
          font-size: 12px;
          color: #4a5568;
          background: #edf2f7;
          padding: 2px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }

        .event-details {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .event-detail {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #718096;
        }

        .card-footer {
          margin-top: auto;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
        }

        .update-time {
          font-size: 11px;
          color: #a0aec0;
        }

        @media (max-width: 768px) {
          .calendar-card {
            padding: 15px;
          }

          .event-header {
            flex-direction: column;
            gap: 5px;
          }

          .event-time {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarCard;