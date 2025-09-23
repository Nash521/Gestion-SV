
"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToTransactions, addTransaction, updateTransaction, deleteTransaction, subscribeToCashRegisters } from '@/lib/firebase/services';

const TransactionTable = ({ 
    transactions, 
    type, 
    onDelete, 
    onEdit, 
    cashRegisters,
    isLoading 
}: { 
    transactions: Transaction[], 
    type: 'income' | 'expense', 
    onDelete: (transactionId: string) => void, 
    onEdit: (transaction: Transaction) => void, 
    cashRegisters: CashRegister[],
    isLoading: boolean
}) => {
    
    const getCashRegisterName = (id?: string) => {
        if (!id) return 'N/A';
        return cashRegisters.find(c => c.id === id)?.name || 'Inconnue';
    };

    if (isLoading) {
        return (
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
                    {[...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

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
    onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'> & { date?: Date }) => Promise<void>;
    onEditTransaction: (transaction: Transaction) => Promise<void>;
    transactionToEdit?: Transaction | null;
    cashRegisters: CashRegister[];
}) => {
    const { currentUser } = useAuth();
    const [type, setType] = useState<'income' | 'expense' | ''>('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [cashRegisterId, setCashRegisterId] = useState<string | undefined>('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    
    const isEditMode = !!transactionToEdit;

    useEffect(() => {
        if (!isOpen) return;

        if (isEditMode && transactionToEdit) {
            setType(transactionToEdit.type);
            setDescription(transactionToEdit.description);
            setCategory(transactionToEdit.category);
            setAmount(String(transactionToEdit.amount));
            setCashRegisterId(transactionToEdit.cashRegisterId);
            setDate(new Date(transactionToEdit.date));
        } else {
            // Reset for new transaction
            setType('');
            setDescription('');
            setCategory('');
            setAmount('');
            const defaultCashRegister = cashRegisters.length > 0 ? cashRegisters[0].id : '';
            setCashRegisterId(defaultCashRegister);
            setDate(new Date());
        }
    }, [isOpen, transactionToEdit, isEditMode, cashRegisters]);


    const handleSubmit = async () => {
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
            date: date
        };

        if (isEditMode && transactionToEdit) {
             await onEditTransaction({
                ...transactionData,
                id: transactionToEdit.id,
                date: date || new Date(transactionToEdit.date),
            });
        } else {
             const newTransaction: Omit<Transaction, 'id' | 'date'> & { date?: Date } = transactionData;
             await onAddTransaction(newTransaction);
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
                    {currentUser?.role === 'Admin' && (
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label className="text-right">Date</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                     <Button
                                        variant={"outline"}
                                        className={cn(
                                        "col-span-3 justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP", {locale: fr}) : <span>Choisir une date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        locale={fr}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
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
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [transactionIdToDelete, setTransactionIdToDelete] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [selectedCashRegister, setSelectedCashRegister] = useState<string>('all');
    
    useEffect(() => {
        setIsLoading(true);
        const unsubscribeTransactions = subscribeToTransactions((data) => {
            setTransactions(data);
            setIsLoading(false);
        });
        const unsubscribeCashRegisters = subscribeToCashRegisters((data) => {
            setCashRegisters(data);
        });

        return () => {
            unsubscribeTransactions();
            unsubscribeCashRegisters();
        }
    }, []);

    const handleAddTransaction = async (newTransaction: Omit<Transaction, 'id' | 'date'> & { date?: Date }) => {
        try {
            await addTransaction(newTransaction);
            toast({
                title: "Transaction ajoutée",
                description: `La transaction "${newTransaction.description}" a été ajoutée.`,
            });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'ajouter la transaction." });
        }
    };

    const handleEditTransaction = async (updatedTransaction: Transaction) => {
        try {
            await updateTransaction(updatedTransaction.id, updatedTransaction);
            toast({
                title: "Transaction modifiée",
                description: `La transaction "${updatedTransaction.description}" a été mise à jour.`,
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de modifier la transaction." });
        } finally {
            setTransactionToEdit(null);
        }
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

    const handleConfirmDelete = async () => {
        if (!transactionIdToDelete) return;

        const transactionToDelete = transactions.find(t => t.id === transactionIdToDelete);
        try {
            await deleteTransaction(transactionIdToDelete);
            toast({
                title: "Transaction supprimée",
                description: `La transaction "${transactionToDelete?.description}" a été supprimée.`,
                variant: "destructive",
            });
        } catch(error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de supprimer la transaction." });
        } finally {
            setTransactionIdToDelete(null);
        }
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
        
        const generatePdfContent = (logoImage: HTMLImageElement | null) => {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            
            // Header
            doc.setFillColor(76, 81, 191);
            doc.rect(0, 0, pageWidth, 30, 'F');

            if (logoImage) {
                doc.addImage(logoImage, 'JPEG', margin, 5, 40, 20);
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Bilan Comptable', pageWidth - margin, 20, { align: 'right' });
            
            doc.setTextColor(51, 51, 51);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Période du ${format(startDate, 'PPP', { locale: fr })} au ${format(endDate, 'PPP', { locale: fr })}`, margin, 45);

            let totalIncome = 0;
            let totalExpenses = 0;

            const tableData = filteredTransactions.map(t => {
                if (t.type === 'income') totalIncome += t.amount;
                if (t.type === 'expense') totalExpenses += t.amount;

                return [
                    format(new Date(t.date), 'dd/MM/yyyy', { locale: fr }),
                    t.description,
                    t.category,
                    t.type === 'income' ? t.amount.toLocaleString('fr-FR') + ' XOF' : '',
                    t.type === 'expense' ? t.amount.toLocaleString('fr-FR') + ' XOF' : ''
                ];
            });

            (doc as any).autoTable({
                startY: 55,
                head: [['Date', 'Description', 'Catégorie', 'Entrée', 'Dépense']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [76, 81, 191] },
                columnStyles: {
                    3: { halign: 'right' },
                    4: { halign: 'right' }
                }
            });
            
            const finalY = (doc as any).lastAutoTable.finalY || 40;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Résumé', 14, finalY + 15);

            const summaryData = [
                ['Total des Entrées:', `${totalIncome.toLocaleString('fr-FR')} XOF`],
                ['Total des Dépenses:', `${totalExpenses.toLocaleString('fr-FR')} XOF`],
                ['Bénéfice Net:', `${(totalIncome - totalExpenses).toLocaleString('fr-FR')} XOF`],
            ];

            (doc as any).autoTable({
                startY: finalY + 20,
                body: summaryData,
                theme: 'plain',
                styles: { font: 'helvetica' },
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    1: { halign: 'right' },
                }
            });

            doc.save(`bilan-comptable-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}.pdf`);

            toast({
                title: "Exportation réussie",
                description: "Votre bilan PDF a été généré.",
            });
        };

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = '/logo.jpeg'; 
        img.onload = () => generatePdfContent(img);
        img.onerror = () => generatePdfContent(null);
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
                           <TransactionTable transactions={filteredTransactions} type="income" onDelete={handleDeleteRequest} onEdit={handleOpenEditDialog} cashRegisters={cashRegisters} isLoading={isLoading} />
                        </TabsContent>
                        <TabsContent value="expense">
                           <TransactionTable transactions={filteredTransactions} type="expense" onDelete={handleDeleteRequest} onEdit={handleOpenEditDialog} cashRegisters={cashRegisters} isLoading={isLoading} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}


    


    