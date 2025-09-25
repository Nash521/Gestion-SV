import { db } from './client';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, onSnapshot, getDoc, Timestamp, where, writeBatch, setDoc, orderBy, limit } from 'firebase/firestore';
import type { Client, Invoice, PurchaseOrder, DeliveryNote, LineItem, Transaction, CashRegister, Subcontractor, SubcontractorService, Project, TaskList, ProjectTask } from '../definitions';

const getClientsMap = async (): Promise<Map<string, Client>> => {
    const clients = await getClients();
    return new Map(clients.map(client => [client.id, client]));
}

// Client Services
export const getClients = async (): Promise<Client[]> => {
    const clientsCol = collection(db, 'clients');
    const clientSnapshot = await getDocs(clientsCol);
    const clientList = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    return clientList;
};

export const subscribeToClients = (callback: (clients: Client[]) => void) => {
    const q = query(collection(db, "clients"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clients: Client[] = [];
        querySnapshot.forEach((doc) => {
            clients.push({ id: doc.id, ...doc.data() } as Client);
        });
        callback(clients);
    });
    return unsubscribe;
};


export const addClient = async (clientData: Omit<Client, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, 'clients'), clientData);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw new Error("Could not add client");
    }
};

export const updateClient = async (id: string, updatedData: Partial<Omit<Client, 'id'>>) => {
     if (!id) throw new Error("Client ID is required for updating.");
    try {
        const clientDoc = doc(db, 'clients', id);
        await updateDoc(clientDoc, updatedData);
    } catch(e) {
        console.error("Error updating document: ", e);
        throw new Error("Could not update client");
    }
};

export const deleteClient = async (id: string) => {
     if (!id) throw new Error("Client ID is required for deletion.");
    try {
        const clientDoc = doc(db, 'clients', id);
        await deleteDoc(clientDoc);
    } catch(e) {
        console.error("Error deleting document: ", e);
        throw new Error("Could not delete client");
    }
};


// Invoice Services
const processInvoiceDoc = (docSnap: any, clientsMap: Map<string, Client>, lineItems: LineItem[] = []) => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        client: clientsMap.get(data.clientId) || { id: data.clientId, name: 'Client Inconnu', email: '', address: '' },
        issueDate: data.issueDate.toDate(),
        dueDate: data.dueDate.toDate(),
        lineItems,
    } as Invoice;
};

export const subscribeToInvoices = (callback: (invoices: Invoice[]) => void) => {
    const q = query(collection(db, "invoices"));
    return onSnapshot(q, async (querySnapshot) => {
        const clientsMap = await getClientsMap();
        const invoices: Invoice[] = [];
        for (const doc of querySnapshot.docs) {
            const lineItemsQuery = query(collection(db, 'invoices', doc.id, 'lineItems'));
            const lineItemsSnapshot = await getDocs(lineItemsQuery);
            const lineItems = lineItemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as LineItem));
            invoices.push(processInvoiceDoc(doc, clientsMap, lineItems));
        }
        callback(invoices.sort((a,b) => b.issueDate.getTime() - a.issueDate.getTime()));
    });
};

export const getInvoice = async (id: string): Promise<Invoice | null> => {
    if (!id) return null;
    const docRef = doc(db, 'invoices', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const lineItemsQuery = query(collection(db, 'invoices', id, 'lineItems'));
    const lineItemsSnapshot = await getDocs(lineItemsQuery);
    const lineItems = lineItemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as LineItem));

    const clientsMap = await getClientsMap();
    return processInvoiceDoc(docSnap, clientsMap, lineItems);
}

const generateNewInvoiceId = async (): Promise<string> => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    
    const prefix = 'P-SV-';
    const suffix = `-${month}-${year}`;
    
    const invoicesRef = collection(db, "invoices");
    const q = query(
        invoicesRef, 
        where('id', '>=', `${prefix}000${suffix}`),
        where('id', '<=', `${prefix}999${suffix}`),
        orderBy('id', 'desc'),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    
    let lastNumber = 0;
    if (!querySnapshot.empty) {
        const lastId = querySnapshot.docs[0].id;
        const lastNumberStr = lastId.substring(prefix.length, lastId.indexOf(suffix));
        lastNumber = parseInt(lastNumberStr, 10);
    }
    
    const newNumber = lastNumber + 1;
    const newId = `${prefix}${String(newNumber).padStart(3, '0')}${suffix}`;
    
    return newId;
};


