
# Étude Préalable - Méthode MERISE

Ce document décrit les règles de gestion et le dictionnaire de données qui définissent le système d'information de l'application GestioSV.

---

### 1. Règles de Gestion (RG)

Les règles de gestion décrivent les contraintes et les opérations qui régissent les données du système.

**RG-01 :** Un **Client** peut passer de zéro à plusieurs **Proformas**, **Bons de Commande** ou **Bons de Livraison**.

**RG-02 :** Une **Proforma**, un **Bon de Commande** ou un **Bon de Livraison** est obligatoirement associé à un et un seul **Client**.

**RG-03 :** Un **Document Commercial** (Proforma, Bon de Commande) doit contenir au moins une **Ligne d'Article**.

**RG-04 :** Une **Ligne d'Article** appartient à un et un seul **Document Commercial**.

**RG-05 :** Un **Collaborateur** possède un unique **Rôle** (Admin ou Employé) qui détermine ses droits d'accès.

**RG-06 :** Un **Projet** est composé d'au moins une **Liste de Tâches**.

**RG-07 :** Une **Liste de Tâches** appartient à un et un seul **Projet**.

**RG-08 :** Une **Tâche** est contenue dans une et une seule **Liste de Tâches**.

**RG-09 :** Une **Tâche** peut être assignée à un ou plusieurs **Collaborateurs**. Un **Collaborateur** peut être assigné à plusieurs **Tâches**.

**RG-10 :** Une **Transaction** est de type "Entrée" ou "Dépense".

**RG-11 :** Une **Transaction** de type "Entrée" peut être liée à zéro ou plusieurs **Transactions** de type "Dépense".

**RG-12 :** Une **Transaction** est obligatoirement affectée à une et une seule **Caisse**.

**RG-13 :** Un **Sous-traitant** propose au moins un **Service** dans sa grille tarifaire.

---

### 2. Dictionnaire de Données

Le dictionnaire de données décrit en détail chaque information (attribut) gérée par le système.

| Nom de l'Attribut | Alias | Type | Format / Taille | Description |
|---------------------|-----------------|----------|-----------------|----------------------------------------------------------|
| **CLIENT** | | | | |
| ID_Client | Id | Numérique | Entier | Identifiant unique du client |
| Nom_Client | Nom | Texte | 50 | Nom ou raison sociale du client |
| Email_Client | Email | Texte | 100 | Adresse email du client |
| Adresse_Client | Adresse | Texte | 255 | Adresse postale du client |
| Telephone_Client | Téléphone | Texte | 20 | Numéro de téléphone du client |
| | | | | |
| **PROFORMA** | | | | |
| ID_Proforma | Numéro Proforma| Texte | 20 | Identifiant unique de la proforma (ex: P-SV-001-05-24) |
| Date_Emission | Date | Date | JJ/MM/AAAA | Date de création de la proforma |
| Date_Echeance | Échéance | Date | JJ/MM/AAAA | Date limite de validité ou de paiement |
| Statut_Proforma | Statut | Texte | 15 | État de la proforma (Brouillon, Envoyée, Payée, En retard) |
| Montant_Reduction | Réduction | Numérique | Décimal | Montant fixe de la réduction appliquée |
| Notes_Proforma | Notes | Texte | 500 | Notes ou conditions additionnelles |
| *#ID_Client* | | Numérique | Entier | Clé étrangère vers l'entité Client |
| | | | | |
| **LIGNE_ARTICLE** | | | | |
| Description_Article | Description | Texte | 255 | Description du produit ou service |
| Quantite | Qté | Numérique | Entier | Nombre d'unités |
| Prix_Unitaire | P.U. | Numérique | Décimal | Prix pour une unité |
| *#ID_Document* | | Texte | 20 | Clé étrangère vers Proforma, Bon de Commande, etc. |
| | | | | |
| **TRANSACTION** | | | | |
| ID_Transaction | Id | Numérique | Entier | Identifiant unique de la transaction |
| Type_Transaction | Type | Texte | 10 | Type de la transaction (Entrée ou Dépense) |
| Description_Trans | Description | Texte | 150 | Libellé de la transaction |
| Categorie_Trans | Catégorie | Texte | 50 | Catégorie comptable (ex: Bureau, Logiciel) |
| Montant_Trans | Montant | Numérique | Décimal | Montant de la transaction en XOF |
| Date_Transaction | Date | Date | JJ/MM/AAAA | Date à laquelle la transaction a eu lieu |
| Montant_Avance | Avance | Numérique | Décimal | Montant perçu en avance pour une entrée |
| Montant_Reste | Reste | Numérique | Décimal | Montant restant à percevoir pour une entrée |
| *#ID_Caisse* | | Numérique | Entier | Clé étrangère vers l'entité Caisse |
| | | | | |
| **PROJET** | | | | |
| ID_Projet | Id | Numérique | Entier | Identifiant unique du projet |
| Nom_Projet | Nom | Texte | 100 | Nom du projet |
| Description_Projet| Description | Texte | 500 | Description détaillée du projet |
| | | | | |
| **TÂCHE** | | | | |
| ID_Tache | Id | Numérique | Entier | Identifiant unique de la tâche |
| Titre_Tache | Titre | Texte | 100 | Intitulé de la tâche |
| Date_Echeance_Tache| Échéance | Date | JJ/MM/AAAA | Date limite pour la réalisation de la tâche |
| Ordre_Tache | Ordre | Numérique | Entier | Position de la tâche dans sa liste |
| *#ID_Liste* | | Numérique | Entier | Clé étrangère vers l'entité Liste de Tâches |
| | | | | |
| **COLLABORATEUR** | | | | |
| ID_Collaborateur | Id | Numérique | Entier | Identifiant unique du collaborateur |
| Nom_Collaborateur | Nom | Texte | 50 | Nom complet du collaborateur |
| Email_Collaborateur| Email | Texte | 100 | Adresse email de connexion |
| Role | Rôle | Texte | 15 | Rôle du collaborateur (Admin, Employé) |
