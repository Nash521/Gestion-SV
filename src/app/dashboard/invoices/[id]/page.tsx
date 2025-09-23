"use client"
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { notFound, useParams } from 'next/navigation';
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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    const generatePdfContent = (logoImage: HTMLImageElement | null) => {
        // Header
        doc.setFillColor(76, 81, 191);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        // Logo
        if (logoImage) {
            doc.addImage(logoImage, 'JPEG', margin, 5, 50, 30);
        } else {
            // Fallback if logo fails
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text("Logo non chargé", margin + 5, 20);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('PROFORMA', pageWidth - margin, 18, { align: 'right' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`N° ${invoice.id}`, pageWidth - margin, 26, { align: 'right' });
        doc.text(`Date: ${format(invoice.issueDate, 'dd/MM/yyyy', { locale: fr })}`, pageWidth - margin, 32, { align: 'right' });

        // Client Info Section
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(10);
        const clientInfoY = 50;
        
        doc.setFont('helvetica', 'bold');
        doc.text('De :', margin, clientInfoY);
        doc.setFont('helvetica', 'normal');
        doc.text(companyInfo.name, margin, clientInfoY + 5);
        doc.text(companyInfo.address, margin, clientInfoY + 10, { maxWidth: 80 });
        doc.text(`Tél: ${companyInfo.phone}`, margin, clientInfoY + 20);
        doc.text(`Email: ${companyInfo.email}`, margin, clientInfoY + 25);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Facture pour :', pageWidth / 2 + 10, clientInfoY);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.client.name, pageWidth / 2 + 10, clientInfoY + 5);
        doc.text(invoice.client.phone || '', pageWidth / 2 + 10, clientInfoY + 10);
        doc.text(invoice.client.address, pageWidth / 2 + 10, clientInfoY + 15);

        // Table
        const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discount = invoice.discountAmount || 0;
        const total = subtotal - discount;

        const tableData = invoice.lineItems.map((item, index) => ([
            index + 1,
            item.description,
            item.quantity,
            item.price.toLocaleString('de-DE') + ' XOF',
            (item.price * item.quantity).toLocaleString('de-DE') + ' XOF'
        ]));
        
        (doc as any).autoTable({
            startY: clientInfoY + 40,
            head: [['N°', 'DESCRIPTION', 'QTY', 'PRIX UNITAIRE', 'TOTAL']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [76, 81, 191],
                textColor: 255,
                fontSize: 10,
            },
            styles: {
                fontSize: 9,
            },
            columnStyles: {
                0: { cellWidth: 10 },
                2: { halign: 'right', cellWidth: 15 },
                3: { halign: 'right', cellWidth: 30 },
                4: { halign: 'right', cellWidth: 30 },
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY;

        const summaryData = [];
        summaryData.push(['Sous-total', `${subtotal.toLocaleString('de-DE')} XOF`]);
        
        if (discount > 0) {
            summaryData.push(['Réduction', `-${discount.toLocaleString('de-DE')} XOF`]);
        }
        
        summaryData.push(['NET À PAYER', `${total.toLocaleString('de-DE')} XOF`]);

        (doc as any).autoTable({
            startY: finalY + 5,
            body: summaryData,
            theme: 'plain',
            tableWidth: 'wrap',
            margin: { left: pageWidth - margin - 90 },
            styles: {
                fontSize: 10,
                cellPadding: { top: 1, right: 2, bottom: 1, left: 2 },
            },
            columnStyles: {
                0: { halign: 'right', fontStyle: 'bold' },
                1: { halign: 'right', fontStyle: 'bold' },
            },
            didParseCell: function (data: any) {
                if (data.row.section === 'body' && data.row.raw[0] === 'NET À PAYER') {
                    data.cell.styles.fontSize = 11;
                    if (data.column.index === 1) {
                        data.cell.styles.fontSize = 11;
                    }
                }
            }
        });


        // Footer notes
        const notesFinalY = (doc as any).lastAutoTable.finalY || finalY + 30;
        doc.setFillColor(245, 247, 255);
        doc.rect(margin, notesFinalY + 5, pageWidth - (margin * 2), 30, 'F');
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const paymentNotes = `Arrêter la présente facture proforma à la somme de [montant en lettres] XOF
70% à la commande 30% à la livraison
Proforma valable: 07 Jours
Veuillez notifier la commande par un bon numérique ou physique
NB: Veuillez libeller tout paiement par chèque ou virement à l'ordre de ${companyInfo.legalName}`;
        doc.text(paymentNotes, margin + 5, notesFinalY + 10, { maxWidth: pageWidth - (margin * 2) - 10 });
        
        // Legal footer
        const legalFooterY = Math.max(notesFinalY + 45, pageHeight - 20);
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text(companyInfo.legalFooter, margin, legalFooterY, { maxWidth: pageWidth - (margin * 2) });
        
        doc.save(`proforma-${invoice.id}.pdf`);
    };

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = '/logo.jpeg'; 

    img.onload = () => {
        generatePdfContent(img);
    };

    img.onerror = (err) => {
        console.error('Failed to load image', err);
        generatePdfContent(null);
    };
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
                        <Link href="/dashboard/invoices">Retour</Link>
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
