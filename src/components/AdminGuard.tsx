import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminGuard() {
  const [status, setStatus] = useState<'loading' | 'admin' | 'denied'>('loading');

  useEffect(() => {
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('denied');
        return;
      }
      const role = session.user.app_metadata?.role;
      setStatus(role === 'admin' ? 'admin' : 'denied');
    }
    checkAdmin();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
