import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/services/task-service";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  employees: any[];
  initialData?: Task | null;
}

export function TaskFormModal({ isOpen, onClose, onSave, employees, initialData }: TaskFormModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    assigneeId: "",
    department: "",
    priority: "medium",
    status: "todo",
    dueDate: new Date().toISOString().split('T')[0],
    linkedName: "",
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        ...initialData,
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "",
      });
    } else if (isOpen) {
      setFormData({
        title: "",
        description: "",
        assigneeId: "",
        department: "",
        priority: "medium",
        status: "todo",
        dueDate: new Date().toISOString().split('T')[0],
        linkedName: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.assigneeId || !formData.department) return;
    
    const assignee = employees.find(emp => emp.id === formData.assigneeId);
    
    onSave({
      ...formData,
      assigneeName: assignee ? (assignee.name || assignee.displayName) : "Unassigned",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title <span className="text-red-500">*</span></Label>
            <Input 
              id="title" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assign To <span className="text-red-500">*</span></Label>
              <Select value={formData.assigneeId} onValueChange={val => setFormData({...formData, assigneeId: val})} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name || emp.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department <span className="text-red-500">*</span></Label>
              <Select value={formData.department} onValueChange={val => setFormData({...formData, department: val})} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chocolate">Chocolate</SelectItem>
                  <SelectItem value="Cosmetics">Cosmetics</SelectItem>
                  <SelectItem value="Detergents">Detergents</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={val => setFormData({...formData, priority: val as any})}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <span className="flex items-center text-red-500 font-medium">High</span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center text-orange-500 font-medium">Medium</span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="flex items-center text-green-500 font-medium">Low</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input 
                type="date" 
                value={formData.dueDate} 
                onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Link to Customer/Supplier (Optional)</Label>
            <Input 
              placeholder="e.g. Al Noor Trading Co" 
              value={formData.linkedName} 
              onChange={e => setFormData({...formData, linkedName: e.target.value})} 
            />
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
