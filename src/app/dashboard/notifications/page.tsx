"use client";

import React from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications } from '@/contexts/notification-context';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Activity,
  CreditCard,
  DollarSign,
  Download,
  Users,
} from 'lucide-react';


export default function NotificationsPage() {
    const { notifications, markAllAsRead, markAsRead, unreadCount } = useNotifications();

    const groupedNotifications = notifications.reduce((acc, notif) => {
        const dateKey = format(notif.timestamp, 'yyyy-MM-dd');
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(notif);
        return acc;
    }, {} as Record<string, typeof notifications>);

    const sortedDates = Object.keys(groupedNotifications).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
    
    const formatDateKey = (dateKey: string) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
        if (dateKey === today) return 'Aujourd\'hui';
        if (dateKey === yesterday) return 'Hier';
        return format(new Date(dateKey), 'eeee d MMMM yyyy', { locale: fr });
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Bell />
                            Notifications
                        </CardTitle>
                        <CardDescription>Historique de toutes les activités de l'équipe.</CardDescription>
                    </div>
                    {unreadCount > 0 && (
                        <Button onClick={markAllAsRead}>
                            <CheckCheck className="mr-2 h-4 w-4"/>
                            Marquer tout comme lu
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {sortedDates.length === 0 ? (
                         <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Bell className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">Aucune notification</h3>
                            <p className="mt-1 text-sm">L'activité de votre équipe apparaîtra ici.</p>
                        </div>
                    ) : sortedDates.map(dateKey => (
                        <div key={dateKey}>
                             <h3 className="text-sm font-semibold text-muted-foreground mb-4">{formatDateKey(dateKey)}</h3>
                             <div className="space-y-4">
                                {groupedNotifications[dateKey].map(notif => (
                                    <div
                                        key={notif.id}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-background/80",
                                            !notif.read ? "bg-background shadow-sm" : "bg-transparent"
                                        )}
                                        onClick={() => !notif.read && markAsRead(notif.id)}
                                    >
                                        <Avatar className="mt-1">
                                            <AvatarImage src={`https://picsum.photos/seed/${notif.actorId}/40/40`} alt={notif.actorName} />
                                            <AvatarFallback>{notif.actorName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p>
                                                <span className="font-semibold">{notif.actorName}</span> {notif.message}
                                            </p>
                                             <p className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: fr })}
                                            </p>
                                            {notif.href && (
                                                <Button variant="link" size="sm" asChild className="-ml-3 h-auto">
                                                    <Link href={notif.href}>Voir le détail</Link>
                                                </Button>
                                            )}
                                        </div>
                                         {!notif.read && (
                                            <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 flex-shrink-0" aria-label="Non lue"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
