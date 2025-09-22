"use client"

import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ProjectTask } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { LayoutGrid, List, Calendar as CalendarSwitchIcon } from 'lucide-react';

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
  currentView: 'board' | 'table' | 'calendar';
  onViewChange: (view: 'board' | 'table' | 'calendar') => void;
}

export function ProjectCalendarView({ tasks, currentView, onViewChange }: ProjectCalendarViewProps) {
    const [date, setDate] = useState(new Date());
    
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
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Vue Calendrier</CardTitle>
                    <CardDescription>Visualisez les échéances de vos tâches sur le mois.</CardDescription>
                </div>
                 <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    <Button
                        variant={currentView === 'board' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => onViewChange('board')}
                        className="px-3 h-8"
                        >
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        Kanban
                    </Button>
                    <Button
                        variant={currentView === 'table' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => onViewChange('table')}
                        className="px-3 h-8"
                        >
                        <List className="mr-2 h-4 w-4" />
                        Tableau
                    </Button>
                    <Button
                        variant={currentView === 'calendar' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => onViewChange('calendar')}
                        className="px-3 h-8"
                        >
                        <CalendarSwitchIcon className="mr-2 h-4 w-4" />
                        Calendrier
                    </Button>
                </div>
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
                    date={date}
                    onNavigate={(newDate) => setDate(newDate)}
                />
            </CardContent>
        </Card>
    );
}
