"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Client } from '@/lib/definitions'; // Re-using Client type for prospects for simplicity
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Mail, MessageSquare, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { addDoc, updateDoc, deleteDoc, onSnapshot, collection, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Skeleton } from '@/components/ui/skeleton';

// For simplicity, we'll name the collection 'prospects' but reuse the Client type
type Prospect = Client;

const subscribeToProspects = (callback: (data: Prospect[]) => void) => {
    const prospectsCollection = collection(db, 'prospects');
    return onSnapshot(prospectsCollection, (snapshot) => {
        const prospectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prospect));
        callback(prospectsData);
    });
};

const addProspect = (data: Omit<Prospect, 'id'>) => addDoc(collection(db, 'prospects'), data);
const updateProspect = (id: string, data: Partial<Prospect>) => updateDoc(doc(db, 'prospects', id), data);
const deleteProspect = (id: string) => deleteDoc(doc(db, 'prospects', id));
const addClientFromProspect = (data: Omit<Client, 'id'>) => addDoc(collection(db, 'clients'), data);


const AddOrEditProspectDialog = ({
    isOpen,
    setIsOpen,
    onSave,
    prospectToEdit,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSave: (prospect: Omit<Prospect, 'id'> | Prospect) => void;
    prospectToEdit?: Prospect | null;
}) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');

    const isEditMode = !!prospectToEdit;

    useEffect(() => {
        if (isEditMode && prospectToEdit) {
            setName(prospectToEdit.name);
            setEmail(prospectToEdit.email);
            setAddress(prospectToEdit.address);
            setPhone(prospectToEdit.phone || '');
        } else {
            setName('');
            setEmail('');
            setAddress('');
            setPhone('');
        }
    }, [prospectToEdit, isEditMode, isOpen]);

    const handleSubmit = () => {
        if (!name || !email) {
            alert('Veuillez remplir le nom et l\'email.');
            return;
        }

        const prospectData = { name, email, address, phone };

        if (isEditMode && prospectToEdit) {
            onSave({ ...prospectData, id: prospectToEdit.id });
        } else {
            onSave(prospectData);
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Modifier le prospect' : 'Nouveau prospect'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Mettez à jour les informations du prospect.' : 'Remplissez les informations pour le nouveau prospect.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nom</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" value={email} onChange={e => setEmail(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">Adresse</Label>
                        <Input id="address" value={address} onChange={e => setAddress(e.target.value)} className="col-span-3" placeholder="Optionnel" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Téléphone</Label>
                        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="col-span-3" placeholder="Optionnel" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Annuler</Button></DialogClose>
                    <Button onClick={handleSubmit}>Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function ProspectsPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const searchParams = useSearchParams();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [prospectToEdit, setProspectToEdit] = useState<Prospect | null>(null);
  const [prospectIdToDelete, setProspectIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToProspects((data) => {
        setProspects(data);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenAddDialog = () => {
    setProspectToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (prospect: Prospect) => {
    setProspectToEdit(prospect);
    setIsDialogOpen(true);
  };

  const handleSaveProspect = async (prospectData: Omit<Prospect, 'id'> | Prospect) => {
    try {
        if ('id' in prospectData) {
            await updateProspect(prospectData.id, prospectData);
            toast({ title: 'Prospect modifié', description: `Les informations de ${prospectData.name} ont été mises à jour.` });
        } else {
            await addProspect(prospectData);
            toast({ title: 'Prospect ajouté', description: `${prospectData.name} a été ajouté à votre liste.` });
            if (currentUser) {
                addNotification({
                    actorId: currentUser!.id,
                    actorName: currentUser!.name,
                    message: `a ajouté un nouveau prospect : ${prospectData.name}.`,
                });
            }
        }
    } catch (error) {
        console.error("Error saving prospect: ", error);
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de sauvegarder le prospect." });
    }
  };
  
  const handleDeleteRequest = (id: string) => {
    setProspectIdToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!prospectIdToDelete) return;
    
    const prospectToDelete = prospects.find(p => p.id === prospectIdToDelete);
    if (!prospectToDelete) return;
    
    try {
        await deleteProspect(prospectIdToDelete);
        toast({
            variant: 'destructive',
            title: 'Prospect supprimé',
            description: `${prospectToDelete.name} a été supprimé.`,
        });
        
        if (currentUser) {
            addNotification({
                actorId: currentUser.id,
                actorName: currentUser.name,
                message: `a supprimé le prospect ${prospectToDelete.name}.`,
            });
        }
    } catch (error) {
        console.error("Error deleting prospect: ", error);
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de supprimer le prospect." });
    } finally {
        setProspectIdToDelete(null);
    }
  };

  const handleConvertToClient = async (prospect: Prospect) => {
    try {
        // Add to clients collection
        await addClientFromProspect({
            name: prospect.name,
            email: prospect.email,
            address: prospect.address,
            phone: prospect.phone,
        });

        // Delete from prospects collection
        await deleteProspect(prospect.id);
        
        toast({ title: 'Prospect converti', description: `${prospect.name} est maintenant un client.` });
        if(currentUser) {
            addNotification({
                actorId: currentUser.id,
                actorName: currentUser.name,
                message: `a converti le prospect ${prospect.name} en client.`,
            });
        }
    } catch (error) {
        console.error("Error converting prospect to client: ", error);
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de convertir le prospect." });
    }
  };

  const searchQuery = searchParams.get('q')?.toLowerCase() || '';

  const filteredProspects = useMemo(() => {
    if (!searchQuery) return prospects;

    return prospects.filter(p =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.email.toLowerCase().includes(searchQuery)
    );
  }, [prospects, searchQuery]);

  const ListSkeleton = () => (
    <TableBody>
        {[...Array(5)].map((_, i) => (
             <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
            </TableRow>
        ))}
    </TableBody>
  );

  return (
    <>
        <AddOrEditProspectDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            onSave={handleSaveProspect}
            prospectToEdit={prospectToEdit}
        />

        <AlertDialog open={!!prospectIdToDelete} onOpenChange={(open) => !open && setProspectIdToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Le prospect sera définitivement supprimé.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setProspectIdToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
        <CardHeader>
            <div className="flex items-center justify-between">
            <div>
                <CardTitle>Prospects</CardTitle>
                <CardDescription>Gérez votre liste de contacts et de clients potentiels.</CardDescription>
            </div>
            <Button size="sm" onClick={handleOpenAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un prospect
            </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            {isLoading ? <ListSkeleton /> : (
            <TableBody>
                {filteredProspects.map((prospect) => (
                <TableRow key={prospect.id}>
                    <TableCell className="font-medium">{prospect.name}</TableCell>
                    <TableCell>{prospect.email}</TableCell>
                    <TableCell>{prospect.phone || 'N/A'}</TableCell>
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
                                <DropdownMenuItem onClick={() => handleConvertToClient(prospect)}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Convertir en Client
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenEditDialog(prospect)}>Modifier</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <a href={`mailto:${prospect.email}`} className="flex items-center">
                                        <Mail className="mr-2 h-4 w-4"/>
                                        <span>Contacter par Email</span>
                                    </a>
                                </DropdownMenuItem>
                                {prospect.phone && (
                                    <DropdownMenuItem asChild>
                                        <a href={`https://wa.me/${prospect.phone.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                            <MessageSquare className="mr-2 h-4 w-4"/>
                                            <span>Contacter par WhatsApp</span>
                                        </a>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => handleDeleteRequest(prospect.id)}
                                >
                                    Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            )}
            </Table>
            {!isLoading && filteredProspects.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucun prospect trouvé.
            </div>
            )}
        </CardContent>
        </Card>
    </>
  );
}
