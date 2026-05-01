import React, { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Mail, Building2, CheckCircle2, Clock, Users, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';

export default function Welcome() {
  const navigate = useNavigate();
  const loginInProgress = useRef(false);

  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    googleLogin,
  } = useAuth();

  const redirectUser = (u) => {
    if (!u) return;

    if (u.is_profile_complete) {
      navigate(
        createPageUrl(u.role === 'admin' ? 'AdminDashboard' : 'Dashboard'),
        { replace: true }
      );
    } else {
      navigate(createPageUrl('CompleteProfile'), { replace: true });
    }
  };

  useEffect(() => {
    if (isLoadingAuth) return;

    if (isAuthenticated && user) {
      redirectUser(user);
    }
  }, [isLoadingAuth, isAuthenticated, user]);

  const handleGoogleSuccess = async (credentialResponse) => {
    if (loginInProgress.current) return;

    if (!credentialResponse?.credential) {
      toast.error('Google login failed — no credential');
      return;
    }

    loginInProgress.current = true;

    try {
      const result = await googleLogin(credentialResponse.credential);

      toast.success('Welcome!');
      redirectUser(result.user);
    } catch (error) {
      console.error('[Welcome] Google login error:', error);
      toast.error(error?.error || error?.message || 'Google login failed');
    } finally {
      loginInProgress.current = false;
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login was cancelled');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="lg:w-3/5 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white flex items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400 opacity-20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 opacity-20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-xl"
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">AttendEase</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Your team's workspace,
            <br />
            <span className="text-blue-200">all in one place.</span>
          </h1>

          <p className="text-lg text-blue-100 mb-10">
            Track attendance, manage projects, chat in real-time, and stay connected with your team.
          </p>

          <div className="space-y-4">
            <Feature icon={Clock} text="Smart attendance tracking with live status" />
            <Feature icon={Users} text="Real-time team chat & group messaging" />
            <Feature icon={BarChart3} text="Project boards & task management" />
            <Feature icon={CheckCircle2} text="Leave requests & approvals" />
          </div>
        </motion.div>
      </div>

      <div className="lg:w-2/5 bg-white flex items-center justify-center p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AttendEase</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h2>
            <p className="text-gray-500">Sign in to access your workspace</p>
          </div>

          <div className="space-y-4">
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                width="320"
                text="continue_with"
                shape="rectangular"
              />
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400 font-medium uppercase">
                  Or
                </span>
              </div>
            </div>

            <Button
              onClick={() => navigate(createPageUrl('Register'))}
              variant="outline"
              size="lg"
              className="w-full h-12 border-2 hover:bg-gray-50 font-medium"
            >
              <Mail className="w-5 h-5 mr-3 text-gray-600" />
              Continue with Email
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{' '}
            <Link
              to={createPageUrl('Login')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-12">
            By continuing, you agree to our{' '}
            <Link to={createPageUrl('PrivacyPolicy')} className="underline hover:text-gray-600">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

const Feature = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-white" />
    </div>
    <span className="text-blue-50">{text}</span>
  </div>
);