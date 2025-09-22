"use client";

import React from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/contexts/notification-context';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0 relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" onClick={markAllAsRead}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Marquer comme lu
                </Button>
            )}
        </div>
        <ScrollArea className="h-96">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                    Aucune notification pour le moment.
                </div>
            ) : (
                <div className="divide-y">
                {notifications.map((notif) => (
                    <div 
                        key={notif.id}
                        className={`p-4 hover:bg-muted/50 transition-colors ${!notif.read ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                        onClick={() => !notif.read && markAsRead(notif.id)}
                    >
                        <div className="flex items-start gap-3">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://picsum.photos/seed/${notif.actorId}/40/40`} alt={notif.actorName} />
                                <AvatarFallback>{notif.actorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm">
                                    <span className="font-semibold">{notif.actorName}</span> {notif.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: fr })}
                                </p>
                                {notif.href && (
                                     <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
                                        <Link href={notif.href}>Voir le détail</Link>
                                    </Button>
                                )}
                            </div>
                            {!notif.read && (
                                <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 flex-shrink-0"></div>
                            )}
                        </div>
                    </div>
                ))}
                </div>
            )}
        </ScrollArea>
        <div className="p-2 border-t text-center">
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link href="/dashboard/notifications">Voir toutes les notifications</Link>
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
