# Guide d'authentification Netatmo

## ⚠️ Changement important

Netatmo a déprécié l'authentification par mot de passe (grant_type: password) depuis 2023.
Vous devez maintenant utiliser un **refresh token** pour accéder à l'API.

## 📋 Étapes pour obtenir un refresh token

### 1. Créer une application Netatmo

1. Allez sur https://dev.netatmo.com/apps
2. Connectez-vous avec votre compte Netatmo
3. Cliquez sur "Create" pour créer une nouvelle app
4. Remplissez les informations :
   - **App name** : Family Dashboard
   - **Description** : Personal weather station dashboard
   - **Redirect URI** : http://localhost:8888/callback (important !)
5. Notez votre `Client ID` et `Client Secret`

### 2. Obtenir le code d'autorisation

Ouvrez cette URL dans votre navigateur (remplacez YOUR_CLIENT_ID) :

```
https://api.netatmo.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:8888/callback&scope=read_station&state=test
```

Connectez-vous et autorisez l'application. Vous serez redirigé vers une URL comme :
```
http://localhost:8888/callback?code=YOUR_AUTH_CODE&state=test
```

Notez le `code` dans l'URL.

### 3. Obtenir le refresh token

Utilisez curl pour échanger le code contre un refresh token :

```bash
curl -X POST "https://api.netatmo.com/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_AUTH_CODE" \
  -d "redirect_uri=http://localhost:8888/callback" \
  -d "scope=read_station"
```

La réponse contiendra :
```json
{
  "access_token": "...",
  "refresh_token": "YOUR_REFRESH_TOKEN",  // Gardez ceci !
  "expires_in": 10800
}
```

### 4. Configurer votre .env

Remplacez les variables dans votre `.env` :

```env
NETATMO_CLIENT_ID=votre_client_id
NETATMO_CLIENT_SECRET=votre_client_secret
NETATMO_REFRESH_TOKEN=votre_refresh_token  # Au lieu du username/password
```

## 🔄 Token refresh automatique

Le refresh token est permanent et peut être utilisé pour obtenir de nouveaux access tokens.
L'application gérera automatiquement le renouvellement des tokens.

## 📝 Notes importantes

- Le refresh token n'expire jamais tant que vous l'utilisez régulièrement
- Gardez-le secret et sécurisé
- Si vous perdez le refresh token, vous devrez refaire tout le processus d'autorisation