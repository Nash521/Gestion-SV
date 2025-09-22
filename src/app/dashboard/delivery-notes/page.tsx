"use client"

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { DeliveryNote } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { subscribeToDeliveryNotes, updateDeliveryNoteStatus, deleteDeliveryNote } from '@/lib/firebase/services';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const deliveryNoteStatuses: DeliveryNote['status'][] = ['Draft', 'Delivered', 'Canceled'];

export default function DeliveryNotesPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToDeliveryNotes((data) => {
      setDeliveryNotes(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (noteId: string, newStatus: DeliveryNote['status']) => {
    try {
      await updateDeliveryNoteStatus(noteId, newStatus);
      toast({
        title: "Statut mis à jour",
        description: `Le bon de livraison ${noteId} est maintenant "${newStatus}".`,
      });
    } catch(error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.'});
    }
  };

  const handleDeleteRequest = (noteId: string) => {
    setNoteIdToDelete(noteId);
  };

  const handleConfirmDelete = async () => {
    if (!noteIdToDelete) return;
    try {
        await deleteDeliveryNote(noteIdToDelete);
        toast({
            variant: 'destructive',
            title: 'Bon de livraison supprimé',
            description: `Le bon de livraison a été supprimé.`,
        });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de supprimer le bon de livraison." });
    } finally {
        setNoteIdToDelete(null);
    }
  };

  const searchQuery = searchParams.get('q')?.toLowerCase() || '';

  const filteredDeliveryNotes = useMemo(() => {
    if (!searchQuery) return deliveryNotes;

    return deliveryNotes.filter(note =>
      note.id.toLowerCase().includes(searchQuery) ||
      note.client.name.toLowerCase().includes(searchQuery) ||
      (note.invoiceId && note.invoiceId.toLowerCase().includes(searchQuery))
    );
  }, [deliveryNotes, searchQuery]);

  const ListSkeleton = () => (
    <TableBody>
        {[...Array(5)].map((_, i) => (
             <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
            </TableRow>
        ))}
    </TableBody>
  );

  return (
    <>
      <AlertDialog open={!!noteIdToDelete} onOpenChange={(open) => !open && setNoteIdToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Le bon de livraison sera définitivement supprimé.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setNoteIdToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bons de livraison</CardTitle>
                <CardDescription>Gérez vos bons de livraison.</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/dashboard/delivery-notes/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Créer un bon de livraison
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID du bon</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Proforma associée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date de livraison</TableHead>
                  <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              {isLoading ? <ListSkeleton /> : (
              <TableBody>
                {filteredDeliveryNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">{note.id}</TableCell>
                    <TableCell>{note.client.name}</TableCell>
                    <TableCell>{note.invoiceId || 'N/A'}</TableCell>
                    <TableCell>
                      <StatusBadge status={note.status} />
                    </TableCell>
                    <TableCell>{format(note.deliveryDate, 'PPP', { locale: fr })}</TableCell>
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
                                <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/delivery-notes/${note.id}`}>Voir les détails</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled>Modifier</DropdownMenuItem>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Changer le statut</DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            {deliveryNoteStatuses.map(status => (
                                                <DropdownMenuItem 
                                                    key={status} 
                                                    onClick={() => handleStatusChange(note.id, status)}
                                                    disabled={note.status === status}
                                                >
                                                    {status}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={() => handleDeleteRequest(note.id)}
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
            {(!isLoading && filteredDeliveryNotes.length === 0) && (
              <div className="text-center py-10 text-muted-foreground">
                Aucun bon de livraison trouvé.
              </div>
            )}
          </CardContent>
        </Card>
    </>
  );
}
