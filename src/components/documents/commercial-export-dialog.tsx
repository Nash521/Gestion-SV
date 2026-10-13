"use client";

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { CommercialRecord, DeliveryNote, Invoice, PurchaseOrder } from '@/lib/definitions';
import { getDeliveryNote, getInvoice, getPurchaseOrder, type CommercialDocumentType } from '@/lib/firebase/services';
import { exportCommercialDocumentPDF } from '@/lib/pdf/commercial-document';

export type ExportSource =
  | { type: 'commercial'; value: CommercialRecord }
  | { type: 'invoice'; value: Invoice }
  | { type: 'purchaseOrder'; value: PurchaseOrder }
  | { type: 'deliveryNote'; value: DeliveryNote };

const labels: Record<CommercialDocumentType, string> = {
  invoice: 'Proforma',
  purchaseOrder: 'Bon de commande',
  deliveryNote: 'Bon de livraison',
};

async function findExistingVersion(source: ExportSource, type: CommercialDocumentType): Promise<ExportSource | null> {
  if (source.type === 'commercial' || source.type === type) return null;
  const match = source.value.id.match(/^[PCL]-SV-(\d{3}-\d{2}-\d{2})$/);
  if (!match) return null;
  const prefix = type === 'invoice' ? 'P' : type === 'purchaseOrder' ? 'C' : 'L';
  const id = `${prefix}-SV-${match[1]}`;
  const value = type === 'invoice' ? await getInvoice(id) : type === 'purchaseOrder' ? await getPurchaseOrder(id) : await getDeliveryNote(id);
  if (!value || value.clientId !== source.value.clientId) return null;
  const signature = (items: { description: string; quantity: number; price?: number }[], comparePrice: boolean) => items.map(item => `${item.description.trim().toLocaleLowerCase('fr')}:${item.quantity}${comparePrice ? `:${item.price}` : ''}`).sort().join('|');
  const comparePrice = source.type !== 'deliveryNote' && type !== 'deliveryNote';
  if (signature(value.lineItems, comparePrice) !== signature(source.value.lineItems, comparePrice)) return null;
  if (type === 'invoice') return { type, value: value as Invoice };
  if (type === 'purchaseOrder') return { type, value: value as PurchaseOrder };
  return { type, value: value as DeliveryNote };
}

export function CommercialExportDialog({ source }: { source: ExportSource }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CommercialDocumentType>(source.type === 'commercial' ? 'invoice' : source.type);
  const [exporting, setExporting] = useState(false);
  const mayLackPrices = source.type === 'deliveryNote' && type !== 'deliveryNote';

  const exportDocument = async () => {
    setExporting(true);
    try {
      const existing = await findExistingVersion(source, type);
      if (mayLackPrices && !existing) {
        toast({ variant: 'destructive', title: 'Prix manquants', description: 'Aucun document associé avec les prix n’a été trouvé. Réutilisez ce bon de livraison pour renseigner les montants.' });
        return;
      }
      const selected = existing || source;
      const value = selected.value;
      const issueDate = selected.type === 'deliveryNote' ? selected.value.deliveryDate : selected.value.issueDate;
      const deliveryDate = selected.type === 'invoice' ? new Date(issueDate.getTime() + 14 * 86400000) : selected.value.deliveryDate;
      const dueDate = selected.type === 'invoice' || selected.type === 'commercial' ? selected.value.dueDate : new Date(issueDate.getTime() + 30 * 86400000);
      const prefix = type === 'invoice' ? 'P' : type === 'purchaseOrder' ? 'C' : 'L';
      const id = selected.type === 'commercial'
        ? value.id.replace(/^DOC-/, `${prefix}-SV-`)
        : selected.type === type
          ? value.id
          : value.id.replace(/^[PCL](?=-SV-)/, prefix);
      const common = {
        id,
        clientId: value.clientId,
        client: value.client,
        notes: value.notes,
        lineItems: value.lineItems.map(item => ({ description: item.description, quantity: item.quantity, price: 'price' in item ? item.price : 0 })),
      };
      if (type === 'invoice') {
        await exportCommercialDocumentPDF({ type, value: { ...common, status: 'Draft', issueDate, dueDate, discountAmount: selected.type === 'invoice' || selected.type === 'commercial' ? selected.value.discountAmount || 0 : 0 } });
      } else if (type === 'purchaseOrder') {
        await exportCommercialDocumentPDF({ type, value: { ...common, status: 'Draft', issueDate, deliveryDate } });
      } else {
        await exportCommercialDocumentPDF({ type, value: { ...common, status: 'Draft', deliveryDate } });
      }
      setOpen(false);
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({ variant: 'destructive', title: 'Export impossible', description: 'Le PDF n’a pas pu être généré.' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}><FileDown className="mr-2 size-4" />Exporter en PDF</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir le type de document</DialogTitle>
            <DialogDescription>Le PDF sera généré à partir des informations de {source.value.id}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="export-document-type">Type de document</Label>
            <Select value={type} onValueChange={value => setType(value as CommercialDocumentType)}>
              <SelectTrigger id="export-document-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(labels) as CommercialDocumentType[]).map(option => <SelectItem key={option} value={option}>{labels[option]}</SelectItem>)}
              </SelectContent>
            </Select>
            {mayLackPrices && <p className="text-sm text-muted-foreground">Le bon de livraison ne contient pas de prix. Un document associé avec les mêmes articles sera utilisé s’il existe.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={exportDocument} disabled={exporting}>{exporting && <Loader2 className="mr-2 size-4 animate-spin" />}Exporter en PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
