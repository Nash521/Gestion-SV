"use client"

import React from 'react';
import type { Project, TaskList, ProjectTask, Collaborator } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, Tag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskCardProps {
  task: ProjectTask;
  collaborators: Collaborator[];
}

const TaskCard = ({ task, collaborators }: TaskCardProps) => {
  const assignees = collaborators.filter(c => task.assigneeIds?.includes(c.id));
  
  const labelColors: { [key: string]: string } = {
    'Urgent': 'bg-red-500',
    'Design': 'bg-purple-500',
    'Tech': 'bg-blue-500',
    'Dev': 'bg-green-500',
  };

  return (
    <Card className="mb-4 bg-background/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-3">
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.map(label => (
              <span key={label} className={`px-2 py-0.5 text-xs font-semibold text-white rounded-full ${labelColors[label] || 'bg-gray-400'}`}>
                {label}
              </span>
            ))}
          </div>
        )}
        <p className="font-medium text-sm mb-2">{task.title}</p>
        {task.content && (
            <p className="text-xs text-muted-foreground mb-3">{task.content}</p>
        )}
        <div className="flex items-center justify-between">
           <div className="flex -space-x-2">
                {assignees.map(assignee => (
                    <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                         <AvatarImage src={`https://picsum.photos/seed/${assignee.id}/40/40`} />
                        <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                ))}
            </div>
            {/* You can add more info here like comments count, attachments, etc. */}
        </div>
      </CardContent>
    </Card>
  );
};

interface TaskListColumnProps {
  list: TaskList;
  tasks: ProjectTask[];
  collaborators: Collaborator[];
}

const TaskListColumn = ({ list, tasks, collaborators }: TaskListColumnProps) => {
  return (
    <div className="flex-shrink-0 w-80 bg-muted/60 rounded-xl p-3">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold text-md">{list.title} <Badge variant="secondary" className="ml-2">{tasks.length}</Badge></h3>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>Ajouter une tâche</DropdownMenuItem>
                <DropdownMenuItem>Renommer la liste</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Archiver la liste</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="h-full overflow-y-auto pr-2 -mr-2">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} collaborators={collaborators} />
        ))}
      </div>
       <Button variant="ghost" className="w-full justify-start mt-2">
            <Plus className="mr-2 h-4 w-4" /> Ajouter une tâche
        </Button>
    </div>
  );
};

interface ProjectBoardProps {
  project: Project;
  initialLists: TaskList[];
  initialTasks: ProjectTask[];
  collaborators: Collaborator[];
}

export const ProjectBoard = ({ project, initialLists, initialTasks, collaborators }: ProjectBoardProps) => {
  const sortedLists = initialLists.sort((a, b) => a.order - b.order);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 bg-background border-b">
            <h1 className="text-xl font-bold">{project.name}</h1>
            {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
        </div>
        <div className="flex-1 flex gap-6 p-4 overflow-x-auto">
            {sortedLists.map(list => {
                const tasksInList = initialTasks
                    .filter(task => task.listId === list.id)
                    .sort((a, b) => a.order - b.order);
                
                return (
                    <TaskListColumn
                        key={list.id}
                        list={list}
                        tasks={tasksInList}
                        collaborators={collaborators}
                    />
                );
            })}
             <div className="flex-shrink-0 w-80">
                <Button variant="outline" className="w-full bg-muted/40 hover:bg-muted">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter une autre liste
                </Button>
            </div>
        </div>
    </div>
  );
};
