"use client";

import { InvoiceForm } from "@/components/invoices/invoice-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { InvoiceFormValues } from "@/components/invoices/invoice-form";

export default function NewInvoicePage() {
  const { toast } = useToast();
  const router = useRouter();

  function onSubmit(data: InvoiceFormValues) {
    console.log(data);
    toast({
      title: "Proforma créée",
      description: "La nouvelle proforma a été créée avec succès.",
    });
    // Here you would typically send the data to your server
    // For now, let's just redirect to the invoices page
    router.push('/dashboard/invoices');
  }

  return (
    <InvoiceForm 
      formType="create"
      onSubmit={onSubmit}
    />
  );
}
