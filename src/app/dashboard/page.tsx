"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { getInvoiceTotal } from '@/lib/data';
import type { Invoice, Transaction, CashRegister, Client } from '@/lib/definitions';
import { subscribeToInvoices, subscribeToTransactions, subscribeToCashRegisters, subscribeToClients, onSnapshot, collection } from '@/lib/firebase/services';
import { db } from '@/lib/firebase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, DollarSign, Users, FileText, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { RevenueComparisonChart } from '@/components/dashboard/revenue-comparison-chart';
import { IncomeExpensePieChart } from '@/components/dashboard/income-expense-pie-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { addMonths, format, getMonth, getYear, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type RevenueFilterMode = 'recent' | 'all' | 'custom';

type RevenueMonthPoint = {
    key: string;
    month: string;
    fullMonth: string;
    revenue: number;
    expenses: number;
    sortTime: number;
};

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
    const [revenueFilterMode, setRevenueFilterMode] = useState<RevenueFilterMode>('recent');
    const [selectedRevenueMonthKeys, setSelectedRevenueMonthKeys] = useState<string[]>([]);
    const [comparisonFilterMode, setComparisonFilterMode] = useState<RevenueFilterMode>('recent');
    const [selectedComparisonMonthKeys, setSelectedComparisonMonthKeys] = useState<string[]>([]);

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
    const recentInvoices = [...invoices].sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime()).slice(0, 5);

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
        return 0;
    }, [clients]);

    const { allRevenueChartData, allComparisonChartData, expenseChartData, incomeExpensePieData } = useMemo(() => {
        const now = new Date();

        const allRevenueDataMap: Record<string, RevenueMonthPoint> = {};
        const allComparisonDataMap: Record<string, RevenueMonthPoint> = {};
        const transactionDates = transactions.map(transaction => new Date(transaction.date));

        if (transactionDates.length > 0) {
            const validDates = transactionDates.filter(date => !Number.isNaN(date.getTime()));
            if (validDates.length > 0) {
                const sortedDates = [...validDates].sort((a, b) => a.getTime() - b.getTime());
                const start = new Date(sortedDates[0].getFullYear(), sortedDates[0].getMonth(), 1);
                const end = new Date(sortedDates[sortedDates.length - 1].getFullYear(), sortedDates[sortedDates.length - 1].getMonth(), 1);

                for (let cursor = new Date(start); cursor <= end; cursor = addMonths(cursor, 1)) {
                    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
                    const key = format(monthStart, 'yyyy-MM');
                    const monthPoint = {
                        key,
                        month: format(monthStart, 'MMM yy', { locale: fr }),
                        fullMonth: format(monthStart, 'MMMM yyyy', { locale: fr }),
                        revenue: 0,
                        expenses: 0,
                        sortTime: monthStart.getTime(),
                    };
                    allRevenueDataMap[key] = { ...monthPoint };
                    allComparisonDataMap[key] = { ...monthPoint };
                }
            }
        }

        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            if (Number.isNaN(transactionDate.getTime())) {
                return;
            }

            const monthStart = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1);
            const key = format(monthStart, 'yyyy-MM');

            if (allRevenueDataMap[key]) {
                if (transaction.type === 'income') {
                    allRevenueDataMap[key].revenue += transaction.amount;
                } else {
                    allRevenueDataMap[key].expenses += transaction.amount;
                }
            }

            if (allComparisonDataMap[key]) {
                if (transaction.type === 'income') {
                    allComparisonDataMap[key].revenue += transaction.amount;
                } else {
                    allComparisonDataMap[key].expenses += transaction.amount;
                }
            }
        });

        const finalAllRevenueData = Object.values(allRevenueDataMap).sort((a, b) => a.sortTime - b.sortTime);
        const finalComparisonData = Object.values(allComparisonDataMap).sort((a, b) => a.sortTime - b.sortTime);

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
            .slice(0, 5);

        const finalIncomeExpensePieData = [
            { name: 'Entrees', value: totalIncome, fill: 'hsl(var(--chart-1))' },
            { name: 'Sorties', value: totalExpenses, fill: 'hsl(var(--chart-2))' },
        ];

        return {
            allRevenueChartData: finalAllRevenueData.map(data => ({ key: data.key, month: data.month, fullMonth: data.fullMonth, revenue: data.revenue })),
            allComparisonChartData: finalComparisonData.map(data => ({ key: data.key, month: data.month, fullMonth: data.fullMonth, revenue: data.revenue, expenses: data.expenses })),
            expenseChartData: finalExpenseData,
            incomeExpensePieData: finalIncomeExpensePieData,
        };
    }, [transactions, totalIncome, totalExpenses]);

    useEffect(() => {
        if (allRevenueChartData.length === 0) {
            setSelectedRevenueMonthKeys([]);
            return;
        }

        setSelectedRevenueMonthKeys(previousKeys => {
            const availableKeys = allRevenueChartData.map(item => item.key);
            const filteredKeys = previousKeys.filter(key => availableKeys.includes(key));
            if (filteredKeys.length > 0) {
                return filteredKeys;
            }
            return availableKeys.slice(-6);
        });
    }, [allRevenueChartData]);

    useEffect(() => {
        if (allComparisonChartData.length === 0) {
            setSelectedComparisonMonthKeys([]);
            return;
        }

        setSelectedComparisonMonthKeys(previousKeys => {
            const availableKeys = allComparisonChartData.map(item => item.key);
            const filteredKeys = previousKeys.filter(key => availableKeys.includes(key));
            if (filteredKeys.length > 0) {
                return filteredKeys;
            }
            return availableKeys.slice(-6);
        });
    }, [allComparisonChartData]);

    const displayedRevenueChartData = useMemo(() => {
        if (revenueFilterMode === 'all') {
            return allRevenueChartData;
        }

        if (revenueFilterMode === 'custom') {
            return allRevenueChartData.filter(item => selectedRevenueMonthKeys.includes(item.key));
        }

        return allRevenueChartData.slice(-6);
    }, [allRevenueChartData, revenueFilterMode, selectedRevenueMonthKeys]);

    const displayedComparisonChartData = useMemo(() => {
        if (comparisonFilterMode === 'all') {
            return allComparisonChartData;
        }

        if (comparisonFilterMode === 'custom') {
            return allComparisonChartData.filter(item => selectedComparisonMonthKeys.includes(item.key));
        }

        return allComparisonChartData.slice(-6);
    }, [allComparisonChartData, comparisonFilterMode, selectedComparisonMonthKeys]);

    const revenueChartDescription = useMemo(() => {
        if (revenueFilterMode === 'all') {
            return 'Apercu de tous les mois disponibles.';
        }

        if (revenueFilterMode === 'custom') {
            return selectedRevenueMonthKeys.length > 0
                ? `Apercu de ${selectedRevenueMonthKeys.length} mois selectionne(s).`
                : 'Selectionne un ou plusieurs mois pour afficher le graphique.';
        }

        return 'Apercu des 6 derniers mois.';
    }, [revenueFilterMode, selectedRevenueMonthKeys]);

    const comparisonChartDescription = useMemo(() => {
        if (comparisonFilterMode === 'all') {
            return 'Apercu de tous les mois disponibles.';
        }

        if (comparisonFilterMode === 'custom') {
            return selectedComparisonMonthKeys.length > 0
                ? `Vue sur ${selectedComparisonMonthKeys.length} mois selectionne(s).`
                : 'Selectionne un ou plusieurs mois pour afficher la comparaison.';
        }

        return "Vue d'ensemble des 6 derniers mois.";
    }, [comparisonFilterMode, selectedComparisonMonthKeys]);

    const handleRevenueFilterModeChange = (value: RevenueFilterMode) => {
        setRevenueFilterMode(value);
        if (value === 'custom' && selectedRevenueMonthKeys.length === 0) {
            setSelectedRevenueMonthKeys(allRevenueChartData.map(item => item.key).slice(-6));
        }
    };

    const handleComparisonFilterModeChange = (value: RevenueFilterMode) => {
        setComparisonFilterMode(value);
        if (value === 'custom' && selectedComparisonMonthKeys.length === 0) {
            setSelectedComparisonMonthKeys(allComparisonChartData.map(item => item.key).slice(-6));
        }
    };

    const toggleRevenueMonthSelection = (monthKey: string) => {
        setSelectedRevenueMonthKeys(previousKeys => (
            previousKeys.includes(monthKey)
                ? previousKeys.filter(key => key !== monthKey)
                : [...previousKeys, monthKey]
        ));
    };

    const toggleComparisonMonthSelection = (monthKey: string) => {
        setSelectedComparisonMonthKeys(previousKeys => (
            previousKeys.includes(monthKey)
                ? previousKeys.filter(key => key !== monthKey)
                : [...previousKeys, monthKey]
        ));
    };

    return (
        <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Revenu Total"
                    value={totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                    description="Hors petite caisse"
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                    isLoading={isLoading}
                    className="bg-gradient-to-br from-cyan-50 via-sky-100 to-blue-100 dark:from-cyan-900/50 dark:via-sky-950/50 dark:to-blue-950/50"
                />
                <StatCard
                    title="Solde Petite Caisse"
                    value={petiteCaisseTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                    description="Solde de la petite caisse uniquement"
                    icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                    isLoading={isLoading}
                    className="bg-gradient-to-br from-violet-50 via-purple-100 to-indigo-100 dark:from-violet-900/50 dark:via-purple-950/50 dark:to-indigo-950/50"
                />
                <StatCard
                    title="Proformas en cours"
                    value={String(ongoingInvoicesCount)}
                    description="Total des proformas envoyees"
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
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <CardTitle>Revenus Mensuels</CardTitle>
                            <CardDescription>{revenueChartDescription}</CardDescription>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Select value={revenueFilterMode} onValueChange={(value) => handleRevenueFilterModeChange(value as RevenueFilterMode)}>
                                <SelectTrigger className="w-[200px] bg-background/80">
                                    <SelectValue placeholder="Choisir un affichage" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">6 derniers mois</SelectItem>
                                    <SelectItem value="all">Tous les mois</SelectItem>
                                    <SelectItem value="custom">Certains mois</SelectItem>
                                </SelectContent>
                            </Select>
                            {revenueFilterMode === 'custom' && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="bg-background/80">
                                            {selectedRevenueMonthKeys.length > 0
                                                ? `${selectedRevenueMonthKeys.length} mois selectionne(s)`
                                                : 'Choisir les mois'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        <DropdownMenuItem onSelect={(event) => {
                                            event.preventDefault();
                                            setSelectedRevenueMonthKeys(allRevenueChartData.map(item => item.key));
                                        }}>
                                            Tout selectionner
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={(event) => {
                                            event.preventDefault();
                                            setSelectedRevenueMonthKeys([]);
                                        }}>
                                            Tout effacer
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {allRevenueChartData.map(item => (
                                            <DropdownMenuCheckboxItem
                                                key={item.key}
                                                checked={selectedRevenueMonthKeys.includes(item.key)}
                                                onCheckedChange={() => toggleRevenueMonthSelection(item.key)}
                                                onSelect={(event) => event.preventDefault()}
                                            >
                                                {item.fullMonth}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <RevenueChart data={displayedRevenueChartData} isLoading={isLoading} />
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                    <CardHeader>
                        <CardTitle>Repartition des Depenses</CardTitle>
                        <CardDescription>Depenses par categorie ce mois-ci.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ExpenseChart data={expenseChartData} isLoading={isLoading} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <CardTitle>Comparaison Revenus vs. Depenses</CardTitle>
                            <CardDescription>{comparisonChartDescription}</CardDescription>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Select value={comparisonFilterMode} onValueChange={(value) => handleComparisonFilterModeChange(value as RevenueFilterMode)}>
                                <SelectTrigger className="w-[200px] bg-background/80">
                                    <SelectValue placeholder="Choisir un affichage" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">6 derniers mois</SelectItem>
                                    <SelectItem value="all">Tous les mois</SelectItem>
                                    <SelectItem value="custom">Certains mois</SelectItem>
                                </SelectContent>
                            </Select>
                            {comparisonFilterMode === 'custom' && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="bg-background/80">
                                            {selectedComparisonMonthKeys.length > 0
                                                ? `${selectedComparisonMonthKeys.length} mois selectionne(s)`
                                                : 'Choisir les mois'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        <DropdownMenuItem onSelect={(event) => {
                                            event.preventDefault();
                                            setSelectedComparisonMonthKeys(allComparisonChartData.map(item => item.key));
                                        }}>
                                            Tout selectionner
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={(event) => {
                                            event.preventDefault();
                                            setSelectedComparisonMonthKeys([]);
                                        }}>
                                            Tout effacer
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {allComparisonChartData.map(item => (
                                            <DropdownMenuCheckboxItem
                                                key={item.key}
                                                checked={selectedComparisonMonthKeys.includes(item.key)}
                                                onCheckedChange={() => toggleComparisonMonthSelection(item.key)}
                                                onSelect={(event) => event.preventDefault()}
                                            >
                                                {item.fullMonth}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <RevenueComparisonChart data={displayedComparisonChartData.map(item => ({ month: item.month, revenue: item.revenue, expenses: item.expenses }))} isLoading={isLoading} />
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                    <CardHeader>
                        <CardTitle>Caisse Principale</CardTitle>
                        <CardDescription>Rapport Entrees / Sorties</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <IncomeExpensePieChart data={incomeExpensePieData} total={totalRevenue} isLoading={isLoading} />
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Proformas Recentes</CardTitle>
                        <CardDescription>Vos proformas les plus recentes.</CardDescription>
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
                                            Aucune proforma recente.
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
                                        <TableCell className="text-right">{getInvoiceTotal(invoice).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</TableCell>
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
