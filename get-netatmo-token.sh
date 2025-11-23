#!/bin/bash

# Script pour obtenir un refresh token Netatmo
# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Obtention du Refresh Token Netatmo ===${NC}\n"

# Vos clés (déjà configurées)
CLIENT_ID="692344edd039e0e35e061659"
CLIENT_SECRET="QVR69Ia3sxnWucwI8MrVvhmsFc8O"
REDIRECT_URI="http://localhost:8888/callback"

echo -e "${YELLOW}Étape 1: Autorisation${NC}"
echo "Ouvrez cette URL dans votre navigateur :"
echo -e "${GREEN}https://api.netatmo.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=read_station&state=test${NC}\n"

echo "Appuyez sur Entrée pour ouvrir automatiquement le navigateur..."
read

# Ouvrir le navigateur
open "https://api.netatmo.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=read_station&state=test"

echo -e "\n${YELLOW}Étape 2: Récupération du code${NC}"
echo "Après autorisation, vous serez redirigé vers une URL comme :"
echo "http://localhost:8888/callback?code=XXXXXX&state=test"
echo -e "\n${GREEN}Copiez le CODE de l'URL et collez-le ici :${NC}"
read -p "Code: " AUTH_CODE

if [ -z "$AUTH_CODE" ]; then
    echo -e "${RED}Erreur : Aucun code fourni${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Étape 3: Échange du code contre un token${NC}"

# Faire la requête pour obtenir le refresh token
RESPONSE=$(curl -s -X POST "https://api.netatmo.com/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "code=${AUTH_CODE}" \
  -d "redirect_uri=${REDIRECT_URI}" \
  -d "scope=read_station")

# Extraire le refresh token
REFRESH_TOKEN=$(echo $RESPONSE | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$REFRESH_TOKEN" ]; then
    echo -e "${RED}Erreur lors de l'obtention du token :${NC}"
    echo "$RESPONSE"
    exit 1
fi

echo -e "\n${GREEN}✅ Succès ! Votre refresh token :${NC}"
echo "$REFRESH_TOKEN"

echo -e "\n${YELLOW}Étape 4: Mise à jour du fichier .env${NC}"
echo "Voulez-vous ajouter automatiquement le token à votre .env ? (o/n)"
read -p "Choix: " UPDATE_ENV

if [ "$UPDATE_ENV" = "o" ] || [ "$UPDATE_ENV" = "O" ]; then
    # Sauvegarder l'ancien .env
    cp .env .env.backup

    # Ajouter ou mettre à jour le refresh token
    if grep -q "NETATMO_REFRESH_TOKEN=" .env; then
        # Remplacer la ligne existante
        sed -i '' "s/.*NETATMO_REFRESH_TOKEN=.*/NETATMO_REFRESH_TOKEN=$REFRESH_TOKEN/" .env
    else
        # Ajouter la ligne
        echo "" >> .env
        echo "# Refresh token obtenu automatiquement" >> .env
        echo "NETATMO_REFRESH_TOKEN=$REFRESH_TOKEN" >> .env
    fi

    echo -e "${GREEN}✅ .env mis à jour avec succès !${NC}"
    echo "Une sauvegarde a été créée : .env.backup"
    echo -e "\n${GREEN}🎉 Configuration terminée ! Relancez 'netlify dev' pour tester.${NC}"
else
    echo -e "\n${YELLOW}Ajoutez manuellement cette ligne à votre .env :${NC}"
    echo "NETATMO_REFRESH_TOKEN=$REFRESH_TOKEN"
fi