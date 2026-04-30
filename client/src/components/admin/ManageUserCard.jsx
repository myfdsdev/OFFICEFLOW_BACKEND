import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings as SettingsIcon,
  Mail,
  Trash2,
  KeyRound,
  Save,
  Power,
  PowerOff,
  Clock4,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return "—";
  }
};

export default function ManageUserCard({ employee, onUpdated }) {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    employee_id: "",
    department: "",
    mobile_number: "",
    role: "user",
    is_active: true,
    shift_id: "",
  });

  useEffect(() => {
    base44.shifts.list().then(setShifts).catch(() => setShifts([]));
  }, []);

  useEffect(() => {
    if (!employee) return;
    setForm({
      full_name: employee.full_name || "",
      employee_id: employee.employee_id || "",
      department: employee.department || "",
      mobile_number: employee.mobile_number || "",
      role: employee.role || "user",
      is_active: employee.is_active !== false,
      shift_id: employee.shift_id?._id || employee.shift_id || "",
    });
  }, [employee]);

  const userId = employee?.id || employee?._id;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await base44.users.adminUpdate(userId, {
        full_name: form.full_name,
        employee_id: form.employee_id,
        department: form.department,
        mobile_number: form.mobile_number,
        role: form.role,
        is_active: form.is_active,
      });

      // Shift assignment goes through its own endpoint
      const currentShift = employee.shift_id?._id || employee.shift_id || "";
      if (form.shift_id !== currentShift) {
        await base44.shifts.assignToUser(userId, form.shift_id || null);
      }

      toast.success("User updated");
      onUpdated?.(updated);
    } catch (err) {
      toast.error(err?.error || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleSendReset = async () => {
    if (!window.confirm(`Send a password-reset email to ${employee.email}?`)) return;
    setResetting(true);
    try {
      await base44.users.sendPasswordReset(userId);
      toast.success("Password reset email sent");
    } catch (err) {
      toast.error(err?.error || "Failed to send reset email");
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete ${employee.email}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await base44.users.adminDelete(userId);
      toast.success("User deleted");
      navigate("/AdminDashboard");
    } catch (err) {
      toast.error(err?.error || "Failed to delete user");
      setDeleting(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <SettingsIcon className="w-5 h-5 text-indigo-600" />
          Manage User
        </CardTitle>
        <CardDescription>Edit profile, role, status, shift, and security actions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Editable fields */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Employee ID</Label>
            <Input
              value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Mobile number</Label>
            <Input
              value={form.mobile_number}
              onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded-md px-3 py-2 bg-white text-sm h-10"
            >
              <option value="user">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock4 className="w-4 h-4" /> Shift
            </Label>
            <select
              value={form.shift_id}
              onChange={(e) => setForm({ ...form, shift_id: e.target.value })}
              className="w-full border rounded-md px-3 py-2 bg-white text-sm h-10"
            >
              <option value="">None (use global office hours)</option>
              {shifts.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.start_time} – {s.end_time})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
          <div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              {form.is_active ? (
                <Power className="w-4 h-4 text-emerald-600" />
              ) : (
                <PowerOff className="w-4 h-4 text-rose-600" />
              )}
              Account {form.is_active ? "Active" : "Deactivated"}
            </div>
            <div className="text-xs text-gray-500">
              {form.is_active
                ? "User can log in and use the app."
                : "User cannot log in. Existing sessions are disconnected."}
            </div>
          </div>
          <Button
            type="button"
            variant={form.is_active ? "outline" : "default"}
            className={form.is_active ? "" : "bg-emerald-600 hover:bg-emerald-700"}
            onClick={() => setForm({ ...form, is_active: !form.is_active })}
          >
            {form.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>

        {/* Read-only metadata */}
        <div className="grid md:grid-cols-2 gap-3 text-sm bg-gray-50 rounded-lg p-3">
          <div>
            <div className="text-gray-500">Email</div>
            <div className="font-medium text-gray-800">{employee.email}</div>
          </div>
          <div>
            <div className="text-gray-500">Auth provider</div>
            <div className="font-medium text-gray-800 capitalize">
              {employee.auth_provider || "local"}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Created</div>
            <div className="font-medium text-gray-800">
              {formatDate(employee.createdAt || employee.created_date)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Last updated</div>
            <div className="font-medium text-gray-800">
              {formatDate(employee.updatedAt || employee.updated_date)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Last active</div>
            <div className="font-medium text-gray-800">{formatDate(employee.last_active)}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-2 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={resetting || employee.auth_provider === "google"}
            onClick={handleSendReset}
            title={
              employee.auth_provider === "google"
                ? "Google-authenticated users cannot reset password"
                : ""
            }
          >
            <KeyRound className="w-4 h-4 mr-2" />
            {resetting ? "Sending..." : "Send password reset"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-red-600 hover:text-red-700 ml-auto"
            disabled={deleting}
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? "Deleting..." : "Delete user"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
