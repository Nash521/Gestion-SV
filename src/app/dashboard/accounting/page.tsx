"use client"
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { mockTransactions } from '@/lib/data';
import type { Transaction } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, PlusCircle, FileDown, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const TransactionTable = ({ transactions, type }: { transactions: any[], type: 'income' | 'expense' }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {transactions.filter(t => t.type === type).map((transaction) => (
                <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{format(transaction.date, 'PPP', { locale: fr })}</TableCell>
                    <TableCell className={`text-right font-semibold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                    </TableCell>
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
                                <DropdownMenuItem>Modifier</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Supprimer</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const ExportDialog = ({ onExport, toast }: { onExport: (startDate?: Date, endDate?: Date) => void; toast: any }) => {
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const handleExportClick = () => {
        onExport(startDate, endDate);
        toast({
            title: "Exportation lancée",
            description: "La génération de votre bilan PDF va commencer."
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileDown className="mr-2 h-4 w-4" /> Exporter le bilan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Exporter le bilan comptable</DialogTitle>
                    <DialogDescription>
                        Sélectionnez la période pour laquelle vous souhaitez exporter le bilan.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                         <Label className="text-right">Du</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                 <Button
                                    variant={"outline"}
                                    className={cn(
                                    "col-span-3 justify-start text-left font-normal",
                                    !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP", {locale: fr}) : <span>Choisir une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                    locale={fr}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label className="text-right">Au</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                 <Button
                                    variant={"outline"}
                                    className={cn(
                                    "col-span-3 justify-start text-left font-normal",
                                    !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP", {locale: fr}) : <span>Choisir une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    initialFocus
                                    locale={fr}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleExportClick} disabled={!startDate || !endDate}>Générer le PDF</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function AccountingPage() {
    const { toast } = useToast();

    const handleExport = (startDate?: Date, endDate?: Date) => {
        if (!startDate || !endDate) return;

        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('Bilan Comptable', 14, 22);
        doc.setFontSize(11);
        doc.text(`Période du ${format(startDate, 'PPP', { locale: fr })} au ${format(endDate, 'PPP', { locale: fr })}`, 14, 30);

        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        const filteredTransactions = mockTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endOfDay;
        });

        let totalIncome = 0;
        let totalExpenses = 0;

        const tableData = filteredTransactions.map(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpenses += t.amount;

            return [
                format(t.date, 'dd/MM/yyyy', { locale: fr }),
                t.description,
                t.category,
                t.type === 'income' ? t.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' }) : '',
                t.type === 'expense' ? t.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' }) : ''
            ];
        });
        
        (doc as any).autoTable({
            startY: 40,
            head: [['Date', 'Description', 'Catégorie', 'Entrée', 'Dépense']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
        });
        
        const finalY = (doc as any).lastAutoTable.finalY || 40;
        doc.setFontSize(12);
        doc.text('Résumé', 14, finalY + 15);

        const summaryData = [
            ['Total des Entrées:', totalIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })],
            ['Total des Dépenses:', totalExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })],
            ['Bénéfice Net:', (totalIncome - totalExpenses).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })],
        ];

        (doc as any).autoTable({
             startY: finalY + 20,
             body: summaryData,
             theme: 'plain'
        });

        doc.save(`bilan-comptable-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}.pdf`);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <CardTitle>Comptabilité</CardTitle>
                        <CardDescription>Suivez vos entrées et vos dépenses.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                         <ExportDialog onExport={handleExport} toast={toast} />
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une transaction
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Nouvelle transaction</DialogTitle>
                                    <DialogDescription>
                                        Remplissez les détails de la transaction.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="type" className="text-right">Type</Label>
                                        <Select>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Sélectionnez un type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="income">Entrée</SelectItem>
                                                <SelectItem value="expense">Dépense</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="description" className="text-right">Description</Label>
                                        <Input id="description" placeholder="Ex: Fournitures de bureau" className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="category" className="text-right">Catégorie</Label>
                                        <Input id="category" placeholder="Ex: Bureau" className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="amount" className="text-right">Montant (XOF)</Label>
                                        <Input id="amount" type="number" placeholder="15000" className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Enregistrer</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="income">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="income">Entrées</TabsTrigger>
                        <TabsTrigger value="expense">Dépenses</Tabs-trigger>
                    </TabsList>
                    <TabsContent value="income">
                       <TransactionTable transactions={mockTransactions} type="income" />
                    </TabsContent>
                    <TabsContent value="expense">
                       <TransactionTable transactions={mockTransactions} type="expense" />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
