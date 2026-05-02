import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Eye,
  Download,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from 'react-router-dom';

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

function StatCard({ label, value, icon: Icon, currency = false }) {
  return (
    <Card
      className="p-5 rounded-2xl border"
      style={{
        background: THEME.surface2,
        borderColor: THEME.border,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.18em] mb-2"
            style={{ color: THEME.muted }}
          >
            {label}
          </p>
          <p
            className="text-2xl md:text-3xl font-semibold tracking-[-0.03em]"
            style={{ color: THEME.text }}
          >
            {currency ? '₹' : ''}{typeof value === 'number' ? value.toLocaleString('en-IN', { minimumFractionDigits: 0 }) : value}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(163,211,18,0.08)",
            border: `1px solid ${THEME.border}`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: THEME.accent }} />
        </div>
      </div>
    </Card>
  );
}

export default function SalaryBoard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), 'yyyy-MM')
  );

  const { data: boardData = [], isLoading } = useQuery({
    queryKey: ['salaryBoard', selectedMonth],
    queryFn: () => base44.salary.board(selectedMonth),
    staleTime: 5 * 60 * 1000,
  });

  const { data: appSettings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.appSettings.get(),
    staleTime: 5 * 60 * 1000,
  });

  const generateBulkMutation = useMutation({
    mutationFn: () => base44.salary.payslips.generateBulk({ month: selectedMonth }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryBoard'] });
      toast.success('Payslips generated successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to generate payslips');
    },
  });

  // Calculate summary stats
  const totalPayroll = boardData.reduce((sum, item) => sum + item.calcData.gross_salary, 0);
  const totalDeductions = boardData.reduce((sum, item) => sum + item.calcData.total_deductions, 0);
  const totalNet = boardData.reduce((sum, item) => sum + item.calcData.net_salary, 0);
  const paidCount = boardData.filter((item) => item.payslip_status === 'paid').length;

  const currencySymbol = appSettings?.currency_symbol || '₹';

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Draft', color: '#6b7280', bgColor: '#f3f4f6' },
      approved: { label: 'Approved', color: '#3b82f6', bgColor: '#eff6ff' },
      paid: { label: 'Paid', color: '#10b981', bgColor: '#f0fdf4' },
      none: { label: 'Not Generated', color: '#8a9472', bgColor: '#070b00' },
    };
    const statusInfo = statusMap[status] || statusMap.none;
    return (
      <Badge
        style={{
          background: statusInfo.bgColor,
          color: statusInfo.color,
          border: `1px solid ${statusInfo.color}33`,
        }}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: THEME.bg, color: THEME.text }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8" style={{ color: THEME.accent }} />
            <h1 className="text-3xl font-bold">Salary Board</h1>
          </div>
          <p style={{ color: THEME.muted }}>
            View and manage employee salaries for the selected month
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex-1">
            <label style={{ color: THEME.text }} className="text-sm font-medium block mb-2">
              Select Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                background: THEME.surface,
                borderColor: THEME.border,
                color: THEME.text,
              }}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div className="flex gap-2 md:pt-6">
            <Button
              onClick={() => generateBulkMutation.mutate()}
              disabled={generateBulkMutation.isPending || isLoading}
              style={{ background: THEME.accent, color: THEME.accentTextDark }}
            >
              {generateBulkMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Generate All
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Payroll" value={totalPayroll} icon={DollarSign} currency />
          <StatCard label="Total Deductions" value={totalDeductions} icon={AlertCircle} currency />
          <StatCard label="Total Net" value={totalNet} icon={TrendingUp} currency />
          <StatCard label="Employees Paid" value={paidCount} icon={Users} />
        </div>

        {/* Salary Table */}
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
            ) : boardData.length === 0 ? (
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
                  No salary data available for this month. Create salary configurations first.
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
                      <TableHead style={{ color: THEME.accent }} className="text-right">
                        Base Salary
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }} className="text-right">
                        Earnings
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }} className="text-right">
                        Deductions
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }} className="text-right">
                        Net Salary
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }} className="text-center">
                        Status
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }} className="text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boardData.map((item) => (
                      <TableRow
                        key={item.payslip_id || `${item.user._id}`}
                        style={{ borderColor: THEME.border }}
                      >
                        <TableCell
                          style={{ color: THEME.text }}
                          className="font-medium"
                        >
                          {item.user.full_name}
                        </TableCell>
                        <TableCell style={{ color: THEME.text }} className="text-right">
                          {currencySymbol}{item.calcData.base_salary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell style={{ color: THEME.text }} className="text-right">
                          {currencySymbol}{item.calcData.gross_salary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell style={{ color: THEME.danger }} className="text-right">
                          {currencySymbol}{item.calcData.total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell
                          style={{ color: THEME.accentSoft }}
                          className="text-right font-semibold"
                        >
                          {currencySymbol}{item.calcData.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(item.payslip_status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/salary/${item.user._id}/${selectedMonth}`)}
                            style={{
                              color: THEME.accent,
                              background: `${THEME.accent}08`,
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
