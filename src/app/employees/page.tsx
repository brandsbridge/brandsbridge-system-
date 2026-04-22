"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo, useState } from "react";
import { Users, Briefcase, Building, Plus, Trash2, Edit, Loader2, MoreVertical, UserCheck, UserX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  Tooltip,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_EMPLOYEES } from "@/lib/mock-data";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, updateDoc, Timestamp } from "firebase/firestore";
import { userService } from "@/services/user-service";
import { toast } from "@/hooks/use-toast";

const COLORS = ['#755EDE', '#5182E0', '#F59E0B', '#EF4444', '#10B981'];

export default function EmployeesPage() {
  const db = useFirestore();
  const { user } = useUser();

  const employeesCol = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "employees");
  }, [db, user]);

  const { data: fbEmployees, isLoading: loading } = useCollection(employeesCol);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("sales");
  const [formDepartment, setFormDepartment] = useState("chocolate");
  const [formEmployeeType, setFormEmployeeType] = useState<"regular" | "sales">("regular");
  const [formBaseSalary, setFormBaseSalary] = useState("");
  const [formDeductionAbsence, setFormDeductionAbsence] = useState("");
  const [formDeductionLate, setFormDeductionLate] = useState("");
  const [formJoinDate, setFormJoinDate] = useState("");

  const employees = (fbEmployees && fbEmployees.length > 0) ? fbEmployees : MOCK_EMPLOYEES;
  const departments = Array.from(new Set(employees.map((e: any) => e.department)));

  const deptData = useMemo(() => {
    return departments.map(dept => ({
      name: dept,
      value: employees.filter((e: any) => e.department === dept).length,
    }));
  }, [departments, employees]);

  const resetForm = () => {
    setEditingId(null);
    setFormName("");
    setFormEmail("");
    setFormRole("sales");
    setFormDepartment("chocolate");
    setFormEmployeeType("regular");
    setFormBaseSalary("");
    setFormDeductionAbsence("");
    setFormDeductionLate("");
    setFormJoinDate("");
  };

  const openEdit = (emp: any) => {
    setEditingId(emp.id);
    setFormName(emp.name || "");
    setFormEmail(emp.email || "");
    setFormRole(emp.role || "sales");
    setFormDepartment(emp.department || "chocolate");
    setFormEmployeeType(emp.employeeType || "regular");
    setFormBaseSalary(emp.baseSalary?.toString() || "");
    setFormDeductionAbsence(emp.deductionPerAbsence?.toString() || "");
    setFormDeductionLate(emp.deductionPerLateArrival?.toString() || "");
    setFormJoinDate(emp.joinDate || "");
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name and Email are required." });
      return;
    }
    const data: any = {
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      department: formDepartment,
      employeeType: formEmployeeType,
      joinDate: formJoinDate || new Date().toISOString().split("T")[0],
      isActive: true,
    };
    if (formEmployeeType === "regular") {
      data.baseSalary = parseFloat(formBaseSalary) || 0;
      data.deductionPerAbsence = parseFloat(formDeductionAbsence) || 0;
      data.deductionPerLateArrival = parseFloat(formDeductionLate) || 0;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, "employees", editingId), { ...data, updatedAt: Timestamp.now() });
        toast({ title: "Employee Updated" });
      } else {
        data.status = "active";
        userService.createEmployee(db, data);
        toast({ title: "Employee Created" });
      }
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    }
  };

  const toggleActive = async (emp: any) => {
    try {
      const newActive = emp.isActive === false ? true : false;
      await updateDoc(doc(db, "employees", emp.id), { isActive: newActive, updatedAt: Timestamp.now() });
      toast({ title: newActive ? "Employee Activated" : "Employee Deactivated" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    }
  };

  const activeCount = employees.filter((e: any) => e.isActive !== false).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Employees & Access</h1>
          <p className="text-muted-foreground">Manage your team members and their system permissions.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Team Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Agents</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter((e: any) => e.employeeType === "sales").length}</div>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp: any) => (
                  <TableRow key={emp.id} className={emp.isActive === false ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-[10px] text-muted-foreground">{emp.email}</div>
                    </TableCell>
                    <TableCell>
                      {emp.employeeType === "sales" ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] uppercase">Sales</Badge>
                      ) : (
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] uppercase">Regular</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase">{emp.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">{emp.department}</Badge>
                    </TableCell>
                    <TableCell>
                      {emp.isActive === false ? (
                        <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                      ) : (
                        <Badge className="bg-green-500">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setTimeout(() => openEdit(emp), 0)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => toggleActive(emp)}
                            className={emp.isActive === false ? "text-green-500" : "text-destructive"}
                          >
                            {emp.isActive === false ? (
                              <><UserCheck className="mr-2 h-4 w-4" /> Activate</>
                            ) : (
                              <><UserX className="mr-2 h-4 w-4" /> Deactivate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => emp.id && userService.deleteEmployee(db, emp.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {deptData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit Employee Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Employee" : "Register New Employee"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Full Name</Label>
                <Input id="emp-name" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="e.g. Michael Chen" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Email Address</Label>
                <Input id="emp-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required placeholder="m.chen@brandsbridge.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">System Role</Label>
                  <Select value={formRole} onValueChange={setFormRole}>
                    <SelectTrigger id="emp-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Department</Label>
                  <Select value={formDepartment} onValueChange={setFormDepartment}>
                    <SelectTrigger id="emp-dept"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chocolate">Chocolate</SelectItem>
                      <SelectItem value="cosmetics">Cosmetics</SelectItem>
                      <SelectItem value="detergents">Detergents</SelectItem>
                      <SelectItem value="all">All (Global)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Employee Type</Label>
                  <Select value={formEmployeeType} onValueChange={(v: any) => setFormEmployeeType(v)}>
                    <SelectTrigger id="emp-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="sales">Sales Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">Join Date</Label>
                  <Input id="emp-join-date" type="date" value={formJoinDate} onChange={(e) => setFormJoinDate(e.target.value)} />
                </div>
              </div>
              {formEmployeeType === "regular" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Base Salary (QAR)</Label>
                    <Input id="emp-salary" type="number" step="0.01" value={formBaseSalary} onChange={(e) => setFormBaseSalary(e.target.value)} placeholder="e.g. 5000" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Deduction / Absence</Label>
                      <Input id="emp-ded-abs" type="number" step="0.01" value={formDeductionAbsence} onChange={(e) => setFormDeductionAbsence(e.target.value)} placeholder="e.g. 200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Deduction / Late</Label>
                      <Input id="emp-ded-late" type="number" step="0.01" value={formDeductionLate} onChange={(e) => setFormDeductionLate(e.target.value)} placeholder="e.g. 50" />
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingId ? "Save Changes" : "Create Account"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
