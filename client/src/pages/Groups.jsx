import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Users,
  Plus,
  Search,
  UserPlus,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/* ================= THEME ================= */

const glassCard =
  "rounded-[1.6rem] border border-lime-400/15 bg-[#020806]/80 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]";

/* ================= COMPONENT ================= */

export default function Groups() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [formData, setFormData] = useState({
    group_name: "",
    description: "",
    group_type: "custom",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  useEffect(() => {
    if (!feedback.message) return;
    const timer = setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.list("-created_date", 100),
    enabled: !!user,
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const groupName = formData.group_name.trim();

      if (!groupName) {
        throw new Error("Group name is required.");
      }

      return await base44.entities.Group.create({
        group_name: groupName,
        name: groupName,
        description: formData.description.trim(),
        group_type: formData.group_type,
        created_by: user.id,
        created_by_email: user.email,
        created_by_name: user.full_name,
      });
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });

      setCreateOpen(false);
      setFormData({
        group_name: "",
        description: "",
        group_type: "custom",
      });

      setFeedback({
        type: "success",
        message: "Group created successfully.",
      });
    },

    onError: (error) => {
      setFeedback({
        type: "error",
        message: error?.message || "Failed to create group.",
      });
    },
  });

  const filtered = groups.filter((group) => {
    const name = group.group_name || group.name || "";
    const description = group.description || "";

    return `${name} ${description}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-lime-300">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(132,255,0,0.13),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(0,255,163,0.10),transparent_30%),linear-gradient(135deg,#020617_0%,#020b08_45%,#000000_100%)]" />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
        {feedback.message && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              feedback.type === "success"
                ? "border-lime-400/20 bg-lime-400/10 text-lime-300"
                : "border-rose-400/20 bg-rose-500/10 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {feedback.message}
            </div>
          </div>
        )}

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`${glassCard} p-5`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">
                  Team{" "}
                  <span className="text-lime-300 drop-shadow-[0_0_10px_rgba(132,255,0,0.5)]">
                    Groups
                  </span>
                </h1>
                <p className="mt-1 text-sm text-lime-100/50">
                  Manage team groups and collaboration
                </p>
              </div>

              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-lime-400 font-bold text-black shadow-[0_0_20px_rgba(132,255,0,0.3)] hover:bg-lime-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* SEARCH */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`${glassCard} p-4`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-lime-300/40" />
              <input
                type="text"
                placeholder="Search groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-lime-400/15 bg-[#061006]/80 py-3 pl-10 pr-4 text-white outline-none placeholder:text-lime-100/30 focus:border-lime-400/40"
              />
            </div>
          </Card>
        </motion.div>

        {/* GROUP LIST */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {isLoading ? (
            <Card className={`${glassCard} p-12 text-center text-lime-100/60`}>
              Loading groups...
            </Card>
          ) : filtered.length === 0 ? (
            <Card className={`${glassCard} p-12 text-center`}>
              <Users className="mx-auto mb-4 h-10 w-10 text-lime-300" />
              <h2 className="mb-2 text-lg font-bold">No Groups Found</h2>
              <p className="mb-5 text-sm text-lime-100/50">
                Create your first team group to get started
              </p>

              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-lime-400 font-bold text-black hover:bg-lime-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((group) => (
                <Card key={group.id} className={`${glassCard} p-5`}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-bold text-white">
                        {group.group_name || group.name}
                      </h3>
                      <p className="mt-1 break-words text-sm text-lime-100/50">
                        {group.description || "No description"}
                      </p>
                    </div>

                    <Users className="shrink-0 text-lime-300" />
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-lime-100/40">
                      Type: {group.group_type || "custom"}
                    </span>

                    <Button
                      size="sm"
                      className="bg-lime-400 font-bold text-black hover:bg-lime-300"
                    >
                      <UserPlus className="mr-1 h-4 w-4" />
                      Manage
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* CREATE GROUP DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-[2rem] border border-lime-400/20 bg-[#020806] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Plus className="h-5 w-5 text-lime-300" />
              Create Group
            </DialogTitle>
            <DialogDescription className="text-lime-100/50">
              Create a real team group for collaboration.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              createGroupMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-lime-100/80">
                Group Name
              </label>
              <input
                value={formData.group_name}
                onChange={(e) =>
                  setFormData({ ...formData, group_name: e.target.value })
                }
                placeholder="Example: Design Team"
                className="w-full rounded-xl border border-lime-400/15 bg-[#061006]/80 px-4 py-3 text-white outline-none placeholder:text-lime-100/30 focus:border-lime-400/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-lime-100/80">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Short description..."
                rows={3}
                className="w-full resize-none rounded-xl border border-lime-400/15 bg-[#061006]/80 px-4 py-3 text-white outline-none placeholder:text-lime-100/30 focus:border-lime-400/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-lime-100/80">
                Group Type
              </label>
              <select
                value={formData.group_type}
                onChange={(e) =>
                  setFormData({ ...formData, group_type: e.target.value })
                }
                className="w-full rounded-xl border border-lime-400/15 bg-[#061006]/80 px-4 py-3 text-white outline-none focus:border-lime-400/40"
              >
                <option value="custom">Custom</option>
                <option value="attendance">Attendance</option>
                <option value="project">Project</option>
                <option value="department">Department</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="flex-1 border-lime-400/15 bg-transparent text-lime-100 hover:bg-lime-400/10 hover:text-lime-100"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={createGroupMutation.isPending}
                className="flex-1 bg-lime-400 font-bold text-black hover:bg-lime-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                {createGroupMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}