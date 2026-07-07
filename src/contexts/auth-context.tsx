"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase/client';
import { Collaborator } from '@/lib/definitions';
import { doc, onSnapshot, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';

interface AuthContextType {
    currentUser: Collaborator | null;
    loading: boolean;
    firebaseConfigured: boolean;
    login: (email: string, password: string) => Promise<any>;
    logout: () => Promise<any>;
}

const createFirebaseConfigError = () => new Error('firebase/not-configured');

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    loading: true,
    firebaseConfigured: isFirebaseConfigured,
    login: async () => { throw createFirebaseConfigError(); },
    logout: async () => { throw createFirebaseConfigError(); },
});

const assignFirstAdmin = async (user: FirebaseUser) => {
    const collaboratorsRef = collection(db, 'collaborators');
    const adminQuery = query(collaboratorsRef, where('role', '==', 'Admin'));
    const adminSnapshot = await getDocs(adminQuery);

    if (adminSnapshot.empty) {
        console.log('No admin found. Assigning admin role to the first user:', user.email);
        const userDocRef = doc(db, 'collaborators', user.uid);
        const batch = writeBatch(db);
        batch.set(userDocRef, {
            name: user.displayName || user.email,
            email: user.email,
            role: 'Admin'
        }, { merge: true });
        await batch.commit();
        return true;
    }
    return false;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isFirebaseConfigured || !auth) {
            setCurrentUser(null);
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                assignFirstAdmin(user).then((wasAssigned) => {
                    const userDocRef = doc(db, 'collaborators', user.uid);
                    onSnapshot(userDocRef, (docSnap) => {
                        if (docSnap.exists()) {
                            setCurrentUser({ id: docSnap.id, ...docSnap.data() } as Collaborator);
                        } else if (!wasAssigned) {
                            setCurrentUser({
                                id: user.uid,
                                name: user.displayName || user.email || 'Utilisateur',
                                email: user.email!,
                                role: 'Employee'
                            });
                        }
                        setLoading(false);
                    });
                }).catch((error) => {
                    console.error('Failed to initialize authenticated user:', error);
                    setLoading(false);
                });
            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const login = (email: string, password: string) => {
        if (!isFirebaseConfigured || !auth) {
            return Promise.reject(createFirebaseConfigError());
        }
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        if (!isFirebaseConfigured || !auth) {
            return Promise.reject(createFirebaseConfigError());
        }
        return signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ currentUser, loading, firebaseConfigured: isFirebaseConfigured, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
