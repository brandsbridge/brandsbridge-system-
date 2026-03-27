import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, Link as LinkIcon, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { Task } from "@/services/task-service";

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMarkComplete: (taskId: string) => void;
  onAddComment: (taskId: string, commentText: string) => void;
  currentUser: any;
}

export function TaskDetailPanel({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onMarkComplete,
  onAddComment,
  currentUser
}: TaskDetailPanelProps) {
  const [newComment, setNewComment] = useState("");

  if (!task) return null;

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    onAddComment(task.id, newComment.trim());
    setNewComment("");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-background border-l shadow-2xl overflow-hidden p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex justify-between items-start">
            <SheetTitle className="text-xl font-bold font-headline pr-8">{task.title}</SheetTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className={getPriorityColor(task.priority)}>{task.priority?.toUpperCase()}</Badge>
            <Badge variant="outline">{task.department}</Badge>
            <Badge variant="secondary">{task.status === "todo" ? "To Do" : task.status === "inprogress" ? "In Progress" : task.status === "review" ? "Review" : "Done"}</Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-2"><User className="h-3 w-3" /> Assignee</span>
                  <p className="font-medium">{task.assigneeName || 'Unassigned'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-3 w-3" /> Due Date</span>
                  <p className="font-medium">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</p>
                </div>
                {task.linkedName && (
                  <div className="space-y-1 col-span-2">
                    <span className="text-muted-foreground flex items-center gap-2"><LinkIcon className="h-3 w-3" /> Linked to</span>
                    <p className="font-medium text-primary cursor-pointer hover:underline">{task.linkedName}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Description</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {task.description || "No description provided."}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Comments & Activity</h3>
              <div className="space-y-4">
                {task.comments?.map((comment: any, idx: number) => (
                  <div key={idx} className="bg-muted p-3 rounded-lg text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">{comment.createdBy}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p>{comment.text}</p>
                  </div>
                ))}
                
                {(!task.comments || task.comments.length === 0) && (
                  <p className="text-sm text-muted-foreground italic text-center py-2">No comments yet</p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Input 
                  placeholder="Add a comment..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <Button onClick={handleAddComment} variant="secondary">Post</Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/30 grid grid-cols-3 gap-2 shrink-0">
          <Button variant="outline" onClick={() => onEdit(task)} className="w-full gap-2">
            <Edit className="h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => { onDelete(task.id); onClose(); }} className="w-full gap-2">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          {task.status !== "done" && (
            <Button onClick={() => onMarkComplete(task.id)} className="w-full gap-2 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4" /> Complete
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
