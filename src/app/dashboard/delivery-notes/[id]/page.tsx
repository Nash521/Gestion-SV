"use client"
import React, { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { exportCommercialDocumentPDF } from '@/lib/pdf/commercial-document';
import type { DeliveryNote } from '@/lib/definitions';
import { getDeliveryNote } from '@/lib/firebase/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const companyInfo = {
    name: 'Smart Visuel SARL',
    address: 'YAMOUSSOUKRO - Centre commercial mofaitai local n°20',
};

function exportDeliveryNoteToPDF(note: DeliveryNote) {
    void exportCommercialDocumentPDF({ type: 'deliveryNote', value: note }).catch(error => {
        console.error('PDF export failed:', error);
        window.alert('Impossible de générer le PDF. Vérifiez les paramètres du document.');
    });
}

const DetailPageSkeleton = () => (
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
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-4 w-full" />
            </CardFooter>
        </Card>
    </div>
);


export default function DeliveryNoteDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [note, setNote] = useState<DeliveryNote | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        getDeliveryNote(id)
            .then(data => {
                if (data) {
                    setNote(data);
                } else {
                    notFound();
                }
            })
            .catch(() => notFound())
            .finally(() => setIsLoading(false));
    }, [id]);

    if (isLoading) {
        return <DetailPageSkeleton />;
    }

    if (!note) {
        notFound();
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Bon de Livraison {note.id}</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/documents">Retour</Link>
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
                            {note.lineItems.map((item, index) => (
                                <TableRow key={index}>
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
