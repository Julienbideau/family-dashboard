# Configuration OAuth Netatmo

Ce projet utilise OAuth2 pour l'authentification Netatmo. Voici comment le configurer.

## Pourquoi OAuth ?

Au lieu de stocker un refresh token dans le `.env` (qui nécessite une configuration manuelle complexe), chaque utilisateur s'authentifie directement avec son compte Netatmo. Les tokens sont stockés dans le localStorage du navigateur.

## Avantages

- ✅ Pas besoin de manipuler les tokens manuellement
- ✅ Chaque utilisateur utilise son propre compte Netatmo
- ✅ Les tokens sont rafraîchis automatiquement
- ✅ Plus sécurisé et conforme aux bonnes pratiques OAuth2

## Configuration

### 1. Créer une application Netatmo

1. Allez sur [dev.netatmo.com](https://dev.netatmo.com)
2. Connectez-vous avec votre compte Netatmo
3. Allez dans "My Apps" → "Create"
4. Remplissez les informations :
   - **Name**: Family Dashboard (ou autre)
   - **Description**: Dashboard familial pour Netatmo
   - **Data protection officer**: Votre email
   - **Redirect URI**: `http://localhost:8888/netatmo-callback` (en développement)
   - Pour la production: `https://votre-domaine.netlify.app/netatmo-callback`

5. Notez le **Client ID** et le **Client Secret**

### 2. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Code secret pour protéger l'accès au dashboard
APP_SECRET_CODE=votre_code_secret

# Configuration Netatmo (backend)
NETATMO_CLIENT_ID=votre_client_id
NETATMO_CLIENT_SECRET=votre_client_secret

# Configuration Netatmo (frontend)
VITE_NETATMO_CLIENT_ID=votre_client_id
```

⚠️ **Important** : Le même Client ID doit être dans `NETATMO_CLIENT_ID` (backend) et `VITE_NETATMO_CLIENT_ID` (frontend).

### 3. Configuration Netlify (Production)

Dans Netlify, ajoutez les variables d'environnement :

1. Allez dans Site Settings → Environment Variables
2. Ajoutez :
   - `APP_SECRET_CODE`
   - `NETATMO_CLIENT_ID`
   - `NETATMO_CLIENT_SECRET`
   - `VITE_NETATMO_CLIENT_ID`

3. N'oubliez pas de mettre à jour le Redirect URI dans votre app Netatmo avec l'URL de production !

## Flux d'authentification

1. L'utilisateur entre son code secret (authentification app)
2. Au premier appel à l'API Netatmo, il reçoit une erreur 401
3. Il est automatiquement redirigé vers Netatmo pour s'authentifier
4. Netatmo redirige vers `/netatmo-callback` avec un code
5. Le code est échangé contre un access token et refresh token
6. Les tokens sont stockés dans le localStorage
7. Le token est automatiquement ajouté aux futurs appels API

## Cache Netatmo

⚠️ **Important à savoir** : Netatmo met en cache les données météo pendant ~10 minutes côté serveur. C'est normal si les données ne sont pas en temps réel parfait.

## Dépannage

### Erreur "Invalid redirect URI"
- Vérifiez que l'URL de callback dans l'app Netatmo correspond exactement à celle configurée
- En développement : `http://localhost:8888/netatmo-callback`
- En production : `https://votre-domaine.netlify.app/netatmo-callback`

### Erreur "Invalid client"
- Vérifiez que `NETATMO_CLIENT_ID` et `VITE_NETATMO_CLIENT_ID` sont identiques
- Vérifiez que `NETATMO_CLIENT_SECRET` est correct

### Données pas à jour
- C'est normal ! Netatmo cache les données pendant ~10 minutes
- L'application mobile Netatmo utilise des APIs internes qui ne sont pas disponibles pour les développeurs

## Architecture

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │
       │ 1. Redirect vers Netatmo OAuth
       ▼
┌─────────────────┐
│  Netatmo OAuth  │
│   api.netatmo   │
└──────┬──────────┘
       │
       │ 2. Callback avec code
       ▼
┌──────────────────┐
│ Netlify Function │
│ netatmo-callback │
└──────┬───────────┘
       │
       │ 3. Exchange code → tokens
       ▼
┌─────────────────┐
│  localStorage   │
│  (tokens)       │
└─────────────────┘
```

Chaque appel à `/get-netatmo` utilise le token du localStorage dans le header `Authorization: Bearer <token>`.
