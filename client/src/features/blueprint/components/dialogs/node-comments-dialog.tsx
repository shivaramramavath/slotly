'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, User } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import { toast } from '@/components/ui/toast';
import type { BlueprintCommentDto } from '@slotly/contracts';

export function NodeCommentsDialog() {
  const activeNodeId = useBlueprintStore((s) => s.activeCommentsNodeId);
  const setActiveNodeId = useBlueprintStore((s) => s.setActiveCommentsNodeId);
  const projectId = useBlueprintStore((s) => s.projectId);
  const nodes = useBlueprintStore((s) => s.nodes);

  const [comments, setComments] = useState<BlueprintCommentDto[]>([]);
  const [newText, setNewText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const targetNode = nodes.find((n) => n.id === activeNodeId);

  useEffect(() => {
    if (!activeNodeId) return;

    let mounted = true;
    blueprintApi
      .getComments(projectId, activeNodeId)
      .then((data) => {
        if (mounted) setComments(data);
      })
      .catch((err) => {
        if (mounted) toast.error('Failed to load comments', (err as Error).message);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeNodeId, projectId]);

  if (!activeNodeId || !targetNode) return null;

  const handleSend = async () => {
    if (!newText.trim()) return;
    setIsSending(true);
    try {
      const added = await blueprintApi.addComment(projectId, activeNodeId, {
        text: newText.trim(),
      });
      setComments((prev) => [...prev, added]);
      setNewText('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error('Failed to post comment', (err as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={Boolean(activeNodeId)} onOpenChange={() => setActiveNodeId(null)}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#FACC15] mb-1">
          <MessageSquare className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Comments: {targetNode.data.label}
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          Collaborative discussion and mentions on this blueprint node.
        </DialogDescription>
      </DialogHeader>

      <div className="my-3 space-y-3">
        {/* Comment list */}
        <div className="max-h-60 overflow-y-auto space-y-2 p-1">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-[#8A8A8A]">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#8A8A8A]">
              No comments yet. Start the conversation!
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="p-2.5 rounded bg-[#161616] border border-[#232323] text-xs">
                <div className="flex items-center justify-between text-[#8A8A8A] font-mono text-[10px] mb-1">
                  <span className="flex items-center gap-1 text-[#FAFAFA]">
                    <User className="h-2.5 w-2.5 text-[#FACC15]" />
                    <span>{c.userName}</span>
                  </span>
                  <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="text-xs text-[#FAFAFA]">
                  {c.text.split(' ').map((word, i) =>
                    word.startsWith('@') ? (
                      <span key={i} className="text-[#FACC15] font-semibold mr-1">
                        {word}
                      </span>
                    ) : (
                      <span key={i} className="mr-1">
                        {word}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* New comment input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Write a comment (@mention teammate)..."
            className="flex-1 bg-[#161616] border border-[#232323] rounded h-8 px-2.5 text-xs text-[#FAFAFA] placeholder:text-[#555555] focus:outline-none focus:border-[#FACC15]"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={isSending || !newText.trim()}
            className="h-8 px-3 text-xs gap-1"
          >
            <Send className="h-3 w-3" />
            <span>Send</span>
          </Button>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => setActiveNodeId(null)}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
