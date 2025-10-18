@startuml GestioSV

skinparam classAttributeIconSize 0

enum CollaboratorRole {
  Admin
  Employee
}

enum InvoiceStatus {
  Draft
  Sent
  Paid
  Overdue
}

enum PurchaseOrderStatus {
  Draft
  Sent
  Approved
  Rejected
}

enum DeliveryNoteStatus {
  Draft
  Delivered
  Canceled
}

enum TransactionType {
  income
  expense
}

enum ServiceUnit {
  par_heure
  par_jour
  forfait
  par_m2
  par_unite
}

class Collaborator {
  + id: string
  + name: string
  + email: string
  + role: CollaboratorRole
}

class Client {
  + id: string
  + name: string
  + email: string
  + address: string
  + phone: string
}

class Invoice {
  + id: string
  + issueDate: Date
  + dueDate: Date
  + status: InvoiceStatus
  + discountAmount: number
  + notes: string
}

class LineItem {
  + description: string
  + quantity: number
  + price: number
}

class PurchaseOrder {
  + id: string
  + issueDate: Date
  + deliveryDate: Date
  + status: PurchaseOrderStatus
  + notes: string
}

class DeliveryNote {
  + id: string
  + deliveryDate: Date
  + status: DeliveryNoteStatus
  + notes: string
}

class DeliveryLineItem {
  + description: string
  + quantity: number
}

class Transaction {
  + id: string
  + type: TransactionType
  + description: string
  + category: string
  + amount: number
  + date: Date
  + advance: number
  + remainder: number
}

class CashRegister {
  + id: string
  + name: string
}

class Subcontractor {
  + id: string
  + name: string
  + domain: string
  + address: string
  + phone: string
}

class SubcontractorService {
  + description: string
  + price: number
  + unit: ServiceUnit
}

class Project {
  + id: string
  + name: string
  + description: string
}

class TaskList {
  + id: string
  + title: string
  + order: number
  + color: string
}

class ProjectTask {
  + id: string
  + title: string
  + content: string
  + order: number
  + startDate: Date
  + dueDate: Date
  + completed: boolean
}

class ChecklistItem {
  + text: string
  + completed: boolean
}

class Attachment {
  + name: string
  + url: string
  + type: string
}

class AppNotification {
    + id: string
    + message: string
    + timestamp: Date
    + read: boolean
    + href: string
}


' --- Relations ---

Client "1" -- "0..*" Invoice : établit pour >
Client "1" -- "0..*" PurchaseOrder : commande pour >
Client "1" -- "0..*" DeliveryNote : livre à >

Invoice "1" -- "1..*" LineItem : contient
PurchaseOrder "1" -- "1..*" LineItem : contient
DeliveryNote "1" -- "1..*" DeliveryLineItem : contient

Collaborator "1" -- "0..*" AppNotification : est acteur de >

Project "1" -- "1..*" TaskList : contient >
TaskList "1" -- "0..*" ProjectTask : contient >

Collaborator "0..*" -- "0..*" ProjectTask : est assigné à

ProjectTask "1" -- "0..*" ChecklistItem : a pour checklist
ProjectTask "1" -- "0..*" Attachment : a pour pièce jointe

Transaction "1" -- "1" CashRegister : est effectuée depuis >
Transaction "1" -- "0..*" Transaction : est liée à

Subcontractor "1" -- "1..*" SubcontractorService : propose >

@enduml
