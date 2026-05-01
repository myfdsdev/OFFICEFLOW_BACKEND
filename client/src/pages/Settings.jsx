// settings
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/lib/AppSettingsContext";
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
import { AlertCircle, Save, Clock, Calendar, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
  
import AppSettingsForm from "@/components/admin/AppSettingsForm";
export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings: appSettings, updateSettings: updateAppSettings } = useAppSettings();

  const [settings, setSettings] = useState({
    office_start_time: "09:00",
    office_end_time: "18:00",
    late_threshold_minutes: 15,
    half_day_hours: 4,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    auto_checkout_enabled: true,
    auto_checkout_hours: 2,
    auto_checkout_warning_minutes: 20,
  });
  const [saving, setSaving] = useState(false);

  // Load user info + attendance rules (per-user)
  useEffect(() => {
    base44.auth
      .me()
      .then((userData) => {
        setUser(userData);
        if (userData) {
          setSettings((prev) => ({
            ...prev,
            late_threshold_minutes: userData.late_threshold_minutes || 15,
            half_day_hours: userData.half_day_hours || 4,
            working_days:
              userData.working_days?.length > 0
                ? userData.working_days
                : ["monday", "tuesday", "wednesday", "thursday", "friday"],
          }));
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Sync office hours from GLOBAL AppSettings (not from user)
  useEffect(() => {
    if (appSettings) {
      setSettings((prev) => ({
        ...prev,
        office_start_time: appSettings.office_start_time || "09:00",
        office_end_time: appSettings.office_end_time || "18:00",
        auto_checkout_enabled:
          appSettings.auto_checkout_enabled ?? true,
        auto_checkout_hours: appSettings.auto_checkout_hours ?? 2,
        auto_checkout_warning_minutes:
          appSettings.auto_checkout_warning_minutes ?? 20,
      }));
    }
  }, [
    appSettings.office_start_time,
    appSettings.office_end_time,
    appSettings.auto_checkout_enabled,
    appSettings.auto_checkout_hours,
    appSettings.auto_checkout_warning_minutes,
  ]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save office hours GLOBALLY to AppSettings (visible to ALL users)
      await updateAppSettings({
        office_start_time: settings.office_start_time,
        office_end_time: settings.office_end_time,
        auto_checkout_enabled: settings.auto_checkout_enabled,
        auto_checkout_hours: Number(settings.auto_checkout_hours),
        auto_checkout_warning_minutes: Number(
          settings.auto_checkout_warning_minutes,
        ),
      });

      // Save attendance rules to user (admin's preferences)
      await base44.auth.updateMe({
        late_threshold_minutes: settings.late_threshold_minutes,
        half_day_hours: settings.half_day_hours,
        working_days: settings.working_days,
      });

      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error(
        "Failed to save: " +
          (error?.response?.data?.error || error?.message || "Unknown error"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-lime-100/35">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
  
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500">
            Only administrators can access settings.
          </p>
  
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-lime-100/50">Only administrators can access settings.</p>
  
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
  
          <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
          <p className="text-lime-100/50 mt-1">Configure office hours, attendance rules, and holidays</p>
  
        </motion.div>

        <div className="space-y-6">
          {/* Office Hours — saves to AppSettings (global) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle>App Branding</CardTitle>
                <CardDescription>Customize how your app looks</CardDescription>
              </CardHeader>
              <CardContent>
                <AppSettingsForm />
              </CardContent>
            </Card>
          </motion.div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-lime-300" />
                  Office Hours
                </CardTitle>
                <CardDescription>
                  Standard office working hours (applies to ALL employees globally)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={settings.office_start_time}
  
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          office_start_time: e.target.value,
                        })
                      }
  
                      onChange={(e) => setSettings({ ...settings, office_start_time: e.target.value })}
                      className="border border-lime-400/10"
  
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={settings.office_end_time}
  
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          office_end_time: e.target.value,
                        })
                      }
  
                      onChange={(e) => setSettings({ ...settings, office_end_time: e.target.value })}
                      className="border border-lime-400/10"
  
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  ⏱️ Dashboard timer counts DOWN until end time, then OVERTIME starts
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Custom Shifts — manage named shifts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <CustomShifts />
          </motion.div>

          {/* Attendance Rules — saves to user */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-lime-300" />
                  Attendance Rules
                </CardTitle>
                <CardDescription>
                  Configure late arrival and half-day rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Late Threshold (minutes after start time)</Label>
                  <Input
                    type="number"
                    value={settings.late_threshold_minutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        late_threshold_minutes:
                          parseInt(e.target.value) || 0,
                      })
                    }
                    min="1"
                    max="60"
                    className="border border-lime-400/10"
                  />
                  <p className="text-xs text-lime-100/50">
                    Employees checking in after this time will be marked as late
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Half Day Hours</Label>
                  <Input
                    className="border border-lime-400/10"
                    type="number"
                    value={settings.half_day_hours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        half_day_hours: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="1"
                    max="8"
                    step="0.5"
                  />
                  <p className="text-xs text-lime-100/50">
                    Working less than this many hours will be marked as half day
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Auto-Checkout — saves to AppSettings (global) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-indigo-600" />
                  Auto Check-out
                </CardTitle>
                <CardDescription>
                  Automatically check out users who go inactive for too long
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      Enable Auto Check-out
                    </p>
                    <p className="text-xs text-gray-500">
                      System will check out idle users automatically
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_checkout_enabled}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, auto_checkout_enabled: v })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Auto-checkout after (hours of inactivity)</Label>
                    <Input
                      type="number"
                      min="0.25"
                      max="24"
                      step="0.25"
                      value={settings.auto_checkout_hours}
                      disabled={!settings.auto_checkout_enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          auto_checkout_hours: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      Default: 2 hours
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Warn user (minutes before checkout)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={settings.auto_checkout_warning_minutes}
                      disabled={!settings.auto_checkout_enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          auto_checkout_warning_minutes:
                            parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      Default: 20 minutes before
                    </p>
                  </div>
                </div>
                <p className="text-xs text-amber-600">
                  ⏱️ Checkout time = user's <strong>last detected activity</strong>, not when the system noticed (fair time).
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Working Days — saves to user */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-lime-300" />
                  Working Days
                </CardTitle>
                <CardDescription>
                  Select which days of the week are working days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => {
                    const dayLower = day.toLowerCase();
                    const isSelected = settings.working_days.includes(dayLower);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSettings({
                              ...settings,
                              working_days: settings.working_days.filter(
                                (d) => d !== dayLower,
                              ),
                            });
                          } else {
                            setSettings({
                              ...settings,
                              working_days: [
                                ...settings.working_days,
                                dayLower,
                              ],
                            });
                          }
                        }}
  
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 text-indigo-600 font-semibold"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
  
                        className={`p-3 rounded-lg border-2 transition-all ${isSelected
                          ? 'border-indigo-600 bg-lime-400/10 text-lime-300 font-semibold'
                          : 'border-lime-400/15 hover:border-lime-400/20'
                          }`}
  
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end"
          >
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="bg-lime-400 hover:bg-lime-300 text-black"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
}