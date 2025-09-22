"use client"

import React, { useState, useEffect } from 'react';
import type { Project, TaskList, ProjectTask, Collaborator } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, Tag, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

interface TaskCardProps {
  task: ProjectTask;
  collaborators: Collaborator[];
  onTaskClick: (task: ProjectTask) => void;
}

const TaskCard = ({ task, collaborators, onTaskClick }: TaskCardProps) => {
  const assignees = collaborators.filter(c => task.assigneeIds?.includes(c.id));
  
  const labelColors: { [key: string]: string } = {
    'Urgent': 'bg-red-500',
    'Design': 'bg-purple-500',
    'Tech': 'bg-blue-500',
    'Dev': 'bg-green-500',
  };

  return (
    <Card 
      className="mb-4 bg-background/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onTaskClick(task)}
    >
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
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.content}</p>
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
        </div>
      </CardContent>
    </Card>
  );
};

interface TaskListColumnProps {
  list: TaskList;
  tasks: ProjectTask[];
  collaborators: Collaborator[];
  onTaskClick: (task: ProjectTask) => void;
  onAddTask: (listId: string) => void;
}

const TaskListColumn = ({ list, tasks, collaborators, onTaskClick, onAddTask }: TaskListColumnProps) => {
  return (
    <div className="flex-shrink-0 w-80 bg-muted/60 rounded-xl p-3 flex flex-col">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold text-md">{list.title} <Badge variant="secondary" className="ml-2">{tasks.length}</Badge></h3>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onAddTask(list.id)}>Ajouter une tâche</DropdownMenuItem>
                <DropdownMenuItem>Renommer la liste</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Archiver la liste</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="flex-1 -mx-3 px-3">
        <div className="pr-1">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} collaborators={collaborators} onTaskClick={onTaskClick} />
          ))}
        </div>
      </ScrollArea>
       <Button variant="ghost" className="w-full justify-start mt-2" onClick={() => onAddTask(list.id)}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter une tâche
        </Button>
    </div>
  );
};


interface TaskDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (data: Partial<ProjectTask>) => void;
  task: Partial<ProjectTask> | null;
  collaborators: Collaborator[];
}

const TaskDialog = ({ isOpen, setIsOpen, onSubmit, task, collaborators }: TaskDialogProps) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    
    const isEditMode = !!task?.id;

    useEffect(() => {
        if (isOpen && task) {
            setTitle(task.title || '');
            setContent(task.content || '');
            setAssigneeIds(task.assigneeIds || []);
        } else {
            setTitle('');
            setContent('');
            setAssigneeIds([]);
        }
    }, [isOpen, task]);

    const handleSubmit = () => {
        onSubmit({
            ...task,
            title,
            content,
            assigneeIds,
        });
        setIsOpen(false);
    };

    const handleAssigneeChange = (checked: boolean, id: string) => {
        if (checked) {
            setAssigneeIds(prev => [...prev, id]);
        } else {
            setAssigneeIds(prev => prev.filter(assigneeId => assigneeId !== id));
        }
    }

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
                     <DialogDescription>
                        {isEditMode ? 'Mettez à jour les détails de cette tâche.' : 'Remplissez les détails de la nouvelle tâche.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="task-title">Titre</Label>
                        <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la tâche" />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="task-content">Description</Label>
                        <Textarea id="task-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Ajoutez une description plus détaillée..." />
                    </div>
                     <div className="space-y-2">
                        <Label>Assigner à</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {collaborators.map(c => (
                                <div key={c.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`assignee-${c.id}`}
                                        checked={assigneeIds.includes(c.id)}
                                        onCheckedChange={(checked) => handleAssigneeChange(!!checked, c.id)}
                                    />
                                    <Label htmlFor={`assignee-${c.id}`} className="flex items-center gap-2 font-normal">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={`https://picsum.photos/seed/${c.id}/40/40`} />
                                            <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {c.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Annuler</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit}>Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface ProjectBoardProps {
  project: Project;
  initialLists: TaskList[];
  initialTasks: ProjectTask[];
  collaborators: Collaborator[];
}

export const ProjectBoard = ({ project, initialLists, initialTasks, collaborators }: ProjectBoardProps) => {
    const { toast } = useToast();
    const [lists, setLists] = useState<TaskList[]>(initialLists.sort((a, b) => a.order - b.order));
    const [tasks, setTasks] = useState<ProjectTask[]>(initialTasks);
    
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<ProjectTask> | null>(null);

    const handleOpenTaskDialog = (task: ProjectTask) => {
        setEditingTask(task);
        setIsTaskDialogOpen(true);
    };

    const handleOpenAddTaskDialog = (listId: string) => {
        setEditingTask({ listId }); // Set the listId for the new task
        setIsTaskDialogOpen(true);
    };

    const handleTaskSubmit = (data: Partial<ProjectTask>) => {
        if (data.id) { // Editing existing task
            setTasks(currentTasks => currentTasks.map(t => t.id === data.id ? { ...t, ...data } as ProjectTask : t));
            toast({ title: "Tâche mise à jour", description: `La tâche "${data.title}" a été modifiée.` });
        } else { // Adding new task
            const newOrder = tasks.filter(t => t.listId === data.listId).length + 1;
            const newTask: ProjectTask = {
                id: `task-${Date.now()}`,
                order: newOrder,
                ...data
            } as ProjectTask;
            setTasks(currentTasks => [...currentTasks, newTask]);
            toast({ title: "Tâche ajoutée", description: `La tâche "${newTask.title}" a été créée.` });
        }
    };


  return (
    <>
      <TaskDialog
          isOpen={isTaskDialogOpen}
          setIsOpen={setIsTaskDialogOpen}
          onSubmit={handleTaskSubmit}
          task={editingTask}
          collaborators={collaborators}
      />
      <div className="flex-1 flex flex-col overflow-hidden h-full">
          <div className="p-4 bg-background border-b">
              <h1 className="text-xl font-bold">{project.name}</h1>
              {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
          </div>
          <div className="flex-1 flex gap-6 p-4 overflow-x-auto">
              {lists.map(list => {
                  const tasksInList = tasks
                      .filter(task => task.listId === list.id)
                      .sort((a, b) => a.order - b.order);
                  
                  return (
                      <TaskListColumn
                          key={list.id}
                          list={list}
                          tasks={tasksInList}
                          collaborators={collaborators}
                          onTaskClick={handleOpenTaskDialog}
                          onAddTask={handleOpenAddTaskDialog}
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
    </>
  );
};
