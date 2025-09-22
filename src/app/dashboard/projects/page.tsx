"use client";

import { ProjectBoard } from '@/components/projects/project-board';
import { mockProjects, mockTaskLists, mockTasks, mockCollaborators } from '@/lib/data';

export default function ProjectsPage() {
    const project = mockProjects[0];
    const lists = mockTaskLists.filter(list => list.projectId === project.id);
    const tasks = mockTasks.filter(task => lists.some(list => list.id === task.listId));

    return (
        <div className="h-full flex flex-col">
            <ProjectBoard
                project={project}
                initialLists={lists}
                initialTasks={tasks}
                collaborators={mockCollaborators}
            />
        </div>
    );
}
