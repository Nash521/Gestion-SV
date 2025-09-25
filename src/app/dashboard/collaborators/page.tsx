"use client"
import React, { useState, useEffect } from 'react';
import { mockCollaborators } from '@/lib/data';
import type { Collaborator, CollaboratorRole } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, PlusCircle, ShieldCheck, User, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const AddCollaboratorDialog = ({ isOpen, setIsOpen, onAdd }: { isOpen: boolean, setIsOpen: (open: boolean) => void, onAdd: (collaborator: Omit<Collaborator, 'id'>, password: string) => Promise<void> }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<CollaboratorRole | ''>('');

    const handleSubmit = async () => {
        if (!name || !email || !role || !password) {
            alert('Veuillez remplir tous les champs.');
            return;
        }
        await onAdd({ name, email, role: role as CollaboratorRole }, password);
        setIsOpen(false);
        setName('');
        setEmail('');
        setPassword('');
        setRole('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ajouter un collaborateur</DialogTitle>
                    <DialogDescription>
                        Invitez un nouveau membre dans votre équipe.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nom</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Mot de passe</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Rôle</Label>
                        <Select onValueChange={(value: CollaboratorRole) => setRole(value)} value={role}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Admin">Administrateur</SelectItem>
                                <SelectItem value="Employee">Employé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button onClick={handleSubmit}>Ajouter</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const EditRoleDialog = ({ collaborator, isOpen, setIsOpen, onUpdate }: { collaborator: Collaborator | null, isOpen: boolean, setIsOpen: (open: boolean) => void, onUpdate: (id: string, newRole: CollaboratorRole) => void }) => {
    const [newRole, setNewRole] = useState<CollaboratorRole | ''>(collaborator?.role || '');
    
    useEffect(() => {
        if (collaborator) {
            setNewRole(collaborator.role);
        }
    }, [collaborator]);

    if (!collaborator) return null;

    const handleUpdate = () => {
        if (!newRole) {
            alert('Veuillez sélectionner un rôle.');
            return;
        }
        onUpdate(collaborator.id, newRole as CollaboratorRole);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Modifier le rôle</DialogTitle>
                    <DialogDescription>
                        Changer le rôle de <span className="font-semibold">{collaborator.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Nouveau Rôle</Label>
                        <Select onValueChange={(value: CollaboratorRole) => setNewRole(value)} value={newRole}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Admin">Administrateur</SelectItem>
                                <SelectItem value="Employee">Employé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button onClick={handleUpdate}>Mettre à jour</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

function AccessDenied() {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                 <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className="text-2xl mt-4">Accès Refusé</CardTitle>
                <CardDescription>
                    Vous n'avez pas les permissions nécessaires pour accéder à cette page. Veuillez contacter un administrateur.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" asChild>
                    <a href="/dashboard">Retour au tableau de bord</a>
                </Button>
            </CardContent>
        </Card>
    );
}

export default function CollaboratorsPage() {
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const [collaborators, setCollaborators] = useState<Collaborator[]>(mockCollaborators);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [collaboratorToEdit, setCollaboratorToEdit] = useState<Collaborator | null>(null);
    const [collaboratorToDelete, setCollaboratorToDelete] = useState<Collaborator | null>(null);


    if (currentUser?.role !== 'Admin') {
        return <AccessDenied />;
    }

    const handleAddCollaborator = async (newCollaborator: Omit<Collaborator, 'id'>, password: string) => {
        try {
            // In a real app, you would have a backend function to create user
            // to avoid exposing auth logic on the client.
            // This is a simplified example.
            const userCredential = await createUserWithEmailAndPassword(auth, newCollaborator.email, password);
            
            // You would then save the user's role and other info in Firestore
            // associated with their userCredential.user.uid
            const collaboratorToAdd: Collaborator = {
                id: userCredential.user.uid,
                ...newCollaborator
            };

            setCollaborators(prev => [...prev, collaboratorToAdd]);
            toast({
                title: "Collaborateur ajouté",
                description: `Le compte pour ${collaboratorToAdd.email} a été créé.`,
            });
        } catch (error: any) {
            console.error("Error creating user:", error);
            toast({
                variant: "destructive",
                title: "Erreur lors de la création",
                description: error.message,
            });
        }
    };
    
    const handleOpenEditDialog = (collaborator: Collaborator) => {
        setCollaboratorToEdit(collaborator);
        setIsEditDialogOpen(true);
    };

    const handleUpdateRole = (id: string, newRole: CollaboratorRole) => {
        // In a real app, this would be an API call to your backend/Firebase to update the user's custom claims or role in Firestore.
        setCollaborators(prev => prev.map(c => c.id === id ? { ...c, role: newRole } : c));
        toast({
            title: "Rôle mis à jour",
            description: `Le rôle de ${collaborators.find(c => c.id === id)?.name} a été changé en ${newRole}.`,
        });
    };

    const handleDeleteRequest = (collaborator: Collaborator) => {
        setCollaboratorToDelete(collaborator);
    };

    const handleConfirmDelete = () => {
        if (!collaboratorToDelete) return;
        
        // This is a client-side only deletion for now.
        // A real implementation would call a backend function to delete the Firebase Auth user.
        setCollaborators(prev => prev.filter(c => c.id !== collaboratorToDelete.id));

        toast({
            variant: "destructive",
            title: "Collaborateur supprimé",
            description: `${collaboratorToDelete.name} a été retiré de la liste.`,
        });

        setCollaboratorToDelete(null);
    };

    const roleTranslations: Record<CollaboratorRole, string> = {
        'Admin': 'Administrateur',
        'Employee': 'Employé'
    };

    return (
        <>
            <AlertDialog open={!!collaboratorToDelete} onOpenChange={(open) => !open && setCollaboratorToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera {collaboratorToDelete?.name} de la liste. Note : Ceci ne supprime pas le compte utilisateur de l'authentification.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCollaboratorToDelete(null)}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>Confirmer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AddCollaboratorDialog isOpen={isAddDialogOpen} setIsOpen={setIsAddDialogOpen} onAdd={handleAddCollaborator} />
            <EditRoleDialog
                collaborator={collaboratorToEdit}
                isOpen={isEditDialogOpen}
                setIsOpen={setIsEditDialogOpen}
                onUpdate={handleUpdateRole}
            />
            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Collaborateurs</CardTitle>
                            <CardDescription>Gérez les membres de votre équipe et leurs permissions.</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un collaborateur
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead className="w-[50px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {collaborators.map((collaborator) => (
                                <TableRow key={collaborator.id}>
                                    <TableCell className="font-medium">{collaborator.name}</TableCell>
                                    <TableCell>{collaborator.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={collaborator.role === 'Admin' ? 'default' : 'secondary'}>
                                            {collaborator.role === 'Admin' ? <ShieldCheck className="mr-2 h-4 w-4" /> : <User className="mr-2 h-4 w-4" />}
                                            {roleTranslations[collaborator.role]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={collaborator.id === currentUser?.id}>
                                                    <span className="sr-only">Ouvrir le menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenEditDialog(collaborator)} disabled={collaborator.role === 'Admin' && collaborator.id !== currentUser?.id}>
                                                    Modifier le rôle
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                    onClick={() => handleDeleteRequest(collaborator)}
                                                >
                                                    Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
