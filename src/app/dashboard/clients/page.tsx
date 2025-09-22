"use client"
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { mockClients } from '@/lib/data';
import type { Client } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Mail, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { addClient, updateClient, deleteClient, subscribeToClients } from '@/lib/firebase/services';
import { Skeleton } from '@/components/ui/skeleton';


const AddOrEditClientDialog = ({
    isOpen,
    setIsOpen,
    onSave,
    clientToEdit,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSave: (client: Omit<Client, 'id'> | Client) => void;
    clientToEdit?: Client | null;
}) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');

    const isEditMode = !!clientToEdit;

    useEffect(() => {
        if (isEditMode && clientToEdit) {
            setName(clientToEdit.name);
            setEmail(clientToEdit.email);
            setAddress(clientToEdit.address);
            setPhone(clientToEdit.phone || '');
        } else {
            setName('');
            setEmail('');
            setAddress('');
            setPhone('');
        }
    }, [clientToEdit, isEditMode, isOpen]);

    const handleSubmit = () => {
        if (!name || !email || !address) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        const clientData = {
            name,
            email,
            address,
            phone,
        };

        if (isEditMode && clientToEdit) {
            onSave({ ...clientData, id: clientToEdit.id });
        } else {
            onSave(clientData);
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Mettez à jour les informations du client.' : 'Remplissez les informations pour le nouveau client.'}
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
                        <Input id="address" value={address} onChange={e => setAddress(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Téléphone</Label>
                        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="col-span-3" />
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

export default function ClientsPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientIdToDelete, setClientIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToClients((clientsData) => {
        setClients(clientsData);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenAddDialog = () => {
    setClientToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (client: Client) => {
    setClientToEdit(client);
    setIsDialogOpen(true);
  };

  const handleSaveClient = async (clientData: Omit<Client, 'id'> | Client) => {
    try {
        if ('id' in clientData) {
            // Edit mode
            const { id, ...dataToUpdate } = clientData;
            await updateClient(id, dataToUpdate);
            toast({ title: 'Client modifié', description: `Les informations de ${clientData.name} ont été mises à jour.` });

            if (currentUser?.role !== 'Admin') {
                addNotification({
                    actorId: currentUser!.id,
                    actorName: currentUser!.name,
                    message: `a modifié le client ${clientData.name}.`,
                });
            }
        } else {
            // Add mode
            await addClient(clientData);
            toast({ title: 'Client ajouté', description: `${clientData.name} a été ajouté à votre liste.` });
            if (currentUser?.role !== 'Admin') {
                addNotification({
                    actorId: currentUser!.id,
                    actorName: currentUser!.name,
                    message: `a ajouté un nouveau client : ${clientData.name}.`,
                });
            }
        }
    } catch (error) {
        console.error("Error saving client: ", error);
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de sauvegarder le client." });
    }
  };
  
  const handleDeleteRequest = (clientId: string) => {
    setClientIdToDelete(clientId);
  };

  const handleConfirmDelete = async () => {
    if (!clientIdToDelete) return;
    
    const clientToDelete = clients.find(c => c.id === clientIdToDelete);
    if (!clientToDelete) return;
    
    try {
        await deleteClient(clientIdToDelete);
        toast({
            variant: 'destructive',
            title: 'Client supprimé',
            description: `${clientToDelete.name} a été supprimé.`,
        });
        
        if (currentUser?.role !== 'Admin') {
            addNotification({
                actorId: currentUser!.id,
                actorName: currentUser!.name,
                message: `a supprimé le client ${clientToDelete.name}.`,
            });
        }
    } catch (error) {
        console.error("Error deleting client: ", error);
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de supprimer le client." });
    } finally {
        setClientIdToDelete(null);
    }
  };

  const searchQuery = searchParams.get('q')?.toLowerCase() || '';

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;

    return clients.filter(client =>
      client.name.toLowerCase().includes(searchQuery) ||
      client.email.toLowerCase().includes(searchQuery)
    );
  }, [clients, searchQuery]);

  const ClientListSkeleton = () => (
    <TableBody>
        {[...Array(5)].map((_, i) => (
             <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
            </TableRow>
        ))}
    </TableBody>
  );


  return (
    <>
        <AddOrEditClientDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            onSave={handleSaveClient}
            clientToEdit={clientToEdit}
        />

        <AlertDialog open={!!clientIdToDelete} onOpenChange={(open) => !open && setClientIdToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Le client sera définitivement supprimé.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setClientIdToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
        <CardHeader>
            <div className="flex items-center justify-between">
            <div>
                <CardTitle>Clients</CardTitle>
                <CardDescription>Gérez les informations de vos clients.</CardDescription>
            </div>
            <Button size="sm" onClick={handleOpenAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un client
            </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Nom du client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            {isLoading ? <ClientListSkeleton /> : (
            <TableBody>
                {filteredClients.map((client) => (
                <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone || 'N/A'}</TableCell>
                    <TableCell>{client.address}</TableCell>
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
                                <DropdownMenuItem onClick={() => handleOpenEditDialog(client)}>Modifier</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <a href={`mailto:${client.email}`} className="flex items-center">
                                        <Mail className="mr-2 h-4 w-4"/>
                                        <span>Contacter par Email</span>
                                    </a>
                                </DropdownMenuItem>
                                {client.phone && (
                                    <DropdownMenuItem asChild>
                                        <a href={`https://wa.me/${client.phone.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                            <MessageSquare className="mr-2 h-4 w-4"/>
                                            <span>Contacter par WhatsApp</span>
                                        </a>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => handleDeleteRequest(client.id)}
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
            {!isLoading && filteredClients.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucun client trouvé.
            </div>
            )}
        </CardContent>
        </Card>
    </>
  );
}