export const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'client' | 'lineItems'> & { lineItems: Omit<LineItem, 'id'>[] }) => {
    const newInvoiceId = await generateNewInvoiceId();

    const { lineItems, ...invoice } = invoiceData;
    const invoicePayload = {
        ...invoice,
        id: newInvoiceId,
        issueDate: Timestamp.fromDate(invoiceData.issueDate),
        dueDate: Timestamp.fromDate(invoiceData.dueDate),
    };

    const newInvoiceRef = doc(db, 'invoices', newInvoiceId);
    await setDoc(newInvoiceRef, invoicePayload);
    
    const batch = writeBatch(db);
    const itemsCollection = collection(db, 'invoices', newInvoiceRef.id, 'lineItems');
    lineItems.forEach(item => {
        const itemRef = doc(itemsCollection);
        batch.set(itemRef, item);
    });
    await batch.commit();

    return newInvoiceRef.id;
};

export const updateInvoice = async (id: string, invoiceData: Omit<Invoice, 'id' | 'client' | 'lineItems'> & { lineItems: LineItem[] }) => {
    const { lineItems, ...invoice } = invoiceData;
    const invoicePayload = {
        ...invoice,
        issueDate: Timestamp.fromDate(invoiceData.issueDate),
        dueDate: Timestamp.fromDate(invoiceData.dueDate),
    };
    const invoiceRef = doc(db, 'invoices', id);
    await updateDoc(invoiceRef, invoicePayload as any);

    const batch = writeBatch(db);
    const itemsCollection = collection(db, 'invoices', id, 'lineItems');
    
    const existingItemsSnap = await getDocs(itemsCollection);
    existingItemsSnap.forEach(doc => batch.delete(doc.ref));

    lineItems.forEach(item => {
        const itemRef = doc(itemsCollection); 
        batch.set(itemRef, { description: item.description, quantity: item.quantity, price: item.price });
    });
    await batch.commit();
};

export const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    const invoiceRef = doc(db, 'invoices', id);
    await updateDoc(invoiceRef, { status });
};

export const deleteInvoice = async (id: string) => {
    const invoiceRef = doc(db, 'invoices', id);
    // You might want to delete subcollections here too if needed
    await deleteDoc(invoiceRef);
};


// Purchase Order Services
const processPODoc = (doc: any, clientsMap: Map<string, Client>, lineItems: LineItem[] = []) => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        client: clientsMap.get(data.clientId) || { id: data.clientId, name: 'Client Inconnu', email: '', address: '' },
        issueDate: data.issueDate.toDate(),
        deliveryDate: data.deliveryDate.toDate(),
        lineItems,
    } as PurchaseOrder;
};

export const subscribeToPurchaseOrders = (callback: (pos: PurchaseOrder[]) => void) => {
    const q = query(collection(db, "purchaseOrders"));
    return onSnapshot(q, async (querySnapshot) => {
        const clientsMap = await getClientsMap();
        const pos: PurchaseOrder[] = [];
        for (const doc of querySnapshot.docs) {
             const lineItemsQuery = query(collection(db, 'purchaseOrders', doc.id, 'lineItems'));
             const lineItemsSnapshot = await getDocs(lineItemsQuery);
             const lineItems = lineItemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as LineItem));
            pos.push(processPODoc(doc, clientsMap, lineItems));
        }
        callback(pos.sort((a,b) => b.issueDate.getTime() - a.issueDate.getTime()));
    });
};

export const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    if (!id) return null;
    const docRef = doc(db, 'purchaseOrders', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const lineItemsQuery = query(collection(db, 'purchaseOrders', id, 'lineItems'));
    const lineItemsSnapshot = await getDocs(lineItemsQuery);
    const lineItems = lineItemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as LineItem));

    const clientsMap = await getClientsMap();
    return processPODoc(docSnap, clientsMap, lineItems);
}

const generateNewPurchaseOrderId = async (): Promise<string> => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    
    const prefix = 'C-SV-';
    const suffix = `-${month}-${year}`;
    
    const poRef = collection(db, "purchaseOrders");
    const q = query(
        poRef,
        where('id', '>=', `${prefix}000${suffix}`),
        where('id', '<=', `${prefix}999${suffix}`),
        orderBy('id', 'desc'),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    
    let lastNumber = 0;
    if (!querySnapshot.empty) {
        const lastId = querySnapshot.docs[0].id;
        const lastNumberStr = lastId.substring(prefix.length, lastId.indexOf(suffix));
        lastNumber = parseInt(lastNumberStr, 10);
    }
    
    const newNumber = lastNumber + 1;
    return `${prefix}${String(newNumber).padStart(3, '0')}${suffix}`;
};

