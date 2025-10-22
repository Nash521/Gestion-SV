# Architecture Générale du Front-end - GestioSV

Ce document décrit l'organisation globale du projet front-end de l'application GestioSV, en mettant en lumière la structure des dossiers et les principaux outils utilisés.

## 1. Outils et Framework

Le projet est construit sur l'écosystème **Next.js** avec **React** et **TypeScript**. Ce choix offre une base solide, performante et maintenable, combinant le rendu côté serveur (SSR) et la génération de sites statiques (SSG) pour des temps de chargement optimaux.

- **Framework :** Next.js 15 (utilisant l'App Router)
- **Langage :** TypeScript
- **Bibliothèque UI :** React 18
- **Style :** Tailwind CSS pour l'utilitaire CSS et ShadCN UI pour un ensemble de composants d'interface utilisateur réutilisables et accessibles.
- **Gestion de l'état global :** React Context API pour des états simples comme l'authentification et les notifications.
- **Communication Backend :** Firebase SDK (v11) pour l'interaction en temps réel avec Firestore (base de données) et Firebase Authentication.

## 2. Arborescence et Organisation des Dossiers

Le projet suit une structure modulaire et logique pour faciliter la maintenance et l'évolution de l'application. Le code source principal est situé dans le dossier `src/`.

```
src/
├── app/                  # Coeur de l'application avec Next.js App Router
│   ├── dashboard/        # Layout et pages protégées de l'application
│   │   ├── (groupes)/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Pages de détail/modification (ex: facture)
│   │   │   └── page.tsx          # Pages principales (ex: /dashboard/clients)
│   │   └── layout.tsx            # Layout principal du tableau de bord (sidebar, header)
│   ├── login/              # Page de connexion
│   ├── layout.tsx          # Layout racine de l'application
│   └── page.tsx            # Page d'accueil (qui redirige vers /login)
│
├── components/           # Composants React réutilisables
│   ├── dashboard/        # Composants spécifiques au tableau de bord (graphiques, etc.)
│   ├── invoices/         # Composants liés aux proformas (ex: formulaire)
│   ├── layout/           # Composants de la structure (sidebar, header, etc.)
│   ├── projects/         # Composants pour la gestion de projet (kanban, etc.)
│   ├── shared/           # Composants partagés par plusieurs modules (ex: StatusBadge)
│   └── ui/               # Composants de base fournis par ShadCN UI (Button, Card, etc.)
│
├── contexts/             # Providers React Context pour la gestion de l'état global
│   ├── auth-context.tsx      # Gère l'état de l'utilisateur connecté
│   └── notification-context.tsx # Gère les notifications en temps réel
│
├── hooks/                # Hooks React personnalisés
│   ├── use-toast.ts      # Hook pour afficher des notifications (toasts)
│   └── use-mobile.ts     # Hook pour détecter la navigation sur mobile
│
├── lib/                  # Utilitaires, définitions et services
│   ├── firebase/
│   │   ├── client.ts         # Configuration et initialisation du client Firebase
│   │   └── services.ts       # Fonctions pour interagir avec Firestore (CRUD)
│   ├── definitions.ts    # Définitions des types TypeScript (Invoice, Client, etc.)
│   ├── data.ts           # Données de simulation (utilisées au début du projet)
│   └── utils.ts          # Fonctions utilitaires générales (ex: cn pour les classes CSS)
│
└── ai/                   # Logique liée à l'intelligence artificielle
    ├── genkit.ts         # Configuration de l'instance Genkit
    └── flows/            # Contiendrait les flux Genkit (non utilisé actuellement)
```

### **Philosophie de l'Architecture**

- **Modularité :** Les fonctionnalités sont regroupées par domaine (comptabilité, projets, clients) dans des dossiers dédiés au sein de `app/dashboard/` et `components/`.
- **Composants Réutilisables :** L'utilisation de **ShadCN UI** permet de disposer d'une bibliothèque de composants de base (`ui/`) qui sont ensuite assemblés pour créer des composants plus complexes et spécifiques à l'application (`dashboard/`, `layout/`, etc.).
- **Séparation des Préoccupations :**
    - L'interface utilisateur est gérée par les composants React (`.tsx`).
    - La logique métier et l'accès aux données sont encapsulés dans `lib/firebase/services.ts`.
    - Les types et structures de données sont centralisés dans `lib/definitions.ts`.
- **Scalabilité :** L'utilisation de l'App Router de Next.js et de cette structure de dossiers permet d'ajouter facilement de nouvelles pages et fonctionnalités sans impacter l'existant.
