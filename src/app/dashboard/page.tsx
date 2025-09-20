"use client";
import React from 'react';
import { mockInvoices, mockTransactions, getInvoiceTotal, mockCashRegisters } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, DollarSign, Users, FileText, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { RevenueComparisonChart } from '@/components/dashboard/revenue-comparison-chart';


export default function DashboardPage() {
    const overdueInvoicesCount = mockInvoices.filter(i => i.status === 'Overdue').length;
    const recentInvoices = [...mockInvoices].sort((a,b) => b.issueDate.getTime() - a.issueDate.getTime()).slice(0, 5);
    
    const totalIncome = mockTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = mockTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalRevenue = totalIncome - totalExpenses;
    
    const petiteCaisseId = mockCashRegisters.find(cr => cr.name === 'Petite caisse')?.id;
    const petiteCaisseTotal = mockTransactions
        .filter(t => t.cashRegisterId === petiteCaisseId)
        .reduce((acc, t) => {
            if (t.type === 'income') return acc + t.amount;
            if (t.type === 'expense') return acc - t.amount;
            return acc;
        }, 0);


  return (
    <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card className="transition-transform transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalRevenue.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</div>
                    <p className="text-xs text-muted-foreground">Basé sur toutes les caisses</p>
                </CardContent>
            </Card>
             <Card className="transition-transform transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Solde Petite Caisse</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{petiteCaisseTotal.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</div>
                    <p className="text-xs text-muted-foreground">Solde de la petite caisse uniquement</p>
                </CardContent>
            </Card>
            <Card className="transition-transform transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Proformas en Retard</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{overdueInvoicesCount}</div>
                    <p className="text-xs text-muted-foreground">Total des proformas impayées</p>
                </CardContent>
            </Card>
            <Card className="transition-transform transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nouveaux Clients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+5</div>
                    <p className="text-xs text-muted-foreground">+10% ce mois-ci</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Revenus Mensuels</CardTitle>
                    <CardDescription>Revenus des 6 derniers mois.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <RevenueChart />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Répartition des Dépenses</CardTitle>
                    <CardDescription>Dépenses par catégorie ce mois-ci.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpenseChart />
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Comparaison Revenus vs. Dépenses</CardTitle>
                <CardDescription>Vue d'ensemble de la rentabilité mensuelle.</CardDescription>
            </CardHeader>
            <CardContent>
                <RevenueComparisonChart />
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>Proformas Récentes</CardTitle>
                    <CardDescription>Vos proformas les plus récentes.</CardDescription>
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
  );
}
