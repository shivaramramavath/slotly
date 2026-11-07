'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  EyeOff,
  Building2,
  FolderTree,
  GraduationCap,
  Calendar,
  Users2,
  BookOpen,
  UserCheck,
  DoorOpen,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { useBlueprintStore } from '../../store/blueprint.store';

const ICONS: Record<string, React.ElementType> = {
  institution: Building2,
  department: FolderTree,
  program: GraduationCap,
  academicYear: Calendar,
  semester: Calendar,
  section: Users2,
  batch: Users2,
  subjectAssignment: BookOpen,
  faculty: UserCheck,
  room: DoorOpen,
};

export function BlueprintSearchFilter() {
  const { setCenter } = useReactFlow();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchQuery = useBlueprintStore((s) => s.searchQuery);
  const setSearchQuery = useBlueprintStore((s) => s.setSearchQuery);
  const filterNodeType = useBlueprintStore((s) => s.filterNodeType);
  const setFilterNodeType = useBlueprintStore((s) => s.setFilterNodeType);
  const hideUnrelated = useBlueprintStore((s) => s.hideUnrelated);
  const setHideUnrelated = useBlueprintStore((s) => s.setHideUnrelated);
  const nodes = useBlueprintStore((s) => s.nodes);
  const selectNode = useBlueprintStore((s) => s.selectNode);

  // Search results
  const matchingNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();

    return nodes.filter((n) => {
      const label = (n.data.label || '').toLowerCase();
      const code = String(n.data.config?.code || '').toLowerCase();
      const type = n.data.nodeType.toLowerCase();
      const faculty = String(n.data.config?.facultyName || '').toLowerCase();
      const room = String(n.data.config?.roomName || '').toLowerCase();

      return (
        label.includes(q) ||
        code.includes(q) ||
        type.includes(q) ||
        faculty.includes(q) ||
        room.includes(q)
      );
    });
  }, [nodes, searchQuery]);

  const handleSelectResult = (nodeId: string, position: { x: number; y: number }) => {
    selectNode(nodeId);
    setCenter(position.x + 120, position.y + 65, { zoom: 1.1, duration: 400 });
    setIsSearchOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Search Input Container */}
      <div className="relative">
        <div className="flex items-center bg-[#161616] border border-[#232323] rounded h-7 px-2 w-48 focus-within:w-64 transition-all">
          <Search className="h-3.5 w-3.5 text-[#8A8A8A] shrink-0 mr-1.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search nodes, codes, rooms..."
            className="w-full bg-transparent text-xs text-[#FAFAFA] placeholder:text-[#555555] focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="text-[#8A8A8A] hover:text-[#FAFAFA]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim() && (
          <div className="absolute top-8 left-0 w-72 bg-[#111111] border border-[#232323] rounded-md shadow-2xl p-1 z-50 max-h-60 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-mono text-[#8A8A8A] border-b border-[#232323] flex items-center justify-between">
              <span>{matchingNodes.length} match(es)</span>
              <span>ESC to close</span>
            </div>

            {matchingNodes.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#8A8A8A]">No matching nodes found</div>
            ) : (
              matchingNodes.map((node) => {
                const Icon = ICONS[node.data.nodeType] || Building2;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleSelectResult(node.id, node.position)}
                    className="w-full px-2 py-1.5 hover:bg-[#1a1a1a] rounded flex items-center justify-between text-left text-xs text-[#FAFAFA] group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className="h-3.5 w-3.5 text-[#8A8A8A] shrink-0" />
                      <span className="truncate">{node.data.label}</span>
                      <span className="font-mono text-[9px] text-[#666666]">
                        ({node.data.nodeType})
                      </span>
                    </div>
                    <ArrowUpRight className="h-3 w-3 text-[#8A8A8A] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Filter by Node Type */}
      <div className="flex items-center bg-[#161616] border border-[#232323] rounded h-7 p-0.5">
        {(['all', 'section', 'subjectAssignment', 'faculty', 'room'] as const).map((t) => (
          <Button
            key={t}
            variant={filterNodeType === t ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setFilterNodeType(t)}
            className="h-5 px-1.5 text-[10px] uppercase font-mono"
          >
            {t === 'all' ? 'All' : t === 'subjectAssignment' ? 'Subjects' : t}
          </Button>
        ))}
      </div>

      {/* Hide Unrelated Nodes Toggle */}
      <Button
        variant={hideUnrelated ? 'primary' : 'ghost'}
        size="icon"
        className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
        onClick={() => setHideUnrelated(!hideUnrelated)}
        title={hideUnrelated ? 'Show all nodes' : 'Hide unrelated nodes'}
      >
        {hideUnrelated ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
