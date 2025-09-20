"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { mockTransactions, mockCashRegisters } from '@/lib/data';
import type { Transaction, CashRegister } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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

const TransactionTable = ({ transactions, type, onDelete, onEdit, cashRegisters }: { transactions: Transaction[], type: 'income' | 'expense', onDelete: (transactionId: string) => void, onEdit: (transaction: Transaction) => void, cashRegisters: CashRegister[] }) => {
    
    const getCashRegisterName = (id?: string) => {
        if (!id) return 'N/A';
        return cashRegisters.find(c => c.id === id)?.name || 'Inconnue';
    };

    return (
    <>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Caisse</TableHead>
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
                        <TableCell>{getCashRegisterName(transaction.cashRegisterId)}</TableCell>
                        <TableCell>{format(new Date(transaction.date), 'PPP', { locale: fr })}</TableCell>
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
                                    <DropdownMenuItem onClick={() => onEdit(transaction)}>Modifier</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                        onClick={() => onDelete(transaction.id)}
                                    >
                                        Supprimer
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        {transactions.filter(t => t.type === type).length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                Aucune transaction de type "{type === 'income' ? 'entrée' : 'dépense'}" trouvée.
            </div>
        )}
    </>
)};

const ExportDialog = ({ onExport, toast }: { onExport: (startDate?: Date, endDate?: Date) => void; toast: any }) => {
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const handleExportClick = () => {
        onExport(startDate, endDate);
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
};

const AddOrEditTransactionDialog = ({ 
    isOpen, 
    setIsOpen, 
    onAddTransaction, 
    onEditTransaction,
    transactionToEdit,
    cashRegisters
}: { 
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
    onEditTransaction: (transaction: Transaction) => void;
    transactionToEdit?: Transaction | null;
    cashRegisters: CashRegister[];
}) => {
    const [type, setType] = useState<'income' | 'expense' | ''>('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [cashRegisterId, setCashRegisterId] = useState<string | undefined>('');
    
    const isEditMode = !!transactionToEdit;

    useEffect(() => {
        if (isEditMode && transactionToEdit) {
            setType(transactionToEdit.type);
            setDescription(transactionToEdit.description);
            setCategory(transactionToEdit.category);
            setAmount(String(transactionToEdit.amount));
            setCashRegisterId(transactionToEdit.cashRegisterId);
        } else {
            // Reset form for "add" mode
            setType('');
            setDescription('');
            setCategory('');
            setAmount('');
            setCashRegisterId(cashRegisters[0]?.id || '');
        }
    }, [transactionToEdit, isEditMode, isOpen, cashRegisters]);


    const handleSubmit = () => {
        if (!type || !description || !category || !amount || !cashRegisterId) {
            alert('Veuillez remplir tous les champs.');
            return;
        }

        const transactionData = {
            type: type as 'income' | 'expense',
            description: description,
            category: category,
            amount: parseFloat(amount),
            cashRegisterId: cashRegisterId,
        };

        if (isEditMode && transactionToEdit) {
             onEditTransaction({
                ...transactionData,
                id: transactionToEdit.id,
                date: transactionToEdit.date, // Keep original date or allow editing? For now, keep.
            });
        } else {
             const newTransaction: Omit<Transaction, 'id' | 'date'> = transactionData;
             onAddTransaction(newTransaction);
        }
        
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Modifier la transaction' : 'Nouvelle transaction'}</DialogTitle>
                    <DialogDescription>
                       {isEditMode ? 'Mettez à jour les détails de la transaction.' : 'Remplissez les détails de la transaction.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                        <Select onValueChange={(value: 'income' | 'expense') => setType(value)} value={type}>
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
                        <Label htmlFor="cash-register" className="text-right">Caisse</Label>
                        <Select onValueChange={setCashRegisterId} value={cashRegisterId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Sélectionnez une caisse" />
                            </SelectTrigger>
                            <SelectContent>
                                {cashRegisters.map(cr => <SelectItem key={cr.id} value={cr.id}>{cr.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Input id="description" placeholder="Ex: Fournitures de bureau" className="col-span-3" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Catégorie</Label>
                        <Input id="category" placeholder="Ex: Bureau" className="col-span-3" value={category} onChange={(e) => setCategory(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">Montant (XOF)</Label>
                        <Input id="amount" type="number" placeholder="15000" className="col-span-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                         <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit}>Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function AccountingPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
    const [transactionIdToDelete, setTransactionIdToDelete] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [selectedCashRegister, setSelectedCashRegister] = useState<string>('all');
    
    const cashRegisters = mockCashRegisters;

    const handleAddTransaction = (newTransaction: Omit<Transaction, 'id' | 'date'>) => {
        const transactionToAdd: Transaction = {
            id: `TRANS-${Date.now()}`,
            ...newTransaction,
            date: new Date(),
        };

        setTransactions(prevTransactions => [transactionToAdd, ...prevTransactions]);
        
        toast({
            title: "Transaction ajoutée",
            description: `La transaction "${transactionToAdd.description}" a été ajoutée.`,
        });
    };

    const handleEditTransaction = (updatedTransaction: Transaction) => {
        setTransactions(prevTransactions => 
            prevTransactions.map(t => 
                t.id === updatedTransaction.id ? updatedTransaction : t
            )
        );

        toast({
            title: "Transaction modifiée",
            description: `La transaction "${updatedTransaction.description}" a été mise à jour.`,
        });
        setTransactionToEdit(null);
    };

    const handleOpenAddDialog = () => {
        setTransactionToEdit(null);
        setIsDialogOpen(true);
    };

    const handleOpenEditDialog = (transaction: Transaction) => {
        setTransactionToEdit(transaction);
        setIsDialogOpen(true);
    };

    const handleDeleteRequest = (transactionId: string) => {
        setTransactionIdToDelete(transactionId);
    };

    const handleConfirmDelete = () => {
        if (!transactionIdToDelete) return;

        const transactionToDelete = transactions.find(t => t.id === transactionIdToDelete);
        setTransactions(prevTransactions => prevTransactions.filter(t => t.id !== transactionIdToDelete));
        
        toast({
            title: "Transaction supprimée",
            description: `La transaction "${transactionToDelete?.description}" a été supprimée.`,
            variant: "destructive",
        });

        setTransactionIdToDelete(null);
    };


    const handleExport = (startDate?: Date, endDate?: Date) => {
        if (!startDate || !endDate) {
            toast({
                variant: "destructive",
                title: "Dates requises",
                description: "Veuillez sélectionner une date de début et de fin.",
            })
            return;
        }

        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('Bilan Comptable', 14, 22);
        doc.setFontSize(11);
        doc.text(`Période du ${format(startDate, 'PPP', { locale: fr })} au ${format(endDate, 'PPP', { locale: fr })}`, 14, 30);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        const filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= start && transactionDate <= end;
        });

        if (filteredTransactions.length === 0) {
            toast({
                variant: "destructive",
                title: "Aucune donnée à exporter",
                description: "Aucune transaction n'a été trouvée pour la période sélectionnée.",
            })
            return;
        }
        
        let totalIncome = 0;
        let totalExpenses = 0;

        const tableData = filteredTransactions.map(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpenses += t.amount;

            return [
                format(new Date(t.date), 'dd/MM/yyyy', { locale: fr }),
                t.description,
                t.category,
                t.type === 'income' ? t.amount.toString() : '',
                t.type === 'expense' ? t.amount.toString() : ''
            ];
        });

        (doc as any).autoTable({
            startY: 40,
            head: [['Date', 'Description', 'Catégorie', 'Entrée (XOF)', 'Dépense (XOF)']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right' }
            }
        });
        
        const finalY = (doc as any).lastAutoTable.finalY || 40;
        doc.setFontSize(12);
        doc.text('Résumé', 14, finalY + 15);

        const summaryData = [
            ['Total des Entrées:', `${totalIncome.toString()} XOF`],
            ['Total des Dépenses:', `${totalExpenses.toString()} XOF`],
            ['Bénéfice Net:', `${(totalIncome - totalExpenses).toString()} XOF`],
        ];

        (doc as any).autoTable({
             startY: finalY + 20,
             body: summaryData,
             theme: 'plain',
             columnStyles: {
                1: { halign: 'right' },
            }
        });

        doc.save(`bilan-comptable-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}.pdf`);

        toast({
            title: "Exportation réussie",
            description: "Votre bilan PDF a été généré.",
        });
    };
    
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';

    const filteredTransactions = useMemo(() => {
        let items = transactions;

        if (selectedCashRegister !== 'all') {
            items = items.filter(t => t.cashRegisterId === selectedCashRegister);
        }

        if (searchQuery) {
            items = items.filter(t =>
                t.description.toLowerCase().includes(searchQuery) ||
                t.category.toLowerCase().includes(searchQuery)
            );
        }

        return items;
    }, [transactions, selectedCashRegister, searchQuery]);

    return (
        <>
            <AlertDialog open={!!transactionIdToDelete} onOpenChange={(open) => !open && setTransactionIdToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. La transaction sera définitivement supprimée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setTransactionIdToDelete(null)}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>Confirmer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AddOrEditTransactionDialog 
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                onAddTransaction={handleAddTransaction}
                onEditTransaction={handleEditTransaction}
                transactionToEdit={transactionToEdit}
                cashRegisters={cashRegisters}
            />

            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <CardTitle>Comptabilité</CardTitle>
                            <CardDescription>Suivez vos entrées et vos dépenses.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <ExportDialog onExport={handleExport} toast={toast} />
                              <Button size="sm" onClick={handleOpenAddDialog}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une transaction
                            </Button>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Label>Filtrer par caisse</Label>
                        <Select value={selectedCashRegister} onValueChange={setSelectedCashRegister}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Sélectionner une caisse" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les caisses</SelectItem>
                                {cashRegisters.map(cr => (
                                    <SelectItem key={cr.id} value={cr.id}>{cr.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="income">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="income">Entrées</TabsTrigger>
                            <TabsTrigger value="expense">Dépenses</TabsTrigger>
                        </TabsList>
                        <TabsContent value="income">
                           <TransactionTable transactions={filteredTransactions} type="income" onDelete={handleDeleteRequest} onEdit={handleOpenEditDialog} cashRegisters={cashRegisters} />
                        </TabsContent>
                        <TabsContent value="expense">
                           <TransactionTable transactions={filteredTransactions} type="expense" onDelete={handleDeleteRequest} onEdit={handleOpenEditDialog} cashRegisters={cashRegisters} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}
