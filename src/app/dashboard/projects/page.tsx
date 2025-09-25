"use client";

import { useState, useEffect } from 'react';
import { ProjectBoard } from '@/components/projects/project-board';
import { ProjectTableView } from '@/components/projects/project-table-view';
import { ProjectCalendarView } from '@/components/projects/project-calendar-view';
import { ProjectGanttView } from '@/components/projects/project-gantt-view';
import { subscribeToProjects, subscribeToTaskLists, subscribeToProjectTasks } from '@/lib/firebase/services';
import type { Project, TaskList, ProjectTask, Collaborator } from '@/lib/definitions';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { mockCollaborators } from '@/lib/data'; // Collaborators are still mock for now

export default function ProjectsPage() {
    const [view, setView] = useState<'board' | 'table' | 'calendar' | 'gantt'>('board');
    const [projects, setProjects] = useState<Project[]>([]);
    const [lists, setLists] = useState<TaskList[]>([]);
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const activeProject = projects[0];

    useEffect(() => {
        setIsLoading(true);

        const unsubProjects = subscribeToProjects(setProjects);
        
        // Let's assume we work on the first project. In a real app, you'd have a project selector.
        if (activeProject) {
            const unsubLists = subscribeToTaskLists(activeProject.id, setLists);
            const unsubTasks = subscribeToProjectTasks(activeProject.id, setTasks);
            
            // A simple way to detect when initial data has loaded
            Promise.all([
                new Promise(resolve => setTimeout(resolve, 1500)) // Give Firebase some time to load
            ]).then(() => {
                setIsLoading(false);
            });

            return () => {
                unsubLists();
                unsubTasks();
            };
        } else {
            // Handle case where there are no projects
            setIsLoading(false);
        }

        return () => {
            unsubProjects();
        };
    }, [activeProject?.id]);


    if (isLoading) {
        return <ProjectPageSkeleton />;
    }

    if (!activeProject) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <h2 className="text-2xl font-semibold">Aucun projet trouvé</h2>
                <p className="mt-2">Veuillez créer un projet pour commencer.</p>
                <Button className="mt-4">Créer un projet</Button>
            </div>
        );
    }

    const renderView = () => {
        switch (view) {
            case 'board':
                return (
                    <ProjectBoard
                        project={activeProject}
                        lists={lists}
                        tasks={tasks}
                        collaborators={mockCollaborators} // Using mock collaborators for now
                        currentView={view}
                        onViewChange={setView}
                    />
                );
            case 'table':
                 return (
                    <ProjectTableView
                        tasks={tasks}
                        lists={lists}
                        collaborators={mockCollaborators}
                        currentView={view}
                        onViewChange={setView}
                    />
                 );
            case 'calendar':
                return (
                    <ProjectCalendarView
                        tasks={tasks}
                        currentView={view}
                        onViewChange={setView}
                    />
                );
            case 'gantt':
                 return (
                    <ProjectGanttView
                        tasks={tasks}
                        project={activeProject}
                        currentView={view}
                        onViewChange={setView}
                    />
                );
            default:
                return null;
        }
    }

    return (
        <div className="h-full flex flex-col">
             {renderView()}
        </div>
    );
}

const ProjectPageSkeleton = () => (
    <div className="p-4 h-full">
        <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-96" />
        </div>
        <div className="flex gap-6 overflow-hidden">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="w-80 flex-shrink-0 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
            ))}
        </div>
    </div>
);
