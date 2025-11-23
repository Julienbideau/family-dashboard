/**
 * Utilitaires pour les calculs d'humidité et la gestion de la qualité de l'air
 */

/**
 * Calcule la pression de vapeur saturante selon la formule de Magnus
 * @param {number} temperature - Température en degrés Celsius
 * @returns {number} Pression de vapeur saturante en hPa
 */
export function calculateSaturatedVaporPressure(temperature) {
  // Formule de Magnus
  return 6.112 * Math.exp((17.67 * temperature) / (temperature + 243.5));
}

/**
 * Calcule l'humidité absolue
 * @param {number} temperature - Température en degrés Celsius
 * @param {number} relativeHumidity - Humidité relative en pourcentage
 * @returns {number} Humidité absolue en g/m³
 */
export function calculateAbsoluteHumidity(temperature, relativeHumidity) {
  const saturatedVaporPressure = calculateSaturatedVaporPressure(temperature);
  const actualVaporPressure = (relativeHumidity / 100) * saturatedVaporPressure;

  // Constante des gaz parfaits pour la vapeur d'eau
  const R_v = 461.5; // J/(kg·K)

  // Conversion de la température en Kelvin
  const T_kelvin = temperature + 273.15;

  // Calcul de l'humidité absolue en kg/m³
  const absoluteHumidityKg = (actualVaporPressure * 100) / (R_v * T_kelvin);

  // Conversion en g/m³
  return absoluteHumidityKg * 1000;
}

/**
 * Calcule le point de rosée
 * @param {number} temperature - Température en degrés Celsius
 * @param {number} relativeHumidity - Humidité relative en pourcentage
 * @returns {number} Point de rosée en degrés Celsius
 */
export function calculateDewPoint(temperature, relativeHumidity) {
  const a = 17.67;
  const b = 243.5;
  const gamma = Math.log(relativeHumidity / 100) + (a * temperature) / (b + temperature);
  return (b * gamma) / (a - gamma);
}

/**
 * Détermine si les fenêtres doivent être ouvertes ou fermées
 * @param {Object} indoor - Données intérieures {temperature, humidity, name}
 * @param {Object} outdoor - Données extérieures {temperature, humidity}
 * @param {number} threshold - Seuil de différence d'humidité absolue pour ouvrir (défaut: 3 g/m³)
 * @returns {Object} Verdict avec action et raison
 */
export function determineVentilationAdvice(indoor, outdoor, threshold = 3) {
  const indoorAbsoluteHumidity = calculateAbsoluteHumidity(indoor.temperature, indoor.humidity);
  const outdoorAbsoluteHumidity = calculateAbsoluteHumidity(outdoor.temperature, outdoor.humidity);
  const humidityDifference = indoorAbsoluteHumidity - outdoorAbsoluteHumidity;

  const dewPointIndoor = calculateDewPoint(indoor.temperature, indoor.humidity);

  // Logique de décision
  const verdict = {
    action: 'ATTENDRE',
    reason: '',
    roomName: indoor.name || 'Pièce',
    details: {
      indoorAbsoluteHumidity: Math.round(indoorAbsoluteHumidity * 10) / 10,
      outdoorAbsoluteHumidity: Math.round(outdoorAbsoluteHumidity * 10) / 10,
      dewPointIndoor: Math.round(dewPointIndoor * 10) / 10,
      humidityDifference: Math.round(humidityDifference * 10) / 10
    }
  };

  // Priorité 1: CO₂ élevé - TOUJOURS ouvrir
  if (indoor.co2 && indoor.co2 > 1000) {
    verdict.action = 'OUVRIR';
    verdict.reason = `CO₂ élevé (${indoor.co2} ppm)`;
    verdict.priority = 'high';
    return verdict;
  }

  // Priorité 2: Différence d'humidité absolue > seuil (3g/m³)
  if (humidityDifference > threshold) {
    verdict.action = 'OUVRIR';
    verdict.reason = `Différence favorable: ${verdict.details.humidityDifference} g/m³`;
    verdict.priority = 'medium';

    // Avertissement condensation si nécessaire
    if (dewPointIndoor > outdoor.temperature && outdoor.temperature < 10) {
      verdict.warning = `Attention: risque de condensation (point de rosée: ${verdict.details.dewPointIndoor}°C)`;
    }
    return verdict;
  }

  // Priorité 3: Humidité relative trop élevée
  if (indoor.humidity > 65) {
    if (humidityDifference > 1) {
      verdict.action = 'OUVRIR';
      verdict.reason = `Humidité élevée (${indoor.humidity}%), légère amélioration possible`;
      verdict.priority = 'low';
    } else {
      verdict.action = 'FERMER';
      verdict.reason = `Humidité élevée mais air extérieur trop humide`;
      verdict.priority = 'low';
    }
    return verdict;
  }

  // Priorité 4: Air trop sec
  if (indoor.humidity < 40) {
    if (humidityDifference < 0 && outdoor.temperature > 5) {
      verdict.action = 'OUVRIR';
      verdict.reason = `Air trop sec, l'extérieur peut humidifier`;
      verdict.priority = 'low';
    } else {
      verdict.action = 'FERMER';
      verdict.reason = `Air sec mais conditions extérieures défavorables`;
      verdict.priority = 'low';
    }
    return verdict;
  }

  // Conditions normales
  if (humidityDifference > 1 && humidityDifference <= threshold) {
    verdict.action = 'ATTENDRE';
    verdict.reason = `Différence faible (${verdict.details.humidityDifference} g/m³)`;
  } else if (humidityDifference <= 0) {
    verdict.action = 'FERMER';
    verdict.reason = `Extérieur plus humide que l'intérieur`;
  } else {
    verdict.action = 'FERMER';
    verdict.reason = `Conditions optimales`;
  }

  verdict.priority = 'low';
  return verdict;
}

