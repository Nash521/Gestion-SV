# Modification du mot de passe d'un employé

La page **Collaborateurs** permet à un administrateur de définir un nouveau mot de passe pour un compte employé. Cette opération passe par une route serveur Next.js protégée : elle vérifie le jeton Firebase de l'administrateur, lit son rôle dans Firestore, vérifie que le compte cible est un employé, puis utilise Firebase Admin pour modifier le mot de passe. Les sessions de l'employé sont révoquées.

## Configuration Netlify

1. Dans la console Firebase du projet utilisé par l'application, ouvrez **Paramètres du projet > Comptes de service > Générer une clé privée**.
2. Dans Netlify, ajoutez une variable d'environnement **`FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`** contenant le JSON complet de cette clé, avec une portée incluant les fonctions et le contexte de production. La valeur ne doit jamais être préfixée par `NEXT_PUBLIC_`, ni être ajoutée au dépôt.
3. Dans Firebase Authentication > Utilisateurs, relevez l'UID de chaque administrateur autorisé à modifier les mots de passe. Ajoutez **`FIREBASE_PASSWORD_MANAGER_UIDS`** dans Netlify avec ces UID séparés par des virgules. Cette liste est vérifiée en plus du rôle Admin enregistré dans Firestore.
4. Vérifiez que `NEXT_PUBLIC_FIREBASE_PROJECT_ID` correspond au `project_id` de la clé, puis redéployez le site.

L'application Windows transmet cette demande à la route du site `https://gestionsv.netlify.app` ; elle ne contient aucune clé de service Firebase. Le serveur local de développement peut être configuré avec la même variable privée, ou avec `GESTIONSV_ADMIN_API_ORIGIN=https://gestionsv.netlify.app` pour utiliser la route déployée.

Si la variable privée manque sur Netlify, l'interface affiche une erreur de configuration et aucun mot de passe n'est modifié.
