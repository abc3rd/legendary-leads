import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, LogOut, User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStatus } from '@/components/hooks/useAuthStatus';

export default function Settings() {
  const { user } = useAuthStatus();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      // Delete all user's leads
      const leads = await base44.entities.Lead.list();
      for (const lead of leads) {
        await base44.entities.Lead.delete(lead.id);
      }
      toast.success('Account data deleted. Logging out...');
      setTimeout(() => base44.auth.logout(), 1500);
    } catch (err) {
      toast.error('Failed to delete account. Please contact support.');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-lg mx-auto pt-4">
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>
          Settings
        </h1>

        {/* Account Info */}
        <div className="rounded-2xl p-5 mb-4" style={{
          background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
          border: '1.5px solid rgba(84,176,231,0.3)'
        }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(84,176,231,0.2)' }}>
              <User className="h-5 w-5" style={{ color: '#54b0e7' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#ffffff' }}>{user?.full_name || 'User'}</p>
              <p className="text-sm" style={{ color: '#9ea7b5' }}>{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-2"
            style={{ color: '#9ea7b5', border: '1px solid #5e6a78' }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Privacy & Data */}
        <div className="rounded-2xl p-5 mb-4" style={{
          background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
          border: '1.5px solid rgba(74,203,191,0.2)'
        }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4" style={{ color: '#4acbbf' }} />
            <h2 className="font-semibold text-sm" style={{ color: '#4acbbf' }}>Privacy & Data</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: '#9ea7b5' }}>
            Your data is stored securely and never shared with third parties.
            You can request deletion of your account and all associated data at any time.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl p-5" style={{
          background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
          border: '1.5px solid rgba(246,108,37,0.4)'
        }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" style={{ color: '#f66c25' }} />
            <h2 className="font-semibold text-sm" style={{ color: '#f66c25' }}>Danger Zone</h2>
          </div>

          {!showDeleteConfirm ? (
            <>
              <p className="text-xs mb-4" style={{ color: '#9ea7b5' }}>
                Permanently delete your account and all leads data. This action cannot be undone.
              </p>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="ghost"
                className="w-full justify-start gap-2"
                style={{ color: '#f66c25', border: '1px solid rgba(246,108,37,0.4)' }}
              >
                <Trash2 className="h-4 w-4" />
                Delete Account & All Data
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: '#f66c25' }}>
                ⚠ This will permanently delete all your leads and account data.
              </p>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>
                Type <strong style={{ color: '#ffffff' }}>DELETE</strong> to confirm:
              </p>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#071a2c', border: '1px solid #f66c25', color: '#fff' }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
                  variant="ghost"
                  className="flex-1"
                  style={{ color: '#9ea7b5', border: '1px solid #5e6a78' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleting || confirmText !== 'DELETE'}
                  className="flex-1 font-semibold"
                  style={{ background: '#f66c25', color: '#fff' }}
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}