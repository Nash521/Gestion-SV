import React from 'react';
import Link from 'next/link';
import { mockInvoices, getInvoiceTotal } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function InvoicesPage() {
  return (
    <Card>
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
          <TableBody>
            {mockInvoices.map((invoice) => (
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
                            <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                            <DropdownMenuItem>Marquer comme payée</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
