export type Client = {
  id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
};

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
};

export type Invoice = {
  id: string;
  client: Client;
  lineItems: LineItem[];
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  issueDate: Date;
  dueDate: Date;
  taxRate: number; // as a percentage
  notes?: string;
};

export type PurchaseOrder = {
  id: string;
  client: Client;
  lineItems: LineItem[];
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected';
  issueDate: Date;
  deliveryDate: Date;
  notes?: string;
};

export type DeliveryNote = {
    id: string;
    client: Client;
    invoiceId?: string; // Associated invoice
    lineItems: Omit<LineItem, 'price'>[];
    status: 'Draft' | 'Delivered' | 'Canceled';
    deliveryDate: Date;
    notes?: string;
};

export type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: Date;
};
