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
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard />, label: 'Tableau de bord' },
    { href: '/dashboard/invoices', icon: <FileText />, label: 'Proformas' },
    { href: '/dashboard/purchase-orders', icon: <ShoppingCart />, label: 'Bons de commande' },
    { href: '/dashboard/delivery-notes', icon: <Truck />, label: 'Bons de livraison' },
    { href: '/dashboard/clients', icon: <Users />, label: 'Clients' },
    { href: '/dashboard/expenses', icon: <Wallet />, label: 'Dépenses' },
    { href: '/dashboard/reporting', icon: <FilePieChart />, label: 'Rapports' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
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
