"use client"

import React, { useMemo } from 'react';
import type { Project, ProjectTask } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { LayoutGrid, List, Calendar as CalendarSwitchIcon, BarChartHorizontal } from 'lucide-react';
import { format, differenceInDays, addDays, min, max, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectGanttViewProps {
  tasks: ProjectTask[];
  project: Project;
  currentView: 'board' | 'table' | 'calendar' | 'gantt';
  onViewChange: (view: 'board' | 'table' | 'calendar' | 'gantt') => void;
}

export function ProjectGanttView({ tasks, project, currentView, onViewChange }: ProjectGanttViewProps) {

    const { startDate, endDate, totalDays, dateMarkers } = useMemo(() => {
        const taskDates = tasks.map(t => t.dueDate).filter(Boolean).map(d => new Date(d!));
        if (taskDates.length === 0) {
            const today = new Date();
            const start = addDays(today, -15);
            const end = addDays(today, 15);
            const days = differenceInDays(end, start);
            
            const markers = Array.from({ length: days }, (_, i) => {
                const date = addDays(start, i);
                if (i % 5 === 0) {
                    return { date, label: format(date, 'd MMM', { locale: fr }) };
                }
                return null;
            }).filter(Boolean);
            
            return {
                startDate: start,
                endDate: end,
                totalDays: days,
                dateMarkers: markers as {date: Date, label: string}[]
            };
        }

        const minDate = min(taskDates);
        const maxDate = max(taskDates);
        
        const startDate = addDays(minDate, -7); // Add some padding
        const endDate = addDays(maxDate, 7); // Add some padding
        const totalDays = differenceInDays(endDate, startDate) || 1;

        const markers = [];
        let markerCount = Math.max(5, Math.floor(totalDays / 7)); // Aim for a reasonable number of markers
        let interval = Math.floor(totalDays / markerCount);
        if (interval < 1) interval = 1;

        for (let i = 0; i <= totalDays; i+= interval) {
            const date = addDays(startDate, i);
            markers.push({ date, label: format(date, 'd MMM', { locale: fr }) });
        }

        return { startDate, endDate, totalDays, dateMarkers: markers };
    }, [tasks]);

    const getTaskStyle = (task: ProjectTask) => {
        if (!task.dueDate) return { display: 'none' };
        
        const taskDueDate = new Date(task.dueDate);
        
        // Let's assume tasks have a duration of 3 days for visualization if no start date
        const taskStartDate = task.startDate ? new Date(task.startDate) : addDays(taskDueDate, -3);

        const leftOffset = differenceInDays(taskStartDate, startDate);
        const duration = differenceInDays(taskDueDate, taskStartDate) || 1;

        const leftPercentage = (leftOffset / totalDays) * 100;
        const widthPercentage = (duration / totalDays) * 100;

        return {
            left: `${Math.max(0, leftPercentage)}%`,
            width: `${Math.min(100 - Math.max(0, leftPercentage), widthPercentage)}%`,
        };
    };

    return (
        <Card className="m-4 flex-1 flex flex-col">
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Vue Chronogramme</CardTitle>
                    <CardDescription>Visualisez la chronologie des tâches du projet.</CardDescription>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                     <Button variant={currentView === 'board' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('board')} className="px-3 h-8">
                        <LayoutGrid className="mr-2 h-4 w-4" /> Kanban
                    </Button>
                    <Button variant={currentView === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('table')} className="px-3 h-8">
                        <List className="mr-2 h-4 w-4" /> Tableau
                    </Button>
                    <Button variant={currentView === 'calendar' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('calendar')} className="px-3 h-8">
                        <CalendarSwitchIcon className="mr-2 h-4 w-4" /> Calendrier
                    </Button>
                    <Button variant={currentView === 'gantt' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('gantt')} className="px-3 h-8">
                        <BarChartHorizontal className="mr-2 h-4 w-4" /> Chronogramme
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <TooltipProvider>
                <div className="grid" style={{ gridTemplateColumns: '250px 1fr' }}>
                    {/* Header Row */}
                    <div className="font-semibold text-sm p-2 border-b border-border sticky top-0 bg-muted/50 z-10">Tâche</div>
                    <div className="relative p-2 border-b border-border sticky top-0 bg-muted/50 z-10">
                         {dateMarkers.map(({ date, label }) => {
                             const leftPercentage = (differenceInDays(date, startDate) / totalDays) * 100;
                             if(leftPercentage < 0 || leftPercentage > 100) return null;
                             return (
                                <div key={date.toISOString()} style={{ left: `${leftPercentage}%`}} className="absolute top-0 h-full pt-2 text-xs text-muted-foreground flex flex-col items-center">
                                    <span>{label}</span>
                                    <div className="h-full w-px bg-border/70 mt-1"></div>
                                </div>
                             )
                        })}
                    </div>
                
                    {/* Task Rows */}
                    {tasks.filter(task => task.dueDate).map((task, index) => {
                        const taskStyle = getTaskStyle(task);
                        const isOverdue = isPast(new Date(task.dueDate!)) && !task.completed;

                        return (
                           <React.Fragment key={task.id}>
                                <div className="p-2 border-b border-border truncate text-sm flex items-center">
                                    {task.title}
                                </div>
                                <div className="relative p-2 border-b border-border h-12">
                                     <Tooltip delayDuration={100}>
                                        <TooltipTrigger asChild>
                                            <div
                                                style={taskStyle}
                                                className={cn(
                                                    "absolute h-8 top-1/2 -translate-y-1/2 rounded-md transition-all cursor-pointer",
                                                    isOverdue ? "bg-destructive/80" : "bg-primary/80",
                                                    "hover:opacity-100 hover:scale-y-110"
                                                )}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="font-semibold">{task.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Échéance : {format(new Date(task.dueDate!), 'd MMMM yyyy', { locale: fr })}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                           </React.Fragment>
                        )
                    })}
                </div>
              </TooltipProvider>
               {tasks.filter(task => task.dueDate).length === 0 && (
                    <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg mt-4">
                        Aucune tâche avec une date d'échéance à afficher.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
