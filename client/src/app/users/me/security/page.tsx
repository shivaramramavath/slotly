// React component for page.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AppLayout } from '@/components/layouts/app-layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { authApi } from '@/features/auth/services/auth.api';
import type { SecurityOverview } from '@/features/auth/services/auth.api';
import type {
  SessionDto,
  DeviceDto,
  SecurityActivityDto,
  MfaEnrollResponse,
} from '@slotly/contracts';
import { toast } from '@/components/ui/toast';
import { Shield, Key, Smartphone, History, Check, Copy } from 'lucide-react';
import { ConnectedAccounts } from '@/features/auth/components/connected-accounts';

/** React component rendering security settings page. */
export default function SecuritySettingsPage() {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [activity, setActivity] = useState<SecurityActivityDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // MFA modal state
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [enrollData, setEnrollData] = useState<MfaEnrollResponse | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [revealedRecoveryCodes, setRevealedRecoveryCodes] = useState<string[] | null>(null);
  const [verifyingMfa, setVerifyingMfa] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const refetchData = useCallback(async () => {
    try {
      const [ov, sess, dev, act] = await Promise.all([
        authApi.getSecurityOverview().catch(() => null),
        authApi.getSessions().catch(() => []),
        authApi.getDevices().catch(() => []),
        authApi.getSecurityActivity().catch(() => []),
      ]);
      setOverview(ov);
      setSessions(sess);
      setDevices(dev);
      setActivity(act);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      authApi.getSecurityOverview().catch(() => null),
      authApi.getSessions().catch(() => []),
      authApi.getDevices().catch(() => []),
      authApi.getSecurityActivity().catch(() => []),
    ])
      .then(([ov, sess, dev, act]) => {
        if (!ignore) {
          setOverview(ov);
          setSessions(sess);
          setDevices(dev);
          setActivity(act);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword.length < 12) {
      toast.error('Invalid Password', 'New password must be at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mismatch', 'New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Password Updated', 'Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      void refetchData();
    } catch {
      // toast error handled by apiClient
    } finally {
      setSavingPassword(false);
    }
  };

  const handleStartMfaEnroll = async () => {
    try {
      const res = await authApi.enrollMfa();
      setEnrollData(res);
      setMfaCode('');
      setRevealedRecoveryCodes(null);
      setMfaModalOpen(true);
    } catch {
      // error handled by apiClient
    }
  };

  const handleVerifyEnrollMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim() || !enrollData) return;

    setVerifyingMfa(true);
    try {
      await authApi.verifyMfa({ code: mfaCode.trim() });
      setRevealedRecoveryCodes(enrollData.recoveryCodes);
      toast.success('MFA Enabled', 'Two-Factor Authentication is active.');
      void refetchData();
    } catch {
      toast.error('Invalid Code', 'The 6-digit code was invalid. Please check your app.');
    } finally {
      setVerifyingMfa(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication?')) return;
    try {
      await authApi.disableMfa();
      toast.warning('MFA Disabled', 'Two-Factor Authentication has been removed.');
      void refetchData();
    } catch {
      // error handled
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      toast.success('Session Terminated', 'The selected session has been revoked.');
      void refetchData();
    } catch {
      // error handled
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('This will terminate all other active sessions across all devices.')) return;
    try {
      await authApi.logoutAll();
      toast.success('Sessions Terminated', 'All other sessions have been revoked.');
      void refetchData();
    } catch {
      // error handled
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await authApi.removeDevice(deviceId);
      toast.success('Device Removed', 'The trusted device has been removed.');
      void refetchData();
    } catch {
      // error handled
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <AppLayout activePath="/users/me/security">
      <div className="space-y-6 max-w-4xl pb-16">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Security &amp; Privacy</h1>
          <p className="text-xs font-mono text-[#8A8A8A]">
            Manage authentication methods, multi-factor security, active sessions, and devices.
          </p>
          {loading && <p className="text-xs font-mono text-[#FACC15] mt-1">Loading security status...</p>}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-mono">Email Verification</CardDescription>
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>{overview?.email || '—'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overview?.isEmailVerified ? (
                <Badge variant="green">Verified</Badge>
              ) : (
                <Badge variant="yellow">Pending</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-mono">Two-Factor Auth</CardDescription>
              <CardTitle className="text-sm font-semibold">
                {overview?.mfaEnabled ? 'Enabled' : 'Disabled'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overview?.mfaEnabled ? (
                <Badge variant="green">Enrolled</Badge>
              ) : (
                <Badge variant="neutral">Not Enrolled</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-mono">Active Sessions</CardDescription>
              <CardTitle className="text-lg font-mono">
                {sessions.length || overview?.activeSessionsCount || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-[#8A8A8A] font-mono">Valid across devices</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-mono">Registered Devices</CardDescription>
              <CardTitle className="text-lg font-mono">
                {devices.length || overview?.devicesCount || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-[#8A8A8A] font-mono">Recognized clients</span>
            </CardContent>
          </Card>
        </div>

        {/* Two-Factor Authentication Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#FACC15]" />
                <div>
                  <CardTitle className="text-sm font-semibold">Two-Factor Authentication (TOTP)</CardTitle>
                  <CardDescription>
                    Protect your account with an extra verification step using Google Authenticator, Authy, or 1Password.
                  </CardDescription>
                </div>
              </div>
              {overview?.mfaEnabled ? (
                <Badge variant="green">Active</Badge>
              ) : (
                <Badge variant="neutral">Inactive</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {overview?.mfaEnabled ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#8A8A8A] font-mono">
                  TOTP 2FA is currently protecting your sign-ins and sensitive operations.
                </p>
                <Button variant="danger" size="sm" onClick={handleDisableMfa}>
                  Disable 2FA
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#8A8A8A] font-mono">
                  Enrolling 2FA is highly recommended for Administrators and Timetable Designers.
                </p>
                <Button variant="primary" size="sm" onClick={handleStartMfaEnroll}>
                  Enroll Authenticator App
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-[#8A8A8A]" />
              <div>
                <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
                <CardDescription>
                  Choose a passphrase of at least 12 characters. All other sessions will be revoked upon change.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-[#8A8A8A]">Current Password</label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-[#8A8A8A]">New Password (min 12 chars)</label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={12}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-[#8A8A8A]">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={12}
                />
              </div>
              <Button variant="primary" size="sm" disabled={savingPassword} className="font-mono uppercase">
                {savingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Connected OAuth Accounts Card */}
        <ConnectedAccounts />

        {/* Active Sessions Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Active Sessions</CardTitle>
                <CardDescription>
                  Sessions currently authorized to interact with your Slotly account.
                </CardDescription>
              </div>
              {sessions.length > 1 && (
                <Button variant="danger" size="sm" onClick={handleLogoutAll}>
                  Revoke All Others
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-xs font-mono text-[#8A8A8A]">No active sessions found.</p>
            ) : (
              <div className="divide-y divide-[#232323]">
                {sessions.map((s) => (
                  <div key={s.sessionId} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-[#FAFAFA]">
                          {s.device || 'Standard Device'} • {s.browser || 'Browser'}
                        </span>
                        {s.isCurrent && <Badge variant="green">Current Session</Badge>}
                      </div>
                      <div className="text-xs font-mono text-[#8A8A8A] mt-1">
                        IP: {s.ip} • Last Active:{' '}
                        {new Date(s.lastActiveAt).toLocaleString()}
                      </div>
                    </div>
                    {!s.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(s.sessionId)}
                      >
                        Terminate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Devices Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[#8A8A8A]" />
              <div>
                <CardTitle className="text-sm font-semibold">Recognized Devices</CardTitle>
                <CardDescription>
                  Devices you have previously signed in from.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <p className="text-xs font-mono text-[#8A8A8A]">No saved devices.</p>
            ) : (
              <div className="divide-y divide-[#232323]">
                {devices.map((d) => (
                  <div key={d.deviceId} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-[#FAFAFA]">
                          {d.name || `${d.browser} on ${d.os}`}
                        </span>
                        {d.isTrusted && <Badge variant="green">Trusted</Badge>}
                      </div>
                      <div className="text-xs font-mono text-[#8A8A8A] mt-1">
                        IP: {d.ip} • Last seen:{' '}
                        {new Date(d.lastActiveAt).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveDevice(d.deviceId)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Activity Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[#8A8A8A]" />
              <div>
                <CardTitle className="text-sm font-semibold">Security Audit Activity</CardTitle>
                <CardDescription>
                  Recent security and authentication events associated with your account.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-xs font-mono text-[#8A8A8A]">No recent security events recorded.</p>
            ) : (
              <div className="divide-y divide-[#232323] max-h-80 overflow-y-auto pr-2">
                {activity.map((act) => (
                  <div key={act.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[#FAFAFA] font-medium">{act.action}</span>
                      {act.ipAddress && <span className="text-[#8A8A8A] ml-2">from {act.ipAddress}</span>}
                    </div>
                    <span className="text-[#8A8A8A]">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MFA Enrollment Modal */}
      <Dialog open={mfaModalOpen} onOpenChange={setMfaModalOpen}>
        {revealedRecoveryCodes ? (
          <div>
            <DialogHeader>
              <DialogTitle>Save Your Emergency Recovery Codes</DialogTitle>
              <DialogDescription>
                Two-Factor Authentication is now enabled! Store these single-use recovery codes in a secure password manager.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="p-3 bg-black border border-[#232323] rounded grid grid-cols-2 gap-2 font-mono text-xs text-[#FAFAFA]">
                {revealedRecoveryCodes.map((code, idx) => (
                  <div key={idx} className="p-1.5 bg-[#111111] rounded text-center tracking-widest border border-[#232323]">
                    {code}
                  </div>
                ))}
              </div>
              <p className="text-xs font-mono text-[#8A8A8A] mt-2">
                Each code can be used once if you lose access to your authenticator app.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(revealedRecoveryCodes.join('\n'))}
              >
                {copiedKey ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copiedKey ? 'Copied All' : 'Copy All Codes'}
              </Button>
              <Button variant="primary" size="sm" onClick={() => setMfaModalOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleVerifyEnrollMfa}>
            <DialogHeader>
              <DialogTitle>Set Up Authenticator App</DialogTitle>
              <DialogDescription>
                Scan the QR code below using your authenticator app (Google Authenticator, Authy, 1Password).
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {enrollData?.qrCodeUrl && (
                <div className="flex justify-center p-4 bg-white rounded-lg w-48 h-48 mx-auto relative">
                  <Image
                    src={enrollData.qrCodeUrl}
                    alt="MFA QR Code"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-[#8A8A8A] mb-1 uppercase">
                  Manual Entry Key
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={enrollData?.secret || ''}
                    className="font-mono text-xs select-all"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(enrollData?.secret || '')}
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8A8A8A] mb-1 uppercase">
                  Verification Code
                </label>
                <Input
                  placeholder="000000"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.trim())}
                  className="font-mono text-center tracking-widest text-lg"
                  required
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setMfaModalOpen(false)}
                disabled={verifyingMfa}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={verifyingMfa || !mfaCode}>
                {verifyingMfa ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </AppLayout>
  );
}