export const addPurchaseOrder = async (poData: Omit<PurchaseOrder, 'id' | 'client' | 'lineItems'> & { lineItems: Omit<LineItem, 'id'>[] }) => {
    const newId = await generateNewPurchaseOrderId();
    const { lineItems, ...po } = poData;
    
    const poPayload = {
        ...po,
        id: newId,
        issueDate: Timestamp.fromDate(poData.issueDate),
        deliveryDate: Timestamp.fromDate(poData.deliveryDate),
    };
    
    const newPoRef = doc(db, 'purchaseOrders', newId);
    await setDoc(newPoRef, poPayload);


    const batch = writeBatch(db);
    const itemsCollection = collection(db, 'purchaseOrders', newId, 'lineItems');
    lineItems.forEach(item => {
        const itemRef = doc(itemsCollection);
        batch.set(itemRef, item);
    });
    await batch.commit();

    return newId;
};

export const updatePurchaseOrderStatus = async (id: string, status: PurchaseOrder['status']) => {
    const poRef = doc(db, 'purchaseOrders', id);
    await updateDoc(poRef, { status });
};

export const deletePurchaseOrder = async (id: string) => {
    await deleteDoc(doc(db, 'purchaseOrders', id));
};


// Delivery Note Services
const processDNDoc = (doc: any, clientsMap: Map<string, Client>, lineItems: Omit<LineItem, 'price'>[] = []) => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        client: clientsMap.get(data.clientId) || { id: data.clientId, name: 'Client Inconnu', email: '', address: '' },
        deliveryDate: data.deliveryDate.toDate(),
        lineItems,
    } as DeliveryNote;
};

export const subscribeToDeliveryNotes = (callback: (dns: DeliveryNote[]) => void) => {
    const q = query(collection(db, "deliveryNotes"));
    return onSnapshot(q, async (querySnapshot) => {
        const clientsMap = await getClientsMap();
        const dns: DeliveryNote[] = [];
        for (const doc of querySnapshot.docs) {
            const lineItemsQuery = query(collection(db, 'deliveryNotes', doc.id, 'lineItems'));
            const lineItemsSnapshot = await getDocs(lineItemsQuery);
            const lineItems = lineItemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as Omit<LineItem, 'price'>));
            dns.push(processDNDoc(doc, clientsMap, lineItems));
        }
        callback(dns.sort((a,b) => b.deliveryDate.getTime() - a.deliveryDate.getTime()));
    });
};

export const getDeliveryNote = async (id: string): Promise<DeliveryNote | null> => {
    if (!id) return null;
    const docRef = doc(db, 'deliveryNotes', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const lineItemsQuery = query(collection(db, 'deliveryNotes', id, 'lineItems'));
    const lineItemsSnapshot = await getDocs(lineItemsQuery);
    const lineItems = lineItemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as Omit<LineItem, 'price'>));

    const clientsMap = await getClientsMap();
    return processDNDoc(docSnap, clientsMap, lineItems);
}

const generateNewDeliveryNoteId = async (): Promise<string> => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    
    const prefix = 'L-SV-';
    const suffix = `-${month}-${year}`;
    
    const dnRef = collection(db, "deliveryNotes");
    const q = query(
        dnRef,
        where('id', '>=', `${prefix}000${suffix}`),
        where('id', '<=', `${prefix}999${suffix}`),
        orderBy('id', 'desc'),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    
    let lastNumber = 0;
    if (!querySnapshot.empty) {
        const lastId = querySnapshot.docs[0].id;
        const lastNumberStr = lastId.substring(prefix.length, lastId.indexOf(suffix));
        lastNumber = parseInt(lastNumberStr, 10);
    }
    
    const newNumber = lastNumber + 1;
    return `${prefix}${String(newNumber).padStart(3, '0')}${suffix}`;
};


export const addDeliveryNote = async (dnData: Omit<DeliveryNote, 'id' | 'client' | 'lineItems'> & { lineItems: Omit<LineItem, 'id' | 'price'>[] }) => {
    const newId = await generateNewDeliveryNoteId();
    const { lineItems, ...dn } = dnData;
    const dnPayload = {
        ...dn,
        id: newId,
        deliveryDate: Timestamp.fromDate(dnData.deliveryDate),
    };
    
    const newDnRef = doc(db, 'deliveryNotes', newId);
    await setDoc(newDnRef, dnPayload);

    const batch = writeBatch(db);
    const itemsCollection = collection(db, 'deliveryNotes', newId, 'lineItems');
    lineItems.forEach(item => {
        const itemRef = doc(itemsCollection);
        batch.set(itemRef, item);
    });
    await batch.commit();

    return newId;
};

