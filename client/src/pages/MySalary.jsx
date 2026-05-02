import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Download,
  Loader2,
  AlertCircle,
  TrendingUp,
  Eye,
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

export default function MySalary() {
  const currentMonth = format(new Date(), 'yyyy-MM');

  // Fetch current user's payslips
  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['myPayslips'],
    queryFn: () => base44.salary.payslips.listMine(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch current month's expected salary (draft)
  const { data: currentMonthPayslip } = useQuery({
    queryKey: ['currentMonthSalary', currentMonth],
    queryFn: async () => {
      try {
        const breakdown = await base44.salary.breakdown('me', currentMonth);
        return breakdown;
      } catch (error) {
        return null;
      }
    },
    staleTime: 60 * 1000, // Recalculate every minute
  });

  const { data: appSettings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.appSettings.get(),
    staleTime: 5 * 60 * 1000,
  });

  const downloadPdfMutation = useMutation({
    mutationFn: (pdfUrl) => {
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
        return Promise.resolve();
      }
      return Promise.reject(new Error('PDF not available'));
    },
    onError: (error) => {
      toast.error(error?.message || 'PDF not available');
    },
  });

  const currencySymbol = appSettings?.currency_symbol || '₹';

  // Sort payslips by month descending
  const sortedPayslips = [...payslips].sort((a, b) => b.month.localeCompare(a.month));

  // Find current month payslip from list
  const currentMonthData = sortedPayslips.find((p) => p.month === currentMonth);

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Expected', color: '#6b7280', bgColor: '#f3f4f6' },
      approved: { label: 'Approved', color: '#3b82f6', bgColor: '#eff6ff' },
      paid: { label: 'Paid', color: '#10b981', bgColor: '#f0fdf4' },
    };
    const statusInfo = statusMap[status] || statusMap.draft;
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

  const expectedNetSalary = currentMonthData?.net_salary || currentMonthPayslip?.net_salary || 0;
  const totalEarnings = payslips
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.net_salary, 0);

  const monthName = new Date(`${currentMonth}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: THEME.bg, color: THEME.text }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8" style={{ color: THEME.accent }} />
            <h1 className="text-3xl font-bold">My Salary</h1>
          </div>
          <p style={{ color: THEME.muted }}>
            View your salary slips and payment history
          </p>
        </div>

        {/* Current Month Expected Salary */}
        <Card
          className="p-8 rounded-2xl border mb-8"
          style={{
            background: `linear-gradient(135deg, ${THEME.accent}15 0%, ${THEME.accent}08 100%)`,
            borderColor: THEME.accent,
            border: `2px solid ${THEME.accent}40`,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p style={{ color: THEME.muted }} className="text-sm mb-2">
                CURRENT MONTH
              </p>
              <p className="text-2xl font-semibold" style={{ color: THEME.text }}>
                {monthName}
              </p>
            </div>

            <div>
              <p style={{ color: THEME.muted }} className="text-sm mb-2">
                EXPECTED NET SALARY
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: THEME.accentSoft }}
              >
                {currencySymbol}{expectedNetSalary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </p>
            </div>

            <div>
              <p style={{ color: THEME.muted }} className="text-sm mb-2">
                STATUS
              </p>
              {getStatusBadge(currentMonthData?.status || 'draft')}
            </div>
          </div>

          {currentMonthPayslip && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6" style={{ borderTop: `1px solid ${THEME.accent}40` }}>
              <div>
                <p style={{ color: THEME.muted }} className="text-xs mb-1">
                  Days Present
                </p>
                <p className="text-xl font-semibold" style={{ color: THEME.text }}>
                  {currentMonthPayslip.days_present}
                </p>
              </div>
              <div>
                <p style={{ color: THEME.muted }} className="text-xs mb-1">
                  Earnings
                </p>
                <p className="text-xl font-semibold" style={{ color: THEME.text }}>
                  {currencySymbol}{currentMonthPayslip.gross_salary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p style={{ color: THEME.muted }} className="text-xs mb-1">
                  Deductions
                </p>
                <p className="text-xl font-semibold" style={{ color: THEME.danger }}>
                  {currencySymbol}{currentMonthPayslip.total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p style={{ color: THEME.muted }} className="text-xs mb-1">
                  Total Paid
                </p>
                <p className="text-xl font-semibold" style={{ color: THEME.accentSoft }}>
                  {currencySymbol}{totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Paid"
            value={totalEarnings}
            icon={TrendingUp}
            currency
          />
          <StatCard
            label="Last Paid"
            value={sortedPayslips.find((p) => p.status === 'paid')
              ? format(
                new Date(sortedPayslips.find((p) => p.status === 'paid').paid_date),
                'dd MMM yyyy'
              )
              : 'N/A'}
            icon={DollarSign}
          />
          <StatCard
            label="Total Payslips"
            value={sortedPayslips.length}
            icon={AlertCircle}
          />
        </div>

        {/* Payslips Table */}
        <Card
          style={{
            background: THEME.surface,
            borderColor: THEME.border,
          }}
          className="border rounded-2xl"
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: THEME.text }}>
              Salary History
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: THEME.accent }} />
              </div>
            ) : sortedPayslips.length === 0 ? (
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
                  No payslips yet. Check back after your first salary is processed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: THEME.border }}>
                      <TableHead style={{ color: THEME.accent }}>
                        Month
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }} className="text-right">
                        Gross
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
                      <TableHead style={{ color: THEME.accent }} className="text-center">
                        Paid Date
                      </TableHead>
                      <TableHead style={{ color: THEME.accent }} className="text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPayslips.map((payslip) => (
                      <TableRow
                        key={payslip._id}
                        style={{ borderColor: THEME.border }}
                      >
                        <TableCell style={{ color: THEME.text }} className="font-medium">
                          {new Date(`${payslip.month}-01`).toLocaleDateString(
                            'en-US',
                            { month: 'short', year: 'numeric' }
                          )}
                        </TableCell>
                        <TableCell style={{ color: THEME.text }} className="text-right">
                          {currencySymbol}{payslip.gross_salary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell
                          style={{ color: THEME.danger }}
                          className="text-right"
                        >
                          {currencySymbol}{payslip.total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell
                          style={{ color: THEME.accentSoft }}
                          className="text-right font-semibold"
                        >
                          {currencySymbol}{payslip.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(payslip.status)}
                        </TableCell>
                        <TableCell style={{ color: THEME.text }} className="text-center">
                          {payslip.paid_date
                            ? format(new Date(payslip.paid_date), 'dd MMM yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {payslip.payslip_pdf_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                downloadPdfMutation.mutate(payslip.payslip_pdf_url)
                              }
                              style={{
                                color: THEME.accent,
                                background: `${THEME.accent}08`,
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              PDF
                            </Button>
                          )}
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
