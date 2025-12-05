"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Prospect, Client } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Mail, MessageSquare, UserPlus, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { subscribeToProspects, addProspect, updateProspect, deleteProspect, addClientFromProspect } from '@/lib/firebase/services';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [need, setNeed] = useState('');

    const isEditMode = !!prospectToEdit;

    useEffect(() => {
        if (isEditMode && prospectToEdit) {
            setName(prospectToEdit.name);
            setPhone(prospectToEdit.phone || '');
            setDate(new Date(prospectToEdit.date));
            setNeed(prospectToEdit.need);
        } else {
            setName('');
            setPhone('');
            setDate(new Date());
            setNeed('');
        }
    }, [prospectToEdit, isEditMode, isOpen]);

    const handleSubmit = () => {
        if (!name || !need || !date) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        const prospectData = { name, phone, date, need };

        if (isEditMode && prospectToEdit) {
            onSave({ ...prospectData, id: prospectToEdit.id });
        } else {
            onSave(prospectData);
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Modifier le prospect' : 'Nouveau prospect'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Mettez à jour les informations du prospect.' : 'Remplissez les informations pour le nouveau prospect.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom et Prénom(s)</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Date</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                 <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", {locale: fr}) : <span>Choisir une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    locale={fr}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="need">Besoin</Label>
                        <Textarea id="need" value={need} onChange={e => setNeed(e.target.value)} />
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
        // Here you decide what to do with the prospect data.
        // A simple conversion might use the name and phone.
        // The email and address fields are missing from the new prospect form.
        await addClientFromProspect({
            name: prospect.name,
            email: `prospect-${prospect.id}@example.com`, // Placeholder email
            address: 'Adresse non spécifiée', // Placeholder address
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
      p.need.toLowerCase().includes(searchQuery)
    );
  }, [prospects, searchQuery]);

  const ListSkeleton = () => (
    <TableBody>
        {[...Array(5)].map((_, i) => (
             <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
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
                    <TableHead>Date</TableHead>
                    <TableHead>Nom et Prénom(s)</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Besoin</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            {isLoading ? <ListSkeleton /> : (
            <TableBody>
                {filteredProspects.map((prospect) => (
                <TableRow key={prospect.id}>
                    <TableCell>{format(prospect.date, 'PPP', { locale: fr })}</TableCell>
                    <TableCell className="font-medium">{prospect.name}</TableCell>
                    <TableCell>{prospect.phone || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{prospect.need}</TableCell>
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
