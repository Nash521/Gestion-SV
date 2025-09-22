"use client"

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getInvoiceTotal } from '@/lib/data';
import type { Invoice } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { subscribeToInvoices, updateInvoiceStatus, deleteInvoice } from '@/lib/firebase/services';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const invoiceStatuses: Invoice['status'][] = ['Draft', 'Sent', 'Paid', 'Overdue'];

export default function InvoicesPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceIdToDelete, setInvoiceIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToInvoices((invoicesData) => {
        setInvoices(invoicesData);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (invoiceId: string, newStatus: Invoice['status']) => {
    try {
        await updateInvoiceStatus(invoiceId, newStatus);
        toast({
            title: "Statut mis à jour",
            description: `La proforma ${invoiceId} est maintenant "${newStatus}".`,
        });
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de mettre à jour le statut.",
        });
    }
  };

  const handleDeleteRequest = (invoiceId: string) => {
    setInvoiceIdToDelete(invoiceId);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceIdToDelete) return;
    try {
        await deleteInvoice(invoiceIdToDelete);
        toast({
            variant: "destructive",
            title: "Proforma supprimée",
            description: `La proforma a été supprimée avec succès.`,
        });
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de supprimer la proforma.",
        });
    } finally {
        setInvoiceIdToDelete(null);
    }
  };

  const searchQuery = searchParams.get('q')?.toLowerCase() || '';

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    return invoices.filter(invoice =>
      invoice.id.toLowerCase().includes(searchQuery) ||
      invoice.client.name.toLowerCase().includes(searchQuery)
    );
  }, [invoices, searchQuery]);

  const InvoiceListSkeleton = () => (
    <TableBody>
        {[...Array(5)].map((_, i) => (
             <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
            </TableRow>
        ))}
    </TableBody>
  );

  return (
    <>
        <AlertDialog open={!!invoiceIdToDelete} onOpenChange={(open) => !open && setInvoiceIdToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. La proforma sera définitivement supprimée.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setInvoiceIdToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
        <CardHeader>
            <div className="flex items-center justify-between">
            <div>
                <CardTitle>Proformas</CardTitle>
                <CardDescription>Gérez vos proformas et suivez leur statut.</CardDescription>
            </div>
            <Button asChild size="sm">
                <Link href="/dashboard/invoices/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Créer une proforma
                </Link>
            </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>ID de Proforma</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date d'échéance</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            {isLoading ? <InvoiceListSkeleton /> : (
            <TableBody>
                {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.client.name}</TableCell>
                    <TableCell>
                    <StatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell>{format(invoice.dueDate, 'PPP', { locale: fr })}</TableCell>
                    <TableCell className="text-right">{getInvoiceTotal(invoice).toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</TableCell>
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
                                    <Link href={`/dashboard/invoices/${invoice.id}`}>Voir les détails</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/invoices/${invoice.id}/edit`}>Modifier</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Changer le statut</DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            {invoiceStatuses.map(status => (
                                                <DropdownMenuItem 
                                                    key={status} 
                                                    onClick={() => handleStatusChange(invoice.id, status)}
                                                    disabled={invoice.status === status}
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
                                    onClick={() => handleDeleteRequest(invoice.id)}
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
            {(!isLoading && filteredInvoices.length === 0) && (
            <div className="text-center py-10 text-muted-foreground">
                Aucune proforma trouvée.
            </div>
            )}
        </CardContent>
        </Card>
    </>
  );
}
