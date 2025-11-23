import https from 'https';

const APP_SECRET_CODE = process.env.APP_SECRET_CODE;

// Fonction pour appeler l'API TAN
async function fetchTanData() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'open.tan.fr',
      path: '/ewp/tempsattente.json/BJOI',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
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
    'Access-Control-Allow-Headers': 'Content-Type, x-app-secret',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Récupérer les données TAN
    const tanData = await fetchTanData();

    if (!tanData || !Array.isArray(tanData) || tanData.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          trams: []
        })
      };
    }

    // Filtrer et formater les données
    const tramsParsed = tanData
      .filter(tram => {
        // Filtrer uniquement la ligne 1
        return tram.ligne?.numLigne === '1';
      })
      .map(tram => {
        // Parser le temps d'attente
        let tempsMinutes = 0;
        const tempsAttente = tram.temps || '';

        if (tempsAttente.includes('proche')) {
          tempsMinutes = 0;
        } else if (tempsAttente.includes('mn')) {
          tempsMinutes = parseInt(tempsAttente.replace('mn', ''));
        } else if (tempsAttente.includes('h')) {
          const parts = tempsAttente.split('h');
          tempsMinutes = parseInt(parts[0]) * 60;
          if (parts[1] && parts[1].includes('mn')) {
            tempsMinutes += parseInt(parts[1].replace('mn', ''));
          }
        }

        return {
          destination: tram.terminus || 'François Mitterrand',
          temps: tempsAttente || 'N/A',
          tempsMinutes: tempsMinutes,
          ligne: tram.ligne?.numLigne,
          direction: tram.sens === 1 ? 'Aller' : 'Retour',
          arret: tram.arret?.codeArret,
          tempsReel: tram.tempsReel === 'true'
        };
      })
      .sort((a, b) => a.tempsMinutes - b.tempsMinutes)
      .slice(0, 5); // Garder les 5 prochains

    // Format simplifié pour le frontend
    const tramsSimplified = tramsParsed.map(tram => ({
      destination: tram.destination,
      temps: tram.temps
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        trams: tramsSimplified,
        lastUpdate: new Date().toISOString()
      })
    };

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