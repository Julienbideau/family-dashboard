# Family Dashboard 🏠

Un tableau de bord familial sécurisé pour surveiller la qualité de l'air et obtenir des recommandations de ventilation basées sur les données Netatmo.

## 🎯 Fonctionnalités

- **Authentification sécurisée** : Accès protégé par code PIN
- **Monitoring en temps réel** : Données de température, humidité, CO₂ depuis votre station Netatmo
- **Recommandations intelligentes** : Analyse de l'humidité absolue pour déterminer quand ouvrir/fermer les fenêtres
- **Widgets informatifs** : Date, météo, actualités familiales, collecte des déchets
- **Interface moderne** : Design responsive et élégant

## 🛠 Stack Technique

- **Frontend** : React (Vite) + Context API
- **Backend** : Netlify Functions (Node.js)
- **Sécurité** : Header x-app-secret partagé
- **Hébergement** : Netlify

## 📦 Installation

### Prérequis

- Node.js 18+
- Compte Netatmo avec une station météo
- Compte Netlify (gratuit)

### Configuration locale

1. **Cloner le repository**
   ```bash
   git clone <votre-repo>
   cd family-dashboard
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**

   Copiez le fichier `.env.example` en `.env` :
   ```bash
   cp .env.example .env
   ```

   Puis remplissez les valeurs :
   ```env
   # Code secret pour l'accès (choisissez un code fort)
   APP_SECRET_CODE=votre-code-secret

   # API Netatmo (depuis https://dev.netatmo.com/)
   NETATMO_CLIENT_ID=votre-client-id
   NETATMO_CLIENT_SECRET=votre-client-secret
   NETATMO_USERNAME=votre-username-netatmo
   NETATMO_PASSWORD=votre-password-netatmo
   ```

4. **Lancer le développement**
   ```bash
   npm run dev
   ```

   L'application sera accessible sur `http://localhost:5173`

## 🚀 Déploiement sur Netlify

### Méthode 1 : Via l'interface Netlify

1. **Connecter votre repository GitHub**
   - Allez sur [app.netlify.com](https://app.netlify.com)
   - Cliquez sur "Add new site" > "Import an existing project"
   - Sélectionnez GitHub et autorisez l'accès
   - Choisissez votre repository

2. **Configurer le build**
   - Build command : `npm run build`
   - Publish directory : `dist`
   - Functions directory : `netlify/functions`

3. **Ajouter les variables d'environnement**

   Dans Site settings > Environment variables, ajoutez :
   - `APP_SECRET_CODE` : Votre code secret (ex: `MonCodeSecret2024!`)
   - `NETATMO_CLIENT_ID` : Votre Client ID Netatmo
   - `NETATMO_CLIENT_SECRET` : Votre Client Secret Netatmo
   - `NETATMO_USERNAME` : Votre nom d'utilisateur Netatmo
   - `NETATMO_PASSWORD` : Votre mot de passe Netatmo

4. **Déployer**
   - Cliquez sur "Deploy site"
   - Attendez que le déploiement soit terminé

### Méthode 2 : Via Netlify CLI

1. **Installer Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Se connecter**
   ```bash
   netlify login
   ```

3. **Initialiser le site**
   ```bash
   netlify init
   ```

4. **Configurer les variables d'environnement**
   ```bash
   netlify env:set APP_SECRET_CODE "votre-code-secret"
   netlify env:set NETATMO_CLIENT_ID "votre-client-id"
   netlify env:set NETATMO_CLIENT_SECRET "votre-client-secret"
   netlify env:set NETATMO_USERNAME "votre-username"
   netlify env:set NETATMO_PASSWORD "votre-password"
   ```

5. **Déployer**
   ```bash
   netlify deploy --prod
   ```

## 🔐 Obtenir les clés API Netatmo

1. Allez sur [https://dev.netatmo.com/](https://dev.netatmo.com/)
2. Connectez-vous avec votre compte Netatmo
3. Cliquez sur "Create an app"
4. Remplissez le formulaire :
   - App name : Family Dashboard
   - Description : Personal weather station dashboard
   - Data Protection Officer : Votre email
5. Acceptez les conditions
6. Notez votre `Client ID` et `Client Secret`

## 📱 Utilisation

1. **Accès au dashboard**
   - Ouvrez l'URL de votre site Netlify
   - Entrez votre code secret
   - Profitez du dashboard !

2. **Interprétation des recommandations**
   - **🟢 OUVRIR** : Conditions favorables pour ventiler
   - **🔴 FERMER** : Gardez les fenêtres fermées
   - **🟡 ATTENDRE** : Conditions neutres

3. **Rafraîchissement des données**
   - Automatique toutes les 5 minutes
   - Manuel via le bouton de rafraîchissement

## 🧪 Tests locaux avec Netlify Functions

Pour tester les fonctions localement :

```bash
netlify dev
```

Cela lancera le serveur de développement avec les Netlify Functions actives.

## 📊 Architecture

```
family-dashboard/
├── netlify/
│   └── functions/
│       └── get-netatmo.js    # API sécurisée Netatmo
├── src/
│   ├── components/
│   │   ├── AirQualityCard.jsx # Widget qualité de l'air
│   │   ├── Dashboard.jsx      # Dashboard principal
│   │   └── LoginScreen.jsx    # Écran de connexion
│   ├── context/
│   │   └── AuthContext.jsx    # Contexte d'authentification
│   ├── utils/
│   │   └── humidityUtils.js   # Calculs d'humidité
│   └── App.jsx                # Composant racine
├── netlify.toml               # Configuration Netlify
└── package.json               # Dépendances
```

## 🔧 Personnalisation

### Modifier le délai de rafraîchissement

Dans `src/components/Dashboard.jsx`, ligne ~90 :
```javascript
const interval = setInterval(fetchWeatherData, 5 * 60 * 1000); // 5 minutes
```

### Ajouter des widgets

1. Créez un nouveau composant dans `src/components/`
2. Importez-le dans `Dashboard.jsx`
3. Ajoutez-le dans la grille avec la classe `widget`

### Changer les couleurs

Modifiez les gradients dans les fichiers CSS :
- Connexion : `src/components/LoginScreen.jsx`
- Dashboard : `src/components/Dashboard.jsx`

## 🐛 Dépannage

### "Unauthorized" après connexion
- Vérifiez que `APP_SECRET_CODE` est bien défini dans Netlify
- Assurez-vous que le code entré correspond exactement

### Pas de données Netatmo
- Vérifiez vos identifiants Netatmo
- Assurez-vous que votre station est en ligne
- Vérifiez les logs dans Netlify Functions

### Erreur de build sur Netlify
- Vérifiez que Node 18 est utilisé
- Assurez-vous que toutes les dépendances sont dans `package.json`

## 📜 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📞 Support

Pour toute question, ouvrez une issue sur GitHub.