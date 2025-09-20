"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export function SettingsSheet() {
  const { setTheme } = useTheme()
  const { currentUser, logout } = useAuth();
  const router = useRouter();

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
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
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
                        <AvatarImage src="https://picsum.photos/seed/user/100/100" data-ai-hint="profile avatar" alt="User" />
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
            </div>
           )}

            <Separator />

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
