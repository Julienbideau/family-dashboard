import React, { useMemo } from 'react';
import {
  determineVentilationAdvice,
  evaluateAirQuality,
  calculateAbsoluteHumidity,
  calculateDewPoint
} from '../utils/humidityUtils';
import {
  Thermometer,
  Droplets,
  Wind,
  Home,
  TreePine,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Gauge
} from 'lucide-react';

const AirQualityCard = ({ data }) => {
  const { indoor, outdoor, indoorModules = [] } = data;

  // Utiliser indoorModules si disponible, sinon fallback sur indoor
  const modules = indoorModules.length > 0 ? indoorModules : [indoor];

  // Calculer les recommandations pour chaque module
  const moduleAdvices = useMemo(() => {
    return modules.map(module => {
      const advice = determineVentilationAdvice(module, outdoor, 3); // Seuil de 3g/m³
      const absoluteHumidity = calculateAbsoluteHumidity(module.temperature, module.humidity);
      return {
        ...module,
        advice,
        absoluteHumidity: Math.round(absoluteHumidity * 10) / 10
      };
    });
  }, [modules, outdoor]);

  // Module critique (avec le CO2 le plus élevé ou la plus grande différence d'humidité)
  const criticalModule = useMemo(() => {
    return moduleAdvices.reduce((prev, current) => {
      // Priorité au CO2 élevé
      if (current.co2 > 1000 && prev.co2 <= 1000) return current;
      if (prev.co2 > 1000 && current.co2 <= 1000) return prev;

      // Sinon, priorité à la plus grande différence d'humidité
      const prevDiff = prev.advice?.details?.humidityDifference || 0;
      const currentDiff = current.advice?.details?.humidityDifference || 0;
      return Math.abs(currentDiff) > Math.abs(prevDiff) ? current : prev;
    });
  }, [moduleAdvices]);

  // Recommandation globale basée sur le module critique
  const ventilationAdvice = criticalModule.advice;

  const airQuality = useMemo(() => {
    return evaluateAirQuality(criticalModule);
  }, [criticalModule]);

  const outdoorAbsoluteHumidity = useMemo(() => {
    return calculateAbsoluteHumidity(outdoor.temperature, outdoor.humidity);
  }, [outdoor.temperature, outdoor.humidity]);

  const getActionIcon = () => {
    switch (ventilationAdvice.action) {
      case 'OUVRIR':
        return <CheckCircle className="action-icon open" />;
      case 'FERMER':
        return <XCircle className="action-icon close" />;
      default:
        return <AlertCircle className="action-icon wait" />;
    }
  };

  const getActionClass = () => {
    switch (ventilationAdvice.action) {
      case 'OUVRIR':
        return 'action-open';
      case 'FERMER':
        return 'action-close';
      default:
        return 'action-wait';
    }
  };

  const getCO2Level = (co2) => {
    if (co2 < 800) return { text: 'Excellent', color: '#00e400' };
    if (co2 < 1000) return { text: 'Bon', color: '#51d851' };
    if (co2 < 1500) return { text: 'Moyen', color: '#ffff00' };
    if (co2 < 2000) return { text: 'Médiocre', color: '#ff7e00' };
    return { text: 'Mauvais', color: '#ff0000' };
  };

  const co2Level = criticalModule.co2 ? getCO2Level(criticalModule.co2) : null;

  return (
    <div className="air-quality-card">
      <div className="card-header">
        <h2>
          <Wind className="header-icon" />
          Qualité de l'Air & Météo
        </h2>
        <div className={`air-quality-badge`} style={{ backgroundColor: airQuality.color }}>
          {airQuality.quality}
        </div>
      </div>

      <div className="main-verdict">
        <div className={`verdict-card ${getActionClass()}`}>
          {getActionIcon()}
          <div className="verdict-content">
            <h3>{ventilationAdvice.action} LES FENÊTRES</h3>
            <p>{ventilationAdvice.reason}</p>
            {ventilationAdvice.warning && (
              <p className="warning">
                <AlertCircle size={16} />
                {ventilationAdvice.warning}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        {/* Métriques intérieures - Afficher tous les modules */}
        {moduleAdvices.map((module, index) => {
          const moduleCo2Level = module.co2 ? getCO2Level(module.co2) : null;
          const moduleAdvice = module.advice;

          return (
            <div key={index} className="metric-section">
              <h4>
                <Home size={18} />
                {module.name || `Module ${index + 1}`}
                {module === criticalModule && modules.length > 1 && (
                  <span className="critical-badge">Principal</span>
                )}
              </h4>

              {/* Recommandation spécifique pour cette pièce */}
              <div className={`room-advice advice-${moduleAdvice.action.toLowerCase()}`}>
                <div className="advice-header">
                  {moduleAdvice.action === 'OUVRIR' && <CheckCircle size={16} />}
                  {moduleAdvice.action === 'FERMER' && <XCircle size={16} />}
                  {moduleAdvice.action === 'ATTENDRE' && <AlertCircle size={16} />}
                  <span className="advice-action">{moduleAdvice.action}</span>
                </div>
                <p className="advice-reason">{moduleAdvice.reason}</p>
                <div className="humidity-details">
                  <span>Humidité absolue: {module.absoluteHumidity} g/m³</span>
                  <span>Différence: {moduleAdvice.details.humidityDifference} g/m³</span>
                </div>
              </div>

              <div className="metric-cards">
                <div className="metric">
                  <Thermometer className="metric-icon temp" />
                  <div>
                    <span className="value">{module.temperature.toFixed(1)}°C</span>
                    <span className="label">Température</span>
                  </div>
                </div>
                <div className="metric">
                  <Droplets className="metric-icon humidity" />
                  <div>
                    <span className="value">{module.humidity}%</span>
                    <span className="label">Humidité</span>
                  </div>
                </div>
                {module.co2 > 0 && (
                  <div className="metric">
                    <Activity className="metric-icon co2" />
                    <div>
                      <span className="value">{module.co2} ppm</span>
                      <span className="label" style={{ color: moduleCo2Level?.color }}>
                        CO₂ ({moduleCo2Level?.text})
                      </span>
                    </div>
                  </div>
                )}
                {module.pressure > 0 && (
                  <div className="metric">
                    <Gauge className="metric-icon pressure" />
                    <div>
                      <span className="value">{module.pressure.toFixed(1)} hPa</span>
                      <span className="label">Pression</span>
                    </div>
                  </div>
                )}
                {module.noise > 0 && (
                  <div className="metric">
                    <Activity className="metric-icon noise" />
                    <div>
                      <span className="value">{module.noise} dB</span>
                      <span className="label">Bruit</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Métriques extérieures */}
        <div className="metric-section">
          <h4>
            <TreePine size={18} />
            Extérieur
          </h4>
          <div className="metric-cards">
            <div className="metric">
              <Thermometer className="metric-icon temp" />
              <div>
                <span className="value">{outdoor.temperature.toFixed(1)}°C</span>
                <span className="label">Température</span>
              </div>
            </div>
            <div className="metric">
              <Droplets className="metric-icon humidity" />
              <div>
                <span className="value">{outdoor.humidity}%</span>
                <span className="label">Humidité</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé global */}
      <div className="technical-details">
        <h4>Conditions extérieures</h4>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Température extérieure:</span>
            <span className="detail-value">{outdoor.temperature.toFixed(1)}°C</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Humidité extérieure:</span>
            <span className="detail-value">{outdoor.humidity}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Humidité absolue ext.:</span>
            <span className="detail-value">{outdoorAbsoluteHumidity.toFixed(1)} g/m³</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Seuil d'ouverture:</span>
            <span className="detail-value">&gt; 3 g/m³ de différence</span>
          </div>
        </div>
      </div>

      {/* Problèmes détectés */}
      {airQuality.issues.length > 0 && (
        <div className="issues-section">
          <h4>Points d'attention</h4>
          <ul className="issues-list">
            {airQuality.issues.map((issue, index) => (
              <li key={index}>
                <AlertCircle size={16} />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .air-quality-card {
          width: 100%;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .card-header h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 22px;
          color: #1a202c;
        }

        .header-icon {
          color: #4299e1;
        }

        .air-quality-badge {
          padding: 6px 16px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .main-verdict {
          margin-bottom: 30px;
        }

        .verdict-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .verdict-card.action-open {
          background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
          border: 2px solid #48bb78;
        }

        .verdict-card.action-close {
          background: linear-gradient(135deg, #fed7d7 0%, #fc8181 100%);
          border: 2px solid #f56565;
        }

        .verdict-card.action-wait {
          background: linear-gradient(135deg, #feebc8 0%, #fbd38d 100%);
          border: 2px solid #ed8936;
        }

        .action-icon {
          width: 48px;
          height: 48px;
        }

        .action-icon.open {
          color: #22543d;
        }

        .action-icon.close {
          color: #742a2a;
        }

        .action-icon.wait {
          color: #744210;
        }

        .verdict-content h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
        }

        .verdict-content p {
          margin: 0;
          font-size: 14px;
        }

        .warning {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 10px !important;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          font-size: 12px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }

        .metric-section {
          background: #f7fafc;
          padding: 15px;
          border-radius: 10px;
        }

        .metric-section h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #2d3748;
        }

        .metric-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .metric {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .metric-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .metric-icon.temp {
          color: #f56565;
        }

        .metric-icon.humidity {
          color: #4299e1;
        }

        .metric-icon.co2 {
          color: #48bb78;
        }

        .metric-icon.pressure {
          color: #805ad5;
        }

        .metric-icon.noise {
          color: #ed8936;
        }

        .critical-badge {
          margin-left: 10px;
          padding: 2px 8px;
          background: #4299e1;
          color: white;
          font-size: 10px;
          border-radius: 12px;
          text-transform: uppercase;
          font-weight: 600;
        }

        /* Recommandations par pièce */
        .room-advice {
          margin: 15px 0;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
        }

        .room-advice.advice-ouvrir {
          background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
          border: 1px solid #48bb78;
        }

        .room-advice.advice-fermer {
          background: linear-gradient(135deg, #fed7d7 0%, #fc8181 100%);
          border: 1px solid #f56565;
        }

        .room-advice.advice-attendre {
          background: linear-gradient(135deg, #feebc8 0%, #fbd38d 100%);
          border: 1px solid #ed8936;
        }

        .advice-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
          font-weight: 600;
        }

        .advice-action {
          text-transform: uppercase;
          font-size: 12px;
        }

        .advice-reason {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #2d3748;
        }

        .humidity-details {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #4a5568;
          padding-top: 8px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .metric > div {
          display: flex;
          flex-direction: column;
        }

        .metric .value {
          font-size: 16px;
          font-weight: 600;
          color: #1a202c;
        }

        .metric .label {
          font-size: 11px;
          color: #718096;
        }

        .technical-details {
          background: #f7fafc;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .technical-details h4 {
          margin: 0 0 15px 0;
          font-size: 14px;
          color: #4a5568;
          text-transform: uppercase;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
        }

        .detail-label {
          font-size: 12px;
          color: #718096;
        }

        .detail-value {
          font-size: 12px;
          font-weight: 600;
          color: #2d3748;
        }

        .issues-section {
          background: #fff5f5;
          padding: 15px;
          border-radius: 10px;
          border: 1px solid #feb2b2;
        }

        .issues-section h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #742a2a;
        }

        .issues-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .issues-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 0;
          font-size: 13px;
          color: #c53030;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .verdict-card {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AirQualityCard;