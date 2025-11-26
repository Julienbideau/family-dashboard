import https from 'https';

// Configuration Netatmo
const NETATMO_CLIENT_ID = process.env.NETATMO_CLIENT_ID;
const NETATMO_CLIENT_SECRET = process.env.NETATMO_CLIENT_SECRET;
const NETATMO_REFRESH_TOKEN = process.env.NETATMO_REFRESH_TOKEN;
const APP_SECRET_CODE = process.env.APP_SECRET_CODE;

// Cache pour l'access token
let cachedAccessToken = null;
let tokenExpiresAt = null;

// Fonction pour obtenir le token d'accès Netatmo via refresh token
async function getAccessToken() {
  // Vérifier si on a un token en cache encore valide
  if (cachedAccessToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    console.log('Using cached access token');
    return cachedAccessToken;
  }

  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: NETATMO_CLIENT_ID,
      client_secret: NETATMO_CLIENT_SECRET,
      refresh_token: NETATMO_REFRESH_TOKEN
    }).toString();

    const options = {
      hostname: 'api.netatmo.com',
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          console.log('Token response status:', res.statusCode);

          if (res.statusCode !== 200) {
            console.error('Token error:', data);
            reject(new Error(`Failed to get access token: ${res.statusCode}`));
            return;
          }

          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            // Mettre en cache le token
            cachedAccessToken = parsed.access_token;
            // Le token expire dans expires_in secondes, on retire 60 secondes pour la sécurité
            tokenExpiresAt = new Date(Date.now() + (parsed.expires_in - 60) * 1000);
            console.log('Access token obtained, expires at:', tokenExpiresAt);
            resolve(parsed.access_token);
          } else {
            reject(new Error(`No access token in response: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          console.error('Parse error:', e);
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Fonction alternative pour l'authentification par mot de passe (backup)
async function getAccessTokenByPassword() {
  const NETATMO_USERNAME = process.env.NETATMO_USERNAME;
  const NETATMO_PASSWORD = process.env.NETATMO_PASSWORD;

  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      grant_type: 'password',
      client_id: NETATMO_CLIENT_ID,
      client_secret: NETATMO_CLIENT_SECRET,
      username: NETATMO_USERNAME,
      password: NETATMO_PASSWORD,
      scope: 'read_station'
    }).toString();

    const options = {
      hostname: 'api.netatmo.com',
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            return;
          }

          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            resolve(parsed.access_token);
          } else {
            reject(new Error('Failed to get access token'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Fonction pour obtenir les données de la station
async function getStationData(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netatmo.com',
      path: '/api/getstationsdata',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          console.log('Station data response status:', res.statusCode);

          if (res.statusCode !== 200) {
            console.error('Station data error:', data);
            reject(new Error(`Failed to get station data: ${res.statusCode}`));
            return;
          }

          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Handler principal
export const handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-app-secret, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Vérification du secret
    const appSecret = event.headers['x-app-secret'];

    if (!APP_SECRET_CODE || !appSecret || appSecret !== APP_SECRET_CODE) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    let accessToken;

    // NOUVEAU: Vérifier si un token est fourni dans le header Authorization
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
      console.log('Using access token from Authorization header');
    }
    // ANCIEN FLUX: Fallback sur les variables d'environnement
    else if (NETATMO_REFRESH_TOKEN) {
      console.log('Using refresh token from environment');
      try {
        accessToken = await getAccessToken();
      } catch (error) {
        console.error('Refresh token failed:', error);
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            error: 'Netatmo authentication required',
            message: 'Please authenticate with Netatmo',
            details: error.message
          })
        };
      }
    } else {
      // Pas de token fourni et pas de config dans l'environnement
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Netatmo authentication required',
          message: 'Please authenticate with Netatmo'
        })
      };
    }

    // Obtenir les données de la station
    const stationData = await getStationData(accessToken);

    // Parser et formater les données
    if (stationData.body && stationData.body.devices && stationData.body.devices.length > 0) {
      const device = stationData.body.devices[0];

      // Log pour debug - voir tous les modules
      console.log('Device name:', device.station_name || 'Unknown');
      console.log('Device modules count:', device.modules ? device.modules.length : 0);
      if (device.modules) {
        device.modules.forEach((m, i) => {
          console.log(`Module ${i}: type=${m.type}, name=${m.module_name}, data_type=${m.data_type}`);
        });
      }

      // Station principale (module intérieur principal)
      const mainIndoor = {
        name: device.module_name || device.station_name || 'Station principale',
        temperature: device.dashboard_data?.Temperature || 0,
        humidity: device.dashboard_data?.Humidity || 0,
        co2: device.dashboard_data?.CO2 || 0,
        pressure: device.dashboard_data?.Pressure || 0,
        noise: device.dashboard_data?.Noise || 0
      };

      // Collecter tous les modules intérieurs
      const indoorModules = [mainIndoor];

      // Chercher les modules extérieurs et intérieurs supplémentaires
      let outdoor = {
        temperature: 0,
        humidity: 0
      };

      if (device.modules && device.modules.length > 0) {
        device.modules.forEach(module => {
          // Module extérieur (NAModule1)
          if (module.type === 'NAModule1') {
            outdoor = {
              name: module.module_name || 'Extérieur',
              temperature: module.dashboard_data?.Temperature || 0,
              humidity: module.dashboard_data?.Humidity || 0
            };
          }
          // Module intérieur supplémentaire (NAModule4 = module additionnel intérieur)
          else if (module.type === 'NAModule4' && module.dashboard_data) {
            indoorModules.push({
              name: module.module_name || 'Module intérieur',
              temperature: module.dashboard_data?.Temperature || 0,
              humidity: module.dashboard_data?.Humidity || 0,
              co2: module.dashboard_data?.CO2 || 0,
              pressure: 0, // NAModule4 n'a pas de pression
              noise: 0 // NAModule4 n'a pas de bruit
            });
          }
          // Module CO2 (NAModule2 = module CO2)
          else if (module.type === 'NAModule2' && module.dashboard_data) {
            indoorModules.push({
              name: module.module_name || 'Module CO2',
              temperature: module.dashboard_data?.Temperature || 0,
              humidity: module.dashboard_data?.Humidity || 0,
              co2: module.dashboard_data?.CO2 || 0,
              pressure: 0,
              noise: 0
            });
          }
        });
      }

      // Pour la compatibilité, on garde "indoor" comme le premier module
      const indoor = indoorModules[0];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            indoor, // Module principal pour compatibilité
            indoorModules, // Tous les modules intérieurs
            outdoor,
            lastUpdate: new Date().toISOString()
          }
        })
      };
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No station data found' })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};