import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // If already logged in, redirect immediately to /orders
  useEffect(() => {
    if (session && !authLoading) {
      navigate('/orders', { replace: true });
    }
  }, [session, authLoading, navigate]);

  if (authLoading) {
    return <LoadingSpinner size="screen" label="Loading..." />;
  }

  if (session) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || 'Invalid email or password');
        return;
      }

      toast.success('Signed in successfully');
      const fromPath = location.state?.from?.pathname;
      navigate(fromPath && fromPath !== '/login' ? fromPath : '/orders', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            WholesaleTrack
          </h1>
          <p className="text-muted text-sm mt-1">
            Sign in to access your distributor orders and inventory.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border p-8 rounded-md shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              icon={Mail}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="mt-3"
            >
              Sign in
            </Button>
          </form>

          {/* Track an order link */}
          <div className="mt-6 pt-5 border-t border-border text-center">
            <Link
              to="/"
              className="text-xs text-muted hover:text-primary transition-colors underline underline-offset-4"
            >
              Looking for your order? Track an order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
