"use client";

import React, { useMemo, useState } from "react";
import { Kanban as KanbanIcon, Plus, MoreHorizontal, Clock, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOCK_TASKS } from "@/lib/mock-data";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { taskService } from "@/services/task-service";

const COLUMNS = ["To Do", "In Progress", "Review", "Done"];

export default function ProjectsPage() {
  const db = useFirestore();
  const { user } = useUser();
  
  // Memoize Firestore Collection
  const tasksCol = useMemoFirebase(() => user ? collection(db, "tasks") : null, [db, user]);
  const { data: fbTasks, loading } = useCollection(tasksCol);

  const tasks = useMemo(() => (fbTasks && fbTasks.length > 0) ? fbTasks : MOCK_TASKS, [fbTasks]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("taskId", id);
  };

  const onDrop = (e: React.DragEvent, status: string) => {
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find((t: any) => t.id === taskId);
    if (task && fbTasks && fbTasks.length > 0) {
      taskService.updateTaskStatus(db, taskId, status);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  const handleCreateTask = () => {
    taskService.createTask(db, { 
      title: 'New Workflow Task', 
      status: 'To Do', 
      priority: 'Medium', 
      assignee: user?.displayName || 'Unassigned', 
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-8 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Tasks</h1>
        </div>
        <div className="flex gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin mt-3" />}
          <Button onClick={handleCreateTask}>
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 h-full min-w-[1000px]">
          {COLUMNS.map(column => (
            <div 
              key={column} 
              className="flex-1 flex flex-col bg-secondary/30 rounded-lg p-3 min-w-[250px]"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, column)}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{column}</h3>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{tasks.filter((t: any) => t.status === column).length}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {tasks.filter((t: any) => t.status === column).map((task: any) => (
                  <Card 
                    key={task.id} 
                    draggable 
                    onDragStart={(e) => onDragStart(e, task.id)}
                    className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors shadow-sm"
                  >
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-tight">{task.title}</span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={cn("text-[10px] uppercase px-1.5 h-5", getPriorityColor(task.priority))}>
                          {task.priority || 'Low'}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {task.dueDate}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-[11px] font-medium">{task.assignee}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {tasks.filter((t: any) => t.status === column).length === 0 && (
                  <div className="text-[10px] text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
