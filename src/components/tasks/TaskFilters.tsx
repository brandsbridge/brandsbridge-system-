import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface TaskFiltersProps {
  filters: {
    search: string;
    assignee: string;
    department: string;
    priority: string;
    overdueOnly: boolean;
  };
  setFilters: (filters: any) => void;
  employees: any[];
}

export function TaskFilters({ filters, setFilters, employees }: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-lg border shadow-sm">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          className="pl-8 h-9"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <Select value={filters.assignee} onValueChange={(val) => setFilters({ ...filters, assignee: val })}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          {employees.map(emp => (
            <SelectItem key={emp.id} value={emp.id}>{emp.name || emp.displayName}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.department} onValueChange={(val) => setFilters({ ...filters, department: val })}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Depts</SelectItem>
          <SelectItem value="Chocolate">Chocolate</SelectItem>
          <SelectItem value="Cosmetics">Cosmetics</SelectItem>
          <SelectItem value="Detergents">Detergents</SelectItem>
          <SelectItem value="Admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.priority} onValueChange={(val) => setFilters({ ...filters, priority: val })}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center space-x-2 pl-2 border-l">
        <Switch 
          id="overdue-mode" 
          checked={filters.overdueOnly}
          onCheckedChange={(val) => setFilters({ ...filters, overdueOnly: val })}
        />
        <Label htmlFor="overdue-mode" className="text-sm font-medium cursor-pointer">
          Overdue Only
        </Label>
      </div>
    </div>
  );
}
