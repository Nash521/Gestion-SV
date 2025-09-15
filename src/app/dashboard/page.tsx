import React from 'react';
import { mockInvoices, getInvoiceTotal } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, DollarSign, Users, FileText } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { RevenueChart } from '@/components/dashboard/revenue-chart';


export default function DashboardPage() {
    const totalRevenue = mockInvoices.filter(i => i.status === 'Paid').reduce((acc, inv) => acc + getInvoiceTotal(inv), 0);
    const overdueAmount = mockInvoices.filter(i => i.status === 'Overdue').reduce((acc, inv) => acc + getInvoiceTotal(inv), 0);
    const recentInvoices = [...mockInvoices].sort((a,b) => b.issueDate.getTime() - a.issueDate.getTime()).slice(0, 5);

  return (
    <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalRevenue.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</div>
                    <p className="text-xs text-muted-foreground">+20.1% depuis le mois dernier</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Factures en retard</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{overdueAmount.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</div>
                    <p className="text-xs text-muted-foreground">{mockInvoices.filter(i => i.status === 'Overdue').length} factures en retard</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nouveaux Clients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+5</div>
                    <p className="text-xs text-muted-foreground">+10% ce mois-ci</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total des Dépenses</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{Number(4231.89).toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</div>
                    <p className="text-xs text-muted-foreground">+19% depuis le mois dernier</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Aperçu des revenus</CardTitle>
                    <CardDescription>Un résumé de vos revenus sur les 6 derniers mois.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                     <RevenueChart />
                </CardContent>
            </Card>
            <Card className="lg:col-span-3">
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Factures Récentes</CardTitle>
                        <CardDescription>Vos factures les plus récentes.</CardDescription>
                    </div>
                    <Button asChild size="sm" className="ml-auto gap-1">
                        <Link href="/dashboard/invoices">
                            Voir tout
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead className="hidden sm:table-cell">Statut</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentInvoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>
                                        <div className="font-medium">{invoice.client.name}</div>
                                        <div className="hidden text-sm text-muted-foreground md:inline">
                                            {invoice.id}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <StatusBadge status={invoice.status} />
                                    </TableCell>
                                    <TableCell className="text-right">{getInvoiceTotal(invoice).toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
