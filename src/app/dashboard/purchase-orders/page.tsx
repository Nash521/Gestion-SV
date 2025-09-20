"use client"

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { mockPurchaseOrders, getInvoiceTotal } from '@/lib/data';
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

const purchaseOrderStatuses: PurchaseOrder['status'][] = ['Draft', 'Sent', 'Approved', 'Rejected'];

export default function PurchaseOrdersPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);

  const handleStatusChange = (orderId: string, newStatus: PurchaseOrder['status']) => {
    setPurchaseOrders(orders => orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    toast({
      title: "Statut mis à jour",
      description: `Le bon de commande ${orderId} est maintenant "${newStatus}".`,
    });
  };

  const searchQuery = searchParams.get('q')?.toLowerCase() || '';

  const filteredPurchaseOrders = useMemo(() => {
    if (!searchQuery) return purchaseOrders;

    return purchaseOrders.filter(order =>
      order.id.toLowerCase().includes(searchQuery) ||
      order.client.name.toLowerCase().includes(searchQuery)
    );
  }, [purchaseOrders, searchQuery]);

  return (
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
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
         {filteredPurchaseOrders.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            Aucun bon de commande trouvé.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
