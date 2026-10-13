"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, FilePlus2, Loader2, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/hooks/use-toast';
import { getInvoiceTotal } from '@/lib/data';
import type { Client, CommercialRecord, DeliveryNote, Invoice, PurchaseOrder } from '@/lib/definitions';
import {
  addCommercialRecord,
  deleteCommercialRecord,
  deleteDeliveryNote,
  deleteInvoice,
  deletePurchaseOrder,
  getClients,
  subscribeToDeliveryNotes,
  subscribeToCommercialRecords,
  subscribeToInvoices,
  subscribeToPurchaseOrders,
  updateDeliveryNoteStatus,
  updateInvoiceStatus,
  updatePurchaseOrderStatus,
  type CommercialDocumentType,
} from '@/lib/firebase/services';
import { exportCommercialDocumentPDF } from '@/lib/pdf/commercial-document';

type DocumentRow =
  | { type: 'commercial'; document: CommercialRecord }
  | { type: 'invoice'; document: Invoice }
  | { type: 'purchaseOrder'; document: PurchaseOrder }
  | { type: 'deliveryNote'; document: DeliveryNote };

type ListedRow = DocumentRow & { related?: Partial<Record<CommercialDocumentType, DocumentRow>> };

type EditableLine = { key: string; description: string; quantity: number; price: number };

const labels: Record<CommercialDocumentType, string> = {
  invoice: 'Proforma',
  purchaseOrder: 'Bon de commande',
  deliveryNote: 'Bon de livraison',
};

