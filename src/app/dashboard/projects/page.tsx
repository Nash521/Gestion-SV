"use client";

import { useState } from 'react';
import { ProjectBoard } from '@/components/projects/project-board';
import { ProjectTableView } from '@/components/projects/project-table-view';
import { ProjectCalendarView } from '@/components/projects/project-calendar-view';
import { ProjectGanttView } from '@/components/projects/project-gantt-view';
import { mockProjects, mockTaskLists, mockTasks, mockCollaborators } from '@/lib/data';

export default function ProjectsPage() {
    const [view, setView] = useState<'board' | 'table' | 'calendar' | 'gantt'>('board');
    const project = mockProjects[0];
    const lists = mockTaskLists.filter(list => list.projectId === project.id);
    const tasks = mockTasks.filter(task => lists.some(list => list.id === task.listId));

    const renderView = () => {
        switch (view) {
            case 'board':
                return (
                    <ProjectBoard
                        project={project}
                        initialLists={lists}
                        initialTasks={tasks}
                        collaborators={mockCollaborators}
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
                        project={project}
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
