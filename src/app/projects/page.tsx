"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo, useState, useEffect } from "react";
import { Plus, MoreHorizontal, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { taskService, Task } from "@/services/task-service";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";

import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "inprogress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" }
];

export default function ProjectsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);
  
  const tasksCol = useMemoFirebase(() => user ? collection(db, "tasks") : null, [db, user]);
  const employeesCol = useMemoFirebase(() => user ? collection(db, "employees") : null, [db, user]);
  
  const { data: fbTasks, isLoading: isTasksLoading } = useCollection(tasksCol);
  const { data: employees } = useCollection(employeesCol);

  const [filters, setFilters] = useState({
    search: "",
    assignee: "all",
    department: "all",
    priority: "all",
    overdueOnly: false,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasks = useMemo(() => (fbTasks as Task[]) || [], [fbTasks]);
  const safeEmployees = employees || [];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.assignee !== "all" && task.assigneeId !== filters.assignee) return false;
      if (filters.department !== "all" && task.department !== filters.department) return false;
      if (filters.priority !== "all" && task.priority !== filters.priority) return false;
      if (filters.overdueOnly && (new Date(task.dueDate) >= new Date() || task.status === "done")) return false;
      return true;
    });
  }, [tasks, filters]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    taskService.updateTaskStatus(db, draggableId, destination.droppableId);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      taskService.updateTask(db, editingTask.id, taskData);
    } else {
      taskService.createTask(db, {
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: [],
        activityLog: [{ action: "Created task", user: user?.displayName || "Unknown", timestamp: new Date().toISOString() }],
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    taskService.deleteTask(db, taskId);
  };

  const handleAddComment = (taskId: string, commentText: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    taskService.addComment(db, taskId, {
      id: Date.now().toString(),
      text: commentText,
      createdBy: user?.displayName || 'Unknown User',
      createdAt: new Date().toISOString()
    }, task.comments || []);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Tasks</h1>
        </div>
        <div className="flex gap-2">
          {isTasksLoading && <Loader2 className="h-4 w-4 animate-spin mt-3" />}
          <Button onClick={() => { setEditingTask(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      <TaskFilters filters={filters} setFilters={setFilters} employees={safeEmployees} />

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-[1000px]">
            {COLUMNS.map(column => {
              const colTasks = filteredTasks.filter(t => t.status === column.id);
              
              return (
                <div key={column.id} className="flex-1 flex flex-col bg-secondary/30 rounded-lg p-3 min-w-[250px]">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{column.label}</h3>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{colTasks.length}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar min-h-[150px] transition-colors rounded-lg ${snapshot.isDraggingOver ? 'bg-secondary/50' : ''}`}
                      >
                        {colTasks.map((task, index) => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            index={index} 
                            onClick={() => { setSelectedTask(task); setIsDetailOpen(true); }}
                          />
                        ))}
                        {provided.placeholder}
                        {colTasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="text-[10px] text-muted-foreground text-center py-8 border border-dashed border-border/50 rounded-lg">
                            No tasks
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <TaskFormModal 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        employees={safeEmployees}
        initialData={editingTask}
      />

      <TaskDetailPanel 
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedTask(null); }}
        task={selectedTask}
        onEdit={(task) => { setIsDetailOpen(false); setEditingTask(task); setIsFormOpen(true); }}
        onDelete={handleDeleteTask}
        onMarkComplete={(id) => { taskService.updateTaskStatus(db, id, "done"); setIsDetailOpen(false); }}
        onAddComment={handleAddComment}
        currentUser={user}
      />
    </div>
  );
}
