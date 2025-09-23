"use client";
import { use, Suspense, useEffect, useState } from 'react';
import { notFound, useRouter } from "next/navigation";
import { InvoiceForm, type InvoiceFormValues } from "@/components/invoices/invoice-form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { getInvoice, updateInvoice } from '@/lib/firebase/services';
import type { Invoice } from '@/lib/definitions';


function EditInvoiceForm({ id }: { id: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [initialData, setInitialData] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        getInvoice(id)
            .then(data => {
                if (data) {
                    setInitialData(data);
                } else {
                    notFound();
                }
            })
            .finally(() => setIsLoading(false));
    }, [id]);


    const onSubmit = async (data: InvoiceFormValues) => {
        if (!initialData) return;
        try {
            await updateInvoice(id, { ...data, status: initialData.status });
            toast({
                title: "Proforma modifiée",
                description: `La proforma ${id} a été mise à jour avec succès.`,
            });
            router.push('/dashboard/invoices');
        } catch (error) {
            console.error("Failed to update invoice:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de modifier la proforma.",
            });
        }
    };
    
    if (isLoading) {
        return <EditInvoiceSkeleton />;
    }

    if (!initialData) {
        return notFound();
    }

    return (
        <InvoiceForm
            formType="edit"
            onSubmit={onSubmit}
            initialData={initialData}
        />
    );
}

function EditInvoiceSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
                <div className="flex justify-end">
                     <Skeleton className="h-10 w-48" />
                </div>
            </div>
             <div className="flex justify-end gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    )
}


export default function EditInvoicePage({ params }: { params: { id: string } }) {
    const { id } = params;

    return (
       <Suspense fallback={<EditInvoiceSkeleton/>}>
            <EditInvoiceForm id={id} />
       </Suspense>
    );
}
