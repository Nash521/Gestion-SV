import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Invoice, PurchaseOrder, DeliveryNote } from "@/lib/definitions";

type AllStatus = Invoice['status'] | PurchaseOrder['status'] | DeliveryNote['status'];

const statusTranslations: { [key in AllStatus]: string } = {
    // Invoice
    Paid: 'Payée',
    Sent: 'Envoyée',
    Overdue: 'En retard',
    // Shared
    Draft: 'Brouillon',
    // Purchase Order
    Approved: 'Approuvé',
    Rejected: 'Rejeté',
    // Delivery Note
    Delivered: 'Livré',
    Canceled: 'Annulé',
};

const statusVariants: { [key in AllStatus]: BadgeProps['variant'] } = {
    // Invoice
    Paid: 'secondary',
    Sent: 'default',
    Overdue: 'destructive',
    // Shared
    Draft: 'outline',
    // Purchase Order
    Approved: 'secondary',
    Rejected: 'destructive',
    // Delivery Note
    Delivered: 'secondary',
    Canceled: 'destructive',
};

export function StatusBadge({ status }: { status: AllStatus }) {
    const variant = statusVariants[status] || 'default';
    
    return <Badge variant={variant} className="capitalize">{statusTranslations[status]}</Badge>;
}
