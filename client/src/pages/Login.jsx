import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Clock, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.auth.login(email, password);
      toast.success('Welcome back!');

      // Check if profile is complete
      if (result.user.mobile_number && result.user.employee_id && result.user.department) {
        window.location.href = result.user.role === 'admin'
          ? createPageUrl('AdminDashboard')
          : createPageUrl('Dashboard');
      } else {
        window.location.href = createPageUrl('CompleteProfile');
      }
    } catch (err) {
      toast.error(err?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-2xl">
            <Clock className="w-9 h-9 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">AttendEase</h1>
          <p className="text-indigo-100 mt-1">Welcome back</p>
        </div>

        {/* Card */}
        <Card className="p-8 bg-white/95 backdrop-blur-lg shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href={createPageUrl('Register')} className="text-indigo-600 font-semibold hover:underline">Sign up</a>
            </p>
          </div>
        </Card>

        <p className="text-center text-indigo-100 text-sm mt-6">
          <a href={createPageUrl('Welcome')} className="hover:underline">
            ← Back to home
          </a>
        </p>
      </motion.div>
    </div>
  );
}