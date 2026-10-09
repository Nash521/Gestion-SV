"use client"

import { useEffect, useState } from 'react'
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Sun, Moon, Laptop, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { saveProfilePhoto } from '@/lib/firebase/profile'
import { useToast } from '@/hooks/use-toast'
import { defaultDocumentFooter, getDocumentFooter, saveDocumentFooter } from '@/lib/firebase/document-settings'

export function SettingsSheet() {
  const { setTheme } = useTheme()
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [footerText, setFooterText] = useState(defaultDocumentFooter);
  const [savingFooter, setSavingFooter] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== 'Admin') return;
    getDocumentFooter().then(setFooterText).catch(error => {
      console.error('Failed to load document footer:', error);
    });
  }, [currentUser?.role]);

  const handleSaveFooter = async () => {
    if (footerText.length > 350 || footerText.split(/\r?\n/).length > 6) {
      toast({ variant: 'destructive', title: 'Pied de page trop long', description: 'Utilisez au maximum 350 caractères et 6 lignes.' });
      return;
    }
    setSavingFooter(true);
    try {
      await saveDocumentFooter(footerText.trim());
      toast({ title: 'Pied de page enregistré', description: 'Les prochains PDF utiliseront ce texte.' });
    } catch (error) {
      console.error('Failed to save document footer:', error);
      toast({ variant: 'destructive', title: 'Enregistrement impossible', description: 'Vérifiez les autorisations Firestore pour les paramètres de l’application.' });
    } finally {
      setSavingFooter(false);
    }
  };

  useEffect(() => {
    if (!selectedPhoto) {
      setPreviewURL(null);
      return;
    }
    const url = URL.createObjectURL(selectedPhoto);
    setPreviewURL(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedPhoto]);

  const handleSavePhoto = async () => {
    if (!selectedPhoto) return;
    setSavingPhoto(true);
    try {
      await saveProfilePhoto(selectedPhoto);
      setSelectedPhoto(null);
      toast({ title: 'Photo de profil enregistrée' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Impossible d’enregistrer la photo',
        description: error instanceof Error ? error.message : 'Vérifiez les autorisations de Firebase Storage.',
      });
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
            <Settings className="h-5 w-5"/>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 overflow-y-auto">
        <SheetHeader className="p-6">
          <SheetTitle>Paramètres</SheetTitle>
          <SheetDescription>
            Gérez les paramètres de votre compte et de votre espace de travail.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="p-6 space-y-8">
            {/* Theme Settings */}
            <div className="space-y-4">
                <h3 className="font-medium text-lg">Thème</h3>
                <div className="grid grid-cols-3 gap-4">
                    <Button variant="outline" onClick={() => setTheme("light")}>
                        <Sun className="mr-2 h-4 w-4" />
                        Clair
                    </Button>
                    <Button variant="outline" onClick={() => setTheme("dark")}>
                        <Moon className="mr-2 h-4 w-4" />
                        Sombre
                    </Button>
                    <Button variant="outline" onClick={() => setTheme("system")}>
                        <Laptop className="mr-2 h-4 w-4" />
                        Système
                    </Button>
                </div>
            </div>

            <Separator />
            
            {/* User Profile */}
           {currentUser && (
             <div className="space-y-4">
                <h3 className="font-medium text-lg">Profil Utilisateur</h3>
                <div className="flex items-center space-x-4">
                     <Avatar className="h-16 w-16">
                        {(previewURL || currentUser.photoURL) && <AvatarImage src={previewURL || currentUser.photoURL} alt={currentUser.name} />}
                        <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <p className="font-semibold">{currentUser.name}</p>
                        <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                         <Button variant="ghost" size="sm" className="h-auto p-0 text-destructive hover:text-destructive" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Déconnexion
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-photo">Photo de profil</Label>
                  <Input
                    id="profile-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={event => setSelectedPhoto(event.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">JPG, PNG ou WebP, 2 Mo maximum. Sans photo, vos initiales s’affichent.</p>
                  <Button type="button" size="sm" onClick={handleSavePhoto} disabled={!selectedPhoto || savingPhoto}>
                    {savingPhoto ? 'Enregistrement…' : 'Enregistrer la photo'}
                  </Button>
                </div>
            </div>
           )}

            <Separator />

            {currentUser?.role === 'Admin' && (
              <>
                <div className="space-y-3">
                  <h3 className="font-medium text-lg">Pied de page des documents</h3>
                  <p className="text-sm text-muted-foreground">Ce texte apparaît au bas des proformas, bons de commande et bons de livraison exportés en PDF.</p>
                  <Label htmlFor="document-footer">Texte du pied de page</Label>
                  <Textarea id="document-footer" value={footerText} onChange={event => setFooterText(event.target.value)} rows={5} maxLength={350} />
                  <Button type="button" size="sm" onClick={handleSaveFooter} disabled={savingFooter || !footerText.trim()}>
                    {savingFooter ? 'Enregistrement…' : 'Enregistrer le pied de page'}
                  </Button>
                </div>
                <Separator />
              </>
            )}

            {/* Company Information */}
            <div className="space-y-4">
                 <h3 className="font-medium text-lg">Informations de l'entreprise</h3>
                 <div className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="company-name">Nom de l'entreprise</Label>
                        <Input type="text" id="company-name" defaultValue="Smart Visuel SARL" disabled />
                    </div>
                     <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="company-address">Adresse</Label>
                        <Input type="text" id="company-address" defaultValue="YAMOUSSOUKRO - Centre commercial mofaitai local n°20" disabled />
                    </div>
                     <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="company-phone">Téléphone</Label>
                        <Input type="text" id="company-phone" defaultValue="+225 27 30 64 02 78" disabled />
                    </div>
                 </div>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
