@startuml
' Titre du diagramme
title Diagramme de Cas d'Utilisation - GestioSV

' Définition des acteurs
actor Administrateur as Admin
actor Employe

' Définition des cas d'utilisation principaux
rectangle "Gestion de l'Application" {
  Admin -- (Gérer les collaborateurs)
  (Gérer les collaborateurs) .> (Créer un utilisateur) : include
  (Gérer les collaborateurs) .> (Modifier les rôles) : include
  (Gérer les collaborateurs) .> (Supprimer un utilisateur) : include

  Admin -- (Consulter les notifications)
  Employe -- (Consulter les notifications)

  (Gérer les proformas) .> (Consulter les notifications) : extends
  (Gérer les bons de commande) .> (Consulter les notifications) : extends
  (Gérer les clients) .> (Consulter les notifications) : extends

  Admin -- (Gérer les clients)
  Employe -- (Gérer les clients)

  Admin -- (Gérer les proformas)
  Employe -- (Gérer les proformas)
  (Gérer les proformas) ..> (Exporter en PDF) : include

  Admin -- (Gérer les bons de commande)
  Employe -- (Gérer les bons de commande)
  (Gérer les bons de commande) ..> (Exporter en PDF) : include

  Admin -- (Gérer les bons de livraison)
  Employe -- (Gérer les bons de livraison)
  (Gérer les bons de livraison) ..> (Exporter en PDF) : include

  Admin -- (Gérer la comptabilité)
  Employe -- (Gérer la comptabilité)
  (Gérer la comptabilité) ..> (Exporter un bilan PDF) : include

  Admin -- (Gérer les projets)
  Employe -- (Gérer les projets)

  Admin -- (Gérer les sous-traitants)
  Employe -- (Gérer les sous-traitants)
}

note right of Admin : L'Administrateur a accès à toutes les fonctionnalités de l'Employé et peut en plus gérer les comptes des collaborateurs.
@enduml

@startuml
' Titre du diagramme
title Modèle Conceptuel de Données (MCD) - GestioSV

' Style du diagramme
skinparam classAttributeIconSize 0
hide empty members

' Entité Client
class Client {
  + ID_Client (PK)
  --
  Nom_Client
  Email_Client
  Adresse_Client
  Telephone_Client
}

' Entité Collaborateur
class Collaborateur {
  + ID_Collaborateur (PK)
  --
  Nom_Collaborateur
  Email_Collaborateur
  Role
}

' Entité Projet
class Projet {
  + ID_Projet (PK)
  --
  Nom_Projet
  Description_Projet
}

' Entité Liste_Taches
class Liste_Taches {
  + ID_Liste (PK)
  --
  Titre_Liste
  Ordre_Liste
  # ID_Projet (FK)
}

' Entité Tache
class Tache {
  + ID_Tache (PK)
  --
  Titre_Tache
  Date_Echeance_Tache
  Ordre_Tache
  # ID_Liste (FK)
}

' Entité Document_Commercial (abstraite, pour regrouper les propriétés communes)
abstract class Document_Commercial {
  + ID_Document (PK)
  --
  Date_Emission
  Date_Echeance
  Statut
  Notes
  # ID_Client (FK)
}

' Entité Proforma héritant de Document_Commercial
class Proforma extends Document_Commercial {
  Montant_Reduction
}

' Entité Bon_Commande héritant de Document_Commercial
class Bon_Commande extends Document_Commercial {
}

' Entité Bon_Livraison héritant de Document_Commercial
class Bon_Livraison extends Document_Commercial {
}


' Entité Ligne_Article
class Ligne_Article {
  Description_Article
  Quantite
  Prix_Unitaire
  # ID_Document (FK)
}

' Entité Transaction
class Transaction {
  + ID_Transaction (PK)
  --
  Type_Transaction
  Description_Trans
  Categorie_Trans
  Montant_Trans
  Date_Transaction
  Montant_Avance
  Montant_Reste
  # ID_Caisse (FK)
}

' Entité Caisse
class Caisse {
  + ID_Caisse (PK)
  --
  Nom_Caisse
}

' Entité Sous_traitant
class Sous_traitant {
  + ID_Sous_traitant (PK)
  --
  Nom_Sous_traitant
  Domaine
  Adresse
  Telephone
}

' Entité Service
class Service {
  + ID_Service (PK)
  --
  Description_Service
  Prix
  Unite
  # ID_Sous_traitant (FK)
}


' ---- RELATIONS ----

Client "1" -- "0..*" Proforma : passe
Client "1" -- "0..*" Bon_Commande : passe
Client "1" -- "0..*" Bon_Livraison : reçoit

Document_Commercial "1" -- "1..*" Ligne_Article : contient

Projet "1" -- "1..*" Liste_Taches : est composé de

Liste_Taches "1" -- "1..*" Tache : contient

Collaborateur "1..*" -- "0..*" Tache : est assigné à

Transaction "1..*" -- "1" Caisse : est affectée à
Transaction "0..*" -- "0..1" Transaction : est liée à

Sous_traitant "1" -- "1..*" Service : propose
@enduml