export const updateDeliveryNoteStatus = async (id: string, status: DeliveryNote['status']) => {
    const dnRef = doc(db, 'deliveryNotes', id);
await updateDoc(dnRef, { status });
};

export const deleteDeliveryNote = async (id: string) => {
    await deleteDoc(doc(db, 'deliveryNotes', id));
};


// Accounting / Transaction Services
export const subscribeToTransactions = (callback: (transactions: Transaction[]) => void) => {
    const q = query(collection(db, 'transactions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
        } as Transaction));
        callback(transactions.sort((a,b) => b.date.getTime() - a.date.getTime()));
    });
    return unsubscribe;
}

export const addTransaction = async (transaction: Omit<Transaction, 'id'|'date'> & { date?: Date }) => {
    const transactionPayload = {
        ...transaction,
        date: transaction.date ? Timestamp.fromDate(transaction.date) : Timestamp.fromDate(new Date()),
    }
    await addDoc(collection(db, 'transactions'), transactionPayload);
}

export const updateTransaction = async (id: string, transaction: Omit<Transaction, 'id'>) => {
    const transactionRef = doc(db, 'transactions', id);
    const payload = {
        ...transaction,
        date: Timestamp.fromDate(new Date(transaction.date))
    };
    await updateDoc(transactionRef, payload as any);
}

export const deleteTransaction = async (id: string) => {
    const transactionRef = doc(db, 'transactions', id);
    await deleteDoc(transactionRef);
}

// Cash Register Services
export const subscribeToCashRegisters = (callback: (registers: CashRegister[]) => void) => {
    const registersCollection = collection(db, 'cashRegisters');
    const unsubscribe = onSnapshot(registersCollection, async (snapshot) => {
        if (snapshot.empty) {
            console.log('No cash registers found, seeding default ones.');
            const batch = writeBatch(db);
            const defaultRegisters = [
                { name: 'Caisse principale' },
                { name: 'Petite caisse' },
            ];
            defaultRegisters.forEach(reg => {
                const docRef = doc(collection(db, 'cashRegisters'));
                batch.set(docRef, reg);
            });
            await batch.commit();
        } else {
            const registers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as CashRegister));
            callback(registers);
        }
    });
    return unsubscribe;
};

// Subcontractor Services
const processSubcontractorDoc = (docSnap: any, services: SubcontractorService[] = []) => {
    return {
        id: docSnap.id,
        ...docSnap.data(),
        services,
    } as Subcontractor;
};

export const subscribeToSubcontractors = (callback: (subcontractors: Subcontractor[]) => void) => {
    const q = query(collection(db, 'subcontractors'), orderBy('name'));
    return onSnapshot(q, async (querySnapshot) => {
        const subcontractors: Subcontractor[] = [];
        for (const doc of querySnapshot.docs) {
            const servicesQuery = query(collection(db, 'subcontractors', doc.id, 'services'));
            const servicesSnapshot = await getDocs(servicesQuery);
            const services = servicesSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as SubcontractorService));
            subcontractors.push(processSubcontractorDoc(doc, services));
        }
        callback(subcontractors);
    });
};

export const addSubcontractor = async (subcontractorData: Omit<Subcontractor, 'id' | 'services'> & { services: Omit<SubcontractorService, 'id'>[] }) => {
    const { services, ...subcontractor } = subcontractorData;
    
    const docRef = await addDoc(collection(db, 'subcontractors'), subcontractor);
    
    const batch = writeBatch(db);
    const servicesCollection = collection(db, 'subcontractors', docRef.id, 'services');
    services.forEach(service => {
        const serviceRef = doc(servicesCollection);
        batch.set(serviceRef, service);
    });
    await batch.commit();

    return docRef.id;
};

export const updateSubcontractor = async (id: string, subcontractorData: Omit<Subcontractor, 'id' | 'services'> & { services: (Omit<SubcontractorService, 'id'> | SubcontractorService)[] }) => {
    const { services, ...subcontractor } = subcontractorData;
    
    const subcontractorRef = doc(db, 'subcontractors', id);
    await updateDoc(subcontractorRef, subcontractor as any);

    const servicesCollection = collection(db, 'subcontractors', id, 'services');
    
    // Delete old services
    const oldServicesSnap = await getDocs(servicesCollection);
    const deleteBatch = writeBatch(db);
    oldServicesSnap.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    
    // Add new services
    const addBatch = writeBatch(db);
    services.forEach(service => {
        const serviceRef = doc(servicesCollection); // Create new doc for each service
        const { id: serviceId, ...serviceData } = service; // Remove potentially existing id
        addBatch.set(serviceRef, serviceData);
    });
    await addBatch.commit();
};

