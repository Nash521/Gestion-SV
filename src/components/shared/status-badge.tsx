import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Invoice } from "@/lib/definitions";

export function StatusBadge({ status }: { status: Invoice['status'] }) {
    const variant: BadgeProps['variant'] =
        status === 'Paid' ? 'secondary' :
        status === 'Overdue' ? 'destructive' :
        status === 'Draft' ? 'outline' : 'default';
    
    return <Badge variant={variant} className="capitalize">{status.toLowerCase()}</Badge>;
}
