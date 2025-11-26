import https from 'https';

const NETATMO_CLIENT_ID = process.env.NETATMO_CLIENT_ID;
const NETATMO_CLIENT_SECRET = process.env.NETATMO_CLIENT_SECRET;

// Fonction pour rafraîchir le token
async function refreshAccessToken(refreshToken) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: NETATMO_CLIENT_ID,
      client_secret: NETATMO_CLIENT_SECRET,
      refresh_token: refreshToken
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
          console.log('Token refresh response status:', res.statusCode);

          if (res.statusCode !== 200) {
            console.error('Token refresh error:', data);
            reject(new Error(`Failed to refresh token: ${res.statusCode}`));
            return;
          }

          const parsed = JSON.parse(data);
          resolve(parsed);
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

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (!NETATMO_CLIENT_ID || !NETATMO_CLIENT_SECRET) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Missing Netatmo client configuration' })
      };
    }

    const { refresh_token } = JSON.parse(event.body || '{}');

    if (!refresh_token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing refresh token' })
      };
    }

    // Rafraîchir le token
    const tokenData = await refreshAccessToken(refresh_token);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          expires_at: Date.now() + (tokenData.expires_in * 1000)
        }
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to refresh token',
        message: error.message
      })
    };
  }
};
