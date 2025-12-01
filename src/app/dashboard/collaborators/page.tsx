"use client";
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { db, auth as firebaseAuth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addCollaborator, updateCollaborator, deleteCollaborator, subscribeToCollaborators } from '@/lib/firebase/services';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export default function CollaboratorsPage() {
  const { currentUser, loading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("Employee");
  const [showPassword, setShowPassword] = useState(false);

  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState("");

  const fetchUsers = async () => {
    if (currentUser?.role === 'Admin') {
      const unsubscribe = subscribeToCollaborators((collaboratorsData) => {
        setUsers(collaboratorsData);
      });
      return unsubscribe;
    }
  };

  useEffect(() => {
    const unsubscribe = fetchUsers();
    return () => {
      // @ts-ignore
      if (unsubscribe && typeof unsubscribe === 'function') {
        // @ts-ignore
        unsubscribe();
      }
    };
  }, [currentUser]);

  const handleAddUser = async () => {
    if (newUserPassword.length < 6) {
        toast({
            variant: "destructive",
            title: "Mot de passe trop court",
            description: "Le mot de passe doit contenir au moins 6 caractères.",
        });
        return;
    }
    if (newUserName && newUserEmail && newUserPassword && newUserRole) {
      try {
        await addCollaborator({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole as 'Admin' | 'Employee',
        }, newUserPassword);
        
        toast({
          title: "Collaborateur ajouté",
          description: `${newUserName} a été ajouté avec succès.`,
        });

        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("Employee");
        setIsAddDialogOpen(false);
      } catch (error: any) {
        let description = "Une erreur est survenue lors de l'ajout du collaborateur.";
        if (error.code === 'auth/email-already-in-use') {
            description = "Cette adresse e-mail est déjà utilisée par un autre compte.";
        } else if (error.code === 'auth/invalid-email') {
            description = "L'adresse e-mail n'est pas valide.";
        }
        toast({
          variant: "destructive",
          title: "Erreur",
          description: description,
        });
      }
    }
  };

  const handleEditUser = async () => {
    if (selectedUser && editUserName && editUserEmail && editUserRole) {
      try {
        const updateData: Partial<{ name: string; email: string; role: 'Admin' | 'Employee' }> = {
          name: editUserName,
          email: editUserEmail,
          role: editUserRole as 'Admin' | 'Employee',
        };
        
        await updateCollaborator(selectedUser.id, updateData);

        toast({
          title: "Collaborateur mis à jour",
          description: `Les informations de ${editUserName} ont été modifiées.`,
        });
        setSelectedUser(null);
        setIsEditDialogOpen(false);
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Erreur lors de la modification du collaborateur."
        });
      }
    }
  };

  const handleDeleteUser = async () => {
    if (selectedUser) {
      try {
        await deleteCollaborator(selectedUser.id);
        toast({
            variant: 'destructive',
            title: "Collaborateur supprimé",
            description: `${selectedUser.name} a été supprimé. (La suppression de l'authentification doit être faite côté serveur).`
        });
        setSelectedUser(null);
        setIsDeleteDialogOpen(false);
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Erreur lors de la suppression du collaborateur."
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (currentUser?.role !== 'Admin') {
    return <div className="flex items-center justify-center h-full">Accès non autorisé.</div>;
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestion des collaborateurs</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Ajouter un collaborateur</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau collaborateur</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour le nouveau collaborateur. Le mot de passe doit contenir au moins 6 caractères.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nom</Label>
                <Input id="name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Mot de passe</Label>
                 <div className="relative col-span-3">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Rôle</Label>
                <Select onValueChange={setNewUserRole} defaultValue={newUserRole}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Employee">Employé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddUser}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setEditUserName(user.name);
                            setEditUserEmail(user.email);
                            setEditUserRole(user.role);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600 focus:text-red-500"
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  Aucun collaborateur trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier le collaborateur</DialogTitle>
              <DialogDescription>
                Mettez à jour les informations du collaborateur.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Nom</Label>
                <Input id="edit-name" value={editUserName} onChange={(e) => setEditUserName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">Email</Label>
                <Input id="edit-email" type="email" value={editUserEmail} onChange={(e) => setEditUserEmail(e.target.value)} className="col-span-3" disabled />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">Rôle</Label>
                <Select onValueChange={setEditUserRole} value={editUserRole}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Employee">Employé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className='text-sm text-muted-foreground text-center pt-2'>La modification du mot de passe doit être gérée via un flux de réinitialisation sécurisé.</p>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Annuler</Button>
                </DialogClose>
              <Button onClick={handleEditUser}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le collaborateur {selectedUser?.name} ? Cette action est irréversible.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser}>Supprimer</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
