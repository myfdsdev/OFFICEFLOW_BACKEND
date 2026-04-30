import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Users, Mail, Shield, User, Search, Clock4, PowerOff } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatDistanceToNow } from "date-fns";
import OnlineStatusIndicator from './OnlineStatusIndicator';

export default function EmployeeList({ employees, todayAttendance = [] }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    setOnlineUsers(employees);

    const unsubscribe = base44.entities.User.subscribe((event) => {
      if (event.type === 'update') {
        setOnlineUsers(prev =>
          prev.map(u => u.id === event.id ? event.data : u)
        );
      }
    });

    return unsubscribe;
  }, [employees]);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getUserOnlineStatus = (email) => {
    const user = onlineUsers.find(u => u.email === email);
    return user?.is_online || false;
  };

  const getTodayStatus = (email) => {
    const attendance = todayAttendance.find(a => a.employee_email === email);
    if (!attendance) return null;
    return attendance.status;
  };

  const statusStyles = {
    present: "bg-emerald-100 text-emerald-700",
    absent: "bg-rose-100 text-rose-700",
    late: "bg-orange-100 text-orange-700",
    half_day: "bg-amber-100 text-amber-700",
    on_leave: "bg-blue-100 text-blue-700",
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (roleFilter !== 'all' && e.role !== roleFilter) return false;
      if (!q) return true;
      return (
        e.full_name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.employee_id?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q)
      );
    });
  }, [employees, search, roleFilter]);

  const formatRelative = (d) => {
    if (!d) return '—';
    try {
      return formatDistanceToNow(new Date(d), { addSuffix: true });
    } catch {
      return '—';
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Employees
            <span className="text-sm text-gray-400 font-normal">({filtered.length})</span>
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search name, email, ID, dept"
                className="pl-9 w-full sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-md px-3 py-2 bg-white text-sm h-10"
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="user">Employee</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No employees match the filters</p>
          ) : (
            filtered.map((employee, index) => {
              const status = getTodayStatus(employee.email);
              const isOnline = getUserOnlineStatus(employee.email);
              const isInactive = employee.is_active === false;

              return (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <Link
                    to={createPageUrl("EmployeeDetails") + `?id=${employee.id}`}
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors block ${
                      isInactive
                        ? "bg-rose-50/40 hover:bg-rose-50 opacity-80"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12 bg-indigo-100 text-indigo-600">
                          {employee.profile_photo ? (
                            <AvatarImage src={employee.profile_photo} alt={employee.full_name} />
                          ) : (
                            <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                              {getInitials(employee.full_name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1">
                          <OnlineStatusIndicator isOnline={isOnline} size="md" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{employee.full_name}</p>
                          {isInactive && (
                            <Badge className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0">
                              <PowerOff className="w-3 h-3 mr-1" /> Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {employee.email}
                        </p>
                        <div className="text-xs text-gray-400 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          {employee.department && <span>{employee.department}</span>}
                          {employee.shift_id?.name && (
                            <span className="inline-flex items-center gap-1">
                              <Clock4 className="w-3 h-3" /> {employee.shift_id.name}
                            </span>
                          )}
                          <span title={employee.updatedAt || ''}>
                            Updated {formatRelative(employee.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {status && (
                        <Badge className={`${statusStyles[status]} capitalize`}>
                          {status.replace("_", " ")}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={employee.role === "admin"
                          ? "border-indigo-200 text-indigo-600"
                          : "border-gray-200 text-gray-600"
                        }
                      >
                        {employee.role === "admin" ? (
                          <><Shield className="w-3 h-3 mr-1" /> Admin</>
                        ) : (
                          <><User className="w-3 h-3 mr-1" /> Employee</>
                        )}
                      </Badge>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