export const deleteSubcontractor = async (id: string) => {
    const servicesCollection = collection(db, 'subcontractors', id, 'services');
    const servicesSnap = await getDocs(servicesCollection);
    const batch = writeBatch(db);
    servicesSnap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    await deleteDoc(doc(db, 'subcontractors', id));
};


// Project Services
export const subscribeToProjects = (callback: (projects: Project[]) => void) => {
    const q = query(collection(db, "projects"), orderBy("name"));
    return onSnapshot(q, async (querySnapshot) => {
        if (querySnapshot.empty) {
            console.log('No projects found, seeding one.');
            await addDoc(collection(db, "projects"), {
                name: "Refonte du site web",
                description: "Projet de refonte complète du site web de l'entreprise."
            });
        } else {
            const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            callback(projects);
        }
    });
};

export const subscribeToTaskLists = (projectId: string, callback: (lists: TaskList[]) => void) => {
    const q = query(collection(db, "projects", projectId, "lists"), orderBy("order"));
    return onSnapshot(q, async (querySnapshot) => {
        if (querySnapshot.empty) {
             console.log('No lists found, seeding default ones.');
            const batch = writeBatch(db);
            const defaultLists = [
                { title: 'À faire', order: 1, color: 'bg-blue-100 dark:bg-blue-950/30' },
                { title: 'En cours', order: 2, color: 'bg-orange-100 dark:bg-orange-950/30' },
                { title: 'En revue', order: 3, color: 'bg-purple-100 dark:bg-purple-950/30' },
                { title: 'Terminé', order: 4, color: 'bg-green-100 dark:bg-green-950/30' },
            ];
            defaultLists.forEach(list => {
                const docRef = doc(collection(db, 'projects', projectId, 'lists'));
                batch.set(docRef, list);
            });
            await batch.commit();
        } else {
            const lists = querySnapshot.docs.map(doc => ({ id: doc.id, projectId, ...doc.data() } as TaskList));
            callback(lists);
        }
    });
};


const processTaskDoc = (doc: any): ProjectTask => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate(),
        startDate: data.startDate?.toDate(),
    } as ProjectTask;
};

export const subscribeToProjectTasks = (projectId: string, callback: (tasks: ProjectTask[]) => void) => {
    const q = query(collection(db, "projects", projectId, "tasks"), orderBy("order"));
    return onSnapshot(q, (querySnapshot) => {
        const tasks = querySnapshot.docs.map(processTaskDoc);
        callback(tasks);
    });
};

export const addProjectTask = async (projectId: string, taskData: Omit<ProjectTask, 'id' | 'dueDate' | 'startDate'> & { dueDate?: Date, startDate?: Date }) => {
    const { dueDate, startDate, ...rest } = taskData;
    const payload: any = { ...rest };
    if (dueDate) payload.dueDate = Timestamp.fromDate(dueDate);
    if (startDate) payload.startDate = Timestamp.fromDate(startDate);
    
    return addDoc(collection(db, 'projects', projectId, 'tasks'), payload);
};

export const updateProjectTask = async (projectId: string, taskId: string, taskData: Partial<ProjectTask>) => {
    const { dueDate, startDate, ...rest } = taskData;
    const payload: any = { ...rest };
    if (dueDate) payload.dueDate = Timestamp.fromDate(new Date(dueDate));
    if (startDate) payload.startDate = Timestamp.fromDate(new Date(startDate));
    
    // Remove undefined values
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    return updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), payload);
};

export const updateTaskListColor = async (projectId: string, listId: string, color: string) => {
    return updateDoc(doc(db, "projects", projectId, "lists", listId), { color });
};

export const reorderTasks = async (projectId: string, tasks: ProjectTask[]) => {
    const batch = writeBatch(db);
    tasks.forEach((task, index) => {
        const taskRef = doc(db, 'projects', projectId, 'tasks', task.id);
        batch.update(taskRef, { order: index, listId: task.listId });
    });
    await batch.commit();
};


// This is a helper for dashboard page loading state
export { onSnapshot, collection };
