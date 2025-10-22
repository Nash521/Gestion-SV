@startuml Authentification_Utilisateur_Sequence

title Diagramme de Séquence - Authentification d'un Utilisateur

actor Utilisateur
participant "LoginPage (UI)" as LoginPage
participant "AuthContext" as AuthContext
participant "Firebase Auth" as FirebaseAuth
participant "Firestore DB" as Firestore

activate Utilisateur
Utilisateur -> LoginPage : Saisit email et mot de passe
Utilisateur -> LoginPage : Clique sur "Se connecter"
activate LoginPage

LoginPage -> AuthContext : login(email, password)
activate AuthContext

AuthContext -> FirebaseAuth : signInWithEmailAndPassword(email, password)
activate FirebaseAuth
FirebaseAuth --> AuthContext : Retourne l'objet utilisateur (FirebaseUser)
deactivate FirebaseAuth

AuthContext -> Firestore : get(doc('collaborators', user.uid))
activate Firestore
Firestore --> AuthContext : Retourne les données du collaborateur (rôle, nom)
deactivate Firestore

AuthContext -> AuthContext : Met à jour l'état `currentUser`
AuthContext --> LoginPage : Connexion réussie
deactivate AuthContext

LoginPage -> LoginPage : Redirige vers "/dashboard"
deactivate LoginPage
deactivate Utilisateur

@enduml

@startuml Creation_Transaction_Sequence

title Diagramme de Séquence - Création d'une Transaction

actor Employe
participant "AccountingPage (UI)" as AccountingPage
participant "TransactionDialog (UI)" as Dialog
participant "FirebaseServices" as Services
participant "Firestore DB" as Firestore

activate Employe
Employe -> AccountingPage : Clique sur "Ajouter une transaction"
activate AccountingPage
AccountingPage -> Dialog : Ouvre la boîte de dialogue
deactivate AccountingPage
activate Dialog

Employe -> Dialog : Remplit les champs (type, montant, etc.)
Employe -> Dialog : Clique sur "Enregistrer"

Dialog -> Services : addTransaction(transactionData)
activate Services

Services -> Firestore : addDoc(collection('transactions'), payload)
activate Firestore
Firestore --> Services : Confirmation d'écriture
deactivate Firestore

Services --> Dialog : Transaction ajoutée
deactivate Services

Dialog -> AccountingPage : Ferme la boîte de dialogue et rafraîchit la liste
deactivate Dialog
activate AccountingPage
deactivate AccountingPage
deactivate Employe

@enduml

@startuml Deplacement_Tache_Kanban_Sequence

title Diagramme de Séquence - Déplacer une Tâche dans le Kanban

actor Employe
participant "ProjectBoard (UI)" as Board
participant "DndContext" as Dnd
participant "FirebaseServices" as Services
participant "Firestore DB" as Firestore

activate Employe
Employe -> Board : Glisse une carte de tâche
activate Board

Board -> Dnd : onDragStart(event)
activate Dnd
Dnd --> Board : Notifie le début du glissement
deactivate Dnd

Employe -> Board : Dépose la carte sur une autre liste
Board -> Dnd : onDragEnd(event)
activate Dnd

Dnd -> Board : Calcule la nouvelle position et la nouvelle liste
Board -> Board : Met à jour l'état local (UI) instantanément
Board -> Services : reorderTasks(projectId, updatedTasks)
activate Services

Services -> Firestore : batch.update(docRef, {order: newOrder, listId: newListId})
activate Firestore
Firestore --> Services : Confirmation du batch
deactivate Firestore

Services --> Board : Confirmation de la mise à jour
deactivate Services

Dnd --> Board : Fin de l'événement
deactivate Dnd
deactivate Board
deactivate Employe

@enduml
