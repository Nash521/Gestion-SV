"use client"
import React, { useState, useEffect } from 'react';
import { mockSubcontractors } from '@/lib/data';
import type { Subcontractor, SubcontractorService } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { MoreHorizontal, PlusCircle, Phone, MapPin, Globe, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';


const serviceSchema = z.object({
  id: z.string().optional(), // Important for editing
  description: z.string().min(1, 'La description est requise.'),
  price: z.coerce.number().min(0, 'Le prix doit être positif.'),
  unit: z.enum(['par heure', 'par jour', 'forfait', 'par m²', 'par unité'], {
    required_error: "L'unité est requise.",
  }),
});

const subcontractorSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.'),
  domain: z.string().min(1, 'Le domaine est requis.'),
  address: z.string().min(1, 'L\'adresse est requise.'),
  phone: z.string().min(1, 'Le téléphone est requis.'),
  services: z.array(serviceSchema).min(1, 'Au moins un service est requis.'),
});

type SubcontractorFormValues = z.infer<typeof subcontractorSchema>;

const SubcontractorFormDialog = ({ 
    mode,
    isOpen,
    setIsOpen,
    onSubmit,
    subcontractor
}: { 
    mode: 'add' | 'edit',
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    onSubmit: (data: SubcontractorFormValues) => void,
    subcontractor?: Subcontractor | null 
}) => {
    
    const form = useForm<SubcontractorFormValues>({
        resolver: zodResolver(subcontractorSchema),
        defaultValues: {
            name: '',
            domain: '',
            address: '',
            phone: '',
            services: [{ description: '', price: 0, unit: 'forfait' }],
        },
    });
    
    useEffect(() => {
        if (mode === 'edit' && subcontractor && isOpen) {
            form.reset({
                name: subcontractor.name,
                domain: subcontractor.domain,
                address: subcontractor.address,
                phone: subcontractor.phone,
                services: subcontractor.services,
            });
        } else if (mode === 'add' && isOpen) {
            form.reset({
                 name: '',
                domain: '',
                address: '',
                phone: '',
                services: [{ description: '', price: 0, unit: 'forfait' }],
            });
        }
    }, [isOpen, mode, subcontractor, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'services',
    });

    const handleFormSubmit = (data: SubcontractorFormValues) => {
        onSubmit(data);
        form.reset();
        setIsOpen(false);
    };
    
    const title = mode === 'add' ? 'Ajouter un nouveau sous-traitant' : `Modifier ${subcontractor?.name}`;
    const description = mode === 'add' ? 'Remplissez les informations et la grille tarifaire du nouveau partenaire.' : 'Mettez à jour les informations du partenaire.';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
             {mode === 'add' && (
                <DialogTrigger asChild>
                    <Button size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un sous-traitant
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[625px]">
                 <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-4">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nom du sous-traitant" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="domain"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Domaine</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Plomberie" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Adresse complète" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Téléphone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+225 XX XX XX XX XX" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-2 pt-4">
                            <h4 className="text-md font-medium">Grille Tarifaire</h4>
                            {fields.map((item, index) => (
                                <div key={item.id} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                                    <div className="grid grid-cols-12 gap-x-3 flex-1">
                                        <FormField
                                            control={form.control}
                                            name={`services.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem className="col-span-5">
                                                    <FormLabel className={cn(index !== 0 && "sr-only")}>Description</FormLabel>
                                                    <FormControl><Input placeholder="Description du service" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`services.${index}.price`}
                                            render={({ field }) => (
                                                <FormItem className="col-span-3">
                                                    <FormLabel className={cn(index !== 0 && "sr-only")}>Prix (XOF)</FormLabel>
                                                    <FormControl><Input type="number" placeholder="15000" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`services.${index}.unit`}
                                            render={({ field }) => (
                                                <FormItem className="col-span-4">
                                                    <FormLabel className={cn(index !== 0 && "sr-only")}>Unité</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Unité" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="forfait">Forfait</SelectItem>
                                                            <SelectItem value="par heure">Par heure</SelectItem>
                                                            <SelectItem value="par jour">Par jour</SelectItem>
                                                            <SelectItem value="par m²">Par m²</SelectItem>
                                                            <SelectItem value="par unité">Par unité</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                     <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        className="mt-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        disabled={fields.length <= 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                             <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ description: '', price: 0, unit: 'forfait' })}
                            >
                                Ajouter un service
                            </Button>
                        </div>
                         <DialogFooter className="pt-4 sticky bottom-0 bg-background py-4 -mx-4 px-6 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                            <Button type="submit">Enregistrer</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

const MapDialog = ({ isOpen, setIsOpen, subcontractor }: { isOpen: boolean, setIsOpen: (open: boolean) => void, subcontractor: Subcontractor | null }) => {
    if (!subcontractor) return null;

    const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(subcontractor.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[725px]">
                <DialogHeader>
                    <DialogTitle>Géolocalisation de {subcontractor.name}</DialogTitle>
                    <DialogDescription>
                        {subcontractor.address}
                    </DialogDescription>
                </DialogHeader>
                <div className="aspect-video w-full rounded-md overflow-hidden border">
                    <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={mapSrc}
                        title={`Carte pour ${subcontractor.name}`}
                    ></iframe>
                </div>
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function SubcontractorsPage() {
    const { toast } = useToast();
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>(mockSubcontractors);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [selectedSubcontractor, setSelectedSubcontractor] = useState<Subcontractor | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [subcontractorToEdit, setSubcontractorToEdit] = useState<Subcontractor | null>(null);

    const handleAddSubcontractor = (data: SubcontractorFormValues) => {
        const newSubcontractor: Subcontractor = {
            id: `sub-${Date.now()}`,
            ...data,
            services: data.services.map((s, i) => ({ ...s, id: `s-${Date.now()}-${i}` }))
        };

        setSubcontractors(prev => [newSubcontractor, ...prev]);

        toast({
            title: "Sous-traitant ajouté",
            description: `${data.name} a été ajouté à votre liste de partenaires.`,
        });
    };
    
    const handleEditSubcontractor = (data: SubcontractorFormValues) => {
        if (!subcontractorToEdit) return;

        const updatedSubcontractor: Subcontractor = {
            ...subcontractorToEdit,
            ...data,
            services: data.services.map((s, i) => ({ 
                ...s, 
                id: s.id || `s-edited-${Date.now()}-${i}` 
            }))
        };
        
        setSubcontractors(prev => prev.map(sub => sub.id === subcontractorToEdit.id ? updatedSubcontractor : sub));

        toast({
            title: "Sous-traitant modifié",
            description: `Les informations de ${data.name} ont été mises à jour.`,
        });
    };
    
    const handleOpenEditDialog = (subcontractor: Subcontractor) => {
        setSubcontractorToEdit(subcontractor);
        setIsEditDialogOpen(true);
    };

    const handleOpenMap = (subcontractor: Subcontractor) => {
        setSelectedSubcontractor(subcontractor);
        setIsMapOpen(true);
    };

    return (
        <>
            <MapDialog
                isOpen={isMapOpen}
                setIsOpen={setIsMapOpen}
                subcontractor={selectedSubcontractor}
            />
            
             <SubcontractorFormDialog 
                mode="add"
                isOpen={isAddDialogOpen}
                setIsOpen={setIsAddDialogOpen}
                onSubmit={handleAddSubcontractor}
            />

            <SubcontractorFormDialog 
                mode="edit"
                isOpen={isEditDialogOpen}
                setIsOpen={setIsEditDialogOpen}
                onSubmit={handleEditSubcontractor}
                subcontractor={subcontractorToEdit}
            />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Sous-traitants</h1>
                        <p className="text-muted-foreground">Gérez votre réseau de partenaires et sous-traitants.</p>
                    </div>
                    <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un sous-traitant
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {subcontractors.map(subcontractor => (
                        <Card key={subcontractor.id} className="flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{subcontractor.name}</CardTitle>
                                        <Badge variant="secondary" className="mt-2">{subcontractor.domain}</Badge>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Ouvrir le menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleOpenEditDialog(subcontractor)}>
                                                Modifier
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Supprimer</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="pt-2">
                                    <a href={`tel:${subcontractor.phone}`} className="text-sm text-muted-foreground flex items-center hover:text-primary transition-colors">
                                        <Phone className="mr-2 h-4 w-4 flex-shrink-0" />
                                        {subcontractor.phone}
                                    </a>
                                    <p className="text-sm text-muted-foreground flex items-center mt-2">
                                        <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                                        {subcontractor.address}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <h4 className="font-semibold mb-2 text-sm">Grille Tarifaire</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Service</TableHead>
                                            <TableHead className="text-right">Prix</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subcontractor.services.map(service => (
                                            <TableRow key={service.id}>
                                                <TableCell className="text-xs">
                                                    {service.description}
                                                    <span className="text-muted-foreground ml-1">({service.unit})</span>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-xs">
                                                    {service.price.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full" onClick={() => handleOpenMap(subcontractor)}>
                                    <Globe className="mr-2 h-4 w-4" /> Géolocaliser
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {subcontractors.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
                        Aucun sous-traitant trouvé.
                    </div>
                )}
            </div>
        </>
    );
}
