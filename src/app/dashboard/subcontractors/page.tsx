"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { mockSubcontractors } from '@/lib/data';
import type { Subcontractor } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, PlusCircle, Phone, MapPin, Globe } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LocationDialog = ({ subcontractor }: { subcontractor: Subcontractor }) => {
    const mapUrl = `https://picsum.photos/seed/${subcontractor.id}/800/600`;
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <MapPin className="mr-2 h-4 w-4" />
                    Géolocaliser
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[825px]">
                <DialogHeader>
                    <DialogTitle>Localisation de {subcontractor.name}</DialogTitle>
                    <DialogDescription>{subcontractor.address}</DialogDescription>
                </DialogHeader>
                <div className="rounded-lg overflow-hidden border">
                     <Image 
                        src={mapUrl}
                        alt={`Carte de la localisation de ${subcontractor.name}`}
                        width={800}
                        height={600}
                        className="object-cover"
                        data-ai-hint="map location"
                    />
                </div>
                <DialogFooter>
                    <Button asChild variant="secondary">
                        <a href={`https://www.google.com/maps/search/?api=1&query=${subcontractor.location.lat},${subcontractor.location.lng}`} target="_blank" rel="noopener noreferrer">
                            <Globe className="mr-2 h-4 w-4" /> Ouvrir dans Google Maps
                        </a>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function SubcontractorsPage() {
    const { toast } = useToast();
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>(mockSubcontractors);
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Sous-traitants</h1>
                    <p className="text-muted-foreground">Gérez votre réseau de partenaires et sous-traitants.</p>
                </div>
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un sous-traitant
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {subcontractors.map(subcontractor => (
                    <Card key={subcontractor.id} className="flex flex-col">
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
                                        <DropdownMenuItem>Modifier</DropdownMenuItem>
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
                            <LocationDialog subcontractor={subcontractor} />
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
    );
}
