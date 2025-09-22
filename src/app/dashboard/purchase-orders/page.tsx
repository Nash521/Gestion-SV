"use client"

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getInvoiceTotal } from '@/lib/data';
import type { PurchaseOrder } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { subscribeToPurchaseOrders, updatePurchaseOrderStatus, deletePurchaseOrder } from '@/lib/firebase/services';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const purchaseOrderStatuses: PurchaseOrder['status'][] = ['Draft', 'Sent', 'Approved', 'Rejected'];

export default function PurchaseOrdersPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderIdToDelete, setOrderIdToDelete] = useState<string | null>(null);


  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToPurchaseOrders((data) => {
        setPurchaseOrders(data);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: PurchaseOrder['status']) => {
    try {
        await updatePurchaseOrderStatus(orderId, newStatus);
        toast({
            title: "Statut mis à jour",
            description: `Le bon de commande ${orderId} est maintenant "${newStatus}".`,
        });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.'})
    }
  };

  const handleDeleteRequest = (orderId: string) => {
    setOrderIdToDelete(orderId);
  };

  const handleConfirmDelete = async () => {
    if (!orderIdToDelete) return;

    try {
        await deletePurchaseOrder(orderIdToDelete);
        toast({
            variant: 'destructive',
            title: 'Bon de commande supprimé',
            description: `Le bon de commande a été supprimé avec succès.`,
        });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer le bon de commande.'})
    } finally {
        setOrderIdToDelete(null);
    }
  };

  const searchQuery = searchParams.get('q')?.toLowerCase() || '';

  const filteredPurchaseOrders = useMemo(() => {
    if (!searchQuery) return purchaseOrders;

    return purchaseOrders.filter(order =>
      order.id.toLowerCase().includes(searchQuery) ||
      order.client.name.toLowerCase().includes(searchQuery)
    );
  }, [purchaseOrders, searchQuery]);
  
  const ListSkeleton = () => (
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
       <AlertDialog open={!!orderIdToDelete} onOpenChange={(open) => !open && setOrderIdToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Le bon de commande sera définitivement supprimé.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setOrderIdToDelete(null)}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bons de commande</CardTitle>
                <CardDescription>Gérez vos bons de commande.</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/dashboard/purchase-orders/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Créer un bon de commande
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
                  <TableHead>Statut</TableHead>
                  <TableHead>Date de livraison</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              {isLoading ? <ListSkeleton /> : (
              <TableBody>
                {filteredPurchaseOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.client.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{format(order.deliveryDate, 'PPP', { locale: fr })}</TableCell>
                    <TableCell className="text-right">{getInvoiceTotal(order).toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</TableCell>
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
                                    <Link href={`/dashboard/purchase-orders/${order.id}`}>Voir les détails</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled>Modifier</DropdownMenuItem>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Changer le statut</DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            {purchaseOrderStatuses.map(status => (
                                                <DropdownMenuItem 
                                                    key={status} 
                                                    onClick={() => handleStatusChange(order.id, status)}
                                                    disabled={order.status === status}
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
                                    onClick={() => handleDeleteRequest(order.id)}
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
             {(!isLoading && filteredPurchaseOrders.length === 0) && (
              <div className="text-center py-10 text-muted-foreground">
                Aucun bon de commande trouvé.
              </div>
            )}
          </CardContent>
        </Card>
    </>
  );
}
