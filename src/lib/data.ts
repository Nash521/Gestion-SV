import { Client, Invoice, Transaction, LineItem, PurchaseOrder, DeliveryNote, CashRegister, Collaborator, Subcontractor } from '@/lib/definitions';

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
    rate: 25000,
    rateType: 'hourly',
    address: 'Abidjan, Cocody',
    phone: '+2250102030405',
    location: { lat: 5.359952, lng: -4.008256 },
  },
  {
    id: 'sub-2',
    name: 'Elec-Pro Services',
    domain: 'Électricité',
    rate: 300000,
    rateType: 'fixed',
    address: 'Yamoussoukro, Quartier 2000',
    phone: '+2250506070809',
    location: { lat: 6.82055, lng: -5.27677 },
  },
  {
    id: 'sub-3',
    name: 'Froid Express',
    domain: 'Climatisation',
    rate: 150000,
    rateType: 'daily',
    address: 'Bouaké, Centre-ville',
    phone: '+2250908070605',
    location: { lat: 7.68916, lng: -5.03032 },
  },
];

export const getInvoiceTotal = (invoice: Invoice | PurchaseOrder): number => {
    const subtotal = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const tax = subtotal * (('taxRate' in invoice ? invoice.taxRate : 0) / 100);
    return subtotal + tax;
}
