"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { login, currentUser, loading } = useAuth(); // Get currentUser and loading from auth context
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('test-admin@gestiosv.com');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!loading && currentUser) {
            // If not loading and a user is logged in, redirect to dashboard
            router.push('/dashboard');
        }
    }, [currentUser, loading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await login(email, password);
            toast({
                title: "Connexion réussie",
                description: "Bienvenue sur votre tableau de bord.",
            });
            router.push('/dashboard');
        } catch (err: any) {
             console.error("Login error code:", err.code);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                 setError("L'adresse e-mail ou le mot de passe est incorrect.");
            } else {
                setError("Une erreur inattendue est survenue.");
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading || currentUser) {
        // Display a loader or nothing if still loading or already logged in (will redirect)
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
      }

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
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erreur de connexion</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="user@gestiosv.com" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <div className="relative">
                                <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-4 w-4" aria-hidden="true" />
                                    )}
                                    <span className="sr-only">Toggle password visibility</span>
                                </Button>
                            </div>
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
