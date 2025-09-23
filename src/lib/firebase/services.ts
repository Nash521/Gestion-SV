import { db } from './client';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, onSnapshot, getDoc, Timestamp, where, writeBatch } from 'firebase/firestore';
import type { Client, Invoice, PurchaseOrder, DeliveryNote, LineItem, Transaction, CashRegister } from '../definitions';

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

export const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'client' | 'lineItems'> & { lineItems: Omit<LineItem, 'id'>[] }) => {
    const { lineItems, ...invoice } = invoiceData;
    const invoicePayload = {
        ...invoice,
        issueDate: Timestamp.fromDate(invoiceData.issueDate),
        dueDate: Timestamp.fromDate(invoiceData.dueDate),
    };
    const newInvoiceRef = await addDoc(collection(db, 'invoices'), invoicePayload);
    
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

export const addPurchaseOrder = async (poData: Omit<PurchaseOrder, 'id' | 'client' | 'lineItems'> & { lineItems: Omit<LineItem, 'id'>[] }) => {
    const { lineItems, ...po } = poData;
    const poPayload = {
        ...po,
        issueDate: Timestamp.fromDate(poData.issueDate),
        deliveryDate: Timestamp.fromDate(poData.deliveryDate),
    };
    const newPoRef = await addDoc(collection(db, 'purchaseOrders'), poPayload);

    const batch = writeBatch(db);
    const itemsCollection = collection(db, 'purchaseOrders', newPoRef.id, 'lineItems');
    lineItems.forEach(item => {
        const itemRef = doc(itemsCollection);
        batch.set(itemRef, item);
    });
    await batch.commit();

    return newPoRef.id;
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

export const addDeliveryNote = async (dnData: Omit<DeliveryNote, 'id' | 'client' | 'lineItems'> & { lineItems: Omit<LineItem, 'id' | 'price'>[] }) => {
    const { lineItems, ...dn } = dnData;
    const dnPayload = {
        ...dn,
        deliveryDate: Timestamp.fromDate(dnData.deliveryDate),
    };
    const newDnRef = await addDoc(collection(db, 'deliveryNotes'), dnPayload);

    const batch = writeBatch(db);
    const itemsCollection = collection(db, 'deliveryNotes', newDnRef.id, 'lineItems');
    lineItems.forEach(item => {
        const itemRef = doc(itemsCollection);
        batch.set(itemRef, item);
    });
    await batch.commit();

    return newDnRef.id;
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

export const addTransaction = async (transaction: Omit<Transaction, 'id'|'date'>) => {
    const transactionPayload = {
        ...transaction,
        date: Timestamp.fromDate(new Date()),
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
                const docRef = doc(registersCollection);
                batch.set(docRef, reg);
            });
            await batch.commit();
            // The onSnapshot listener will be triggered again automatically after the write,
            // so we don't need to manually call the callback here.
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

// This is a helper for dashboard page loading state
export { onSnapshot, collection };
