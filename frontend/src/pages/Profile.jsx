import { useState } from 'react';
import {
  User, Mail, Phone, Building, Shield, Edit2, Save, X,
  KeyRound, CheckCircle2, AlertCircle, Lock
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import { PERMISSIONS } from '../utils/permissions';
import { clsx } from 'clsx';

export default function Profile() {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'Harshitha Reddy',
    phone: user?.phone || '+91-98765-43210',
    department: user?.department || 'Product Engineering',
  });

  const [banner, setBanner] = useState(null);

  // Change password modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwData, setPwData] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 3500);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      showBanner('success', 'Profile details updated locally (simulated).');
    }, 400);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwError('');
    if (!pwData.current || !pwData.next || !pwData.confirm) {
      setPwError('All password fields are required.');
      return;
    }
    if (pwData.next.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }
    if (pwData.next !== pwData.confirm) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwLoading(true);
    setTimeout(() => {
      setPwLoading(false);
      setIsPasswordModalOpen(false);
      setPwData({ current: '', next: '', confirm: '' });
      showBanner('success', 'Password updated successfully (simulated).');
    }, 700);
  };

  const userRole = user?.role || 'staff';
  const rolePermissions = PERMISSIONS[userRole] || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="My Profile & Security"
        subtitle="Manage account details, authentication credentials, and platform role privileges"
        breadcrumbs={['REVORA', 'Account', 'Profile']}
      />

      {/* Banner */}
      {banner && (
        <div
          className={clsx(
            'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium shadow-sm transition-all',
            banner.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          )}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{banner.message}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-md shadow-indigo-100">
              {user?.avatar || 'HR'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Active member since {formatDate(user?.createdAt || '2024-01-15T09:00:00Z')}
              </p>
            </div>
          </div>

          {!isEditing ? (
            <Button
              variant="primary"
              icon={Edit2}
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Update Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={X}
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Save}
                size="sm"
                onClick={handleSaveProfile}
                loading={isSaving}
              >
                {isSaving ? 'Updating Profile...' : 'Update Profile'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Details Form Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-600" /> Personal & Organization Info
        </h3>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            ) : (
              <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">
                {formData.name}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Email Address (Fixed)
            </label>
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed">
              {user?.email}
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            ) : (
              <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">
                {formData.phone}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Department
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            ) : (
              <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">
                {formData.department}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                icon={X}
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                icon={Save}
                size="sm"
                loading={isSaving}
              >
                {isSaving ? 'Updating Profile...' : 'Update Profile'}
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Security & Password Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-600" /> Security & Credentials
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Secure your account with multi-factor policies and strong passwords.
            </p>
          </div>
          <Button variant="secondary" size="sm" icon={KeyRound} onClick={() => setIsPasswordModalOpen(true)}>
            Change Password
          </Button>
        </div>
      </div>

      {/* Role Privileges Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-600" /> Platform Role Permissions ({userRole.toUpperCase()})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Client-side visualization of capabilities granted to your current role. Server-side API authorization is verified by Sai's backend.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 text-xs">
          {Object.entries(rolePermissions).map(([resource, perms]) => (
            <div key={resource} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
              <span className="font-semibold capitalize text-slate-800 block mb-1">{resource}</span>
              <div className="flex flex-wrap gap-1">
                {Object.entries(perms).map(([action, allowed]) => (
                  <span
                    key={action}
                    className={clsx(
                      'px-1.5 py-0.5 rounded text-[10px] font-medium capitalize',
                      allowed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500 line-through'
                    )}
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Change Password */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Update Account Password"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPasswordModalOpen(false)} disabled={pwLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePasswordSubmit} loading={pwLoading}>
              {pwLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </>
        }
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {pwError && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {pwError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Current Password *
            </label>
            <input
              type="password"
              value={pwData.current}
              onChange={(e) => setPwData({ ...pwData, current: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              New Password *
            </label>
            <input
              type="password"
              value={pwData.next}
              onChange={(e) => setPwData({ ...pwData, next: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Confirm New Password *
            </label>
            <input
              type="password"
              value={pwData.confirm}
              onChange={(e) => setPwData({ ...pwData, confirm: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Password Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Minimum 8 characters in length</li>
              <li>At least one uppercase and one lowercase letter</li>
              <li>At least one special character (!@#$%^&*)</li>
            </ul>
          </div>
        </form>
      </Modal>
    </div>
  );
}
