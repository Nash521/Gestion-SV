"use client";

import { useState } from 'react';
import { ProjectBoard } from '@/components/projects/project-board';
import { ProjectTableView } from '@/components/projects/project-table-view';
import { mockProjects, mockTaskLists, mockTasks, mockCollaborators } from '@/lib/data';
import { ProjectViewSwitcher } from '@/components/projects/project-view-switcher';

export default function ProjectsPage() {
    const [view, setView] = useState<'board' | 'table'>('board');
    const project = mockProjects[0];
    const lists = mockTaskLists.filter(list => list.projectId === project.id);
    const tasks = mockTasks.filter(task => lists.some(list => list.id === task.listId));

    return (
        <div className="h-full flex flex-col">
             <ProjectViewSwitcher currentView={view} onViewChange={setView} />
             {view === 'board' ? (
                <ProjectBoard
                    project={project}
                    initialLists={lists}
                    initialTasks={tasks}
                    collaborators={mockCollaborators}
                />
             ) : (
                <ProjectTableView
                    tasks={tasks}
                    lists={lists}
                    collaborators={mockCollaborators}
                />
             )}
        </div>
    );
}