const exportTypes = Object.keys(labels) as CommercialDocumentType[];

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
  const [commercialRecords, setCommercialRecords] = useState<CommercialRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [loaded, setLoaded] = useState({ commercial: false, invoice: false, purchaseOrder: false, deliveryNote: false });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentRow | null>(null);
  const [source, setSource] = useState<DocumentRow | null>(null);
  const [documentToExport, setDocumentToExport] = useState<ListedRow | null>(null);
  const [exportType, setExportType] = useState<CommercialDocumentType>('invoice');
  const [exporting, setExporting] = useState(false);
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
    const unsubscribeCommercial = subscribeToCommercialRecords(data => {
      setCommercialRecords(data);
      setLoaded(state => ({ ...state, commercial: true }));
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
      unsubscribeCommercial();
      unsubscribeInvoices();
      unsubscribeOrders();
      unsubscribeNotes();
    };
  }, [toast]);

  const rows = useMemo<ListedRow[]>(() => {
    const grouped = new Map<string, ListedRow>();
    const legacy: DocumentRow[] = [
      ...invoices.map(document => ({ type: 'invoice' as const, document })),
      ...purchaseOrders.map(document => ({ type: 'purchaseOrder' as const, document })),
      ...deliveryNotes.map(document => ({ type: 'deliveryNote' as const, document })),
    ];
    for (const row of legacy) {
      const match = row.document.id.match(/^[PCL]-SV-(\d{3}-\d{2}-\d{2})$/);
      const items = row.document.lineItems.map(item => `${item.description.trim().toLocaleLowerCase('fr')}:${item.quantity}:${'price' in item ? item.price : 'sans-prix'}`).join('|');
      const key = match ? `${match[1]}:${row.document.clientId}:${items}` : `${row.type}:${row.document.id}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.related = { ...existing.related, [row.type]: row };
      } else {
        grouped.set(key, { ...row, related: { [row.type]: row } });
      }
    }
    return [
      ...commercialRecords.map(document => ({ type: 'commercial' as const, document })),
      ...grouped.values(),
    ].sort((a, b) => {
    const aDate = a.type === 'deliveryNote' ? a.document.deliveryDate : a.type === 'commercial' ? a.document.createdAt : a.document.issueDate;
    const bDate = b.type === 'deliveryNote' ? b.document.deliveryDate : b.type === 'commercial' ? b.document.createdAt : b.document.issueDate;
    return bDate.getTime() - aDate.getTime();
    });
  }, [commercialRecords, invoices, purchaseOrders, deliveryNotes]);

  const visibleRows = rows.filter(row => {
    const term = search.trim().toLocaleLowerCase('fr');
    return !term || row.document.id.toLocaleLowerCase('fr').includes(term) || row.document.client.name.toLocaleLowerCase('fr').includes(term) || Object.values(row.related || {}).some(related => related?.document.id.toLocaleLowerCase('fr').includes(term));
  });

  const subtotal = lines.reduce((total, line) => total + (Number(line.quantity) || 0) * (Number(line.price) || 0), 0);

  const startNew = () => {
    setSource(null);
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
    setClientId(row.document.clientId);
    setIssueDate(row.type === 'deliveryNote' ? today() : format(row.document.issueDate, 'yyyy-MM-dd'));
    setDueDate(row.type === 'invoice' || row.type === 'commercial' ? format(row.document.dueDate, 'yyyy-MM-dd') : addDays(30));
    setDeliveryDate(row.type === 'invoice' ? addDays(14) : format(row.document.deliveryDate, 'yyyy-MM-dd'));
    setDiscountAmount(row.type === 'invoice' || row.type === 'commercial' ? row.document.discountAmount || 0 : 0);
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
    if (!clientId || !lines.length || lines.some(line => !line.description.trim() || line.quantity <= 0 || line.price < 0)) {
      toast({ variant: 'destructive', title: 'Formulaire incomplet', description: 'Choisissez un client et renseignez correctement chaque ligne.' });
      return;
    }
    if (discountAmount > subtotal) {
      toast({ variant: 'destructive', title: 'Remise invalide', description: 'La remise ne peut pas dépasser le sous-total.' });
      return;
    }
    setSaving(true);
    try {
      const id = await addCommercialRecord({
        clientId,
        issueDate: parseDate(issueDate),
        dueDate: parseDate(dueDate),
        deliveryDate: parseDate(deliveryDate),
        discountAmount,
        notes,
        lineItems: lines.map(({ description, quantity, price }) => ({ description: description.trim(), quantity, price })),
      });
      toast({ title: 'Document créé', description: id });
      setShowForm(false);
      setSource(null);
    } catch (error) {
      console.error('Failed to create commercial document:', error);
      toast({ variant: 'destructive', title: 'Création impossible', description: 'Aucun document n’a été enregistré. Réessayez.' });
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (row: DocumentRow, status: string) => {
    try {
      if (row.type === 'invoice') await updateInvoiceStatus(row.document.id, status as Invoice['status']);
      else if (row.type === 'purchaseOrder') await updatePurchaseOrderStatus(row.document.id, status as PurchaseOrder['status']);
      else if (row.type === 'deliveryNote') await updateDeliveryNoteStatus(row.document.id, status as DeliveryNote['status']);
      toast({ title: 'Statut mis à jour', description: row.document.id });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de modifier le statut.' });
    }
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      if (documentToDelete.type === 'commercial') await deleteCommercialRecord(documentToDelete.document.id);
      else if (documentToDelete.type === 'invoice') await deleteInvoice(documentToDelete.document.id);
      else if (documentToDelete.type === 'purchaseOrder') await deletePurchaseOrder(documentToDelete.document.id);
      else await deleteDeliveryNote(documentToDelete.document.id);
      toast({ title: 'Document supprimé', description: documentToDelete.document.id });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer le document.' });
    } finally {
      setDocumentToDelete(null);
    }
  };

  const openExport = (row: ListedRow) => {
    setDocumentToExport(row);
    setExportType(row.type === 'commercial' ? 'invoice' : row.type);
  };

  const exportDocument = async () => {
    if (!documentToExport) return;
    const row = documentToExport.related?.[exportType] || documentToExport;
    const value = row.document;
    const issue = row.type === 'deliveryNote' ? row.document.deliveryDate : row.document.issueDate;
    const delivery = row.type === 'invoice' ? new Date(issue.getTime() + 14 * 86400000) : row.document.deliveryDate;
    const due = row.type === 'invoice' || row.type === 'commercial' ? row.document.dueDate : new Date(issue.getTime() + 30 * 86400000);
    const lineItems = value.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      price: 'price' in item ? item.price : 0,
    }));
    if (exportType !== 'deliveryNote' && row.type === 'deliveryNote') {
      toast({ variant: 'destructive', title: 'Prix manquants', description: 'Réutilisez ce bon de livraison et renseignez les prix avant de l’exporter avec des montants.' });
      return;
    }
    setExporting(true);
    try {
      const prefix = exportType === 'invoice' ? 'P' : exportType === 'purchaseOrder' ? 'C' : 'L';
      const id = row.type === 'commercial' ? value.id.replace(/^DOC-/, `${prefix}-SV-`) : value.id;
      const common = { id, clientId: value.clientId, client: value.client, lineItems, notes: value.notes };
      if (exportType === 'invoice') {
        await exportCommercialDocumentPDF({ type: 'invoice', value: { ...common, status: 'Draft', issueDate: issue, dueDate: due, discountAmount: row.type === 'invoice' || row.type === 'commercial' ? row.document.discountAmount || 0 : 0 } });
      } else if (exportType === 'purchaseOrder') {
        await exportCommercialDocumentPDF({ type: 'purchaseOrder', value: { ...common, status: 'Draft', issueDate: issue, deliveryDate: delivery } });
      } else {
        await exportCommercialDocumentPDF({ type: 'deliveryNote', value: { ...common, status: 'Draft', deliveryDate: delivery } });
      }
      setDocumentToExport(null);
    } catch (error) {
      console.error('Failed to export commercial document:', error);
      toast({ variant: 'destructive', title: 'Export impossible', description: 'Le PDF n’a pas pu être généré.' });
    } finally {
      setExporting(false);
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
      <Dialog open={!!documentToExport} onOpenChange={open => !open && setDocumentToExport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporter le document</DialogTitle>
            <DialogDescription>Choisissez le format PDF pour {documentToExport?.related?.[exportType]?.document.id || documentToExport?.document.id}. Les mêmes informations seront utilisées.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="export-type">Type de document</Label>
            <Select value={exportType} onValueChange={value => setExportType(value as CommercialDocumentType)}>
              <SelectTrigger id="export-type"><SelectValue /></SelectTrigger>
              <SelectContent>{exportTypes.map(type => <SelectItem key={type} value={type}>{labels[type]}</SelectItem>)}</SelectContent>
            </Select>
            {documentToExport?.type === 'deliveryNote' && exportType !== 'deliveryNote' && <p className="text-sm text-muted-foreground">Ce bon de livraison ne contient pas de prix. Réutilisez-le pour renseigner les montants avant cet export.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentToExport(null)}>Annuler</Button>
            <Button onClick={exportDocument} disabled={exporting || (documentToExport?.type === 'deliveryNote' && exportType !== 'deliveryNote')}>{exporting && <Loader2 className="mr-2 size-4 animate-spin" />}Exporter en PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Documents commerciaux</h2>
          <p className="text-sm text-muted-foreground">Créez un document, puis choisissez son format lors de l’exportation.</p>
        </div>
        <Button onClick={showForm ? () => setShowForm(false) : startNew}>
          <FilePlus2 className="mr-2 size-4" />{showForm ? 'Fermer le formulaire' : 'Créer un document'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{source ? `Reprendre ${source.document.id}` : 'Nouveau document'}</CardTitle>
            <CardDescription>Les lignes, les dates et les notes serviront aux trois formats d’exportation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-6">
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
                <p className="text-sm">Sous-total : <strong>{money(subtotal)}</strong> · Total proforma : <strong>{money(subtotal - discountAmount)}</strong></p>
                <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />}Créer le document</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div><CardTitle>Documents ({rows.length})</CardTitle><CardDescription>Une seule liste pour créer, réutiliser et exporter vos documents commerciaux.</CardDescription></div>
          <Input className="md:w-64" type="search" placeholder="Rechercher un ID ou un client" value={search} onChange={event => setSearch(event.target.value)} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Source</TableHead><TableHead>Numéro</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Montant</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {visibleRows.map(row => {
                  const date = row.type === 'deliveryNote' ? row.document.deliveryDate : row.document.issueDate;
                  return (
                    <TableRow key={`${row.type}-${row.document.id}`}>
                      <TableCell>{row.type === 'commercial' || Object.keys(row.related || {}).length > 1 ? 'Document commercial' : labels[row.type]}</TableCell>
                      <TableCell className="font-medium">{row.document.id}{Object.keys(row.related || {}).length > 1 && <span className="block text-xs font-normal text-muted-foreground">{Object.values(row.related || {}).filter(related => related && related.document.id !== row.document.id).map(related => related?.document.id).join(' · ')}</span>}</TableCell>
                      <TableCell>{row.document.client.name}</TableCell>
                      <TableCell>{format(date, 'dd MMM yyyy', { locale: fr })}</TableCell>
                      <TableCell>{row.type === 'commercial' ? 'Prêt à exporter' : <StatusBadge status={row.document.status} />}</TableCell>
                      <TableCell className="text-right">{row.type === 'deliveryNote' ? '—' : row.type === 'commercial' ? money(row.document.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0) - row.document.discountAmount) : money(getInvoiceTotal(row.document))}</TableCell>
                      <TableCell className="space-x-2 text-right whitespace-nowrap">
                        {row.type !== 'commercial' && <Button asChild size="sm" variant="outline"><Link href={`/dashboard/${paths[row.type]}/${row.document.id}`}>Voir</Link></Button>}
                        <Button size="sm" variant="outline" onClick={() => openExport(row)}><Download className="mr-1 size-4" />Exporter</Button>
                        <Button size="sm" variant="secondary" onClick={() => reuseDocument(row)}>Réutiliser</Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Actions pour ${row.document.id}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {Object.values(row.related || {}).filter(Boolean).length > 1 && <DropdownMenuSub>
                              <DropdownMenuSubTrigger>Voir une version</DropdownMenuSubTrigger>
                              <DropdownMenuPortal><DropdownMenuSubContent>
                                {exportTypes.filter(type => row.related?.[type]).map(type => <DropdownMenuItem key={type} asChild><Link href={`/dashboard/${paths[type]}/${row.related?.[type]?.document.id}`}>{labels[type]}</Link></DropdownMenuItem>)}
                              </DropdownMenuSubContent></DropdownMenuPortal>
                            </DropdownMenuSub>}
                            {row.type === 'invoice' && <DropdownMenuItem asChild><Link href={`/dashboard/invoices/${row.document.id}/edit`}>Modifier</Link></DropdownMenuItem>}
                            {row.type !== 'commercial' && <DropdownMenuSub>
                              <DropdownMenuSubTrigger>Changer le statut</DropdownMenuSubTrigger>
                              <DropdownMenuPortal><DropdownMenuSubContent>
                                {statuses[row.type].map(status => <DropdownMenuItem key={status} disabled={row.document.status === status} onClick={() => changeStatus(row, status)}>{status}</DropdownMenuItem>)}
                              </DropdownMenuSubContent></DropdownMenuPortal>
                            </DropdownMenuSub>}
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
          {(!loaded.commercial || !loaded.invoice || !loaded.purchaseOrder || !loaded.deliveryNote) && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Chargement des documents…</div>}
          {loaded.commercial && loaded.invoice && loaded.purchaseOrder && loaded.deliveryNote && visibleRows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucun document trouvé.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
