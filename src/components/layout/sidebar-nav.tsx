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
  ShoppingCart,
  Truck,
  UsersRound,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { CollaboratorRole } from '@/lib/definitions';

const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard />, label: 'Tableau de bord', requiredRole: ['Admin', 'Employee'] },
    { href: '/dashboard/invoices', icon: <FileText />, label: 'Proformas', requiredRole: ['Admin', 'Employee'] },
    { href: '/dashboard/purchase-orders', icon: <ShoppingCart />, label: 'Bons de commande', requiredRole: ['Admin', 'Employee'] },
    { href: '/dashboard/delivery-notes', icon: <Truck />, label: 'Bons de livraison', requiredRole: ['Admin', 'Employee'] },
    { href: '/dashboard/clients', icon: <Users />, label: 'Clients', requiredRole: ['Admin', 'Employee'] },
    { href: '/dashboard/collaborators', icon: <UsersRound />, label: 'Collaborateurs', requiredRole: ['Admin'] },
    { href: '/dashboard/accounting', icon: <Wallet />, label: 'Comptabilité', requiredRole: ['Admin', 'Employee'] },
    { href: '/dashboard/reporting', icon: <FilePieChart />, label: 'Rapports', requiredRole: ['Admin', 'Employee'] },
];

export function SidebarNav({ currentUserRole }: { currentUserRole: CollaboratorRole }) {
  const pathname = usePathname();

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
            <Link href={item.href}>
              {item.icon}
              {item.label}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
