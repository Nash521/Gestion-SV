import { Client, Invoice, Transaction, LineItem, PurchaseOrder, DeliveryNote, CashRegister, Collaborator, Subcontractor, Project, TaskList, ProjectTask, AppNotification } from '@/lib/definitions';

export const mockClients: Client[] = [
  { id: '1', name: 'Stark Industries', email: 'contact@stark.com', address: '10880 Malibu Point, 90265, Malibu', phone: '+12223334444' },
  { id: '2', name: 'Wayne Enterprises', email: 'info@wayne.com', address: '1007 Mountain Drive, Gotham', phone: '+15556667777' },
  { id: '3', name: 'Cyberdyne Systems', email: 'hr@cyberdyne.com', address: '2144 Kramer Street, Los Angeles', phone: '+18889990000' },
  { id: '4', name: 'Ollivanders', email: 'sales@ollivanders.co.uk', address: 'Diagon Alley, London', phone: '+442071234567' },
];

export const mockCollaborators: Collaborator[] = [
    { id: 'user-1', name: 'Nash Gone', email: 'nashgone@gmail.com', role: 'Admin' },
    { id: 'user-2', name: 'Alice', email: 'alice@example.com', role: 'Employee' },
    { id: 'user-3', name: 'Bob', email: 'bob@example.com', role: 'Employee' },
];

export const mockNotifications: AppNotification[] = [
    { 
        id: 'notif-1', 
        actorId: 'user-2',
        actorName: 'Alice',
        message: 'a créé une nouvelle proforma (INV-006).',
        timestamp: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
        read: false,
        href: '/dashboard/invoices/INV-006',
    },
    { 
        id: 'notif-2', 
        actorId: 'user-3',
        actorName: 'Bob',
        message: 'a ajouté une nouvelle tâche "Déployer en production" au projet "Refonte du site web".',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        href: '/dashboard/projects',
    },
    { 
        id: 'notif-3',
        actorId: 'user-2',
        actorName: 'Alice',
        message: 'a modifié le statut de la proforma INV-004 en "Envoyée".',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        href: '/dashboard/invoices/INV-004',
    }
];

export const mockProjects: Project[] = [
    { id: 'proj-1', name: 'Refonte du site web', description: 'Projet de refonte complète du site web de l\'entreprise.' },
];

export const mockTaskLists: TaskList[] = [
    { id: 'list-1', projectId: 'proj-1', title: 'À faire', order: 1 },
    { id: 'list-2', projectId: 'proj-1', title: 'En cours', order: 2 },
    { id: 'list-3', projectId: 'proj-1', title: 'En revue', order: 3 },
    { id: 'list-4', projectId: 'proj-1', title: 'Terminé', order: 4 },
];

export const mockTasks: ProjectTask[] = [
    // "À faire"
    { id: 'task-1', listId: 'list-1', title: 'Définir les spécifications fonctionnelles', order: 1, labels: ['Urgent'], assigneeIds: ['user-1'], dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
    { id: 'task-2', listId: 'list-1', title: 'Créer les maquettes UI/UX', order: 2, labels: ['Design'], assigneeIds: ['user-2'], dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
    { id: 'task-3', listId: 'list-1', title: 'Mettre en place l\'environnement de développement', order: 3, labels: ['Tech'], assigneeIds: ['user-3'] },
    
    // "En cours"
    { 
        id: 'task-4', 
        listId: 'list-2', 
        title: 'Développer la page d\'accueil', 
        content: 'Intégrer le nouveau design et les animations.', 
        order: 1, 
        labels: ['Dev'], 
        assigneeIds: ['user-3'],
        checklist: [
            { id: 'cl-1', text: 'Intégrer le header', completed: true },
            { id: 'cl-2', text: 'Ajouter la section "hero"', completed: false },
            { id: 'cl-3', text: 'Connecter les données', completed: false },
        ],
        attachments: [
            { id: 'att-1', name: 'maquette-accueil.jpg', url: '#', type: 'image' }
        ]
    },
    { id: 'task-5', listId: 'list-2', title: 'Concevoir le logo', order: 2, labels: ['Design'], assigneeIds: ['user-2'] },

    // "En revue"
    { id: 'task-6', listId: 'list-3', title: 'Valider le schéma de la base de données', order: 1, labels: ['Tech', 'Urgent'], assigneeIds: ['user-1'] },

    // "Terminé"
    { id: 'task-7', listId: 'list-4', title: 'Choisir la palette de couleurs', order: 1, labels: ['Design'], assigneeIds: ['user-2'] },
    { id: 'task-8', listId: 'list-4', title: 'Acheter le nom de domaine', order: 2, labels: [], assigneeIds: ['user-1'] },
];


export const mockCashRegisters: CashRegister[] = [
  { id: 'caisse-1', name: 'Caisse principale' },
  { id: 'caisse-2', name: 'Petite caisse' },
];

const generateLineItems = (count: number): LineItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    description: `Service or Product ${i + 1}`,
    quantity: Math.floor(Math.random() * 5) + 1,
    price: Math.floor(Math.random() * 500) + 50,
  }));
};

