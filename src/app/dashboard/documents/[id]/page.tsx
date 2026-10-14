"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { CommercialExportDialog } from '@/components/documents/commercial-export-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CommercialRecord } from '@/lib/definitions';
import { getCommercialRecord } from '@/lib/firebase/services';

const money = (value: number) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' });

export default function CommercialDocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<CommercialRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCommercialRecord(id)
      .then(setDocument)
      .catch(error => {
        console.error('Failed to load commercial document:', error);
        setDocument(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-4xl space-y-6"><Skeleton className="h-9 w-72" /><Skeleton className="h-96 w-full" /></div>;
  }
  if (!document) return notFound();

  const subtotal = document.lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Document commercial {document.id}</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline"><Link href="/dashboard/documents">Retour</Link></Button>
          <CommercialExportDialog source={{ type: 'commercial', value: document }} />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{document.client.name}</CardTitle>
          <CardDescription>Créé le {format(document.createdAt, 'PPP', { locale: fr })}. Choisissez Proforma, Bon de commande ou Bon de livraison lors de l’exportation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div><span className="text-muted-foreground">Date d’émission</span><p>{format(document.issueDate, 'dd/MM/yyyy')}</p></div>
            <div><span className="text-muted-foreground">Échéance proforma</span><p>{format(document.dueDate, 'dd/MM/yyyy')}</p></div>
            <div><span className="text-muted-foreground">Date de livraison</span><p>{format(document.deliveryDate, 'dd/MM/yyyy')}</p></div>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-center">Quantité</TableHead><TableHead className="text-right">Prix unitaire</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>{document.lineItems.map((item, index) => <TableRow key={item.id || index}><TableCell>{item.description}</TableCell><TableCell className="text-center">{item.quantity}</TableCell><TableCell className="text-right">{money(item.price)}</TableCell><TableCell className="text-right">{money(item.quantity * item.price)}</TableCell></TableRow>)}</TableBody>
          </Table>
          <div className="ml-auto max-w-sm space-y-2 text-sm">
            <div className="flex justify-between"><span>Sous-total</span><strong>{money(subtotal)}</strong></div>
            {document.discountAmount > 0 && <div className="flex justify-between"><span>Remise proforma</span><span>{money(document.discountAmount)}</span></div>}
            <div className="flex justify-between border-t pt-2 font-bold"><span>Total proforma</span><span>{money(subtotal - document.discountAmount)}</span></div>
          </div>
          {document.notes && <div className="whitespace-pre-wrap text-sm"><strong>NB :</strong> {document.notes}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
