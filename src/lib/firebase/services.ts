import { db } from './client';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Client } from '../definitions';

// Client Services
export const getClients = async (): Promise<Client[]> => {
    const clientsCol = collection(db, 'clients');
    const clientSnapshot = await getDocs(clientsCol);
    const clientList = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    return clientList;
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

export const updateClient = async (id: string, updatedData: Partial<Client>) => {
    const clientDoc = doc(db, 'clients', id);
    await updateDoc(clientDoc, updatedData);
};

export const deleteClient = async (id: string) => {
    const clientDoc = doc(db, 'clients', id);
    await deleteDoc(clientDoc);
};

// You can add more services for other collections (invoices, projects, etc.) here
