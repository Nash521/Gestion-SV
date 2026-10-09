"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FilePlus2, Loader2, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/hooks/use-toast';
import { getInvoiceTotal } from '@/lib/data';
import type { Client, DeliveryNote, Invoice, PurchaseOrder } from '@/lib/definitions';
import {
  addCommercialDocuments,
  deleteDeliveryNote,
  deleteInvoice,
  deletePurchaseOrder,
  getClients,
  subscribeToDeliveryNotes,
  subscribeToInvoices,
  subscribeToPurchaseOrders,
  updateDeliveryNoteStatus,
  updateInvoiceStatus,
  updatePurchaseOrderStatus,
  type CommercialDocumentType,
} from '@/lib/firebase/services';

type DocumentRow =
  | { type: 'invoice'; document: Invoice }
  | { type: 'purchaseOrder'; document: PurchaseOrder }
  | { type: 'deliveryNote'; document: DeliveryNote };

type EditableLine = { key: string; description: string; quantity: number; price: number };

const labels: Record<CommercialDocumentType, string> = {
  invoice: 'Proforma',
  purchaseOrder: 'Bon de commande',
  deliveryNote: 'Bon de livraison',
};

const paths: Record<CommercialDocumentType, string> = {
  invoice: 'invoices',
  purchaseOrder: 'purchase-orders',
  deliveryNote: 'delivery-notes',
};

const statuses = {
  invoice: ['Draft', 'Sent', 'Paid', 'Overdue'],
  purchaseOrder: ['Draft', 'Sent', 'Approved', 'Rejected'],
  deliveryNote: ['Draft', 'Delivered', 'Canceled'],
} as const;

const today = () => format(new Date(), 'yyyy-MM-dd');
const addDays = (days: number) => format(new Date(Date.now() + days * 86400000), 'yyyy-MM-dd');
const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const money = (value: number) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' });

