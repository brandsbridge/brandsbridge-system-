
"use client";

import React, { useMemo, useState } from "react";
import { Users, Briefcase, Building, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from "recharts";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MOCK_EMPLOYEES } from "@/lib/mock-data";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import { userService } from "@/services/user-service";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B', '#EF4444', '#10B981'];

export default function EmployeesPage() {
  const db = useFirestore();
  const { user } = useUser();
  
  // Properly memoize collection reference for Firestore hooks
  const employeesCol = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "employees");
  }, [db, user]);

  const { data: fbEmployees, isLoading: loading } = useCollection(employeesCol);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const employees = (fbEmployees && fbEmployees.length > 0) ? fbEmployees : MOCK_EMPLOYEES;
  const departments = Array.from(new Set(employees.map((e: any) => e.department)));
  
  const deptData = useMemo(() => {
    return departments.map(dept => ({
      name: dept,
      value: employees.filter((e: any) => e.department === dept).length
    }));
  }, [departments, employees]);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      department: formData.get('department'),
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    };
    userService.createEmployee(db, data);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Employees & Access</h1>
          <p className="text-muted-foreground">Manage your team members and their system permissions.</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddEmployee}>
              <DialogHeader>
                <DialogTitle>Register New Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Full Name</label>
                  <Input name="name" required placeholder="e.g. Michael Chen" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Email Address</label>
                  <Input name="email" type="email" required placeholder="m.chen@brandsbridge.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Role</label>
                    <Select name="role" defaultValue="sales">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Department</label>
                    <Select name="department" defaultValue="chocolate">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chocolate">Chocolate</SelectItem>
                        <SelectItem value="cosmetics">Cosmetics</SelectItem>
                        <SelectItem value="detergents">Detergents</SelectItem>
                        <SelectItem value="all">All (Global)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Account</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{employees.length}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Departments</CardTitle>
            <Building className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internal Health</CardTitle>
            <Briefcase className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Team Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp: any) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-[10px] text-muted-foreground">{emp.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase">{emp.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">{emp.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.status === 'active' ? 'default' : 'secondary'} className={emp.status === 'active' ? 'bg-green-500' : ''}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => emp.id && userService.deleteEmployee(db, emp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Split</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
