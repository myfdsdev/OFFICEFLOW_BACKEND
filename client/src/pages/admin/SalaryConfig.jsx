import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Edit2,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

const THEME = {
  bg: "#000000",
  surface: "#040700",
  surface2: "#070b00",
  border: "#1B211A",
  borderSoft: "#1c2505",
  accent: "#a3d312",
  accentSoft: "#b7ea20",
  accentTextDark: "#0a0d00",
  muted: "#8a9472",
  muted2: "#66704f",
  text: "#f4f7ea",
  danger: "#ff6b6b",
};

function EditSalaryModal({ isOpen, onClose, employee, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    base_salary: employee?.base_salary || 0,
    hra: employee?.allowances?.hra || 0,
    travel: employee?.allowances?.travel || 0,
    other: employee?.allowances?.other || 0,
    bonuses: employee?.bonuses || 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.base_salary) {
      toast.error('Base salary is required');
      return;
    }

    await onSave({
      user_id: employee.user_id,
      base_salary: formData.base_salary,
      allowances: {
        hra: formData.hra,
        travel: formData.travel,
        other: formData.other,
      },
      bonuses: formData.bonuses,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{ background: THEME.surface, color: THEME.text }}>
        <DialogHeader>
          <DialogTitle>Edit Salary - {employee?.full_name}</DialogTitle>
          <DialogDescription style={{ color: THEME.muted }}>
            Update salary components for this employee
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="base_salary" style={{ color: THEME.text }}>
              Base Salary
            </Label>
            <Input
              id="base_salary"
              name="base_salary"
              type="number"
              value={formData.base_salary}
              onChange={handleChange}
              style={{ borderColor: THEME.border }}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hra" style={{ color: THEME.text }}>
                HRA
              </Label>
              <Input
                id="hra"
                name="hra"
                type="number"
                value={formData.hra}
                onChange={handleChange}
                style={{ borderColor: THEME.border }}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="travel" style={{ color: THEME.text }}>
                Travel
              </Label>
              <Input
                id="travel"
                name="travel"
                type="number"
                value={formData.travel}
                onChange={handleChange}
                style={{ borderColor: THEME.border }}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="other" style={{ color: THEME.text }}>
                Other
              </Label>
              <Input
                id="other"
                name="other"
                type="number"
                value={formData.other}
                onChange={handleChange}
                style={{ borderColor: THEME.border }}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="bonuses" style={{ color: THEME.text }}>
                Monthly Bonus
              </Label>
              <Input
                id="bonuses"
                name="bonuses"
                type="number"
                value={formData.bonuses}
                onChange={handleChange}
                style={{ borderColor: THEME.border }}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            style={{ borderColor: THEME.border, color: THEME.text }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{ background: THEME.accent, color: THEME.accentTextDark }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SalaryConfig() {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['salaryConfigs'],
    queryFn: () => base44.salary.config.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['salaryConfigEmployees'],
    queryFn: () => base44.entities.User.list('full_name', 500),
    staleTime: 5 * 60 * 1000,
  });

  const { data: appSettings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.appSettings.get(),
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.salary.config.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryConfigs'] });
      setIsModalOpen(false);
      toast.success('Salary updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update salary');
    },
  });

  const handleEditClick = (config) => {
    setSelectedEmployee({
      ...config,
      full_name: config.user_id?.full_name || 'Unknown',
      user_id: config.user_id?._id || config.user_id?.id,
    });
    setIsModalOpen(true);
  };

  const salaryRows = employees.map((employee) => {
    const config = configs.find((item) => {
      const configUserId = item.user_id?._id || item.user_id?.id || item.user_id;
      return String(configUserId) === String(employee._id || employee.id);
    });

    return {
      _id: config?._id || employee._id || employee.id,
      user_id: employee,
      base_salary: config?.base_salary || 0,
      allowances: config?.allowances || { hra: 0, travel: 0, other: 0 },
      bonuses: config?.bonuses || 0,
      hasConfig: !!config,
    };
  });

  const isLoading = configsLoading || employeesLoading;

  const currencySymbol = appSettings?.currency_symbol || '₹';

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: THEME.bg, color: THEME.text }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8" style={{ color: THEME.accent }} />
            <h1 className="text-3xl font-bold">Salary Configuration</h1>
          </div>
          <p style={{ color: THEME.muted }}>
            Manage employee salary details and allowances
          </p>
        </div>

        {/* Main Card */}
        <Card
          style={{
            background: THEME.surface,
            borderColor: THEME.border,
          }}
          className="border rounded-2xl"
        >
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: THEME.accent }} />
              </div>
            ) : salaryRows.length === 0 ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{
                  background: THEME.surface2,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <AlertCircle
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: THEME.muted }}
                />
                <p style={{ color: THEME.muted }}>
                  No employees found. Add employees before configuring salary.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: THEME.border }}>
                      <TableHead style={{ color: THEME.accent }}>
                        Employee Name
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }}>
                        Base Salary
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }}>
                        HRA
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }}>
                        Total Allowances
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }}>
                        Bonus
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }} className="text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryRows.map((config) => {
                      const totalAllowances =
                        (config.allowances?.hra || 0) +
                        (config.allowances?.travel || 0) +
                        (config.allowances?.other || 0);

                      return (
                        <TableRow
                          key={config._id}
                          style={{ borderColor: THEME.border }}
                        >
                          <TableCell
                            style={{ color: THEME.text }}
                            className="font-medium"
                          >
                            {config.user_id?.full_name || 'Unknown'}
                          </TableCell>
                          <TableCell style={{ color: THEME.text }}>
                            {currencySymbol}
                            {config.base_salary?.toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                            })}
                          </TableCell>
                          <TableCell style={{ color: THEME.text }}>
                            {currencySymbol}
                            {config.allowances?.hra?.toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                            }) || '0'}
                          </TableCell>
                          <TableCell style={{ color: THEME.text }}>
                            {currencySymbol}
                            {totalAllowances.toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                            })}
                          </TableCell>
                          <TableCell style={{ color: THEME.text }}>
                            {currencySymbol}
                            {config.bonuses?.toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                            }) || '0'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(config)}
                              style={{
                                color: THEME.accent,
                                background: `${THEME.accent}08`,
                              }}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              {config.hasConfig ? 'Edit' : 'Set Salary'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      <EditSalaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={selectedEmployee}
        onSave={updateMutation.mutate}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
