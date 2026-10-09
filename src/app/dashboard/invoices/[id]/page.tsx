"use client"
import React, { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { exportCommercialDocumentPDF } from '@/lib/pdf/commercial-document';
import type { Invoice } from '@/lib/definitions';
import { getInvoice } from '@/lib/firebase/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// Mock company data (replace with actual data source)
const companyInfo = {
    name: 'Smart Visuel SARL',
    address: 'YAMOUSSOUKRO - Centre commercial mofaitai local n°20',
    phone: '+225 27 30 64 02 78 / +225 07 08 09 09 04',
    email: 'smartvisuel1@gmail.com',
    legalName: 'SMART VISUEL SARL',
    legalFooter: 'N°RCCM: CI-TDI-22-Mo-742 - N°CC2242970-A. Régime d\'imposition: TEE - Direction régionale des impôts de Yamoussoukro\nBP: 1538 Yamoussoukro - Côte d\'Ivoire\nCel: 07 59 72 52 72 - smartvisuel1@gmail.com'
};

function exportInvoiceToPDF(invoice: Invoice) {
    void exportCommercialDocumentPDF({ type: 'invoice', value: invoice }).catch(error => {
        console.error('PDF export failed:', error);
        window.alert('Impossible de générer le PDF. Vérifiez les paramètres du document.');
    });
}

const InvoiceDetailSkeleton = () => (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-36" />
            </div>
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-80" />
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <Skeleton className="h-6 w-24 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-6 w-24 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-8 w-full mt-2" />
                </div>
            </CardFooter>
        </Card>
    </div>
);


export default function InvoiceDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        setIsLoading(true);
        getInvoice(id)
            .then(data => {
                if (data) {
                    setInvoice(data);
                } else {
                    notFound();
                }
            })
            .catch(() => notFound())
            .finally(() => setIsLoading(false));
    }, [id]);

    if (isLoading) {
        return <InvoiceDetailSkeleton />;
    }

    if (!invoice) {
        return notFound();
    }
    
    const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const discount = invoice.discountAmount || 0;
    const total = subtotal - discount;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Détails de la Proforma {invoice.id}</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/documents">Retour</Link>
                    </Button>
                    <Button onClick={() => exportInvoiceToPDF(invoice)}>
                        <FileDown className="mr-2 h-4 w-4" /> Exporter en PDF
                    </Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Proforma {invoice.id}</CardTitle>
                    <CardDescription>
                        Émise le {format(invoice.issueDate, 'PPP', { locale: fr })} pour <strong>{invoice.client.name}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="font-semibold mb-2">De :</h3>
                            <p className="text-sm text-muted-foreground">
                                <strong>{companyInfo.name}</strong><br />
                                {companyInfo.address}<br />
                                Tél: {companyInfo.phone}<br />
                                Email: {companyInfo.email}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Pour :</h3>
                            <p className="text-sm text-muted-foreground">
                                <strong>{invoice.client.name}</strong><br />
                                {invoice.client.address}<br />
                                Tél: {invoice.client.phone}<br />
                                Email: {invoice.client.email}
                            </p>
                        </div>
                    </div>
                
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-center">Quantité</TableHead>
                                <TableHead className="text-right">Prix Unitaire</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.lineItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{item.price.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</TableCell>
                                    <TableCell className="text-right">{(item.quantity * item.price).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="flex justify-end">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Sous-total</span>
                            <span>{subtotal.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</span>
                        </div>
                         {discount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Réduction</span>
                                <span className="text-destructive">- {discount.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</span>
                            </div>
                         )}
                         <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                            <span>Total</span>
                            <span>{total.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

    

    
