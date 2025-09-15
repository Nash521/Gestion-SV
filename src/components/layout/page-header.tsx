"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

const titles: { [key: string]: string } = {
    '/dashboard': 'Tableau de bord',
    '/dashboard/invoices': 'Factures',
    '/dashboard/invoices/new': 'Nouvelle Facture',
    '/dashboard/clients': 'Clients',
    '/dashboard/expenses': 'Dépenses',
    '/dashboard/reporting': 'Rapports IA',
};

export function PageHeader() {
    const pathname = usePathname();
    const title = titles[pathname] || 'BillFlow';

    return (
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden"/>
            <h1 className="text-lg font-semibold md:text-xl font-headline">{title}</h1>
        </div>
    );
}
