"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from "next/navigation";
import type { DeliveryNote, Client } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { getClients, addDeliveryNote } from '@/lib/firebase/services';
import { useToast } from "@/hooks/use-toast";


const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'La description est requise.'),
  quantity: z.coerce.number().min(1, 'La quantité doit être au moins de 1.'),
});

const dnSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis.'),
  invoiceId: z.string().optional(),
  deliveryDate: z.date({ required_error: 'La date de livraison est requise.' }),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'Au moins un article est requis.'),
});

type DNFormValues = z.infer<typeof dnSchema>;

function DeliveryNoteForm({
    formType,
    onSubmit,
    initialData
}: {
    formType: 'create' | 'edit';
    onSubmit: (data: DNFormValues) => void;
    initialData?: DeliveryNote;
}) {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    getClients().then(setClients);
  }, []);

  const form = useForm<DNFormValues>({
    resolver: zodResolver(dnSchema),
    defaultValues: formType === 'edit' && initialData ? {
        ...initialData,
        deliveryDate: new Date(initialData.deliveryDate),
    } : {
      clientId: '',
      invoiceId: '',
      deliveryDate: new Date(),
      lineItems: [{ description: '', quantity: 1 }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });
  
  const isSubmitting = form.formState.isSubmitting;
  const title = formType === 'create' ? 'Nouveau Bon de Livraison' : `Modifier le Bon de Livraison ${initialData?.id}`;
  const description = formType === 'create' ? 'Remplissez le formulaire pour créer un nouveau bon de livraison.' : 'Mettez à jour les détails du bon de livraison.';
  const submitButtonText = formType === 'create' ? 'Créer le bon de livraison' : 'Enregistrer';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <FormField control={form.control} name="clientId" render={({ field }) => ( 
                <FormItem> 
                  <FormLabel>Client</FormLabel> 
                  <Select onValueChange={field.onChange} value={field.value}> 
                    <FormControl> 
                      <SelectTrigger> 
                        <SelectValue placeholder="Sélectionnez un client" /> 
                      </SelectTrigger> 
                    </FormControl> 
                    <SelectContent> 
                      {clients.map(client => ( 
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem> 
                      ))} 
                    </SelectContent> 
                  </Select> 
                  <FormMessage /> 
                </FormItem>
              )} />
              <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                <FormItem className="flex flex-col"> 
                  <FormLabel>Date de livraison</FormLabel> 
                  <Popover> 
                    <PopoverTrigger asChild> 
                      <FormControl> 
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}> 
                          {field.value ? format(field.value, "PPP", { locale: fr }) : <span>Choisir une date</span>} 
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /> 
                        </Button> 
                      </FormControl> 
                    </PopoverTrigger> 
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={fr} />
                    </PopoverContent> 
                  </Popover> 
                  <FormMessage /> 
                </FormItem> 
              )} />
              <FormField control={form.control} name="invoiceId" render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Proforma (Optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="INV-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Lignes du bon de livraison</h3>
                {fields.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg bg-muted/20">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
                            <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => (
                              <FormItem className="md:col-span-8">
                                <FormLabel className={cn(index !== 0 && "sr-only")}>Description</FormLabel>
                                <FormControl>
                                  <Input placeholder="Description..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => (
                              <FormItem className="md:col-span-4">
                                <FormLabel className={cn(index !== 0 && "sr-only")}>Quantité</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                        </div>
                         <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10" disabled={fields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1 })} disabled={isSubmitting}>Ajouter une ligne</Button>
            </div>

             <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Notes optionnelles..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild><Link href="/dashboard/delivery-notes">Annuler</Link></Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{submitButtonText}</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}


export default function NewDeliveryNotePage() {
  const { toast } = useToast();
  const router = useRouter();

  async function onSubmit(data: DNFormValues) {
    try {
      await addDeliveryNote({ ...data, status: 'Draft' });
      toast({
        title: "Bon de livraison créé",
        description: "Le nouveau bon de livraison a été enregistré.",
      });
      router.push('/dashboard/delivery-notes');
    } catch (error) {
      console.error("Failed to create delivery note:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le bon de livraison.",
      });
    }
  }

  return (
    <DeliveryNoteForm
      formType="create"
      onSubmit={onSubmit}
    />
  );
}
