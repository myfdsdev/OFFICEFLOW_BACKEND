import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock4, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function CustomShifts() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", start_time: "09:00", end_time: "18:00" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.shifts.list();
      setShifts(data || []);
    } catch (err) {
      toast.error(err?.error || "Failed to load shifts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!draft.name.trim()) {
      toast.error("Shift name is required");
      return;
    }
    try {
      await base44.shifts.create(draft);
      toast.success("Shift created");
      setDraft({ name: "", start_time: "09:00", end_time: "18:00" });
      setCreating(false);
      load();
    } catch (err) {
      toast.error(err?.error || "Failed to create shift");
    }
  };

  const handleUpdate = async (id) => {
    try {
      await base44.shifts.update(id, draft);
      toast.success("Shift updated");
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err?.error || "Failed to update shift");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this shift? Employees assigned to it will be unassigned.")) return;
    try {
      await base44.shifts.remove(id);
      toast.success("Shift deleted");
      load();
    } catch (err) {
      toast.error(err?.error || "Failed to delete shift");
    }
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setDraft({ name: s.name, start_time: s.start_time, end_time: s.end_time });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock4 className="w-5 h-5 text-indigo-600" />
          Custom Shifts
        </CardTitle>
        <CardDescription>
          Create named shifts (e.g. Morning, Night) and assign them to specific employees.
          An employee with an assigned shift overrides the global office hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-gray-400">Loading shifts...</div>
        ) : shifts.length === 0 && !creating ? (
          <div className="text-sm text-gray-500">No custom shifts yet.</div>
        ) : (
          <div className="space-y-2">
            {shifts.map((s) =>
              editingId === s._id ? (
                <div
                  key={s._id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end p-3 border rounded-lg bg-indigo-50"
                >
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Start</Label>
                    <Input
                      type="time"
                      value={draft.start_time}
                      onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input
                      type="time"
                      value={draft.end_time}
                      onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(s._id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={s._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    <div className="text-sm text-gray-500">
                      {s.start_time} – {s.end_time}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(s)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(s._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {creating ? (
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end p-3 border-2 border-dashed rounded-lg">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="e.g. Morning Shift"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Start</Label>
              <Input
                type="time"
                value={draft.start_time}
                onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label>End</Label>
              <Input
                type="time"
                value={draft.end_time}
                onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate}>
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCreating(false);
                  setDraft({ name: "", start_time: "09:00", end_time: "18:00" });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setCreating(true)}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add new shift
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
