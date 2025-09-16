"use client"
import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { notFound } from 'next/navigation';
import { mockInvoices, getInvoiceTotal, mockClients } from '@/lib/data';
import type { Invoice } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

// Mock company data (replace with actual data source)
const companyInfo = {
    name: 'Smart Visuel SARL',
    address: 'YAMOUSSOUKRO - Centre commercial mofaitai local n°20',
    phone: '+225 27 30 64 02 78 / +225 07 08 09 09 04',
    email: 'smartvisuel1@gmail.com',
    legalName: 'SMART VISUEL SARL',
    legalFooter: 'N°RCCM: CI-TDI-22-Mo-742 - N°CC2242970-A. Régime d\'imposition: TEE - Direction régionale des impôts de Yamoussoukro\nBP: 1538 Yamoussoukro - Côte d\'Ivoire\nCel: 07 59 72 52 72 - smartvisuel1@gmail.com'
};

const logoBase64 = 'data:image/jpeg;base64,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';

function exportInvoiceToPDF(invoice: Invoice) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Header
    doc.setFillColor(76, 81, 191);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Logo
    doc.addImage(logoBase64, 'JPEG', margin, 5, 50, 30);

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
    const tableData = invoice.lineItems.map((item, index) => ([
        index + 1,
        item.description,
        item.quantity,
        `${item.price.toLocaleString('fr-FR')} XOF`,
        `${(item.price * item.quantity).toLocaleString('fr-FR')} XOF`
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

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || pageHeight - 100;
    const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * (invoice.taxRate / 100);
    const total = subtotal + tax;

    doc.setFontSize(10);
    doc.text('Sous-total :', pageWidth - margin - 50, finalY + 10, { align: 'left' });
    doc.text(`${subtotal.toLocaleString('fr-FR')} XOF`, pageWidth - margin, finalY + 10, { align: 'right' });
    
    doc.text(`Taxe (${invoice.taxRate}%) :`, pageWidth - margin - 50, finalY + 17, { align: 'left' });
    doc.text(`${tax.toLocaleString('fr-FR')} XOF`, pageWidth - margin, finalY + 17, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NET À PAYER :', pageWidth - margin - 50, finalY + 27, { align: 'left' });
    doc.text(`${total.toLocaleString('fr-FR')} XOF`, pageWidth - margin, finalY + 27, { align: 'right' });

    // Footer notes
    const footerY = finalY + 40;
    doc.setFillColor(245, 247, 255);
    doc.rect(margin, footerY, pageWidth - (margin * 2), 30, 'F');
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const paymentNotes = `Arrêter la présente facture proforma à la somme de [montant en lettres] XOF
70% à la commande 30% à la livraison
Proforma valable: 07 Jours
Veuillez notifier la commande par un bon numérique ou physique
NB: Veuillez libeller tout paiement par chèque ou virement à l'ordre de ${companyInfo.legalName}`;
    doc.text(paymentNotes, margin + 5, footerY + 5, { maxWidth: pageWidth - (margin * 2) - 10 });
    
    // Legal footer
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(companyInfo.legalFooter, margin, pageHeight - 20, { maxWidth: pageWidth - (margin * 2) });
    
    doc.save(`proforma-${invoice.id}.pdf`);
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
    const invoice = mockInvoices.find(inv => inv.id === params.id);

    if (!invoice) {
        notFound();
    }
    
    const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const tax = subtotal * (invoice.taxRate / 100);
    const total = subtotal + tax;

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
                            {invoice.lineItems.map((item) => (
                                <TableRow key={item.id}>
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
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxe ({invoice.taxRate}%)</span>
                            <span>{tax.toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}</span>
                        </div>
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
