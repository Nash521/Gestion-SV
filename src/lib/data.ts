import { Client, Invoice, Expense, LineItem } from '@/lib/definitions';

export const mockClients: Client[] = [
  { id: '1', name: 'Stark Industries', email: 'contact@stark.com', address: '10880 Malibu Point, 90265, Malibu', phone: '+12223334444' },
  { id: '2', name: 'Wayne Enterprises', email: 'info@wayne.com', address: '1007 Mountain Drive, Gotham', phone: '+15556667777' },
  { id: '3', name: 'Cyberdyne Systems', email: 'hr@cyberdyne.com', address: '2144 Kramer Street, Los Angeles', phone: '+18889990000' },
  { id: '4', name: 'Ollivanders', email: 'sales@ollivanders.co.uk', address: 'Diagon Alley, London', phone: '+442071234567' },
];

const generateLineItems = (count: number): LineItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    description: `Service or Product ${i + 1}`,
    quantity: Math.floor(Math.random() * 5) + 1,
    price: Math.floor(Math.random() * 500) + 50,
  }));
};

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    client: mockClients[0],
    lineItems: generateLineItems(2),
    status: 'Paid',
    issueDate: new Date('2023-10-15'),
    dueDate: new Date('2023-11-14'),
    taxRate: 10,
  },
  {
    id: 'INV-002',
    client: mockClients[1],
    lineItems: generateLineItems(3),
    status: 'Sent',
    issueDate: new Date('2023-11-01'),
    dueDate: new Date('2023-12-01'),
    taxRate: 8,
    notes: 'Please pay promptly.'
  },
  {
    id: 'INV-003',
    client: mockClients[2],
    lineItems: generateLineItems(1),
    status: 'Overdue',
    issueDate: new Date('2023-09-20'),
    dueDate: new Date('2023-10-20'),
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
    issueDate: new Date('2023-11-05'),
    dueDate: new Date('2023-12-05'),
    taxRate: 10,
  },
];


export const mockExpenses: Expense[] = [
    { id: '1', description: 'Office Supplies', category: 'Office', amount: 150.75, date: new Date('2023-11-10') },
    { id: '2', description: 'Cloud Server Hosting', category: 'Software', amount: 75.00, date: new Date('2023-11-01') },
    { id: '3', description: 'Client Lunch', category: 'Meals', amount: 250.50, date: new Date('2023-10-28') },
    { id: '4', description: 'Domain Name Renewal', category: 'Software', amount: 20.00, date: new Date('2023-11-15') },
    { id: '5', description: 'Travel to Conference', category: 'Travel', amount: 1200.00, date: new Date('2023-10-20') },
];

export const getInvoiceTotal = (invoice: Invoice): number => {
    const subtotal = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const tax = subtotal * (invoice.taxRate / 100);
    return subtotal + tax;
}
