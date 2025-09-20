"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Settings,
  Briefcase,
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
  const isSearchable = searchablePages.some(page => pathname.startsWith(page));

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
            <SidebarNav />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted rounded-md transition-colors">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src="https://picsum.photos/seed/user/100/100" data-ai-hint="profile avatar" alt="User" />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-sm text-left">
                            <span className="font-semibold">Utilisateur Démo</span>
                            <span className="text-muted-foreground text-xs">user@gestiosv.com</span>
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mb-2 ml-2">
                    <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profil</DropdownMenuItem>
                    <DropdownMenuItem>Paramètres</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Déconnexion</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
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
                <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
                    <Settings className="h-5 w-5"/>
                </Button>
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 animate-fade-in-up">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
