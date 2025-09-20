"use client"
import React, { useState } from 'react';
import { mockCollaborators } from '@/lib/data';
import type { Collaborator, CollaboratorRole } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, PlusCircle, ShieldCheck, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AddCollaboratorDialog = ({ isOpen, setIsOpen, onAdd }: { isOpen: boolean, setIsOpen: (open: boolean) => void, onAdd: (collaborator: Omit<Collaborator, 'id'>) => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<CollaboratorRole | ''>('');

    const handleSubmit = () => {
        if (!name || !email || !role) {
            alert('Veuillez remplir tous les champs.');
            return;
        }
        onAdd({ name, email, role: role as CollaboratorRole });
        setIsOpen(false);
        setName('');
        setEmail('');
        setRole('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ajouter un collaborateur</DialogTitle>
                    <DialogDescription>
                        Invitez un nouveau membre dans votre équipe.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nom</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Rôle</Label>
                        <Select onValueChange={(value: CollaboratorRole) => setRole(value)} value={role}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Admin">Administrateur</SelectItem>
                                <SelectItem value="Employee">Employé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button onClick={handleSubmit}>Ajouter</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function CollaboratorsPage() {
    const { toast } = useToast();
    const [collaborators, setCollaborators] = useState<Collaborator[]>(mockCollaborators);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleAddCollaborator = (newCollaborator: Omit<Collaborator, 'id'>) => {
        const collaboratorToAdd: Collaborator = {
            id: `user-${Date.now()}`,
            ...newCollaborator
        };
        setCollaborators(prev => [...prev, collaboratorToAdd]);
        toast({
            title: "Collaborateur ajouté",
            description: `Une invitation a été envoyée à ${collaboratorToAdd.email}.`,
        });
    };
    
    const roleTranslations: Record<CollaboratorRole, string> = {
        'Admin': 'Administrateur',
        'Employee': 'Employé'
    };

    return (
        <>
            <AddCollaboratorDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} onAdd={handleAddCollaborator} />
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Collaborateurs</CardTitle>
                            <CardDescription>Gérez les membres de votre équipe et leurs permissions.</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un collaborateur
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead className="w-[50px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {collaborators.map((collaborator) => (
                                <TableRow key={collaborator.id}>
                                    <TableCell className="font-medium">{collaborator.name}</TableCell>
                                    <TableCell>{collaborator.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={collaborator.role === 'Admin' ? 'default' : 'secondary'}>
                                            {collaborator.role === 'Admin' ? <ShieldCheck className="mr-2 h-4 w-4" /> : <User className="mr-2 h-4 w-4" />}
                                            {roleTranslations[collaborator.role]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={collaborator.role === 'Admin'}>
                                                    <span className="sr-only">Ouvrir le menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Modifier le rôle</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Supprimer</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}