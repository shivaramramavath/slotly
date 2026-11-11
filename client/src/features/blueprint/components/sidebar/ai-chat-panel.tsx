// Chat panel component providing whole-blueprint AI assistance with streaming, context toggles, and suggestions.
'use client';

import * as React from 'react';
import {
  Sparkles,
  Send,
  Square,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Globe2,
  Focus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { blueprintApi } from '../../services/blueprint.api';
import type { BlueprintAiChatMessage } from '@slotly/contracts';
import { cn } from '@/lib/utils';

/** Interface representing chat message state. */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedNodeIds?: string[] | undefined;
  timestamp: string;
}

/** Props for AiChatPanel component. */
export interface AiChatPanelProps {
  projectId: string;
  className?: string | undefined;
}

const SUGGESTION_CHIPS = [
  'What is blocking this blueprint?',
  'Summarise the hierarchy',
  'Which faculty are over-allocated?',
  'Suggest period timings',
];

/** Helper rendering safe sanitized markdown text. */
function renderMarkdown(content: string) {
  // Simple, secure text renderer converting markdown blocks into safe JSX elements
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let listItems: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list`} className="list-disc pl-4 space-y-1 my-1.5 text-xs text-[#FAFAFA]">
          {listItems.map((item, idx) => (
            <li key={idx}>
              {formatInlineMarkdown(item)}
            </li>
          ))}
        </ul>,
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${index}`}
            className="p-2.5 rounded-[8px] bg-[#0A0A0A] border border-[#232323] font-mono text-[11px] text-[#FAFAFA] overflow-x-auto my-2"
          >
            <code>{codeBlockContent.join('\n')}</code>
          </pre>,
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        flushList(`flush-${index}`);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      listItems.push(line.trim().slice(2));
      return;
    }

    flushList(`flush-${index}`);

    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${index}`} className="font-semibold text-xs text-[#FAFAFA] mt-2 mb-1">
          {line.slice(4)}
        </h4>,
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="font-semibold text-sm text-[#FAFAFA] mt-2 mb-1">
          {line.slice(3)}
        </h3>,
      );
    } else if (line.trim().length > 0) {
      elements.push(
        <p key={`p-${index}`} className="text-xs text-[#FAFAFA] my-1 leading-relaxed">
          {formatInlineMarkdown(line)}
        </p>,
      );
    }
  });

  flushList('final');

  return elements;
}

/** Formats bold, inline code, and safe links. */
function formatInlineMarkdown(text: string): React.ReactNode {
  // Regex parsing for bold **text**, inline code `code`, and [link](url)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Check code span
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch && codeMatch[1]) {
      parts.push(
        <code
          key={keyIdx++}
          className="font-mono text-[11px] px-1 py-0.5 rounded bg-[#181818] border border-[#232323] text-[#FAFAFA]"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Check bold
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch[1]) {
      parts.push(
        <strong key={keyIdx++} className="font-semibold text-[#FAFAFA]">
          {boldMatch[1]}
        </strong>,
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check link
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch && linkMatch[1] && linkMatch[2]) {
      const url = linkMatch[2].startsWith('javascript:') ? '#' : linkMatch[2];
      parts.push(
        <a
          key={keyIdx++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3B82F6] hover:underline"
        >
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Regular character
    const nextSpecial = remaining.search(/[`*\[]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining.charAt(0));
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

