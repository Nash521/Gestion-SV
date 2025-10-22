## 3. Structure des Composants

L'application GestioSV est construite sur une architecture de composants modulaire et réutilisable, fortement inspirée par la philosophie de **ShadCN UI**. Cette approche favorise la séparation des préoccupations, la maintenabilité et la cohérence visuelle à travers toute l'application. Les composants sont organisés de manière logique dans le dossier `src/components/`.

### 3.1. Liste des Dossiers de Composants Principaux

1.  **`src/components/ui/`**
    *   **Rôle :** Ce dossier constitue la fondation de notre bibliothèque d'interface utilisateur. Il contient les composants de base, non-stylisés (ou "primitifs") fournis par ShadCN UI, tels que `Button`, `Card`, `Input`, `Dialog`, `Table`, etc.
    *   **Interaction :** Ces composants sont les "atomes" de notre design system. Ils sont rarement utilisés directement dans les pages, mais servent plutôt à construire des composants plus complexes et spécifiques à notre application.

2.  **`src/components/layout/`**
    *   **Rôle :** Contient les composants responsables de la structure principale de l'application, comme la barre de navigation latérale (`SidebarNav`), l'en-tête de page (`PageHeader`), le gestionnaire de thème, et le système de notifications (`NotificationBell`).
    *   **Interaction :** Ces composants sont assemblés dans le fichier `src/app/dashboard/layout.tsx` pour créer la coquille persistante de l'application. Ils interagissent avec les contextes globaux (comme `AuthContext` et `NotificationContext`) pour afficher des informations dynamiques (nom de l'utilisateur, nombre de notifications).

3.  **`src/components/shared/`**
    *   **Rôle :** Héberge les composants réutilisables à travers plusieurs modules ou fonctionnalités. Un excellent exemple est `StatusBadge.tsx`, qui affiche un badge de statut stylisé en fonction du statut d'une proforma, d'un bon de commande, etc.
    *   **Interaction :** Ces composants sont importés par différentes pages (Proformas, Commandes) pour assurer une représentation visuelle cohérente des données partagées.

4.  **`src/components/dashboard/`**, **`src/components/invoices/`**, **`src/components/projects/`**
    *   **Rôle :** Ces dossiers contiennent des composants "métier", spécifiques à une fonctionnalité.
        *   `dashboard/` : Contient les cartes de statistiques et les graphiques (ex: `RevenueChart`, `ExpenseChart`).
        *   `invoices/` : Contient le formulaire de création/modification de proforma (`InvoiceForm`).
        *   `projects/` : Contient les vues du module projet, comme le tableau Kanban (`ProjectBoard`), la vue en tableau (`ProjectTableView`), etc.
    *   **Interaction :** Ces composants encapsulent une logique métier complexe. Par exemple, `InvoiceForm` gère la validation des champs, le calcul des totaux et la soumission des données. `ProjectBoard` gère la logique de glisser-déposer (drag-and-drop) des tâches.

### 3.2. Réutilisation et Découpage des Composants

La stratégie de découpage suit un principe de composition, allant du plus simple au plus complexe :

*   **Atomes (`/ui`) :** `Button`, `Input`, `Card`.
*   **Molécules (composants métier simples) :** Le composant `StatCard` (`/dashboard/page.tsx`) est un bon exemple. Il est composé d'une `Card`, `CardHeader`, `CardTitle` et `CardContent` pour afficher une statistique clé.
*   **Organismes (composants métier complexes) :**
    *   **`InvoiceForm` :** C'est un composant majeur qui est réutilisé pour deux cas d'usage distincts : la création (`/invoices/new`) et la modification (`/invoices/[id]/edit`) d'une proforma. Il accepte des `props` (`formType`, `initialData`) pour adapter son comportement.
    *   **`ProjectBoard` :** Ce composant orchestre d'autres composants plus petits comme `TaskListColumn` et `TaskCard` pour construire une interface interactive complète. Il gère l'état global du tableau (comme le glisser-déposer) et passe les données nécessaires à ses enfants.
*   **Pages (`/app`) :** Les pages, comme `src/app/dashboard/invoices/page.tsx`, assemblent ces différents composants pour construire l'interface finale. La page de facturation, par exemple, utilise une `Card` pour l'en-tête, une `Table` pour lister les proformas, et des `DropdownMenu` pour les actions sur chaque ligne.

Cette approche garantit que chaque composant a une responsabilité unique, ce qui le rend plus facile à tester, à maintenir et à réutiliser ailleurs dans l'application.
