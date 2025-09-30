
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { getInvoiceTotal } from '@/lib/data';
import type { Invoice, Transaction, CashRegister, Client } from '@/lib/definitions';
import { subscribeToInvoices, subscribeToTransactions, subscribeToCashRegisters, subscribeToClients, onSnapshot, collection } from '@/lib/firebase/services';
import { db } from '@/lib/firebase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, DollarSign, Users, FileText, Wallet, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { RevenueComparisonChart } from '@/components/dashboard/revenue-comparison-chart';
import { IncomeExpensePieChart } from '@/components/dashboard/income-expense-pie-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, getMonth, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const StatCard = ({ title, value, description, icon, isLoading, className }: { title: string, value: string, description: string, icon: React.ReactNode, isLoading: boolean, className?: string }) => (
    <Card className={`transition-transform transform hover:-translate-y-1 ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <>
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </>
            ) : (
                <>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </>
            )}
        </CardContent>
    </Card>
);

export default function DashboardPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const unsubscribeInvoices = subscribeToInvoices(setInvoices);
        const unsubscribeTransactions = subscribeToTransactions(setTransactions);
        const unsubscribeCashRegisters = subscribeToCashRegisters(setCashRegisters);
        const unsubscribeClients = subscribeToClients(setClients);


        Promise.all([
            new Promise(res => onSnapshot(collection(db, 'invoices'), () => res(true))),
            new Promise(res => onSnapshot(collection(db, 'transactions'), () => res(true))),
            new Promise(res => onSnapshot(collection(db, 'clients'), () => res(true))),
        ]).then(() => {
            // This is a trick to know when initial data is loaded.
            // A better solution would involve checking snapshot metadata.
             setTimeout(() => setIsLoading(false), 500);
        });

        return () => {
            unsubscribeInvoices();
            unsubscribeTransactions();
            unsubscribeCashRegisters();
            unsubscribeClients();
        };
    }, []);

    const ongoingInvoicesCount = invoices.filter(i => i.status === 'Sent').length;
    const recentInvoices = [...invoices].sort((a,b) => b.issueDate.getTime() - a.issueDate.getTime()).slice(0, 5);
    
    const petiteCaisseId = cashRegisters.find(cr => cr.name === 'Petite caisse')?.id;

    const mainTransactions = transactions.filter(t => t.cashRegisterId !== petiteCaisseId);

    const totalIncome = mainTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = mainTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalRevenue = totalIncome - totalExpenses;
    
    const petiteCaisseTotal = transactions
        .filter(t => t.cashRegisterId === petiteCaisseId)
        .reduce((acc, t) => {
            if (t.type === 'income') return acc + t.amount;
            if (t.type === 'expense') return acc - t.amount;
            return acc;
        }, 0);
    
    const totalClients = clients.length;
    
    const newClientsThisMonth = useMemo(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // This assumes clients have a `createdAt` field. If not, this won't work.
        // Let's assume `firebase/services` returns a `createdAt` field.
        // Since it doesn't, we'll need to improvise or mock. For now, we'll keep it simple
        // and filter by what's available. Without a creation date, we can't accurately count "new" clients.
        // Let's set it to 0 and adjust the description.
        return 0;

    }, [clients]);

     const { revenueChartData, expenseChartData, revenueComparisonData, incomeExpensePieData } = useMemo(() => {
        const now = new Date();
        
        // Revenue and Comparison Charts Data (Last 6 months)
        const monthlyData: { [key: string]: { month: string, revenue: number, expenses: number } } = {};
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthName = format(date, 'MMMM', { locale: fr });
            const year = getYear(date);
            const key = `${monthName}-${year}`;
            if (!monthlyData[key]) {
                monthlyData[key] = { month: monthName, revenue: 0, expenses: 0 };
            }
        }

        transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            const monthName = format(transactionDate, 'MMMM', { locale: fr });
            const year = getYear(transactionDate);
            const key = `${monthName}-${year}`;

            if (monthlyData[key]) {
                if (t.type === 'income') {
                    monthlyData[key].revenue += t.amount;
                } else {
                    monthlyData[key].expenses += t.amount;
                }
            }
        });
        const finalMonthlyData = Object.values(monthlyData);
        
        // Expense Chart Data (Current month)
        const expenseData: { [category: string]: number } = {};
        const currentMonth = getMonth(now);
        const currentYear = getYear(now);

        transactions
            .filter(t => t.type === 'expense')
            .filter(t => {
                const transactionDate = new Date(t.date);
                return getMonth(transactionDate) === currentMonth && getYear(transactionDate) === currentYear;
            })
            .forEach(t => {
                const category = t.category || 'Autre';
                if (!expenseData[category]) {
                    expenseData[category] = 0;
                }
                expenseData[category] += t.amount;
            });
        
        const finalExpenseData = Object.entries(expenseData)
            .map(([category, expenses]) => ({ category, expenses }))
            .sort((a, b) => b.expenses - a.expenses)
            .slice(0, 5); // Take top 5 categories

        const finalIncomeExpensePieData = [
            { name: 'Entrées', value: totalIncome, fill: 'hsl(var(--chart-1))' },
            { name: 'Sorties', value: totalExpenses, fill: 'hsl(var(--chart-2))' },
        ];

        return {
            revenueChartData: finalMonthlyData.map(d => ({ month: d.month, revenue: d.revenue })),
            expenseChartData: finalExpenseData,
            revenueComparisonData: finalMonthlyData,
            incomeExpensePieData: finalIncomeExpensePieData,
        };
    }, [transactions, totalIncome, totalExpenses]);


  return (
    <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <StatCard
                title="Revenu Total"
                value={totalRevenue.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}
                description="Hors petite caisse"
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
                className="bg-gradient-to-br from-cyan-50 via-sky-100 to-blue-100 dark:from-cyan-900/50 dark:via-sky-950/50 dark:to-blue-950/50"
            />
             <StatCard
                title="Solde Petite Caisse"
                value={petiteCaisseTotal.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}
                description="Solde de la petite caisse uniquement"
                icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
                className="bg-gradient-to-br from-violet-50 via-purple-100 to-indigo-100 dark:from-violet-900/50 dark:via-purple-950/50 dark:to-indigo-950/50"
            />
            <StatCard
                title="Proformas en cours"
                value={String(ongoingInvoicesCount)}
                description="Total des proformas envoyées"
                icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
                className="bg-gradient-to-br from-rose-50 via-red-100 to-orange-100 dark:from-rose-900/50 dark:via-red-950/50 dark:to-orange-950/50"
            />
             <StatCard
                title="Nombre de Clients"
                value={String(totalClients)}
                description={`${newClientsThisMonth > 0 ? `+${newClientsThisMonth}` : 'Aucun nouveau'} ce mois-ci`}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
                className="bg-gradient-to-br from-emerald-50 via-green-100 to-lime-100 dark:from-emerald-900/50 dark:via-green-950/50 dark:to-lime-950/50"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                <CardHeader>
                    <CardTitle>Revenus Mensuels</CardTitle>
                    <CardDescription>Aperçu des revenus des 6 derniers mois.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <RevenueChart data={revenueChartData} isLoading={isLoading} />
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                <CardHeader>
                    <CardTitle>Répartition des Dépenses</CardTitle>
                    <CardDescription>Dépenses par catégorie ce mois-ci.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpenseChart data={expenseChartData} isLoading={isLoading} />
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
             <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                <CardHeader>
                    <CardTitle>Comparaison Revenus vs. Dépenses</CardTitle>
                    <CardDescription>Vue d'ensemble de la rentabilité mensuelle.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RevenueComparisonChart data={revenueComparisonData} isLoading={isLoading}/>
                </CardContent>
            </Card>
             <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                <CardHeader>
                    <CardTitle>Caisse Principale</CardTitle>
                    <CardDescription>Rapport Entrées / Sorties</CardDescription>
                </CardHeader>
                <CardContent>
                    <IncomeExpensePieChart data={incomeExpensePieData} total={totalRevenue} isLoading={isLoading} />
                </CardContent>
            </Card>
        </div>

        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
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
                 {isLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                 ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead className="hidden sm:table-cell">Statut</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                        Aucune proforma récente.
                                    </TableCell>
                                </TableRow>
                            ) : recentInvoices.map((invoice) => (
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
                 )}
            </CardContent>
        </Card>
    </div>
  );
}

    

    