/** React component rendering whole-blueprint AI chat assistant. */
export function AiChatPanel({ projectId, className = '' }: AiChatPanelProps) {
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);
  const nodes = useBlueprintStore((s) => s.nodes);
  const selectNode = useBlueprintStore((s) => s.selectNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeName = selectedNode ? (selectedNode.data.label || selectedNode.id) : null;

  const [includeSelectedNode, setIncludeSelectedNode] = React.useState(true);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [isScrolledUp, setIsScrolledUp] = React.useState(false);

  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Auto-scroll logic
  const scrollToBottom = React.useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      setIsScrolledUp(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom();
    }
  }, [messages, streamingContent, isScrolledUp, scrollToBottom]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      setIsScrolledUp(distanceFromBottom > 80);
    }
  };

  const handleSendMessage = async (userText: string) => {
    const text = userText.trim();
    if (!text || isStreaming) return;

    setError(null);
    setInputValue('');

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent('');

    // Prepare history payload
    const historyPayload: BlueprintAiChatMessage[] = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await blueprintApi.chatAi(projectId, {
        message: text,
        selectedNodeId: selectedNodeId || undefined,
        includeSelectedNode: Boolean(includeSelectedNode && selectedNodeId),
        history: historyPayload,
      });

      // Simulated streaming effect for smooth token output
      const fullReply = res.reply;
      let currentIdx = 0;
      const chunkSize = Math.max(1, Math.floor(fullReply.length / 20));

      const interval = setInterval(() => {
        currentIdx += chunkSize;
        if (currentIdx >= fullReply.length) {
          clearInterval(interval);
          setStreamingContent('');
          setIsStreaming(false);

          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: fullReply,
              suggestedNodeIds: res.suggestedNodeIds,
              timestamp: res.timestamp || new Date().toISOString(),
            },
          ]);
        } else {
          setStreamingContent(fullReply.slice(0, currentIdx));
        }
      }, 25);
    } catch (err) {
      setIsStreaming(false);
      setStreamingContent('');
      setError((err as Error).message || 'Failed to communicate with Slotly AI.');
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (streamingContent) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: streamingContent + ' [stopped]',
          timestamp: new Date().toISOString(),
        },
      ]);
      setStreamingContent('');
    }
    setIsStreaming(false);
  };

  const handleClearChat = () => {
    if (messages.length > 0 && !window.confirm('Clear current chat thread?')) {
      return;
    }
    setMessages([]);
    setStreamingContent('');
    setError(null);
  };

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage(inputValue);
    }
  };

  return (
    <div
      className={cn('flex flex-col h-full bg-[#0A0A0A] text-xs', className)}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* Context Bar */}
      <div className="px-4 py-2.5 border-b border-[#232323] flex items-center justify-between gap-2 bg-[#111111]/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {/* Whole Blueprint Chip (Always on) */}
          <span className="h-6 px-2.5 rounded-full bg-[#181818] border border-[#383838] text-[11px] font-mono text-[#FAFAFA] flex items-center gap-1.5 shrink-0">
            <Globe2 className="h-3 w-3 text-[#22C55E]" />
            <span>Whole blueprint</span>
          </span>

          {/* Selected Node Focus Toggle Chip */}
          {selectedNodeName && (
            <button
              type="button"
              onClick={() => setIncludeSelectedNode(!includeSelectedNode)}
              className={cn(
                'h-6 px-2.5 rounded-full border text-[11px] font-mono flex items-center gap-1.5 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]',
                includeSelectedNode
                  ? 'bg-[#181818] border-[#383838] text-[#FAFAFA]'
                  : 'bg-[#111111] border-transparent text-[#8A8A8A] hover:text-[#FAFAFA]',
              )}
            >
              <Focus className="h-3 w-3 text-[#FACC15]" />
              <span className="truncate max-w-[120px]">Node: {selectedNodeName}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          title="New Chat / Clear"
          aria-label="New Chat"
          className="h-7 w-7 rounded-[6px] text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#181818] flex items-center justify-center transition-colors shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages List */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
      >
        {messages.length === 0 && !isStreaming ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4 my-auto">
            <div className="h-10 w-10 rounded-full bg-[#141414] border border-[#232323] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#FACC15]" />
            </div>

            <div className="space-y-1">
              <p className="font-medium text-xs text-[#FAFAFA]">Ask about your whole blueprint</p>
              <p className="font-mono text-[11px] text-[#8A8A8A]">
                Slotly AI understands your hierarchy, resource assignments, and readiness blocks.
              </p>
            </div>

            {/* 4 Suggestion Chips */}
            <div className="grid grid-cols-1 gap-2 w-full pt-2">
              {SUGGESTION_CHIPS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSendMessage(suggestion)}
                  className="h-8 px-3 rounded-[12px] bg-[#111111] hover:bg-[#181818] border border-[#232323] hover:border-[#383838] text-xs text-left text-[#FAFAFA] transition-colors truncate focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex flex-col space-y-1',
                m.role === 'user' ? 'items-end' : 'items-start',
              )}
            >
              {m.role === 'assistant' && (
                <span className="font-mono text-[10px] text-[#8A8A8A] pl-1">
                  Slotly AI
                </span>
              )}

              <div
                className={cn(
                  'rounded-[14px] p-3 text-xs leading-relaxed group relative transition-colors',
                  m.role === 'user'
                    ? 'bg-[#181818] border border-[#282828] text-[#FAFAFA] max-w-[85%]'
                    : 'bg-transparent text-[#FAFAFA] w-full pr-8',
                )}
              >
                {m.role === 'assistant' ? (
                  <div>
                    {renderMarkdown(m.content)}

                    {/* Suggested Node Chips if returned */}
                    {m.suggestedNodeIds && m.suggestedNodeIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-[#232323]">
                        <span className="font-mono text-[10px] text-[#8A8A8A] self-center">
                          Jump to node:
                        </span>
                        {m.suggestedNodeIds.map((nid) => {
                          const target = nodes.find((n) => n.id === nid);
                          const label = target ? target.data.label : nid;
                          return (
                            <button
                              key={nid}
                              type="button"
                              onClick={() => selectNode(nid)}
                              className="h-6 px-2 rounded-[6px] bg-[#141414] hover:bg-[#1C1C1C] border border-[#232323] hover:border-[#383838] text-[11px] font-mono text-[#FAFAFA] transition-colors"
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <span>{m.content}</span>
                )}

                {/* Copy button */}
                {m.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => handleCopy(m.id, m.content)}
                    aria-label="Copy message"
                    className="absolute right-0 top-2 h-7 w-7 rounded-[6px] text-[#8A8A8A] hover:text-[#FAFAFA] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center bg-[#111111] border border-[#232323]"
                  >
                    {copiedId === m.id ? (
                      <Check className="h-3.5 w-3.5 text-[#22C55E]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Streaming State */}
        {isStreaming && (
          <div className="flex flex-col space-y-1 items-start">
            <span className="font-mono text-[10px] text-[#8A8A8A] pl-1">
              Slotly AI
            </span>
            <div className="w-full rounded-[14px] p-3 text-xs leading-relaxed text-[#FAFAFA]">
              {streamingContent ? (
                <>
                  {renderMarkdown(streamingContent)}
                  <span className="inline-block w-2 h-3.5 bg-[#FAFAFA] animate-pulse ml-1 align-middle" />
                </>
              ) : (
                <div className="flex items-center gap-1.5 py-1 text-[#8A8A8A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FAFAFA] animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FAFAFA] animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FAFAFA] animate-bounce [animation-delay:0.4s]" />
                  <span className="font-mono text-[11px] ml-2">Analyzing blueprint...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inline Error Row */}
        {error && (
          <div className="p-3 rounded-[10px] bg-[#160D0D] border border-[#EF4444]/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-4 w-4 text-[#EF4444] shrink-0" />
              <span className="text-xs text-[#EF4444] truncate">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                if (lastUser) void handleSendMessage(lastUser.content);
              }}
              className="h-6 px-2 rounded-[6px] border border-[#EF4444]/40 text-[11px] font-mono text-[#EF4444] hover:bg-[#EF4444]/10 shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Jump to latest button */}
        {isScrolledUp && (
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Jump to latest message"
            className="sticky bottom-2 left-1/2 -translate-x-1/2 h-7 px-3 rounded-full bg-[#181818] border border-[#383838] text-[11px] font-mono text-[#FAFAFA] shadow-lg flex items-center gap-1 hover:bg-[#202020] transition-colors"
          >
            <span>Jump to latest</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Composer (Sticky Bottom) */}
      <div className="p-3 border-t border-[#232323] bg-[#0A0A0A]/95 backdrop-blur-sm space-y-1.5 shrink-0">
        <div className="relative flex items-end gap-2 bg-[#111111] border border-[#232323] focus-within:border-[#383838] rounded-[12px] p-2 transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Slotly AI about this blueprint..."
            aria-label="Ask Slotly AI"
            className="flex-1 bg-transparent border-0 text-xs text-[#FAFAFA] placeholder:text-[#666666] focus:outline-none resize-none max-h-24 min-h-[24px] py-1"
          />

          <div className="flex items-center gap-1 shrink-0">
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStop}
                aria-label="Stop generating"
                title="Stop generation"
                className="h-8 w-8 rounded-[8px] bg-[#1F1F1F] hover:bg-[#282828] text-[#FAFAFA] flex items-center justify-center transition-colors"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim()}
                aria-label="Send message"
                title="Send message"
                className="h-8 w-8 rounded-[8px] bg-[#FAFAFA] hover:bg-[#FAFAFA]/90 text-[#000000] disabled:opacity-30 disabled:hover:bg-[#FAFAFA] flex items-center justify-center transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[#666666] px-1">
          <span>Enter to send, Shift+Enter for newline</span>
          {inputValue.length > 1500 && (
            <span className={cn(inputValue.length > 2000 && 'text-[#EF4444]')}>
              {inputValue.length}/2000
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
