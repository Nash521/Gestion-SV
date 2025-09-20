"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Collaborator, CollaboratorRole } from '@/lib/definitions';
import { mockCollaborators } from '@/lib/data'; // We'll use this for mock role lookup

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
                // In a real app, you would fetch user roles from Firestore/Database
                // For now, we'll find the user in our mock data
                const collaborator = mockCollaborators.find(c => c.email === user.email);
                
                if (collaborator) {
                    setCurrentUser(collaborator);
                } else {
                    // Fallback for newly created users not in mock data
                    // Default to 'Employee' role. In a real app, you'd have a system
                    // to assign roles upon creation.
                     setCurrentUser({
                        id: user.uid,
                        name: user.displayName || user.email || 'Nouveau membre',
                        email: user.email!,
                        role: 'Employee',
                    });
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
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
