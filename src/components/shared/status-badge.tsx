import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Invoice } from "@/lib/definitions";

const statusTranslations: { [key in Invoice['status']]: string } = {
    Paid: 'Payée',
    Sent: 'Envoyée',
    Overdue: 'En retard',
    Draft: 'Brouillon'
};

export function StatusBadge({ status }: { status: Invoice['status'] }) {
    const variant: BadgeProps['variant'] =
        status === 'Paid' ? 'secondary' :
        status === 'Overdue' ? 'destructive' :
        status === 'Draft' ? 'outline' : 'default';
    
    return <Badge variant={variant} className="capitalize">{statusTranslations[status]}</Badge>;
}
