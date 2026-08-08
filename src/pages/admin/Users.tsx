import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Shield, ShieldCheck, User as UserIcon, AlertCircle } from 'lucide-react';

type Profile = {
  id: string;
  email: string;
  created_at: string;
  name: string;
  role: string;
};

export default function UsersAdmin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      const { data, error: fetchErr } = await supabase.from('profiles').select('*');
      if (fetchErr) throw fetchErr;
      if (data) setProfiles(data as Profile[]);
    } catch (err: any) {
      console.error('Error fetching user profiles:', err);
      setError(err.message || 'Failed to load user profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const makeAdmin = currentRole !== 'admin';
    const confirmMsg = makeAdmin
      ? 'Are you sure you want to promote this user to Admin?'
      : 'Are you sure you want to remove Admin privileges from this user?';

    if (!confirm(confirmMsg)) return;

    setActionLoading(userId);
    setError(null);

    try {
      const { error: rpcErr } = await supabase.rpc('toggle_user_admin', {
        p_target_user_id: userId,
        p_make_admin: makeAdmin,
      });

      if (rpcErr) throw rpcErr;
      await fetchProfiles();
    } catch (err: any) {
      console.error('Toggle admin error:', err);
      setError(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = profiles.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">View registered customers and manage admin access privileges</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by name, email, or user ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3.5 font-semibold">User</th>
                <th className="px-6 py-3.5 font-semibold">Role</th>
                <th className="px-6 py-3.5 font-semibold">Joined Date</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((userProfile) => {
                const isAdmin = userProfile.role === 'admin';
                const isProcessing = actionLoading === userProfile.id;

                return (
                  <tr key={userProfile.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                          {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{userProfile.name || 'Anonymous User'}</div>
                          <div className="text-xs text-slate-500">{userProfile.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          isAdmin
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> : <UserIcon className="w-3.5 h-3.5 text-slate-400" />}
                        {isAdmin ? 'Admin' : 'Shopper'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(userProfile.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleAdmin(userProfile.id, userProfile.role)}
                        disabled={isProcessing}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          isAdmin
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        {isProcessing
                          ? 'Updating...'
                          : isAdmin
                          ? 'Revoke Admin'
                          : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
