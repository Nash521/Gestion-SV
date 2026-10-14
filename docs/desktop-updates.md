# Mises à jour de Gestion SV sur Windows

La version 0.1.0 installée sur les PC ne sait pas encore chercher les mises à jour. Installer une fois la version 0.2.0 sur chaque PC, par-dessus la version actuelle. À partir de cette version, l'application vérifie GitHub au démarrage puis toutes les six heures. Une fois la nouvelle version téléchargée, elle propose de redémarrer pour l'installer. La commande **Gestion SV > Vérifier les mises à jour** permet aussi de vérifier manuellement.

## Préparer GitHub

Dans **Settings > Secrets and variables > Actions > Variables** du dépôt, renseigner les variables publiques `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` et, si utilisé, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`. Elles doivent pointer vers le même projet Firebase que l'application en production. Le jeton temporaire `GITHUB_TOKEN` est fourni par GitHub Actions.

Le workflow `.github/workflows/desktop-release.yml` doit être présent sur la branche publiée. Pour chaque nouvelle version :

1. Mettre à jour `desktop/package.json` et `desktop/package-lock.json` avec la même version.
2. Fusionner le code à publier sur la branche de production.
3. Créer et pousser un tag correspondant, par exemple `v0.2.0`.
4. Attendre la fin du workflow **Publication Windows**. La page **Releases** du dépôt doit contenir l'installateur `Gestion-SV-Setup-0.2.0.exe` et le fichier `latest.yml`.

Ne pas distribuer un installateur local non publié si l'on attend qu'il trouve automatiquement les futures mises à jour. Pour construire un installateur local sans publier : `npm ci`, `npm ci --prefix desktop`, puis `npm run desktop:package`.

Un installateur non signé peut afficher un avertissement Windows SmartScreen. Cela ne change pas le mécanisme de mise à jour ; signer les versions publiées reste souhaitable pour faciliter leur installation.
