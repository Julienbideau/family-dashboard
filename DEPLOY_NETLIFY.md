# 🚀 Guide de Déploiement sur Netlify

## Déploiement Automatique depuis GitHub (Recommandé)

### Étape 1 : Connecter GitHub à Netlify

1. Va sur [app.netlify.com](https://app.netlify.com)
2. Clique sur **"Add new site"** → **"Import an existing project"**
3. Choisis **GitHub**
4. Autorise Netlify à accéder à ton compte GitHub
5. Sélectionne le repository `family-dashboard`

### Étape 2 : Configuration du Build

Netlify détectera automatiquement les paramètres depuis `netlify.toml`, mais vérifie que :

- **Base directory** : (laisse vide)
- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Functions directory** : `netlify/functions`

### Étape 3 : Variables d'Environnement 🔐

**IMPORTANT** : Ajoute ces variables dans Netlify Dashboard → Site Settings → Environment Variables

```bash
# Authentification (OBLIGATOIRE)
APP_SECRET_CODE=TestFamily2024  # Change ce code !

# Netatmo API (OBLIGATOIRE pour la météo)
NETATMO_CLIENT_ID=ton_client_id_ici
NETATMO_CLIENT_SECRET=ton_client_secret_ici
NETATMO_REFRESH_TOKEN=ton_refresh_token_ici

# Google Calendar (OPTIONNEL)
GOOGLE_CALENDAR_API_KEY=ta_cle_api_google
GOOGLE_CALENDAR_ID=ton_calendar_id@group.calendar.google.com

# Node Version
NODE_VERSION=18
```

### Étape 4 : Déployer

1. Clique sur **"Deploy site"**
2. Attends que le build se termine (~2-3 minutes)
3. Ton site sera disponible sur une URL type : `https://amazing-site-abc123.netlify.app`

## Déploiement Manuel avec Netlify CLI

Si tu préfères déployer depuis ton terminal :

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Initialiser le site
netlify init

# Déployer
netlify deploy --prod
```

## Configuration des Domaines Personnalisés

1. Va dans **Domain settings**
2. Clique sur **"Add custom domain"**
3. Entre ton domaine (ex: `dashboard.famille-bideau.fr`)
4. Configure les DNS selon les instructions de Netlify

## Structure du Projet pour Netlify

```
family-dashboard/
├── dist/                   # Frontend buildé (généré automatiquement)
├── netlify/
│   └── functions/         # Backend serverless
│       ├── get-netatmo.js    # API Netatmo
│       ├── get-tan.js         # API Transport
│       └── get-calendar.js    # API Calendar
├── src/                   # Code source React
├── netlify.toml          # Configuration Netlify
└── package.json          # Dépendances
```

## Variables d'Environnement - Détails

### 🔐 APP_SECRET_CODE
- **Utilisation** : Code PIN pour accéder au dashboard
- **Important** : Change la valeur par défaut !
- **Exemple** : `MonCodeSecret2024`

### 🌡️ Netatmo API
Pour obtenir tes credentials Netatmo :
1. Va sur [dev.netatmo.com](https://dev.netatmo.com)
2. Crée une application
3. Récupère Client ID et Client Secret
4. Utilise le script `get-netatmo-token.sh` pour obtenir le refresh token

### 📅 Google Calendar (Optionnel)
Pour activer Google Calendar :

**Option 1 - Calendrier Public** :
1. Va sur [Google Cloud Console](https://console.cloud.google.com)
2. Crée un projet
3. Active l'API Google Calendar
4. Crée une clé API
5. Récupère l'ID de ton calendrier dans les paramètres Google Calendar

**Option 2 - OAuth2** (Plus complexe) :
- Nécessite la configuration OAuth2
- Contacte-moi si tu veux cette option

## Résolution des Problèmes

### ❌ Build Failed
- Vérifie les logs dans Netlify Dashboard
- Assure-toi que toutes les dépendances sont dans `package.json`

### ❌ Functions not working
- Vérifie que les variables d'environnement sont configurées
- Regarde les logs des fonctions : Netlify Dashboard → Functions → Logs

### ❌ 401 Unauthorized
- Vérifie que `APP_SECRET_CODE` est bien configuré dans les variables d'environnement

### ❌ Netatmo ne fonctionne pas
- Vérifie tes credentials Netatmo
- Le refresh token expire après 3 mois, il faut le renouveler

## URLs des Fonctions en Production

Une fois déployé, tes fonctions seront accessibles sur :
- `https://ton-site.netlify.app/.netlify/functions/get-netatmo`
- `https://ton-site.netlify.app/.netlify/functions/get-tan`
- `https://ton-site.netlify.app/.netlify/functions/get-calendar`

## Monitoring

Dans le dashboard Netlify, tu peux voir :
- **Analytics** : Nombre de visiteurs
- **Functions** : Logs et métriques des fonctions
- **Forms** : Si tu ajoutes des formulaires
- **Deploy** : Historique des déploiements

## Support

- Documentation Netlify : [docs.netlify.com](https://docs.netlify.com)
- Dashboard Family : [github.com/Julienbideau/family-dashboard](https://github.com/Julienbideau/family-dashboard)

---

💡 **Astuce** : Active le déploiement automatique pour que chaque push sur GitHub déclenche un nouveau déploiement !