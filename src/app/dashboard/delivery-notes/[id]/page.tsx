"use client"
import React, { use } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { notFound } from 'next/navigation';
import { mockDeliveryNotes } from '@/lib/data';
import type { DeliveryNote } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

const companyInfo = {
    name: 'Smart Visuel SARL',
    address: 'YAMOUSSOUKRO - Centre commercial mofaitai local n°20',
};

function exportDeliveryNoteToPDF(note: DeliveryNote) {
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
        doc.text('BON DE LIVRAISON', pageWidth - margin, 18, { align: 'right' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`N° ${note.id}`, pageWidth - margin, 26, { align: 'right' });
        doc.text(`Date: ${format(note.deliveryDate, 'dd/MM/yyyy', { locale: fr })}`, pageWidth - margin, 32, { align: 'right' });

        // Client Info
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(10);
        const clientInfoY = 50;
        doc.setFont('helvetica', 'bold');
        doc.text('De :', margin, clientInfoY);
        doc.setFont('helvetica', 'normal');
        doc.text(companyInfo.name, margin, clientInfoY + 5);
        doc.text(companyInfo.address, margin, clientInfoY + 10, { maxWidth: 80 });
        
        doc.setFont('helvetica', 'bold');
        doc.text('Livré à :', pageWidth / 2 + 10, clientInfoY);
        doc.setFont('helvetica', 'normal');
        doc.text(note.client.name, pageWidth / 2 + 10, clientInfoY + 5);
        doc.text(note.client.address, pageWidth / 2 + 10, clientInfoY + 10);

        // Table
        const tableData = note.lineItems.map((item) => ([
            item.description,
            item.quantity,
        ]));

        (doc as any).autoTable({
            startY: clientInfoY + 40,
            head: [['DESCRIPTION', 'QUANTITÉ']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [76, 81, 191] },
        });

        // Signature section
        const finalY = (doc as any).lastAutoTable.finalY || 150;
        doc.setFontSize(10);
        doc.text('Cachet et signature du client (pour réception) :', margin, finalY + 20);
        doc.rect(margin, finalY + 25, 80, 30); // Signature box for client

        doc.text('Cachet et signature du fournisseur :', pageWidth - margin - 80, finalY + 20);
        doc.rect(pageWidth - margin - 80, finalY + 25, 80, 30); // Signature box for supplier


        doc.save(`bon-de-livraison-${note.id}.pdf`);
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


export default function DeliveryNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const note = mockDeliveryNotes.find(n => n.id === id);

    if (!note) {
        notFound();
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Bon de Livraison {note.id}</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/delivery-notes">Retour</Link>
                    </Button>
                    <Button onClick={() => exportDeliveryNoteToPDF(note)}>
                        <FileDown className="mr-2 h-4 w-4" /> Exporter en PDF
                    </Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Bon de Livraison {note.id}</CardTitle>
                    <CardDescription>
                        Livraison du {format(note.deliveryDate, 'PPP', { locale: fr })} pour <strong>{note.client.name}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="font-semibold mb-2">De :</h3>
                            <p className="text-sm text-muted-foreground">
                                <strong>{companyInfo.name}</strong><br />
                                {companyInfo.address}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Pour :</h3>
                            <p className="text-sm text-muted-foreground">
                                <strong>{note.client.name}</strong><br />
                                {note.client.address}<br />
                            </p>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Quantité</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {note.lineItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">
                        Note: Ce document atteste de la livraison des biens décrits ci-dessus.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
