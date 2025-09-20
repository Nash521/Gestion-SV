"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            // In a real app, you'd handle success/error from your auth API
            toast({
                title: "Connexion réussie",
                description: "Bienvenue sur votre tableau de bord.",
            });
            router.push('/dashboard');
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="flex items-center gap-2 p-2 justify-center mb-4">
                        <Briefcase className="size-8 text-primary" />
                        <span className="text-2xl font-semibold font-headline">
                        <span>Gestio</span>
                        <span className="font-android-assassins text-primary">SV</span>
                        </span>
                    </div>
                    <CardTitle className="text-2xl">Connexion</CardTitle>
                    <CardDescription>Entrez vos identifiants pour accéder à votre espace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="user@gestiosv.com" required defaultValue="user@gestiosv.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input id="password" type="password" required defaultValue="password" />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Se connecter
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
