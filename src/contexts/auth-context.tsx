"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { Collaborator, CollaboratorRole } from '@/lib/definitions';
import { doc, onSnapshot } from 'firebase/firestore';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userDocRef = doc(db, 'collaborators', user.uid);
                const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setCurrentUser({ id: docSnap.id, ...docSnap.data() } as Collaborator);
                    } else {
                        // This might happen for a brief moment if the user doc hasn't been created yet.
                        // Or if a user exists in Auth but not in Firestore.
                        setCurrentUser({
                            id: user.uid,
                            name: user.displayName || user.email || 'Utilisateur',
                            email: user.email!,
                            role: 'Employee' // Default role
                        });
                    }
                    setLoading(false);
                });
                return () => unsubDoc();
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
