"use client";
import { use, Suspense } from 'react';
import { notFound, useRouter } from "next/navigation";
import { mockInvoices } from "@/lib/data";
import { InvoiceForm, type InvoiceFormValues } from "@/components/invoices/invoice-form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

function EditInvoiceForm({ id }: { id: string }) {
    const router = useRouter();
    const { toast } = useToast();

    // In a real app, you'd fetch this data from your API
    const invoice = mockInvoices.find(inv => inv.id === id);

    if (!invoice) {
        notFound();
    }

    const onSubmit = (data: InvoiceFormValues) => {
        console.log("Updated data:", data);
        toast({
            title: "Proforma modifiée",
            description: `La proforma ${invoice.id} a été mise à jour avec succès.`,
        });
        router.push('/dashboard/invoices');
    };

    return (
        <InvoiceForm
            formType="edit"
            onSubmit={onSubmit}
            initialData={invoice}
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


export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
       <Suspense fallback={<EditInvoiceSkeleton/>}>
            <EditInvoiceForm id={id} />
       </Suspense>
    );
}
