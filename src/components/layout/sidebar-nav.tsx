"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  Users,
  Wallet,
  FilePieChart,
  UsersRound,
  HardHat,
  ClipboardCheck,
  Bell,
  Contact,
  Loader2,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { CollaboratorRole } from '@/lib/definitions';

const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard />, label: 'Tableau de bord', requiredRole: ['Admin'] },
    { href: '/dashboard/projects', icon: <ClipboardCheck />, label: 'Projets', requiredRole: ['Admin'] },
    { href: '/dashboard/documents', icon: <FileText />, label: 'Documents commerciaux', requiredRole: ['Admin', 'Employee'] },
    { href: '/dashboard/clients', icon: <Users />, label: 'Clients', requiredRole: ['Admin', 'Employee'] },
    { href: '/dashboard/prospects', icon: <Contact />, label: 'Prospects', requiredRole: ['Admin', 'Employee'] },
    { href: '/dashboard/subcontractors', icon: <HardHat />, label: 'Sous-traitants', requiredRole: ['Admin', 'Employee'] },
    { href: '/dashboard/collaborators', icon: <UsersRound />, label: 'Collaborateurs', requiredRole: ['Admin'] },
    { href: '/dashboard/accounting', icon: <Wallet />, label: 'Comptabilité', requiredRole: ['Admin'] },
    { href: '/dashboard/notifications', icon: <Bell />, label: 'Notifications', requiredRole: ['Admin', 'Employee'] },
];

export function SidebarNav({
  currentUserRole,
  pendingPath,
  onNavigate,
}: {
  currentUserRole?: CollaboratorRole;
  pendingPath: string | null;
  onNavigate: (path: string) => void;
}) {
  const pathname = usePathname();

  if (!currentUserRole) {
    return null; // or a loading state
  }

  const accessibleNavItems = navItems.filter(item => item.requiredRole.includes(currentUserRole));

  return (
    <SidebarMenu>
      {accessibleNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            size="lg"
            isActive={pathname.startsWith(item.href) && (item.href === '/dashboard' ? pathname === item.href : true)}
          >
            <Link href={item.href} onClick={() => onNavigate(item.href)}>
              {item.icon}
              {item.label}
              {pendingPath === item.href && <Loader2 className="ml-auto size-4 animate-spin" aria-label="Chargement" />}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
