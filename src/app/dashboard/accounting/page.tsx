
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, FileDown, CalendarIcon, Search, Eye, Link as LinkIcon, Hourglass, CheckCircle } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const TransactionTable = ({ 
    transactions, 
    allTransactions,
    type, 
    onDelete, 
    onEdit, 
    onViewDetails,
    cashRegisters,
    isLoading,
}: { 
    transactions: Transaction[],
    allTransactions: Transaction[],
    type: 'income' | 'expense', 
    onDelete: (transactionId: string) => void, 
    onEdit: (transaction: Transaction) => void, 
    onViewDetails: (transaction: Transaction) => void,
    cashRegisters: CashRegister[],
    isLoading: boolean,
}) => {
    
    const getCashRegisterName = (id?: string) => {
        if (!id) return 'N/A';
        return cashRegisters.find(c => c.id === id)?.name || 'Inconnue';
    };

    const isExpenseLinked = (expenseId: string) => {
        return allTransactions.some(t => t.type === 'income' && t.linkedExpenseIds?.includes(expenseId));
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
                        <TableHead>Statut</TableHead>
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
                            <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

    return (
    <TooltipProvider>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Caisse</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.filter(t => t.type === type).map((transaction) => (
                    <TableRow 
                        key={transaction.id}
                        className={cn(
                            transaction.type === 'income' && transaction.remainder && transaction.remainder > 0 ? "bg-red-50 dark:bg-red-950/30" : ""
                        )}
                    >
                        <TableCell className="font-medium">{transaction.description}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{getCashRegisterName(transaction.cashRegisterId)}</TableCell>
                        <TableCell>{format(new Date(transaction.date), 'PPP', { locale: fr })}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {transaction.type === 'income' && transaction.remainder != null && transaction.remainder > 0 && (
                                     <Tooltip>
                                        <TooltipTrigger><Hourglass className="h-4 w-4 text-orange-500" /></TooltipTrigger>
                                        <TooltipContent><p>Reste à percevoir</p></TooltipContent>
                                    </Tooltip>
                                )}
                                {transaction.type === 'income' && transaction.linkedExpenseIds && transaction.linkedExpenseIds.length > 0 && (
                                     <Tooltip>
                                        <TooltipTrigger><LinkIcon className="h-4 w-4 text-blue-500" /></TooltipTrigger>
                                        <TooltipContent><p>Liée à une ou plusieurs dépenses</p></TooltipContent>
                                    </Tooltip>
                                )}
                                 {transaction.type === 'expense' && isExpenseLinked(transaction.id) && (
                                     <Tooltip>
                                        <TooltipTrigger><CheckCircle className="h-4 w-4 text-green-500" /></TooltipTrigger>
                                        <TooltipContent><p>Dépense liée à une entrée</p></TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </TableCell>
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
                                     {transaction.type === 'income' && (
                                        <DropdownMenuItem onClick={() => onViewDetails(transaction)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Voir détails
                                        </DropdownMenuItem>
                                    )}
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
    </TooltipProvider>
)};


const ViewTransactionDetailsDialog = ({ 
    isOpen, 
    setIsOpen, 
    transaction, 
    allTransactions 
} : { 
    isOpen: boolean, 
    setIsOpen: (isOpen: boolean) => void, 
    transaction: Transaction | null,
    allTransactions: Transaction[]
}) => {
    if (!transaction) return null;

    const linkedExpenses = transaction.linkedExpenseIds?.map(id => allTransactions.find(t => t.id === id)).filter(Boolean) as Transaction[];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Détails de l'entrée</DialogTitle>
                    <DialogDescription>
                        Récapitulatif de la transaction "{transaction.description}".
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Montant Total</p>
                            <p className="font-semibold text-lg text-green-600">{transaction.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-semibold">{format(new Date(transaction.date), 'PPP', { locale: fr })}</p>
                        </div>
                         {transaction.advance != null && (
                            <div>
                                <p className="text-muted-foreground">Avance perçue</p>
                                <p className="font-semibold">{transaction.advance.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</p>
                            </div>
                         )}
                         {transaction.remainder != null && (
                            <div>
                                <p className="text-muted-foreground">Reste à percevoir</p>
                                <p className="font-semibold">{transaction.remainder.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</p>
                            </div>
                         )}
                    </div>
                     {linkedExpenses && linkedExpenses.length > 0 && (
                        <div className="space-y-3">
                             <h4 className="font-semibold">Dépenses Liées</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Montant</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {linkedExpenses.map(expense => (
                                        <TableRow key={expense.id}>
                                            <TableCell>{expense.description}</TableCell>
                                            <TableCell className="text-right font-medium text-red-600">
                                                {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                     )}
                     {(!linkedExpenses || linkedExpenses.length === 0) && transaction.advance == null && transaction.remainder == null && (
                        <p className="text-center text-muted-foreground py-4">Aucun détail supplémentaire pour cette transaction.</p>
                     )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                         <Button type="button" variant="outline">Fermer</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


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
    cashRegisters,
    allTransactions,
}: { 
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'> & { date?: Date }) => Promise<void>;
    onEditTransaction: (transaction: Transaction) => Promise<void>;
    transactionToEdit?: Transaction | null;
    cashRegisters: CashRegister[];
    allTransactions: Transaction[];
}) => {
    const { currentUser } = useAuth();
    const [type, setType] = useState<'income' | 'expense' | ''>('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [cashRegisterId, setCashRegisterId] = useState<string | undefined>('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [linkedExpenseIds, setLinkedExpenseIds] = useState<string[]>([]);
    const [advance, setAdvance] = useState<string>('');
    const [remainder, setRemainder] = useState<string>('');
    const [expenseSearch, setExpenseSearch] = useState("");
    
    const isEditMode = !!transactionToEdit;
    
    const expenseTransactions = useMemo(() => {
        return allTransactions
            .filter(t => t.type === 'expense')
            .filter(t => t.description.toLowerCase().includes(expenseSearch.toLowerCase()));
    }, [allTransactions, expenseSearch]);


    useEffect(() => {
        if (isOpen) {
            if (isEditMode && transactionToEdit) {
                setType(transactionToEdit.type);
                setDescription(transactionToEdit.description);
                setCategory(transactionToEdit.category);
                setAmount(String(transactionToEdit.amount));
                setCashRegisterId(transactionToEdit.cashRegisterId);
                setDate(new Date(transactionToEdit.date));
                setLinkedExpenseIds(transactionToEdit.linkedExpenseIds || []);
                setAdvance(transactionToEdit.advance != null ? String(transactionToEdit.advance) : '');
                setRemainder(transactionToEdit.remainder != null ? String(transactionToEdit.remainder) : '');
            } else {
                setType('');
                setDescription('');
                setCategory('');
                setAmount('');
                setCashRegisterId(cashRegisters.length > 0 ? cashRegisters[0].id : '');
                setDate(new Date());
                setLinkedExpenseIds([]);
                setAdvance('');
                setRemainder('');
            }
            setExpenseSearch('');
        }
    }, [isOpen, transactionToEdit, isEditMode, cashRegisters]);


    const handleSubmit = async () => {
        if (!type || !description || !category || !amount || !cashRegisterId) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        const transactionData = {
            type: type as 'income' | 'expense',
            description: description,
            category: category,
            amount: parseFloat(amount),
            cashRegisterId: cashRegisterId,
            date: date,
            linkedExpenseIds: type === 'income' ? linkedExpenseIds : [],
            advance: type === 'income' && advance !== '' ? parseFloat(advance) : undefined,
            remainder: type === 'income' && remainder !== '' ? parseFloat(remainder) : undefined,
        };

        if (isEditMode && transactionToEdit) {
             await onEditTransaction({
                ...transactionToEdit,
                ...transactionData,
                date: date || new Date(transactionToEdit.date),
            });
        } else {
             const newTransaction: Omit<Transaction, 'id' | 'date'> & { date?: Date } = transactionData;
             await onAddTransaction(newTransaction);
        }
        
        setIsOpen(false);
    };

    const handleExpenseSelection = (expenseId: string) => {
        setLinkedExpenseIds(prev => 
            prev.includes(expenseId) 
                ? prev.filter(id => id !== expenseId) 
                : [...prev, expenseId]
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Modifier la transaction' : 'Nouvelle transaction'}</DialogTitle>
                    <DialogDescription>
                       {isEditMode ? 'Mettez à jour les détails de la transaction.' : 'Remplissez les détails de la transaction.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type de transaction</Label>
                                <Select onValueChange={(value: 'income' | 'expense') => setType(value)} value={type}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Sélectionnez un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="income">Entrée</SelectItem>
                                        <SelectItem value="expense">Dépense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" placeholder="Ex: Fournitures de bureau" value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Input id="category" placeholder="Ex: Bureau" value={category} onChange={(e) => setCategory(e.target.value)} />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                             <div className="space-y-2">
                                <Label htmlFor="cash-register">Caisse</Label>
                                <Select onValueChange={setCashRegisterId} value={cashRegisterId}>
                                    <SelectTrigger id="cash-register">
                                        <SelectValue placeholder="Sélectionnez une caisse" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cashRegisters.map(cr => <SelectItem key={cr.id} value={cr.id}>{cr.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Montant (XOF)</Label>
                                <Input id="amount" type="number" placeholder="15000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                            </div>
                            {currentUser?.role === 'Admin' && (
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                     <Popover>
                                        <PopoverTrigger asChild>
                                             <Button
                                                variant={"outline"}
                                                className={cn(
                                                "w-full justify-start text-left font-normal",
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
                        </div>
                    </div>

                    {type === 'income' && (
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-medium mb-4">Détails de l'entrée</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               <div className="space-y-2">
                                    <Label>Dépenses Liées</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start">
                                                {linkedExpenseIds.length === 0 ? "Lier à des dépenses" : `${linkedExpenseIds.length} dépense(s) liée(s)`}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-64" align="start">
                                            <div className="p-2">
                                                <div className="relative">
                                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Rechercher une dépense..."
                                                        value={expenseSearch}
                                                        onChange={(e) => setExpenseSearch(e.target.value)}
                                                        className="pl-8"
                                                    />
                                                </div>
                                            </div>
                                            <DropdownMenuSeparator />
                                            <ScrollArea className="h-[200px]">
                                                {expenseTransactions.map(t => (
                                                    <DropdownMenuCheckboxItem
                                                        key={t.id}
                                                        checked={linkedExpenseIds.includes(t.id)}
                                                        onCheckedChange={() => handleExpenseSelection(t.id)}
                                                        onSelect={(e) => e.preventDefault()}
                                                    >
                                                        {t.description}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </ScrollArea>
                                            {allTransactions.filter(t => t.type === 'expense').length === 0 && <DropdownMenuItem disabled>Aucune dépense disponible</DropdownMenuItem>}
                                            {expenseTransactions.length === 0 && allTransactions.filter(t => t.type === 'expense').length > 0 && <DropdownMenuItem disabled>Aucun résultat</DropdownMenuItem>}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="advance">Avance</Label>
                                    <Input id="advance" type="number" placeholder="Montant de l'avance (optionnel)" value={advance} onChange={(e) => setAdvance(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="remainder">Reste</Label>
                                    <Input id="remainder" type="number" placeholder="Montant restant (optionnel)" value={remainder} onChange={(e) => setRemainder(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}
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
    const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
    const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [transactionToView, setTransactionToView] = useState<Transaction | null>(null);
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
        setIsAddEditDialogOpen(true);
    };

    const handleOpenEditDialog = (transaction: Transaction) => {
        setTransactionToEdit(transaction);
        setIsAddEditDialogOpen(true);
    };

    const handleOpenViewDetailsDialog = (transaction: Transaction) => {
        setTransactionToView(transaction);
        setIsViewDetailsDialogOpen(true);
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
            });
            return;
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const petiteCaisseId = cashRegisters.find(cr => cr.name === 'Petite caisse')?.id;
        const cashRegisterMap = new Map(cashRegisters.map(cr => [cr.id, cr.name]));

        const filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const isPetiteCaisse = t.cashRegisterId === petiteCaisseId;
            return transactionDate >= start && transactionDate <= end && !isPetiteCaisse;
        });

        if (filteredTransactions.length === 0) {
            toast({
                variant: "destructive",
                title: "Aucune donnée à exporter",
                description: "Aucune transaction (hors petite caisse) n'a été trouvée pour la période sélectionnée.",
            });
            return;
        }
        
        const generatePdfContent = (logoImage: HTMLImageElement | null) => {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;

            // Header
            doc.setFillColor(76, 81, 191);
            doc.rect(0, 0, pageWidth, 30, 'F');
            if (logoImage) doc.addImage(logoImage, 'JPEG', margin, 5, 40, 20);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Bilan Comptable', pageWidth - margin, 20, { align: 'right' });
            doc.setTextColor(51, 51, 51);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Période du ${format(startDate, 'PPP', { locale: fr })} au ${format(endDate, 'PPP', { locale: fr })}`, margin, 45);

            let totalIncome = 0;
            let totalExpense = 0;
            let totalProfit = 0;
            
            const linkedExpenseIds = new Set<string>();
            filteredTransactions.forEach(t => {
                if (t.type === 'income' && t.linkedExpenseIds) {
                    t.linkedExpenseIds.forEach(id => linkedExpenseIds.add(id));
                }
            });

            const processedTransactions = filteredTransactions
                .map(t => {
                    if (t.type === 'income') {
                        const linked = t.linkedExpenseIds?.map(id => filteredTransactions.find(exp => exp.id === id)).filter(Boolean) as Transaction[] || [];
                        const linkedExpenseAmount = linked.reduce((sum, exp) => sum + exp.amount, 0);
                        const profit = t.amount - linkedExpenseAmount;
                        
                        const linkedCashRegisters = new Set(linked.map(exp => cashRegisterMap.get(exp.cashRegisterId!)).filter(Boolean));
                        
                        totalIncome += t.amount;
                        totalExpense += linkedExpenseAmount;
                        totalProfit += profit;

                        return {
                            date: format(new Date(t.date), 'dd/MM/yyyy'),
                            description: t.description,
                            category: t.category,
                            income: t.amount,
                            linkedExpense: linkedExpenseAmount,
                            profit: profit,
                            cashRegister: Array.from(linkedCashRegisters).join(', ') || cashRegisterMap.get(t.cashRegisterId!) || 'N/A'
                        };
                    } else if (t.type === 'expense' && !linkedExpenseIds.has(t.id)) {
                        totalExpense += t.amount;
                        totalProfit -= t.amount;
                        return {
                            date: format(new Date(t.date), 'dd/MM/yyyy'),
                            description: t.description,
                            category: t.category,
                            income: 0,
                            linkedExpense: t.amount,
                            profit: -t.amount,
                            cashRegister: cashRegisterMap.get(t.cashRegisterId!) || 'N/A'
                        };
                    }
                    return null;
                })
                .filter(Boolean)
                .sort((a:any, b:any) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());

            const tableData = processedTransactions.map((t: any) => [
                t.date,
                t.description,
                t.category,
                t.income > 0 ? t.income.toLocaleString('de-DE') + ' XOF' : '',
                t.linkedExpense > 0 ? t.linkedExpense.toLocaleString('de-DE') + ' XOF' : '',
                t.profit.toLocaleString('de-DE') + ' XOF',
                t.cashRegister
            ]);

            (doc as any).autoTable({
                startY: 55,
                head: [['Date', 'Description', 'Catégorie', 'Entrée', 'Dépense', 'Profit', 'Caisse']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [76, 81, 191], font: 'helvetica' },
                styles: { font: 'helvetica', fontSize: 9 },
                columnStyles: {
                    3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' },
                }
            });

            const finalY = (doc as any).lastAutoTable.finalY || 40;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Résumé', 14, finalY + 15);

            const summaryData = [
                ['Total des Entrées:', `${totalIncome.toLocaleString('de-DE')} XOF`],
                ['Total des Dépenses:', `${totalExpense.toLocaleString('de-DE')} XOF`],
                ['Bénéfice Net:', `${totalProfit.toLocaleString('de-DE')} XOF`],
            ];

            (doc as any).autoTable({
                startY: finalY + 20,
                body: summaryData,
                theme: 'plain',
                styles: { font: 'helvetica', fontStyle: 'bold' },
                columnStyles: { 1: { halign: 'right' } }
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
                isOpen={isAddEditDialogOpen}
                setIsOpen={setIsAddEditDialogOpen}
                onAddTransaction={handleAddTransaction}
                onEditTransaction={handleEditTransaction}
                transactionToEdit={transactionToEdit}
                cashRegisters={cashRegisters}
                allTransactions={transactions}
            />

            <ViewTransactionDetailsDialog
                isOpen={isViewDetailsDialogOpen}
                setIsOpen={setIsViewDetailsDialogOpen}
                transaction={transactionToView}
                allTransactions={transactions}
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
                           <TransactionTable transactions={filteredTransactions} allTransactions={transactions} type="income" onDelete={handleDeleteRequest} onEdit={handleOpenEditDialog} onViewDetails={handleOpenViewDetailsDialog} cashRegisters={cashRegisters} isLoading={isLoading} />
                        </TabsContent>
                        <TabsContent value="expense">
                           <TransactionTable transactions={filteredTransactions} allTransactions={transactions} type="expense" onDelete={handleDeleteRequest} onEdit={handleOpenEditDialog} onViewDetails={handleOpenViewDetailsDialog} cashRegisters={cashRegisters} isLoading={isLoading} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}

    