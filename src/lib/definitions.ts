export type Client = {
  id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
};

export type LineItem = {
  id?: string;
  description: string;
  quantity: number;
  price: number;
};

export type Invoice = {
  id: string;
  clientId: string;
  client: Client;
  lineItems: LineItem[];
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  issueDate: Date;
  dueDate: Date;
  discountAmount?: number; // as a fixed amount
  notes?: string;
};

export type PurchaseOrder = {
  id: string;
  clientId: string;
  client: Client;
  lineItems: LineItem[];
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected';
  issueDate: Date;
  deliveryDate: Date;
  notes?: string;
};

export type DeliveryNote = {
    id: string;
    clientId: string;
    client: Client;
    invoiceId?: string; // Associated proforma
    lineItems: Omit<LineItem, 'price'>[];
    status: 'Draft' | 'Delivered' | 'Canceled';
    deliveryDate: Date;
    notes?: string;
};

export type Transaction = {
    id: string;
    type: 'income' | 'expense';
    description: string;
    category: string;
    amount: number;
    date: Date;
    cashRegisterId?: string;
    linkedExpenseId?: string;
    advance?: number;
    remainder?: number;
}

export type CashRegister = {
    id: string;
    name: string;
}

export type CollaboratorRole = 'Admin' | 'Employee';

export type Collaborator = {
  id: string;
  name: string;
  email: string;
  role: CollaboratorRole;
};

export type SubcontractorService = {
  id: string;
  description: string;
  price: number;
  unit: 'par heure' | 'par jour' | 'forfait' | 'par m²' | 'par unité';
};

export type Subcontractor = {
  id: string;
  name: string;
  domain: string;
  address: string;
  phone: string;
  services: SubcontractorService[];
};

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type Attachment = {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file' | 'link';
};

export type ProjectTask = {
  id: string;
  listId: string;
  title: string;
  content?: string;
  order: number;
  labels?: string[];
  assigneeIds?: string[];
  startDate?: Date;
  dueDate?: Date;
  completed?: boolean;
  checklist?: ChecklistItem[];
  attachments?: Attachment[];
};

export type TaskList = {
  id: string;
  projectId: string;
  title: string;
  order: number;
  color?: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
};

export type AppNotification = {
    id: string;
    actorName: string;
    actorId: string;
    message: string;
    timestamp: Date;
    read: boolean;
    href?: string;
};
