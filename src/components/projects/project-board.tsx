"use client"

import React, { useState, useEffect, useMemo } from 'react';
import type { Project, TaskList, ProjectTask, Collaborator, ChecklistItem } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, Tag, X, Calendar, Paperclip, CheckSquare, CalendarIcon, Settings, Trash2 } from 'lucide-react';
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
import { Progress } from '../ui/progress';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const initialLabels = [
    { name: 'Urgent', color: 'bg-red-500' },
    { name: 'Design', color: 'bg-purple-500' },
    { name: 'Tech', color: 'bg-blue-500' },
    { name: 'Dev', color: 'bg-green-500' },
    { name: 'Marketing', color: 'bg-orange-500' },
    { name: 'Bug', color: 'bg-pink-500' },
];

const colorPalette = ['bg-red-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-teal-500'];

interface TaskCardProps {
  task: ProjectTask;
  collaborators: Collaborator[];
  onTaskClick: (task: ProjectTask) => void;
  availableLabels: { name: string; color: string }[];
}

const TaskCard = ({ task, collaborators, onTaskClick, availableLabels }: TaskCardProps) => {
  const assignees = collaborators.filter(c => task.assigneeIds?.includes(c.id));
  
  const checklistProgress = useMemo(() => {
    if (!task.checklist || task.checklist.length === 0) return null;
    const completed = task.checklist.filter(item => item.completed).length;
    const total = task.checklist.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  }, [task.checklist]);

  return (
    <Card 
      className="mb-4 bg-background/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onTaskClick(task)}
    >
      <CardContent className="p-3 space-y-3">
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.map(labelName => {
              const labelInfo = availableLabels.find(l => l.name === labelName);
              return (
                <span key={labelName} className={`px-2 py-0.5 text-xs font-semibold text-white rounded-full ${labelInfo?.color || 'bg-gray-400'}`}>
                  {labelName}
                </span>
              )
            })}
          </div>
        )}
        <p className="font-medium text-sm">{task.title}</p>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.dueDate), 'd MMM', { locale: fr })}</span>
            </div>
          )}
          {checklistProgress && checklistProgress.total > 0 && (
             <div className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                <span>{checklistProgress.completed}/{checklistProgress.total}</span>
            </div>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>

        {checklistProgress && checklistProgress.total > 0 && (
            <Progress value={checklistProgress.percentage} className="h-1" />
        )}
        
        <div className="flex items-center justify-between pt-1">
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
  availableLabels: { name: string; color: string }[];
}

const TaskListColumn = ({ list, tasks, collaborators, onTaskClick, onAddTask, availableLabels }: TaskListColumnProps) => {
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
            <TaskCard key={task.id} task={task} collaborators={collaborators} onTaskClick={onTaskClick} availableLabels={availableLabels} />
          ))}
        </div>
      </ScrollArea>
       <Button variant="ghost" className="w-full justify-start mt-2" onClick={() => onAddTask(list.id)}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter une tâche
        </Button>
    </div>
  );
};

interface LabelManagerDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    labels: { name: string; color: string }[];
    onLabelsChange: (labels: { name: string; color: string }[]) => void;
}

