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
            return {
                startDate: today,
                endDate: addDays(today, 30),
                totalDays: 30,
                dateMarkers: []
            };
        }

        const minDate = min(taskDates);
        const maxDate = max(taskDates);
        
        const startDate = addDays(minDate, -5); // Add some padding
        const endDate = addDays(maxDate, 5); // Add some padding
        const totalDays = differenceInDays(endDate, startDate) || 1;

        const markers = [];
        for (let i = 0; i <= totalDays; i++) {
            const date = addDays(startDate, i);
            if (i % 7 === 0) { // Mark every 7 days
                markers.push({ date, label: format(date, 'd MMM', { locale: fr }) });
            }
        }

        return { startDate, endDate, totalDays, dateMarkers: markers };
    }, [tasks]);

    const getTaskStyle = (task: ProjectTask) => {
        if (!task.dueDate) return { display: 'none' };
        
        const taskDueDate = new Date(task.dueDate);
        
        // Let's assume tasks have a duration of 5 days for visualization
        const taskStartDate = task.startDate ? new Date(task.startDate) : addDays(taskDueDate, -5);

        const leftOffset = differenceInDays(taskStartDate, startDate);
        const duration = differenceInDays(taskDueDate, taskStartDate) || 1;

        const leftPercentage = (leftOffset / totalDays) * 100;
        const widthPercentage = (duration / totalDays) * 100;

        return {
            left: `${leftPercentage}%`,
            width: `${widthPercentage}%`,
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
                <div className="relative border-l border-border pt-8">
                    {/* Date Markers */}
                    <div className="absolute top-0 left-0 w-full h-8 flex">
                        {dateMarkers.map(({ date, label }) => {
                             const leftPercentage = (differenceInDays(date, startDate) / totalDays) * 100;
                             return (
                                <div key={date.toISOString()} style={{ left: `${leftPercentage}%`}} className="absolute text-xs text-muted-foreground flex flex-col items-center">
                                    <span className="h-8 w-px bg-border"></span>
                                    <span>{label}</span>
                                </div>
                             )
                        })}
                    </div>
                
                    {/* Task Rows */}
                    <div className="space-y-2">
                    {tasks.map(task => {
                        if (!task.dueDate) return null;

                        const taskStyle = getTaskStyle(task);
                        const isOverdue = isPast(new Date(task.dueDate)) && !task.completed;

                        return (
                            <div key={task.id} className="relative h-10 flex items-center group">
                                <div className="w-48 shrink-0 truncate pr-4 text-sm">
                                    {task.title}
                                </div>
                                 <div className="flex-1 h-full bg-muted/60 rounded-md overflow-hidden">
                                     <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <div
                                                style={taskStyle}
                                                className={cn(
                                                    "absolute h-3/4 top-1/2 -translate-y-1/2 rounded-md transition-all",
                                                    isOverdue ? "bg-destructive/80" : "bg-primary/80",
                                                    "hover:opacity-100 hover:scale-y-110"
                                                )}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="font-semibold">{task.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Échéance : {format(new Date(task.dueDate), 'd MMMM yyyy', { locale: fr })}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        )
                    })}
                    </div>
                </div>
              </TooltipProvider>
            </CardContent>
        </Card>
    );
}
