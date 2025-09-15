"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

const titles: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/dashboard/invoices': 'Invoices',
    '/dashboard/invoices/new': 'New Invoice',
    '/dashboard/clients': 'Clients',
    '/dashboard/expenses': 'Expenses',
    '/dashboard/reporting': 'AI Reporting',
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
