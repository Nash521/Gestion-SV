"use client";
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
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

export default function CollaboratorsPage() {
  const { currentUser, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("Employee");

  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserRole, setEditUserRole] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  const fetchUsers = async () => {
    if (currentUser?.role === 'Admin') {
      const usersCollection = collection(db, "collaborators");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const handleAddUser = async () => {
    if (newUserName && newUserEmail && newUserPassword && newUserRole) {
      try {
        console.warn("WARNING: Storing passwords directly in Firestore is INSECURE for production apps. Use Firebase Authentication.");
        await addDoc(collection(db, "collaborators"), {
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          password: newUserPassword, // Re-enabled for demo purposes. NOT SECURE.
        });
        alert("Collaborateur ajouté ! (Attention: Le mot de passe n'est pas géré de manière sécurisée dans cette démo).");
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("Employee");
        setIsAddDialogOpen(false);
        fetchUsers();
      } catch (error) {
        console.error("Error adding user: ", error);
        alert("Erreur lors de l'ajout du collaborateur.");
      }
    }
  };

  const handleEditUser = async () => {
    if (selectedUser && editUserName && editUserEmail && editUserRole) {
      try {
        const userDocRef = doc(db, "collaborators", selectedUser.id);
        const updateData: { name: string; email: string; role: string; password?: string } = {
          name: editUserName,
          email: editUserEmail,
          role: editUserRole,
        };
        if (editUserPassword) {
          console.warn("WARNING: Updating passwords directly in Firestore is INSECURE for production apps. Use Firebase Authentication.");
          updateData.password = editUserPassword; // Re-enabled for demo purposes. NOT SECURE.
          alert("Mot de passe mis à jour ! (Attention: Le mot de passe n'est pas géré de manière sécurisée dans cette démo).");
        }

        await updateDoc(userDocRef, updateData);
        alert("Collaborateur mis à jour !");
        setEditUserName("");
        setEditUserEmail("");
        setEditUserPassword("");
        setEditUserRole("");
        setSelectedUser(null);
        setIsEditDialogOpen(false);
        fetchUsers();
      } catch (error) {
        console.error("Error updating user: ", error);
        alert("Erreur lors de la modification du collaborateur.");
      }
    }
  };

  const handleDeleteUser = async () => {
    if (selectedUser) {
      try {
        console.warn("WARNING: Deleting users directly from Firestore without Firebase Authentication is INSECURE and incomplete for production apps.");
        await deleteDoc(doc(db, "collaborators", selectedUser.id));
        alert("Collaborateur supprimé ! (Attention: La suppression réelle de l'utilisateur doit être faite via Firebase Auth).");
        setSelectedUser(null);
        setIsDeleteDialogOpen(false);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user: ", error);
        alert("Erreur lors de la suppression du collaborateur.");
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
                Remplissez les informations pour le nouveau collaborateur.
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
                <Input id="password" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="col-span-3" />
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
                            setEditUserPassword(user.password || "");
                            setShowEditPassword(false); // Reset password visibility
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
                          className="text-red-600"
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Edit User Dialog */}
                    <Dialog open={isEditDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsEditDialogOpen}>
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
                            <Input id="edit-email" type="email" value={editUserEmail} onChange={(e) => setEditUserEmail(e.target.value)} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-password" className="text-right">Mot de passe</Label>
                            <div className="relative col-span-3">
                              <Input
                                id="edit-password"
                                type={showEditPassword ? "text" : "password"}
                                value={editUserPassword}
                                onChange={(e) => setEditUserPassword(e.target.value)}
                                className="pr-10"
                                placeholder="Nouveau mot de passe"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowEditPassword((prev) => !prev)}
                              >
                                {showEditPassword ? (
                                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                  <Eye className="h-4 w-4" aria-hidden="true" />
                                )}
                                <span className="sr-only">Toggle password visibility</span>
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-role" className="text-right">Rôle</Label>
                            <Select onValueChange={setEditUserRole} defaultValue={editUserRole}>
                              <SelectTrigger className="col-span-3"><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="Employee">Employé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleEditUser}>Enregistrer les modifications</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Delete User Dialog */}
                    <Dialog open={isDeleteDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirmer la suppression</DialogTitle>
                          <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer le collaborateur {selectedUser?.name} ? Cette action est irréversible.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
                          <Button variant="destructive" onClick={handleDeleteUser}>Supprimer</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
    </div>
  );
}
