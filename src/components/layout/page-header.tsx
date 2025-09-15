"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

const titles: { [key: string]: string } = {
    '/dashboard': 'Tableau de bord',
    '/dashboard/invoices': 'Proformas',
    '/dashboard/invoices/new': 'Nouvelle Proforma',
    '/dashboard/purchase-orders': 'Bons de commande',
    '/dashboard/purchase-orders/new': 'Nouveau Bon de commande',
    '/dashboard/delivery-notes': 'Bons de livraison',
    '/dashboard/delivery-notes/new': 'Nouveau Bon de livraison',
    '/dashboard/clients': 'Clients',
    '/dashboard/accounting': 'Comptabilité',
    '/dashboard/reporting': 'Rapports IA',
};

export function PageHeader() {
    const pathname = usePathname();
    const title = titles[pathname] || 'GestioSV';

    return (
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden"/>
            <h1 className="text-lg font-semibold md:text-xl font-headline">{title}</h1>
        </div>
    );
}
