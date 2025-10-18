 # projetc 

## Modèle Conceptuel de Données (MCD) - Méthode Merise

Ce document décrit la structure des données de l'application GestioSV en utilisant une approche inspirée du Modèle Conceptuel de Données (MCD) de la méthode Merise.

### Entités Principales

1.  **COLLABORATEUR**
    *   `id_collaborateur` (PK) : Identifiant unique
    *   `nom`
    *   `email`
    *   `role` (Admin, Employé)

2.  **CLIENT**
    *   `id_client` (PK) : Identifiant unique
    *   `nom`
    *   `email`
    *   `adresse`
    *   `telephone`

3.  **PROJET**
    *   `id_projet` (PK) : Identifiant unique
    *   `nom`
    *   `description`

4.  **LISTE_TACHE** (Colonnes du Kanban, ex: "À faire", "En cours")
    *   `id_liste` (PK) : Identifiant unique
    *   `titre`
    *   `ordre`
    *   `couleur`

5.  **TACHE**
    *   `id_tache` (PK) : Identifiant unique
    *   `titre`
    *   `contenu`
    *   `ordre`
    *   `date_debut`
    *   `date_echeance`

6.  **PROFORMA**
    *   `id_proforma` (PK) : Identifiant unique
    *   `date_emission`
    *   `date_echeance`
    *   `statut`
    *   `montant_reduction`

7.  **TRANSACTION**
    *   `id_transaction` (PK) : Identifiant unique
    *   `type` (Entrée, Dépense)
    *   `description`
    *   `categorie`
    *   `montant`
    *   `date`
    *   `montant_avance`
    *   `montant_reste`

8.  **CAISSE**
    *   `id_caisse` (PK) : Identifiant unique
    *   `nom`

### Relations (Associations)

*   **Gérer (Collaborateur -> Tâche)** : Un `COLLABORATEUR` peut être assigné à 0,n `TACHE`. Une `TACHE` est assignée à 0,n `COLLABORATEUR`.
    *   `ASSIGNER (0,n)` --- `COLLABORATEUR`
    *   `ASSIGNER (0,n)` --- `TACHE`

*   **Appartenir (Projet -> Liste)** : Un `PROJET` contient 1,n `LISTE_TACHE`. Une `LISTE_TACHE` appartient à 1,1 `PROJET`.
    *   `PROJET` --- `(1,1)` Contenir `(1,n)` --- `LISTE_TACHE`

*   **Contenir (Liste -> Tâche)** : Une `LISTE_TACHE` contient 0,n `TACHE`. Une `TACHE` appartient à 1,1 `LISTE_TACHE`.
    *   `LISTE_TACHE` --- `(1,1)` Contenir `(0,n)` --- `TACHE`

*   **Établir (Client -> Proforma)** : Un `CLIENT` peut avoir 0,n `PROFORMA`. Une `PROFORMA` est établie pour 1,1 `CLIENT`.
    *   `CLIENT` --- `(1,1)` Établir `(0,n)` --- `PROFORMA`

*   **Effectuer (Transaction -> Caisse)** : Une `TRANSACTION` est effectuée depuis 1,1 `CAISSE`. Une `CAISSE` peut enregistrer 0,n `TRANSACTION`.
    *   `TRANSACTION` --- `(1,1)` Effectuer `(0,n)` --- `CAISSE`

*   **Lier (Transaction -> Transaction)** : Une `TRANSACTION` de type "Entrée" peut être liée à 0,n `TRANSACTION` de type "Dépense".
    *   C'est une relation réflexive sur l'entité `TRANSACTION`.
    *   `LIER (0,n)` --- `TRANSACTION` (Entrée)
    *   `LIER (0,1)` --- `TRANSACTION` (Dépense)

Ce modèle représente la structure fondamentale de la base de données et les règles de gestion qui régissent les interactions entre les différentes entités du système GestioSV.
