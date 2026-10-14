import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F9F6] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface border border-border p-8 rounded-md shadow-sm">
        <h1 className="text-2xl font-bold text-primary tracking-tight mb-2">
          Page not found
        </h1>

        <p className="text-sm text-muted mb-6 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>

        <Button variant="primary" fullWidth onClick={() => navigate('/orders')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Return to orders</span>
        </Button>
      </div>
    </div>
  );
}
