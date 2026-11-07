// React component for page.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authApi } from '@/features/auth/services/auth.api';
import type { SessionDto } from '@slotly/contracts';
import { toast } from '@/components/ui/toast';

/** React component rendering sessions page. */
export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await authApi.getSessions();
      setSessions(data);
    } catch {
      // error handled
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    authApi.getSessions()
      .then((data) => {
        if (!ignore) {
          setSessions(data);
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

  const handleRevoke = async (id: string) => {
    try {
      await authApi.revokeSession(id);
      toast.success('Session Revoked', 'Session terminated.');
      await fetchSessions();
    } catch {
      // error handled
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Revoke all other active sessions across all devices?')) return;
    try {
      await authApi.logoutAll();
      toast.success('Sessions Terminated', 'All other sessions have been revoked.');
      await fetchSessions();
    } catch {
      // error handled
    }
  };

  return (
    <AppLayout activePath="/auth/sessions">
      <div className="space-y-6 max-w-4xl pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Active Sessions</h1>
            <p className="text-xs font-mono text-[#8A8A8A]">
              Review and terminate active browser and device sessions across your account.
            </p>
          </div>
          {sessions.length > 1 && (
            <Button variant="danger" size="sm" onClick={handleLogoutAll}>
              Revoke All Others
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-xs font-mono text-[#8A8A8A]">Loading active sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-xs font-mono text-[#8A8A8A]">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <Card key={sess.sessionId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold">
                          {sess.device || 'Standard Client'} • {sess.browser || 'Browser'}
                        </CardTitle>
                        {sess.isCurrent && <Badge variant="green">Current Session</Badge>}
                      </div>
                      <CardDescription className="text-xs font-mono mt-1">
                        IP: {sess.ip} • Started {new Date(sess.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    {!sess.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(sess.sessionId)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xs text-[#8A8A8A]">
                    Last active: {new Date(sess.lastActiveAt).toLocaleString()} • Session ID: {sess.sessionId}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
