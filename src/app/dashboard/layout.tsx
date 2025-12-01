"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Briefcase,
  Loader2,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { PageHeader } from '@/components/layout/page-header';
import { SearchBar } from '@/components/layout/search-bar';
import { SettingsSheet } from '@/components/layout/settings-sheet';
import { useAuth } from '@/contexts/auth-context';
import { NotificationBell } from '@/components/layout/notification-bell';


const searchablePages = [
    '/dashboard/invoices',
    '/dashboard/purchase-orders',
    '/dashboard/delivery-notes',
    '/dashboard/clients',
    '/dashboard/accounting',
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading, logout } = useAuth();
  const isSearchable = searchablePages.some(page => pathname.startsWith(page));

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);


  if (loading || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If current user is an Employee, display access denied message instead of redirecting
  if (currentUser?.role === 'Employee') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accès non autorisé</h1>
          <p className="text-muted-foreground">Vous n'avez pas la permission d'accéder à cette section.</p>
          <Button onClick={() => logout()} className="mt-4">Se déconnecter</Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2 justify-center">
            <Briefcase className="size-6 text-primary" />
            <span className="text-xl font-semibold font-headline">
              <span>Gestio</span>
              <span className="font-android-assassins text-primary">SV</span>
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
           <SidebarGroup>
            <SidebarGroupLabel>MENU</SidebarGroupLabel>
            <SidebarNav currentUserRole={currentUser.role} />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted rounded-md transition-colors">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src="https://picsum.photos/seed/user/100/100" data-ai-hint="profile avatar" alt="User" />
                            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-sm text-left">
                            <span className="font-semibold">{currentUser.name}</span>
                            <span className="text-muted-foreground text-xs">{currentUser.email}</span>
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mb-2 ml-2">
                    <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profil</DropdownMenuItem>
                    <DropdownMenuItem>Paramètres</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Déconnexion</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="hidden md:flex" />
                <PageHeader />
            </div>
            <div className="flex flex-1 items-center justify-end gap-4">
                {isSearchable && (
                    <div className="w-full max-w-sm">
                        <SearchBar />
                    </div>
                )}
                <NotificationBell />
                <SettingsSheet />
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 animate-fade-in-up bg-background overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
