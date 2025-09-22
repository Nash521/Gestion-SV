"use client"

import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ProjectTask } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

const locales = {
  'fr': fr,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
  getDay,
  locales,
})

interface ProjectCalendarViewProps {
  tasks: ProjectTask[];
}

export function ProjectCalendarView({ tasks }: ProjectCalendarViewProps) {
    
    const events = useMemo(() => {
        return tasks
            .filter(task => task.dueDate)
            .map(task => ({
                id: task.id,
                title: task.title,
                start: new Date(task.dueDate!),
                end: new Date(task.dueDate!),
                resource: task,
            }));
    }, [tasks]);
    
    const messages = {
      allDay: 'journée',
      previous: 'Précédent',
      next: 'Suivant',
      today: 'Aujourd\'hui',
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      agenda: 'Agenda',
      date: 'Date',
      time: 'Heure',
      event: 'Événement',
      noEventsInRange: 'Aucun événement dans cette plage.',
      showMore: (total: number) => `+ ${total} de plus`,
    };

    return (
        <Card className="m-4 flex-1">
            <CardHeader>
                 <CardTitle>Vue Calendrier</CardTitle>
                 <CardDescription>Visualisez les échéances de vos tâches sur le mois.</CardDescription>
            </CardHeader>
            <CardContent>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 700 }}
                    views={[Views.MONTH]}
                    defaultView={Views.MONTH}
                    messages={messages}
                    popup
                />
            </CardContent>
        </Card>
    );
}
