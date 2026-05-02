import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DollarSign,
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
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

function MarkPaidModal({ isOpen, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    payment_method: 'bank_transfer',
    transaction_id: '',
    paid_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (!formData.payment_method) {
      toast.error('Payment method is required');
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{ background: THEME.surface, color: THEME.text }}>
        <DialogHeader>
          <DialogTitle>Mark as Paid</DialogTitle>
          <DialogDescription style={{ color: THEME.muted }}>
            Enter payment details for this payslip
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="payment_method" style={{ color: THEME.text }}>
              Payment Method
            </Label>
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              style={{
                background: THEME.surface2,
                borderColor: THEME.border,
                color: THEME.text,
              }}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div>
            <Label htmlFor="transaction_id" style={{ color: THEME.text }}>
              Transaction ID (Optional)
            </Label>
            <Input
              id="transaction_id"
              name="transaction_id"
              value={formData.transaction_id}
              onChange={handleChange}
              placeholder="e.g., TRX123456789"
              style={{ borderColor: THEME.border }}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="paid_date" style={{ color: THEME.text }}>
              Paid Date
            </Label>
            <Input
              id="paid_date"
              name="paid_date"
              type="date"
              value={formData.paid_date}
              onChange={handleChange}
              style={{ borderColor: THEME.border }}
              className="mt-1"
            />
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
                Processing...
              </>
            ) : (
              'Confirm Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SalarySection({ title, children }) {
  return (
    <Card
      style={{
        background: THEME.surface,
        borderColor: THEME.border,
      }}
      className="border rounded-2xl p-6"
    >
      <h2 className="text-xl font-semibold mb-6" style={{ color: THEME.text }}>
        {title}
      </h2>
      {children}
    </Card>
  );
}

function SalaryLineItem({ label, amount, highlight = false, currency = '₹' }) {
  return (
    <div className="flex justify-between items-center py-3 px-4 rounded-lg"
      style={{
        background: highlight ? `${THEME.accent}08` : THEME.surface2,
      }}>
      <span style={{ color: highlight ? THEME.accentSoft : THEME.text }}>
        {label}
      </span>
      <span
        className={highlight ? 'font-semibold' : ''}
        style={{ color: highlight ? THEME.accentSoft : THEME.text }}
      >
        {currency}{amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
      </span>
    </div>
  );
}

export default function SalaryDetail() {
  const navigate = useNavigate();
  const { userId, month } = useParams();
  const queryClient = useQueryClient();
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);

  const { data: payslip, isLoading: payslipLoading } = useQuery({
    queryKey: ['payslip', userId, month],
    queryFn: async () => {
      // First generate/get the payslip
      const result = await base44.salary.payslips.generate({
        user_id: userId,
        month,
      });
      return result;
    },
  });

  const { data: user } = useQuery({
    queryKey: ['userDetail', userId],
    queryFn: () => base44.users.getById(userId),
  });

  const { data: appSettings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.appSettings.get(),
    staleTime: 5 * 60 * 1000,
  });

  const markPaidMutation = useMutation({
    mutationFn: (data) => base44.salary.payslips.markPaid(payslip._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslip'] });
      setShowMarkPaidModal(false);
      toast.success('Payslip marked as paid');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to mark as paid');
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => base44.salary.payslips.approve(payslip._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslip'] });
      queryClient.invalidateQueries({ queryKey: ['salaryBoard'] });
      toast.success('Payslip approved');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to approve payslip');
    },
  });

  const downloadPdfMutation = useMutation({
    mutationFn: () => {
      if (payslip?.payslip_pdf_url) {
        window.open(payslip.payslip_pdf_url, '_blank');
        return Promise.resolve();
      }
      return Promise.reject(new Error('PDF not available'));
    },
    onError: (error) => {
      toast.error(error?.message || 'PDF not available yet');
    },
  });

  const currencySymbol = appSettings?.currency_symbol || '₹';

  if (payslipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEME.bg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: THEME.accent }} />
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ background: THEME.bg, color: THEME.text }}>
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            style={{ color: THEME.accent }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card
            style={{
              background: THEME.surface,
              borderColor: THEME.border,
            }}
            className="border rounded-2xl p-8 text-center mt-8"
          >
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: THEME.danger }} />
            <p style={{ color: THEME.muted }}>Payslip not found</p>
          </Card>
        </div>
      </div>
    );
  }

  const monthName = new Date(`${month}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: THEME.bg, color: THEME.text }}>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          style={{ color: THEME.accent }}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Salary Slip - {monthName}</h1>
          <p style={{ color: THEME.muted }}>
            Detailed breakdown for {payslip.employee_name}
          </p>
        </div>

        {/* Employee Info Card */}
        <Card
          style={{
            background: THEME.surface,
            borderColor: THEME.border,
          }}
          className="border rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <Avatar
              className="w-16 h-16"
              style={{
                border: `1px solid ${THEME.border}`,
                background: THEME.surface2,
              }}
            >
              <AvatarFallback style={{ color: THEME.accent, background: THEME.surface2 }}>
                {payslip.employee_name?.charAt(0) || 'E'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold" style={{ color: THEME.text }}>
                {payslip.employee_name}
              </h2>
              <p style={{ color: THEME.muted }}>{payslip.employee_email}</p>
              <p style={{ color: THEME.muted }}>Month: {monthName}</p>
            </div>
            <div className="text-right">
              <p style={{ color: THEME.muted }} className="text-sm mb-2">
                Status:
              </p>
              <div
                style={{
                  background:
                    payslip.status === 'paid'
                      ? `${THEME.accentSoft}20`
                      : payslip.status === 'approved'
                        ? '#3b82f620'
                        : THEME.surface2,
                  color:
                    payslip.status === 'paid'
                      ? THEME.accentSoft
                      : payslip.status === 'approved'
                        ? '#3b82f6'
                        : THEME.muted,
                  border: `1px solid ${payslip.status === 'paid'
                    ? `${THEME.accentSoft}40`
                    : payslip.status === 'approved'
                      ? '#3b82f640'
                      : THEME.border
                    }`,
                }}
                className="px-3 py-1 rounded-full text-sm font-medium inline-block"
              >
                {payslip.status?.toUpperCase()}
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance Summary */}
        <SalarySection title="Attendance Summary">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              ['Days Present', payslip.days_present],
              ['Days Late', payslip.days_late],
              ['Half-Day', payslip.days_half_day],
              ['Days Absent', payslip.days_absent],
              ['Paid Leaves', payslip.paid_leaves],
              ['Unpaid Leaves', payslip.unpaid_leaves],
            ].map(([label, value], idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg text-center"
                style={{
                  background: THEME.surface2,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <p style={{ color: THEME.muted }} className="text-sm mb-1">
                  {label}
                </p>
                <p className="text-2xl font-semibold" style={{ color: THEME.accent }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </SalarySection>

        {/* Earnings Section */}
        <SalarySection title="Earnings">
          <SalaryLineItem label="Base Salary" amount={payslip.base_salary} currency={currencySymbol} />
          {payslip.allowances?.hra > 0 && (
            <SalaryLineItem label="House Rent Allowance" amount={payslip.allowances.hra} currency={currencySymbol} />
          )}
          {payslip.allowances?.travel > 0 && (
            <SalaryLineItem label="Travel Allowance" amount={payslip.allowances.travel} currency={currencySymbol} />
          )}
          {payslip.allowances?.other > 0 && (
            <SalaryLineItem label="Other Allowances" amount={payslip.allowances.other} currency={currencySymbol} />
          )}
          {payslip.overtime_hours > 0 && (
            <SalaryLineItem
              label={`Overtime (${payslip.overtime_hours.toFixed(2)} hrs)`}
              amount={payslip.overtime_pay}
              currency={currencySymbol}
            />
          )}
          {payslip.bonus > 0 && (
            <SalaryLineItem label="Bonus" amount={payslip.bonus} currency={currencySymbol} />
          )}
          <SalaryLineItem
            label="Gross Salary"
            amount={payslip.gross_salary}
            highlight
            currency={currencySymbol}
          />
        </SalarySection>

        {/* Deductions Section */}
        {payslip.total_deductions > 0 && (
          <SalarySection title="Deductions">
            {payslip.late_deduction > 0 && (
              <SalaryLineItem
                label={`Late Penalty (${payslip.days_late} days)`}
                amount={payslip.late_deduction}
                currency={currencySymbol}
              />
            )}
            {payslip.half_day_deduction > 0 && (
              <SalaryLineItem
                label={`Half-Day Deduction (${payslip.days_half_day} days)`}
                amount={payslip.half_day_deduction}
                currency={currencySymbol}
              />
            )}
            {payslip.absent_deduction > 0 && (
              <SalaryLineItem
                label={`Absent Deduction (${payslip.days_absent} days)`}
                amount={payslip.absent_deduction}
                currency={currencySymbol}
              />
            )}
            {payslip.unpaid_leave_deduction > 0 && (
              <SalaryLineItem
                label={`Unpaid Leave (${payslip.unpaid_leaves} days)`}
                amount={payslip.unpaid_leave_deduction}
                currency={currencySymbol}
              />
            )}
            <SalaryLineItem
              label="Total Deductions"
              amount={payslip.total_deductions}
              highlight
              currency={currencySymbol}
            />
          </SalarySection>
        )}

        {/* Net Salary Highlight */}
        <Card
          className="p-8 rounded-2xl border mb-6"
          style={{
            background: `linear-gradient(135deg, ${THEME.accent}15 0%, ${THEME.accent}08 100%)`,
            borderColor: THEME.accent,
            border: `2px solid ${THEME.accent}40`,
          }}
        >
          <div className="text-center">
            <p style={{ color: THEME.muted }} className="mb-2">
              NET SALARY
            </p>
            <p
              className="text-5xl font-bold"
              style={{ color: THEME.accentSoft }}
            >
              {currencySymbol}{payslip.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          {payslip.payslip_pdf_url && (
            <Button
              onClick={() => downloadPdfMutation.mutate()}
              variant="outline"
              style={{ borderColor: THEME.border, color: THEME.accent }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}

          {payslip.status === 'draft' && (
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              style={{ background: THEME.accent, color: THEME.accentTextDark }}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </Button>
          )}

          {payslip.status !== 'paid' && (
            <Button
              onClick={() => setShowMarkPaidModal(true)}
              style={{ background: THEME.accent, color: THEME.accentTextDark }}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Mark as Paid
            </Button>
          )}
        </div>

        {/* Mark Paid Modal */}
        <MarkPaidModal
          isOpen={showMarkPaidModal}
          onClose={() => setShowMarkPaidModal(false)}
          onSubmit={markPaidMutation.mutate}
          isLoading={markPaidMutation.isPending}
        />
      </div>
    </div>
  );
}
