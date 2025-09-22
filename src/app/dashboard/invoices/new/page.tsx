"use client";

import { InvoiceForm } from "@/components/invoices/invoice-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { InvoiceFormValues } from "@/components/invoices/invoice-form";
import { addInvoice } from "@/lib/firebase/services";

export default function NewInvoicePage() {
  const { toast } = useToast();
  const router = useRouter();

  async function onSubmit(data: InvoiceFormValues) {
    try {
      await addInvoice({ ...data, status: 'Draft' });
      toast({
        title: "Proforma créée",
        description: "La nouvelle proforma a été enregistrée dans la base de données.",
      });
      router.push('/dashboard/invoices');
    } catch (error) {
      console.error("Failed to create invoice:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la proforma.",
      });
    }
  }

  return (
    <InvoiceForm 
      formType="create"
      onSubmit={onSubmit}
    />
  );
}
