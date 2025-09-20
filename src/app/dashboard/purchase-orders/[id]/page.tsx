"use client"
import React, { use } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { notFound } from 'next/navigation';
import { mockPurchaseOrders, mockClients } from '@/lib/data';
import type { PurchaseOrder } from '@/lib/definitions';
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
};

function exportPurchaseOrderToPDF(order: PurchaseOrder) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    const generatePdfContent = (logoImage: HTMLImageElement | null) => {
        // Header
        doc.setFillColor(76, 81, 191);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        if (logoImage) {
            doc.addImage(logoImage, 'JPEG', margin, 5, 50, 30);
        } else {
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text("Logo non chargé", margin + 5, 20);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('BON DE COMMANDE', pageWidth - margin, 18, { align: 'right' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`N° ${order.id}`, pageWidth - margin, 26, { align: 'right' });
        doc.text(`Date: ${format(order.issueDate, 'dd/MM/yyyy', { locale: fr })}`, pageWidth - margin, 32, { align: 'right' });

        // Client Info
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(10);
        const clientInfoY = 50;
        doc.setFont('helvetica', 'bold');
        doc.text('Fournisseur :', margin, clientInfoY);
        doc.setFont('helvetica', 'normal');
        doc.text(companyInfo.name, margin, clientInfoY + 5);
        doc.text(companyInfo.address, margin, clientInfoY + 10, { maxWidth: 80 });
        
        doc.setFont('helvetica', 'bold');
        doc.text('Client :', pageWidth / 2 + 10, clientInfoY);
        doc.setFont('helvetica', 'normal');
        doc.text(order.client.name, pageWidth / 2 + 10, clientInfoY + 5);
        doc.text(order.client.address, pageWidth / 2 + 10, clientInfoY + 10);
        doc.text(order.client.phone || '', pageWidth / 2 + 10, clientInfoY + 15);

        // Table
        const tableData = order.lineItems.map((item, index) => ([
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
            headStyles: { fillColor: [76, 81, 191] },
        });

        // Total
        const finalY = (doc as any).lastAutoTable.finalY || 150;
        const total = order.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL :', pageWidth - margin - 50, finalY + 15, { align: 'left' });
        doc.text(`${total.toLocaleString('fr-FR')} XOF`, pageWidth - margin, finalY + 15, { align: 'right' });

        doc.save(`bon-de-commande-${order.id}.pdf`);
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


export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const order = mockPurchaseOrders.find(o => o.id === id);

    if (!order) {
        notFound();
    }
    
    const total = order.lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Bon de Commande {order.id}</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/purchase-orders">Retour</Link>
                    </Button>
                    <Button onClick={() => exportPurchaseOrderToPDF(order)}>
                        <FileDown className="mr-2 h-4 w-4" /> Exporter en PDF
                    </Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Bon de Commande {order.id}</CardTitle>
                    <CardDescription>
                        Émis le {format(order.issueDate, 'PPP', { locale: fr })} pour <strong>{order.client.name}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="font-semibold mb-2">Fournisseur :</h3>
                            <p className="text-sm text-muted-foreground">
                                <strong>{companyInfo.name}</strong><br />
                                {companyInfo.address}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Client :</h3>
                            <p className="text-sm text-muted-foreground">
                                <strong>{order.client.name}</strong><br />
                                {order.client.address}<br />
                                Tél: {order.client.phone}
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
                            {order.lineItems.map((item) => (
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
