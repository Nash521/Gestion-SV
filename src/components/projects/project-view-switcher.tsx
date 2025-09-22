"use client"

import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectViewSwitcherProps {
  currentView: 'board' | 'table' | 'calendar';
  onViewChange: (view: 'board' | 'table' | 'calendar') => void;
}

export function ProjectViewSwitcher({ currentView, onViewChange }: ProjectViewSwitcherProps) {
  return (
    <div className="flex items-center gap-2 p-4 border-b">
       <h1 className="text-xl font-bold">Tableau de Projet</h1>
      <div className="ml-auto">
        <Button
          variant={currentView === 'board' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('board')}
          className={cn(currentView === 'board' && "font-bold")}
        >
          <LayoutGrid className="mr-2 h-4 w-4" />
          Kanban
        </Button>
        <Button
          variant={currentView === 'table' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('table')}
           className={cn(currentView === 'table' && "font-bold")}
        >
          <List className="mr-2 h-4 w-4" />
          Tableau
        </Button>
        <Button
          variant={currentView === 'calendar' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('calendar')}
           className={cn(currentView === 'calendar' && "font-bold")}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Calendrier
        </Button>
      </div>
    </div>
  );
}
