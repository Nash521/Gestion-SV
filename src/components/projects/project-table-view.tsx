"use client"

import React, { useMemo } from 'react';
import type { ProjectTask, TaskList, Collaborator } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { LayoutGrid, List, Calendar as CalendarSwitchIcon } from 'lucide-react';

const initialLabels = [
    { name: 'Urgent', color: 'bg-red-500' },
    { name: 'Design', color: 'bg-purple-500' },
    { name: 'Tech', color: 'bg-blue-500' },
    { name: 'Dev', color: 'bg-green-500' },
    { name: 'Marketing', color: 'bg-orange-500' },
    { name: 'Bug', color: 'bg-pink-500' },
];

interface ProjectTableViewProps {
  tasks: ProjectTask[];
  lists: TaskList[];
  collaborators: Collaborator[];
  currentView: 'board' | 'table' | 'calendar';
  onViewChange: (view: 'board' | 'table' | 'calendar') => void;
}

export function ProjectTableView({ tasks, lists, collaborators, currentView, onViewChange }: ProjectTableViewProps) {
    const listMap = useMemo(() => {
        return new Map(lists.map(list => [list.id, list.title]));
    }, [lists]);

    const collaboratorMap = useMemo(() => {
        return new Map(collaborators.map(c => [c.id, c]));
    }, [collaborators]);

    const availableLabelsMap = useMemo(() => {
        return new Map(initialLabels.map(l => [l.name, l.color]));
    }, []);

    return (
        <Card className="m-4 flex-1">
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Vue Tableau</CardTitle>
                    <CardDescription>Une vue d'ensemble de toutes les tâches du projet.</CardDescription>
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
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Tâche</TableHead>
                                <TableHead>Liste</TableHead>
                                <TableHead>Assignées</TableHead>
                                <TableHead>Étiquettes</TableHead>
                                <TableHead className="text-right">Échéance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.map(task => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">{task.title}</TableCell>
                                    <TableCell>{listMap.get(task.listId) || 'N/A'}</TableCell>
                                    <TableCell>
                                        <div className="flex -space-x-2">
                                            {task.assigneeIds?.map(id => {
                                                const assignee = collaboratorMap.get(id);
                                                if (!assignee) return null;
                                                return (
                                                    <Avatar key={assignee.id} className="h-7 w-7 border-2 border-background">
                                                        <AvatarImage src={`https://picsum.photos/seed/${assignee.id}/40/40`} />
                                                        <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                )
                                            })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {task.labels?.map(labelName => (
                                                <Badge
                                                    key={labelName}
                                                    className={cn("text-white text-[10px] px-1.5 py-0", availableLabelsMap.get(labelName) || 'bg-gray-400')}
                                                    variant="default"
                                                >
                                                    {labelName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className={cn("text-right text-xs", task.dueDate && isPast(new Date(task.dueDate)) && "text-destructive font-semibold")}>
                                        {task.dueDate ? format(new Date(task.dueDate), 'd MMM yyyy', { locale: fr }) : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
