"use client"

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { mockDeliveryNotes } from '@/lib/data';
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

const deliveryNoteStatuses: DeliveryNote['status'][] = ['Draft', 'Delivered', 'Canceled'];

export default function DeliveryNotesPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>(mockDeliveryNotes);

  const handleStatusChange = (noteId: string, newStatus: DeliveryNote['status']) => {
    setDeliveryNotes(notes => notes.map(note => 
      note.id === noteId ? { ...note, status: newStatus } : note
    ));
    toast({
      title: "Statut mis à jour",
      description: `Le bon de livraison ${noteId} est maintenant "${newStatus}".`,
    });
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


  return (
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
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
         {filteredDeliveryNotes.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            Aucun bon de livraison trouvé.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
