import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/services/task-service";

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
  onEditInline?: (task: Task, newTitle: string) => void;
}

export function TaskCard({ task, index, onClick, onEditInline }: TaskCardProps) {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "done";

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white hover:bg-red-600';
      case 'medium': return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'low': return 'bg-green-500 text-white hover:bg-green-600';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getDepartmentColor = (dept: string) => {
    switch (dept) {
      case 'Chocolate': return 'border-amber-700/50 text-amber-700 bg-amber-50';
      case 'Cosmetics': return 'border-pink-600/50 text-pink-600 bg-pink-50';
      case 'Detergents': return 'border-blue-600/50 text-blue-600 bg-blue-50';
      case 'Admin': return 'border-slate-600/50 text-slate-600 bg-slate-50';
      default: return 'border-gray-200';
    }
  };

  const initials = task.assigneeName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={cn(
            "mb-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors shadow-sm relative group",
            snapshot.isDragging && "shadow-lg scale-105 border-primary z-50",
            isOverdue && "border-red-500/50 bg-red-50/10"
          )}
        >
          <CardContent className="p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium leading-tight line-clamp-2">
                {task.title}
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {task.department && (
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", getDepartmentColor(task.department))}>
                  {task.department}
                </Badge>
              )}
              {task.linkedName && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 max-w-[120px] truncate">
                  {task.linkedName}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-[10px] uppercase px-1.5 h-5", getPriorityColor(task.priority))}>
                  {task.priority || 'low'}
                </Badge>
                
                {task.comments?.length > 0 && (
                  <div className="flex items-center text-[10px] text-muted-foreground gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {task.comments.length}
                  </div>
                )}
              </div>
              
              <div className={cn("flex items-center gap-1 text-[10px]", isOverdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
                {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 mt-1 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground border-2 border-background shadow-sm">
                  {initials || '?'}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[100px]">
                  {task.assigneeName || 'Unassigned'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}