/**
 * Évalue la qualité de l'air intérieur
 * @param {Object} indoor - Données intérieures
 * @returns {Object} Évaluation de la qualité
 */
export function evaluateAirQuality(indoor) {
  let quality = 'Bonne';
  let score = 100;
  const issues = [];

  // Évaluation du CO2
  if (indoor.co2) {
    if (indoor.co2 > 2000) {
      quality = 'Mauvaise';
      score -= 40;
      issues.push('CO₂ très élevé');
    } else if (indoor.co2 > 1500) {
      quality = 'Médiocre';
      score -= 30;
      issues.push('CO₂ élevé');
    } else if (indoor.co2 > 1000) {
      quality = 'Acceptable';
      score -= 15;
      issues.push('CO₂ légèrement élevé');
    }
  }

  // Évaluation de l'humidité
  if (indoor.humidity < 30 || indoor.humidity > 70) {
    quality = quality === 'Bonne' ? 'Acceptable' : quality;
    score -= 20;
    issues.push(indoor.humidity < 30 ? 'Air trop sec' : 'Air trop humide');
  } else if (indoor.humidity < 40 || indoor.humidity > 60) {
    score -= 10;
    if (quality === 'Bonne') quality = 'Acceptable';
  }

  // Évaluation de la température
  if (indoor.temperature < 18 || indoor.temperature > 26) {
    score -= 15;
    issues.push(indoor.temperature < 18 ? 'Température basse' : 'Température élevée');
    if (quality === 'Bonne') quality = 'Acceptable';
  }

  return {
    quality,
    score: Math.max(0, score),
    issues,
    color: getQualityColor(quality)
  };
}

/**
 * Retourne la couleur associée à la qualité de l'air
 * @param {string} quality - Niveau de qualité
 * @returns {string} Code couleur hex
 */
function getQualityColor(quality) {
  const colors = {
    'Excellente': '#00e400',
    'Bonne': '#51d851',
    'Acceptable': '#ffff00',
    'Médiocre': '#ff7e00',
    'Mauvaise': '#ff0000'
  };
  return colors[quality] || '#999999';
}

/**
 * Formate une valeur d'humidité absolue pour l'affichage
 * @param {number} value - Valeur d'humidité absolue
 * @returns {string} Valeur formatée
 */
export function formatAbsoluteHumidity(value) {
  return `${value.toFixed(1)} g/m³`;
}