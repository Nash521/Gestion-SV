import { db } from './client';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, onSnapshot } from 'firebase/firestore';
import type { Client } from '../definitions';

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

// You can add more services for other collections (invoices, projects, etc.) here