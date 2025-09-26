"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { Collaborator, CollaboratorRole } from '@/lib/definitions';
import { doc, onSnapshot, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';

interface AuthContextType {
    currentUser: Collaborator | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<any>;
    logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    loading: true,
    login: async () => {},
    logout: async () => {},
});

// Helper function to check for an admin and assign if none exists
const assignFirstAdmin = async (user: FirebaseUser) => {
    const collaboratorsRef = collection(db, 'collaborators');
    const adminQuery = query(collaboratorsRef, where('role', '==', 'Admin'));
    const adminSnapshot = await getDocs(adminQuery);

    if (adminSnapshot.empty) {
        console.log("No admin found. Assigning admin role to the first user:", user.email);
        const userDocRef = doc(db, 'collaborators', user.uid);
        const batch = writeBatch(db);
        batch.set(userDocRef, {
            name: user.displayName || user.email,
            email: user.email,
            role: 'Admin'
        }, { merge: true }); // Use merge to be safe
        await batch.commit();
        return true; // Indicates that a role was assigned
    }
    return false; // Admin already exists
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                 // Check and assign admin role on first login if necessary
                assignFirstAdmin(user).then((wasAssigned) => {
                    const userDocRef = doc(db, 'collaborators', user.uid);
                    const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
                        if (docSnap.exists()) {
                            setCurrentUser({ id: docSnap.id, ...docSnap.data() } as Collaborator);
                        } else if (!wasAssigned) {
                            // If role was not just assigned, and doc doesn't exist, there is a data inconsistency.
                            // For now, let's create a default employee user.
                             setCurrentUser({
                                id: user.uid,
                                name: user.displayName || user.email || 'Utilisateur',
                                email: user.email!,
                                role: 'Employee'
                            });
                        }
                        setLoading(false);
                    });
                     return () => unsubDoc();
                });
            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const login = (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        currentUser,
        loading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
