@startuml GestioSV_Use_Cases

left to right direction

actor Administrateur
actor Employe

Administrateur --|> Employe

rectangle "Système GestioSV" {
  usecase "Se connecter" as UC_Login
  usecase "Gérer les proformas" as UC_Invoices
  usecase "Gérer les bons de commande" as UC_PO
  usecase "Gérer les bons de livraison" as UC_DN
  usecase "Gérer les clients" as UC_Clients
  usecase "Gérer les sous-traitants" as UC_Subcontractors
  usecase "Gérer les transactions comptables" as UC_Accounting
  usecase "Exporter un bilan" as UC_Export
  usecase "Gérer les projets et tâches" as UC_Projects
  usecase "Consulter les notifications" as UC_Notifications
  usecase "Gérer les collaborateurs" as UC_Users

  Employe -- UC_Login
  Employe -- UC_Invoices
  Employe -- UC_PO
  Employe -- UC_DN
  Employe -- UC_Clients
  Employe -- UC_Subcontractors
  Employe -- UC_Accounting
  Employe -- UC_Export
  Employe -- UC_Projects
  Employe -- UC_Notifications
  
  Administrateur -- UC_Users
}

@enduml