const generateDeliveryLineItems = (count: number): Omit<LineItem, 'price'>[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${i + 1}`,
      description: `Service or Product ${i + 1}`,
      quantity: Math.floor(Math.random() * 10) + 1,
    }));
};

const getCurrentYear = () => new Date().getFullYear();
const currentYear = getCurrentYear();
const lastYear = currentYear - 1;

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    client: mockClients[0],
    lineItems: generateLineItems(2),
    status: 'Paid',
    issueDate: new Date(`${lastYear}-10-15`),
    dueDate: new Date(`${lastYear}-11-14`),
    taxRate: 10,
  },
  {
    id: 'INV-002',
    client: mockClients[1],
    lineItems: generateLineItems(3),
    status: 'Sent',
    issueDate: new Date(`${lastYear}-11-01`),
    dueDate: new Date(`${lastYear}-12-01`),
    taxRate: 8,
    notes: 'Please pay promptly.'
  },
  {
    id: 'INV-003',
    client: mockClients[2],
    lineItems: generateLineItems(1),
    status: 'Overdue',
    issueDate: new Date(`${lastYear}-09-20`),
    dueDate: new Date(`${lastYear}-10-20`),
    taxRate: 20,
  },
  {
    id: 'INV-004',
    client: mockClients[3],
    lineItems: generateLineItems(5),
    status: 'Draft',
    issueDate: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    taxRate: 0,
  },
  {
    id: 'INV-005',
    client: mockClients[0],
    lineItems: generateLineItems(1),
    status: 'Paid',
    issueDate: new Date(`${lastYear}-11-05`),
    dueDate: new Date(`${lastYear}-12-05`),
    taxRate: 10,
  },
];

export const mockPurchaseOrders: PurchaseOrder[] = [
    {
        id: 'BC-001',
        client: mockClients[1],
        lineItems: generateLineItems(4),
        status: 'Approved',
        issueDate: new Date(`${currentYear}-01-10`),
        deliveryDate: new Date(`${currentYear}-02-10`),
    },
    {
        id: 'BC-002',
        client: mockClients[3],
        lineItems: generateLineItems(2),
        status: 'Sent',
        issueDate: new Date(`${currentYear}-02-20`),
        deliveryDate: new Date(`${currentYear}-03-20`),
        notes: 'Urgent order'
    },
     {
        id: 'BC-003',
        client: mockClients[0],
        lineItems: generateLineItems(1),
        status: 'Draft',
        issueDate: new Date(),
        deliveryDate: new Date(new Date().setDate(new Date().getDate() + 15)),
    },
];

export const mockDeliveryNotes: DeliveryNote[] = [
    {
        id: 'BL-001',
        client: mockClients[1],
        invoiceId: 'INV-002',
        lineItems: generateDeliveryLineItems(3),
        status: 'Delivered',
        deliveryDate: new Date(`${lastYear}-11-25`),
    },
    {
        id: 'BL-002',
        client: mockClients[0],
        lineItems: generateDeliveryLineItems(2),
        status: 'Draft',
        deliveryDate: new Date(),
        notes: 'To be delivered tomorrow.'
    }
];


export const mockTransactions: Transaction[] = [
    { id: '1', type: 'expense', description: 'Office Supplies', category: 'Office', amount: 15000, date: new Date(`${currentYear}-01-10`), cashRegisterId: 'caisse-1' },
    { id: '2', type: 'expense', description: 'Cloud Server Hosting', category: 'Software', amount: 75000, date: new Date(`${currentYear}-01-15`), cashRegisterId: 'caisse-1' },
    { id: '3', type: 'expense', description: 'Client Lunch', category: 'Meals', amount: 25000, date: new Date(`${currentYear}-02-05`), cashRegisterId: 'caisse-2' },
    { id: '4', type: 'expense', description: 'Domain Name Renewal', category: 'Software', amount: 20000, date: new Date(`${currentYear}-02-20`), cashRegisterId: 'caisse-1' },
    { id: '5', type: 'expense', description: 'Travel to Conference', category: 'Travel', amount: 120000, date: new Date(`${lastYear}-12-20`), cashRegisterId: 'caisse-1' },
    { id: '6', type: 'income', description: 'Payment from Stark Industries', category: 'Payments', amount: 1200000, date: new Date(`${currentYear}-01-25`), cashRegisterId: 'caisse-1' },
    { id: '7', type: 'income', description: 'Project Alpha - Milestone 1', category: 'Projects', amount: 550000, date: new Date(`${currentYear}-02-18`), cashRegisterId: 'caisse-1' },
    { id: '8', type: 'income', description: 'Consulting services', category: 'Services', amount: 250000, date: new Date(`${currentYear}-03-01`), cashRegisterId: 'caisse-2' },
];

export const mockSubcontractors: Subcontractor[] = [
  {
    id: 'sub-1',
    name: 'Alpha Plomberie',
    domain: 'Plomberie',
    address: 'Boulevard de la paix, Cocody, Abidjan, Côte d\'Ivoire',
    phone: '+2250102030405',
    services: [
        { id: 's1-1', description: 'Réparation de fuite simple', price: 15000, unit: 'forfait' },
        { id: 's1-2', description: 'Débouchage de canalisation', price: 25000, unit: 'forfait' },
        { id: 's1-3', description: 'Taux horaire général', price: 20000, unit: 'par heure' },
    ]
  },
  {
    id: 'sub-2',
    name: 'Elec-Pro Services',
    domain: 'Électricité',
    address: 'Rue des Jardins, II Plateaux, Abidjan, Côte d\'Ivoire',
    phone: '+2250506070809',
    services: [
        { id: 's2-1', description: 'Installation prise électrique', price: 10000, unit: 'par unité' },
        { id: 's2-2', description: 'Diagnostic panne électrique', price: 20000, unit: 'forfait' },
        { id: 's2-3', description: 'Mise à la terre complète', price: 75000, unit: 'forfait' },
    ]
  },
  {
    id: 'sub-3',
    name: 'Froid Express',
    domain: 'Climatisation',
    address: 'Rue du Commerce, Grand-Bassam, Côte d\'Ivoire',
    phone: '+2250908070605',
    services: [
        { id: 's3-1', description: 'Entretien climatiseur', price: 25000, unit: 'par unité' },
        { id: 's3-2', description: 'Recharge de gaz (R410A)', price: 45000, unit: 'par unité' },
        { id: 's3-3', description: 'Installation nouveau split 1.5CV', price: 60000, unit: 'par unité' },
    ]
  },
];

export const getInvoiceTotal = (invoice: Invoice | PurchaseOrder): number => {
    const subtotal = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const tax = subtotal * (('taxRate' in invoice ? invoice.taxRate : 0) / 100);
    return subtotal + tax;
}