const LabelManagerDialog = ({ isOpen, setIsOpen, labels, onLabelsChange }: LabelManagerDialogProps) => {
    const { toast } = useToast();
    const [editingLabels, setEditingLabels] = useState(labels);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(colorPalette[0]);

    useEffect(() => {
        setEditingLabels(labels);
    }, [labels, isOpen]);

    const handleAddLabel = () => {
        if (!newLabelName) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom de l\'étiquette ne peut pas être vide.' });
            return;
        }
        if (editingLabels.some(l => l.name.toLowerCase() === newLabelName.toLowerCase())) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Cette étiquette existe déjà.' });
            return;
        }
        setEditingLabels([...editingLabels, { name: newLabelName, color: newLabelColor }]);
        setNewLabelName('');
    };

    const handleUpdateLabel = (index: number, newName: string, newColor: string) => {
        const updatedLabels = [...editingLabels];
        updatedLabels[index] = { name: newName, color: newColor };
        setEditingLabels(updatedLabels);
    };

    const handleDeleteLabel = (index: number) => {
        const updatedLabels = editingLabels.filter((_, i) => i !== index);
        setEditingLabels(updatedLabels);
    };

    const handleSaveChanges = () => {
        onLabelsChange(editingLabels);
        setIsOpen(false);
        toast({ title: 'Succès', description: 'Les étiquettes ont été mises à jour.' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Gérer les étiquettes</DialogTitle>
                    <DialogDescription>Ajoutez, modifiez ou supprimez les étiquettes pour ce projet.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    {editingLabels.map((label, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                value={label.name}
                                onChange={(e) => handleUpdateLabel(index, e.target.value, label.color)}
                                className="flex-1"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="w-10 h-10">
                                        <div className={cn("w-4 h-4 rounded-full", label.color)}></div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <div className="p-2 grid grid-cols-3 gap-2">
                                    {colorPalette.map(color => (
                                        <Button key={color} variant="outline" size="icon" className="w-8 h-8" onClick={() => handleUpdateLabel(index, label.name, color)}>
                                            <div className={cn("w-4 h-4 rounded-full", color)}></div>
                                        </Button>
                                    ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialog>
                               <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     La suppression de cette étiquette la retirera de toutes les tâches associées. Cette action est irréversible.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Annuler</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleDeleteLabel(index)}>Supprimer</AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
                 <div className="space-y-2 border-t pt-4">
                     <h4 className="font-medium">Nouvelle étiquette</h4>
                     <div className="flex items-center gap-2">
                        <Input
                            placeholder="Nom de l'étiquette"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            className="flex-1"
                        />
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="w-10 h-10">
                                    <div className={cn("w-4 h-4 rounded-full", newLabelColor)}></div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <div className="p-2 grid grid-cols-3 gap-2">
                                {colorPalette.map(color => (
                                    <Button key={color} variant="outline" size="icon" className="w-8 h-8" onClick={() => setNewLabelColor(color)}>
                                        <div className={cn("w-4 h-4 rounded-full", color)}></div>
                                    </Button>
                                ))}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleAddLabel}>Ajouter</Button>
                     </div>
                 </div>
                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button onClick={handleSaveChanges}>Enregistrer les modifications</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


interface TaskDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (data: Partial<ProjectTask>) => void;
  task: Partial<ProjectTask> | null;
  collaborators: Collaborator[];
  availableLabels: { name: string; color: string }[];
}

const TaskDialog = ({ isOpen, setIsOpen, onSubmit, task, collaborators, availableLabels }: TaskDialogProps) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [labels, setLabels] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [newChecklistItemText, setNewChecklistItemText] = useState('');
    
    const isEditMode = !!task?.id;
    
    const checklistProgress = useMemo(() => {
        if (!checklist || checklist.length === 0) return 0;
        const completed = checklist.filter(item => item.completed).length;
        return (completed / checklist.length) * 100;
    }, [checklist]);

    useEffect(() => {
        if (isOpen && task) {
            setTitle(task.title || '');
            setContent(task.content || '');
            setAssigneeIds(task.assigneeIds || []);
            setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
            setLabels(task.labels || []);
            setChecklist(task.checklist ? JSON.parse(JSON.stringify(task.checklist)) : []);
            setNewChecklistItemText('');
        } else {
            setTitle('');
            setContent('');
            setAssigneeIds([]);
            setDueDate(undefined);
            setLabels([]);
            setChecklist([]);
            setNewChecklistItemText('');
        }
    }, [isOpen, task]);

    const handleSubmit = () => {
        onSubmit({
            ...task,
            title,
            content,
            assigneeIds,
            dueDate,
            labels,
            checklist,
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
    
    const handleLabelToggle = (labelName: string) => {
        setLabels(prev => 
            prev.includes(labelName) 
                ? prev.filter(l => l !== labelName)
                : [...prev, labelName]
        );
    }
    
     const handleAddChecklistItem = () => {
        if (newChecklistItemText.trim()) {
            const newItem: ChecklistItem = {
                id: `cl-${Date.now()}`,
                text: newChecklistItemText.trim(),
                completed: false
            };
            setChecklist(prev => [...prev, newItem]);
            setNewChecklistItemText('');
        }
    };
    
    const handleToggleChecklistItem = (id: string) => {
        setChecklist(prev => prev.map(item => 
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const handleDeleteChecklistItem = (id: string) => {
        setChecklist(prev => prev.filter(item => item.id !== id));
    };

    const handleChecklistTextChange = (id: string, newText: string) => {
        setChecklist(prev => prev.map(item =>
            item.id === id ? { ...item, text: newText } : item
        ));
    };

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-3 gap-8 py-4">
                    {/* Colonne principale (gauche) */}
                    <div className="md:col-span-2 space-y-6">
                         <div className="space-y-2">
                            <Label htmlFor="task-title" className="sr-only">Titre</Label>
                            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la tâche" className="text-lg font-semibold border-0 shadow-none -ml-2 focus-visible:ring-0 focus-visible:ring-offset-0" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="task-content">Description</Label>
                            <Textarea id="task-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Ajoutez une description plus détaillée..." rows={6} />
                        </div>
                        
                        {isEditMode && (
                             <div className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <CheckSquare className="h-5 w-5" />
                                        <Label>Checklist</Label>
                                    </div>
                                     {checklist.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{Math.round(checklistProgress)}%</span>
                                            <Progress value={checklistProgress} className="h-2 w-full" />
                                        </div>
                                    )}
                                    <div className="space-y-2 pl-6">
                                        {checklist.map(item => (
                                            <div key={item.id} className="flex items-center gap-2 group">
                                                <Checkbox id={`cl-${item.id}`} checked={item.completed} onCheckedChange={() => handleToggleChecklistItem(item.id)} />
                                                <Input 
                                                    value={item.text} 
                                                    onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                                                    className={cn("flex-1 h-8 border-0 shadow-none -ml-2 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent", item.completed && "line-through text-muted-foreground")}
                                                />
                                                 <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteChecklistItem(item.id)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 pl-6">
                                        <Input 
                                            placeholder="Ajouter un élément..." 
                                            value={newChecklistItemText} 
                                            onChange={(e) => setNewChecklistItemText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddChecklistItem();
                                                }
                                            }}
                                            className="h-9"
                                        />
                                        <Button type="button" onClick={handleAddChecklistItem} variant="secondary">Ajouter</Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Pièces jointes</Label>
                                    <div className="p-3 border rounded-md bg-muted/50 text-sm text-muted-foreground">Téléchargement de fichiers (bientôt disponible)</div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Colonne latérale (droite) */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="space-y-2">
                            <Label>Assigner à</Label>
                            <div className="space-y-2">
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

                        {isEditMode && (
                            <>
                                <div className="space-y-2">
                                    <Label>Étiquettes</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableLabels.map(label => (
                                            <button
                                                key={label.name}
                                                onClick={() => handleLabelToggle(label.name)}
                                                className={cn(
                                                    "px-3 py-1 text-xs font-semibold rounded-full transition-all border",
                                                    labels.includes(label.name)
                                                        ? `${label.color} text-white border-transparent`
                                                        : "bg-transparent border-border hover:border-foreground/50"
                                                )}
                                            >
                                                {label.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Date d'échéance</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !dueDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dueDate ? format(dueDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <CalendarComponent
                                                mode="single"
                                                selected={dueDate}
                                                onSelect={setDueDate}
                                                initialFocus
                                                locale={fr}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
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

    const [availableLabels, setAvailableLabels] = useState(initialLabels);
    const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);

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
        setEditingTask(null);
        setIsTaskDialogOpen(false);
    };
    
    const handleLabelsChange = (newLabels: { name: string; color: string }[]) => {
        const oldLabels = availableLabels;
        setAvailableLabels(newLabels);

        // Update tasks that used a deleted or renamed label
        const deletedLabelNames = oldLabels.filter(ol => !newLabels.some(nl => nl.name === ol.name)).map(l => l.name);
        if (deletedLabelNames.length > 0) {
            setTasks(currentTasks => currentTasks.map(task => ({
                ...task,
                labels: task.labels?.filter(l => !deletedLabelNames.includes(l))
            })));
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
          availableLabels={availableLabels}
      />
       <LabelManagerDialog
          isOpen={isLabelManagerOpen}
          setIsOpen={setIsLabelManagerOpen}
          labels={availableLabels}
          onLabelsChange={handleLabelsChange}
        />
      <div className="flex-1 flex flex-col overflow-hidden h-full">
          <div className="p-4 bg-background border-b flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
              </div>
              <div>
                <Button variant="outline" size="sm" onClick={() => setIsLabelManagerOpen(true)}>
                    <Tag className="mr-2 h-4 w-4" />
                    Gérer les étiquettes
                </Button>
              </div>
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
                          availableLabels={availableLabels}
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