export default function CommercialDocumentsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [loaded, setLoaded] = useState({ invoice: false, purchaseOrder: false, deliveryNote: false });
  const [filter, setFilter] = useState<'all' | CommercialDocumentType>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentRow | null>(null);
  const [source, setSource] = useState<DocumentRow | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<CommercialDocumentType[]>(['invoice', 'purchaseOrder', 'deliveryNote']);
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(() => addDays(30));
  const [deliveryDate, setDeliveryDate] = useState(() => addDays(14));
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<EditableLine[]>([{ key: 'first', description: '', quantity: 1, price: 0 }]);

  useEffect(() => {
    getClients().then(setClients).catch(() => {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les clients.' });
    });
    const unsubscribeInvoices = subscribeToInvoices(data => {
      setInvoices(data);
      setLoaded(state => ({ ...state, invoice: true }));
    });
    const unsubscribeOrders = subscribeToPurchaseOrders(data => {
      setPurchaseOrders(data);
      setLoaded(state => ({ ...state, purchaseOrder: true }));
    });
    const unsubscribeNotes = subscribeToDeliveryNotes(data => {
      setDeliveryNotes(data);
      setLoaded(state => ({ ...state, deliveryNote: true }));
    });
    return () => {
      unsubscribeInvoices();
      unsubscribeOrders();
      unsubscribeNotes();
    };
  }, [toast]);

  const rows = useMemo<DocumentRow[]>(() => [
    ...invoices.map(document => ({ type: 'invoice' as const, document })),
    ...purchaseOrders.map(document => ({ type: 'purchaseOrder' as const, document })),
    ...deliveryNotes.map(document => ({ type: 'deliveryNote' as const, document })),
  ].sort((a, b) => {
    const aDate = a.type === 'deliveryNote' ? a.document.deliveryDate : a.document.issueDate;
    const bDate = b.type === 'deliveryNote' ? b.document.deliveryDate : b.document.issueDate;
    return bDate.getTime() - aDate.getTime();
  }), [invoices, purchaseOrders, deliveryNotes]);

  const visibleRows = rows.filter(row => {
    if (filter !== 'all' && row.type !== filter) return false;
    const term = search.trim().toLocaleLowerCase('fr');
    return !term || row.document.id.toLocaleLowerCase('fr').includes(term) || row.document.client.name.toLocaleLowerCase('fr').includes(term);
  });

  const subtotal = lines.reduce((total, line) => total + (Number(line.quantity) || 0) * (Number(line.price) || 0), 0);

  const startNew = () => {
    setSource(null);
    setSelectedTypes(['invoice', 'purchaseOrder', 'deliveryNote']);
    setClientId('');
    setIssueDate(today());
    setDueDate(addDays(30));
    setDeliveryDate(addDays(14));
    setDiscountAmount(0);
    setNotes('');
    setLines([{ key: crypto.randomUUID(), description: '', quantity: 1, price: 0 }]);
    setShowForm(true);
  };

  const reuseDocument = (row: DocumentRow) => {
    setSource(row);
    setSelectedTypes((Object.keys(labels) as CommercialDocumentType[]).filter(type => type !== row.type));
    setClientId(row.document.clientId);
    setIssueDate(row.type === 'deliveryNote' ? today() : format(row.document.issueDate, 'yyyy-MM-dd'));
    setDueDate(row.type === 'invoice' ? format(row.document.dueDate, 'yyyy-MM-dd') : addDays(30));
    setDeliveryDate(row.type === 'invoice' ? addDays(14) : format(row.document.deliveryDate, 'yyyy-MM-dd'));
    setDiscountAmount(row.type === 'invoice' ? row.document.discountAmount || 0 : 0);
    setNotes(row.document.notes || '');
    setLines(row.document.lineItems.map(line => ({
      key: crypto.randomUUID(),
      description: line.description,
      quantity: line.quantity,
      price: 'price' in line ? line.price : 0,
    })));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateLine = (key: string, patch: Partial<EditableLine>) => {
    setLines(current => current.map(line => line.key === key ? { ...line, ...patch } : line));
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTypes.length || !clientId || !lines.length || lines.some(line => !line.description.trim() || line.quantity <= 0 || line.price < 0)) {
      toast({ variant: 'destructive', title: 'Formulaire incomplet', description: 'Choisissez un client, un document et renseignez correctement chaque ligne.' });
      return;
    }
    if (selectedTypes.some(type => type !== 'deliveryNote') && discountAmount > subtotal) {
      toast({ variant: 'destructive', title: 'Remise invalide', description: 'La remise ne peut pas dépasser le sous-total.' });
      return;
    }
    setSaving(true);
    try {
      const ids = await addCommercialDocuments({
        clientId,
        issueDate: parseDate(issueDate),
        dueDate: parseDate(dueDate),
        deliveryDate: parseDate(deliveryDate),
        discountAmount,
        notes,
        lineItems: lines.map(({ description, quantity, price }) => ({ description: description.trim(), quantity, price })),
        types: selectedTypes,
        ...(source ? { sourceDocument: { type: source.type, id: source.document.id } } : {}),
      });
      toast({ title: 'Documents créés', description: Object.values(ids).join(' · ') });
      setShowForm(false);
      setSource(null);
    } catch (error) {
      console.error('Failed to create commercial documents:', error);
      toast({ variant: 'destructive', title: 'Création impossible', description: 'Aucun document n’a été enregistré. Réessayez.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleType = (type: CommercialDocumentType, checked: boolean) => {
    setSelectedTypes(current => checked ? [...current, type] : current.filter(value => value !== type));
  };

  const changeStatus = async (row: DocumentRow, status: string) => {
    try {
      if (row.type === 'invoice') await updateInvoiceStatus(row.document.id, status as Invoice['status']);
      else if (row.type === 'purchaseOrder') await updatePurchaseOrderStatus(row.document.id, status as PurchaseOrder['status']);
      else await updateDeliveryNoteStatus(row.document.id, status as DeliveryNote['status']);
      toast({ title: 'Statut mis à jour', description: row.document.id });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de modifier le statut.' });
    }
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      if (documentToDelete.type === 'invoice') await deleteInvoice(documentToDelete.document.id);
      else if (documentToDelete.type === 'purchaseOrder') await deletePurchaseOrder(documentToDelete.document.id);
      else await deleteDeliveryNote(documentToDelete.document.id);
      toast({ title: 'Document supprimé', description: documentToDelete.document.id });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer le document.' });
    } finally {
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={!!documentToDelete} onOpenChange={open => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>Le document {documentToDelete?.document.id} sera supprimé définitivement.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Documents commerciaux</h2>
          <p className="text-sm text-muted-foreground">Proformas, bons de commande et bons de livraison réunis au même endroit.</p>
        </div>
        <Button onClick={showForm ? () => setShowForm(false) : startNew}>
          <FilePlus2 className="mr-2 size-4" />{showForm ? 'Fermer le formulaire' : 'Créer des documents'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{source ? `Reprendre ${source.document.id}` : 'Nouveaux documents'}</CardTitle>
            <CardDescription>Les mêmes informations seront utilisées pour tous les types sélectionnés. Vous pouvez les ajuster avant de créer les documents.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(labels) as CommercialDocumentType[]).map(type => (
                  <label key={type} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium">
                    <Checkbox checked={selectedTypes.includes(type)} onCheckedChange={checked => toggleType(type, checked === true)} />
                    {labels[type]}
                  </label>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                    <SelectContent>{clients.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="issue-date">Date d’émission</Label><Input id="issue-date" type="date" value={issueDate} onChange={event => setIssueDate(event.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="due-date">Échéance proforma</Label><Input id="due-date" type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="delivery-date">Date de livraison</Label><Input id="delivery-date" type="date" value={deliveryDate} onChange={event => setDeliveryDate(event.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="discount">Remise proforma (FCFA)</Label><Input id="discount" type="number" min="0" value={discountAmount} onChange={event => setDiscountAmount(Number(event.target.value))} /></div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between"><h3 className="font-medium">Articles et prestations</h3><Button type="button" variant="outline" size="sm" onClick={() => setLines(current => [...current, { key: crypto.randomUUID(), description: '', quantity: 1, price: 0 }])}><Plus className="mr-1 size-4" />Ajouter une ligne</Button></div>
                {lines.map(line => (
                  <div key={line.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_110px_130px_40px]">
                    <Input aria-label="Description" placeholder="Description" value={line.description} onChange={event => updateLine(line.key, { description: event.target.value })} required />
                    <Input aria-label="Quantité" type="number" min="1" value={line.quantity} onChange={event => updateLine(line.key, { quantity: Number(event.target.value) })} required />
                    <Input aria-label="Prix unitaire" type="number" min="0" value={line.price} onChange={event => updateLine(line.key, { price: Number(event.target.value) })} required />
                    <Button type="button" size="icon" variant="ghost" aria-label="Supprimer la ligne" disabled={lines.length === 1} onClick={() => setLines(current => current.filter(item => item.key !== line.key))}><Trash2 className="size-4" /></Button>
                  </div>
                ))}
                {source?.type === 'deliveryNote' && <p className="text-sm text-muted-foreground">Le bon de livraison ne contient pas de prix : renseignez-les avant de créer une proforma ou un bon de commande.</p>}
              </div>

              <div className="space-y-2"><Label htmlFor="document-notes">NB / notes du document</Label><Textarea id="document-notes" placeholder="Ce texte apparaîtra sous le tableau, précédé de NB :" value={notes} onChange={event => setNotes(event.target.value)} /></div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                <p className="text-sm">Sous-total : <strong>{money(subtotal)}</strong>{selectedTypes.includes('invoice') && <> · Total proforma : <strong>{money(subtotal - discountAmount)}</strong></>}</p>
                <Button type="submit" disabled={saving || !selectedTypes.length}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />}Créer {selectedTypes.length} document{selectedTypes.length > 1 ? 's' : ''}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div><CardTitle>Tous les documents</CardTitle><CardDescription>Ouvrez un document ou réutilisez ses lignes pour en créer un autre.</CardDescription></div>
          <Input className="md:w-64" type="search" placeholder="Rechercher un ID ou un client" value={search} onChange={event => setSearch(event.target.value)} />
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={filter} onValueChange={value => setFilter(value as typeof filter)}>
            <TabsList className="h-auto flex-wrap justify-start">
              <TabsTrigger value="all">Tous ({rows.length})</TabsTrigger>
              <TabsTrigger value="invoice">Proformas ({invoices.length})</TabsTrigger>
              <TabsTrigger value="purchaseOrder">Bons de commande ({purchaseOrders.length})</TabsTrigger>
              <TabsTrigger value="deliveryNote">Bons de livraison ({deliveryNotes.length})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Numéro</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Montant</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {visibleRows.map(row => {
                  const date = row.type === 'deliveryNote' ? row.document.deliveryDate : row.document.issueDate;
                  return (
                    <TableRow key={`${row.type}-${row.document.id}`}>
                      <TableCell>{labels[row.type]}</TableCell>
                      <TableCell className="font-medium">{row.document.id}</TableCell>
                      <TableCell>{row.document.client.name}</TableCell>
                      <TableCell>{format(date, 'dd MMM yyyy', { locale: fr })}</TableCell>
                      <TableCell><StatusBadge status={row.document.status} /></TableCell>
                      <TableCell className="text-right">{row.type === 'deliveryNote' ? '—' : money(getInvoiceTotal(row.document))}</TableCell>
                      <TableCell className="space-x-2 text-right whitespace-nowrap">
                        <Button asChild size="sm" variant="outline"><Link href={`/dashboard/${paths[row.type]}/${row.document.id}`}>Voir</Link></Button>
                        <Button size="sm" variant="secondary" onClick={() => reuseDocument(row)}>Réutiliser</Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Actions pour ${row.document.id}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {row.type === 'invoice' && <DropdownMenuItem asChild><Link href={`/dashboard/invoices/${row.document.id}/edit`}>Modifier</Link></DropdownMenuItem>}
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>Changer le statut</DropdownMenuSubTrigger>
                              <DropdownMenuPortal><DropdownMenuSubContent>
                                {statuses[row.type].map(status => <DropdownMenuItem key={status} disabled={row.document.status === status} onClick={() => changeStatus(row, status)}>{status}</DropdownMenuItem>)}
                              </DropdownMenuSubContent></DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDocumentToDelete(row)}>Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {(!loaded.invoice || !loaded.purchaseOrder || !loaded.deliveryNote) && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Chargement des documents…</div>}
          {loaded.invoice && loaded.purchaseOrder && loaded.deliveryNote && visibleRows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucun document trouvé.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
