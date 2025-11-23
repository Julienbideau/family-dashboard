import https from 'https';

const APP_SECRET_CODE = process.env.APP_SECRET_CODE;
const GOOGLE_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID; // Peut être votre email ou un ID de calendrier

// Fonction pour appeler l'API Google Calendar
async function fetchCalendarEvents(calendarId, apiKey) {
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14); // Récupère les événements des 14 prochains jours

  const timeMin = now.toISOString();
  const timeMax = endDate.toISOString();

  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      key: apiKey,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '10'
    });

    const options = {
      hostname: 'www.googleapis.com',
      path: `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
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

// Formater les événements pour le frontend
function formatEvents(events) {
  if (!events || !events.items) return [];

  return events.items.map(event => {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    const isAllDay = !event.start?.dateTime;

    // Parser les dates
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Calculer la durée et le temps restant
    const now = new Date();
    const daysUntil = Math.floor((startDate - now) / (1000 * 60 * 60 * 24));

    let timeUntil = '';
    if (daysUntil === 0) {
      const hoursUntil = Math.floor((startDate - now) / (1000 * 60 * 60));
      if (hoursUntil < 0) {
        timeUntil = 'En cours';
      } else if (hoursUntil === 0) {
        const minutesUntil = Math.floor((startDate - now) / (1000 * 60));
        timeUntil = `Dans ${minutesUntil} min`;
      } else {
        timeUntil = `Dans ${hoursUntil}h`;
      }
    } else if (daysUntil === 1) {
      timeUntil = 'Demain';
    } else if (daysUntil > 1 && daysUntil <= 7) {
      timeUntil = `Dans ${daysUntil} jours`;
    } else {
      timeUntil = startDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }

    return {
      id: event.id,
      title: event.summary || 'Sans titre',
      description: event.description || '',
      location: event.location || '',
      start: start,
      end: end,
      isAllDay: isAllDay,
      startTime: isAllDay ? 'Toute la journée' : startDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      timeUntil: timeUntil,
      colorId: event.colorId,
      status: event.status
    };
  }).filter(event => {
    // Filtrer les événements passés (sauf ceux en cours)
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const now = new Date();
    return eventEnd > now; // Garder si l'événement n'est pas encore terminé
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

    // Vérifier la configuration
    if (!GOOGLE_API_KEY || !CALENDAR_ID) {
      console.log('Configuration manquante:', {
        hasApiKey: !!GOOGLE_API_KEY,
        hasCalendarId: !!CALENDAR_ID
      });

      // Retourner des données de démonstration si non configuré
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          isDemo: true,
          events: [
            {
              id: 'demo1',
              title: 'Configurer Google Calendar',
              description: 'Ajouter GOOGLE_CALENDAR_API_KEY et GOOGLE_CALENDAR_ID dans .env',
              start: new Date().toISOString(),
              isAllDay: false,
              startTime: '10:00',
              timeUntil: "Maintenant",
              location: 'Dashboard'
            },
            {
              id: 'demo2',
              title: 'Réunion famille',
              start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              isAllDay: false,
              startTime: '19:00',
              timeUntil: 'Dans 3 jours',
              location: 'Maison'
            }
          ],
          lastUpdate: new Date().toISOString()
        })
      };
    }

    // Récupérer les événements
    console.log('Fetching calendar events...');
    const calendarData = await fetchCalendarEvents(CALENDAR_ID, GOOGLE_API_KEY);

    // Vérifier les erreurs de l'API
    if (calendarData.error) {
      console.error('Google Calendar API error:', calendarData.error);

      if (calendarData.error.code === 404) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Calendar not found. Vérifiez GOOGLE_CALENDAR_ID',
            details: calendarData.error.message
          })
        };
      }

      return {
        statusCode: calendarData.error.code || 500,
        headers,
        body: JSON.stringify({
          error: 'Google Calendar API error',
          details: calendarData.error.message
        })
      };
    }

    // Formater les événements
    const events = formatEvents(calendarData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        events: events.slice(0, 10), // Limiter à 10 événements
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