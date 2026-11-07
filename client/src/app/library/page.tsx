'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layouts/app-layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { WorkloadBar } from '@/features/library/components/workload-bar';
import { FacultyDialog } from '@/features/library/components/faculty-dialog';
import { SubjectDialog } from '@/features/library/components/subject-dialog';
import { RoomDialog } from '@/features/library/components/room-dialog';
import { ElectiveGroupDialog } from '@/features/library/components/elective-group-dialog';
import { ImportWizardDialog } from '@/features/library/components/import-wizard-dialog';
import { libraryApi } from '@/features/library/services/library.api';
import { institutionApi } from '@/features/institution/services/institution.api';
import { toast } from '@/components/ui/toast';
import type {
  FacultyDto,
  SubjectDto,
  RoomDto,
  ElectiveGroupDto,
} from '@slotly/contracts';
import {
  Users,
  BookOpen,
  DoorOpen,
  Plus,
  Download,
  Upload,
  Search,
  Archive,
  Trash2,
  Edit,
  Layers,
} from 'lucide-react';

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'faculty' | 'subjects' | 'rooms'>('faculty');
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Dialog states
  const [facultyDialogOpen, setFacultyDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyDto | null>(null);

  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectDto | null>(null);

  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomDto | null>(null);

  const [electiveDialogOpen, setElectiveDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ElectiveGroupDto | null>(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'faculty' | 'subject' | 'room' | 'elective';
    id: string;
    name: string;
  }>({ open: false, type: 'faculty', id: '', name: '' });

  // 1. Departments query
  const { data: departments = [] } = useQuery({
    queryKey: ['institution', 'departments'],
    queryFn: () => institutionApi.listDepartments(),
  });

  // 2. Faculty list query
  const { data: facultyData, isLoading: loadingFaculty } = useQuery({
    queryKey: ['library', 'faculty', { departmentId: selectedDeptId, archived: showArchived, search }],
    queryFn: () =>
      libraryApi.listFaculty({
        departmentId: selectedDeptId || undefined,
        archived: showArchived ? undefined : false,
        search: search || undefined,
        limit: 100,
      }),
  });

  // 3. Subjects query
  const { data: subjectData, isLoading: loadingSubjects } = useQuery({
    queryKey: ['library', 'subjects', { departmentId: selectedDeptId, archived: showArchived, search }],
    queryFn: () =>
      libraryApi.listSubjects({
        departmentId: selectedDeptId || undefined,
        archived: showArchived ? undefined : false,
        search: search || undefined,
        limit: 100,
      }),
  });

  // 4. Elective groups query
  const { data: electiveGroups = [] } = useQuery({
    queryKey: ['library', 'elective-groups'],
    queryFn: () => libraryApi.listElectiveGroups(),
  });

  // 5. Rooms query
  const { data: roomData, isLoading: loadingRooms } = useQuery({
    queryKey: ['library', 'rooms', { departmentId: selectedDeptId, archived: showArchived, search }],
    queryFn: () =>
      libraryApi.listRooms({
        departmentId: selectedDeptId || undefined,
        archived: showArchived ? undefined : false,
        search: search || undefined,
        limit: 100,
      }),
  });

  // Optimistic Archive Mutation
  const archiveMutation = useMutation({
    mutationFn: async ({
      entity,
      id,
      archived,
    }: {
      entity: 'faculty' | 'subject' | 'room';
      id: string;
      archived: boolean;
    }) => {
      if (entity === 'faculty') return libraryApi.archiveFaculty(id, archived);
      if (entity === 'subject') return libraryApi.archiveSubject(id, archived);
      return libraryApi.archiveRoom(id, archived);
    },
    onSuccess: (_, vars) => {
      toast.success(
        'Status Updated',
        `Record ${vars.archived ? 'archived' : 'unarchived'}.`,
      );
      queryClient.invalidateQueries({ queryKey: ['library', vars.entity] });
    },
    onError: (err) => {
      toast.error('Error', err instanceof Error ? err.message : 'Operation failed');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async ({
      type,
      id,
    }: {
      type: 'faculty' | 'subject' | 'room' | 'elective';
      id: string;
    }) => {
      if (type === 'faculty') return libraryApi.deleteFaculty(id);
      if (type === 'subject') return libraryApi.deleteSubject(id);
      if (type === 'elective') return libraryApi.deleteElectiveGroup(id);
      return libraryApi.deleteRoom(id);
    },
    onSuccess: (_, vars) => {
      toast.success('Deleted', 'Resource has been removed.');
      const queryKeyEntity =
        vars.type === 'faculty'
          ? 'faculty'
          : vars.type === 'subject'
            ? 'subjects'
            : vars.type === 'elective'
              ? 'elective-groups'
              : 'rooms';
      queryClient.invalidateQueries({ queryKey: ['library', queryKeyEntity] });
    },
    onError: (err) => {
      toast.error('Delete Failed', err instanceof Error ? err.message : 'Operation failed');
    },
  });

  const handleExport = (format: 'xlsx' | 'csv') => {
    const entity = activeTab === 'faculty' ? 'faculty' : activeTab === 'subjects' ? 'subjects' : 'rooms';
    const url = libraryApi.getExportUrl(entity, format);
    window.open(url, '_blank');
  };

  const faculties = facultyData?.items || [];
  const subjects = subjectData?.items || [];
  const rooms = roomData?.items || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232323] pb-5">
          <div>
            <h1 className="text-xl font-mono font-semibold tracking-tight text-[#FAFAFA]">
              Resource Library
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-1 font-sans">
              Central catalog for Faculty teaching resources, Academic Subjects,
              Elective groups, and Room facilities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('xlsx')}
              className="font-mono text-xs"
            >
              <Download className="w-4 h-4 mr-1.5" /> Export (.xlsx)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              className="font-mono text-xs"
            >
              <Download className="w-4 h-4 mr-1.5" /> Export (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              className="font-mono text-xs"
            >
              <Upload className="w-4 h-4 mr-1.5" /> Import
            </Button>

            {activeTab === 'faculty' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedFaculty(null);
                  setFacultyDialogOpen(true);
                }}
                className="font-mono text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Faculty
              </Button>
            )}
            {activeTab === 'subjects' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedGroup(null);
                    setElectiveDialogOpen(true);
                  }}
                  className="font-mono text-xs"
                >
                  <Layers className="w-4 h-4 mr-1.5" /> Elective Groups
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedSubject(null);
                    setSubjectDialogOpen(true);
                  }}
                  className="font-mono text-xs"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Subject
                </Button>
              </div>
            )}
            {activeTab === 'rooms' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedRoom(null);
                  setRoomDialogOpen(true);
                }}
                className="font-mono text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Room
              </Button>
            )}
          </div>
        </div>

        {/* Global Toolbar Filters */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-[#0A0A0A] border border-[#232323] rounded-md">
          <div className="relative min-w-56 flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8A8A8A]" />
            <Input
              placeholder="Search by code, name, designation, building..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="w-48">
            <Select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Select>
          </div>

          <Button
            type="button"
            variant={showArchived ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="h-9 text-xs font-mono"
          >
            <Archive className="w-3.5 h-3.5 mr-1.5" />
            {showArchived ? 'Showing Archived' : 'Active Only'}
          </Button>
        </div>

        {/* Tabs & Content */}
        <Tabs
          defaultValue="faculty"
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'faculty' | 'subjects' | 'rooms')}
        >
          <TabsList className="border-b border-[#232323]">
            <TabsTrigger value="faculty">
              <Users className="w-4 h-4 mr-1.5" />
              Faculty ({facultyData?.total ?? 0})
            </TabsTrigger>
            <TabsTrigger value="subjects">
              <BookOpen className="w-4 h-4 mr-1.5" />
              Subjects ({subjectData?.total ?? 0})
            </TabsTrigger>
            <TabsTrigger value="rooms">
              <DoorOpen className="w-4 h-4 mr-1.5" />
              Rooms & Facilities ({roomData?.total ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* FACULTY TAB */}
          <TabsContent value="faculty">
            <div className="border border-[#232323] rounded-md overflow-x-auto bg-[#0A0A0A]">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#111] border-b border-[#232323] text-[#8A8A8A] font-mono">
                  <tr>
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3 w-56">Teaching Workload</th>
                    <th className="p-3">Qualified Subjects</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232323]">
                  {loadingFaculty ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#8A8A8A] font-mono">
                        Loading faculty directory...
                      </td>
                    </tr>
                  ) : faculties.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#8A8A8A] font-mono">
                        No faculty found. Click &apos;Add Faculty&apos; or use &apos;Import&apos; to populate.
                      </td>
                    </tr>
                  ) : (
                    faculties.map((f) => {
                      const dept = departments.find((d) => d.id === f.departmentId);
                      // Calculate assigned hours from qualified subjects
                      const assignedHours = (f.subjectIds || []).reduce((sum, sId) => {
                        const s = subjects.find((sub) => sub.id === sId);
                        return sum + (s?.weeklyHours || 0);
                      }, 0);

                      return (
                        <tr key={f.id} className="hover:bg-[#111] transition-colors">
                          <td className="p-3 font-mono text-[#FAFAFA] font-medium">
                            {f.code}
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-[#FAFAFA]">{f.name}</div>
                            <div className="text-[11px] text-[#8A8A8A] font-mono">{f.email}</div>
                          </td>
                          <td className="p-3 font-mono text-[#FAFAFA]">
                            {dept?.code || f.departmentId}
                          </td>
                          <td className="p-3 text-[#8A8A8A]">{f.designation}</td>
                          <td className="p-3">
                            <WorkloadBar
                              assignedHours={assignedHours}
                              maxHours={f.maxHoursPerWeek}
                              minHours={f.minHoursPerWeek}
                            />
                          </td>
                          <td className="p-3 font-mono text-[#8A8A8A]">
                            <span className="text-[#FAFAFA]">
                              {f.subjectIds?.length || 0}
                            </span>{' '}
                            qualified
                          </td>
                          <td className="p-3">
                            {f.archived ? (
                              <Badge variant="neutral">Archived</Badge>
                            ) : (
                              <Badge variant="green">Active</Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Edit Faculty"
                                onClick={() => {
                                  setSelectedFaculty(f);
                                  setFacultyDialogOpen(true);
                                }}
                              >
                                <Edit className="w-3.5 h-3.5 text-[#FAFAFA]" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title={f.archived ? 'Unarchive' : 'Archive'}
                                onClick={() =>
                                  archiveMutation.mutate({
                                    entity: 'faculty',
                                    id: f.id,
                                    archived: !f.archived,
                                  })
                                }
                              >
                                <Archive className="w-3.5 h-3.5 text-[#8A8A8A]" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 hover:border-[#EF4444]"
                                title="Delete"
                                onClick={() =>
                                  setDeleteConfirm({
                                    open: true,
                                    type: 'faculty',
                                    id: f.id,
                                    name: `${f.name} (${f.code})`,
                                  })
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* SUBJECTS TAB */}
          <TabsContent value="subjects">
            <div className="border border-[#232323] rounded-md overflow-x-auto bg-[#0A0A0A]">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#111] border-b border-[#232323] text-[#8A8A8A] font-mono">
                  <tr>
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Credits</th>
                    <th className="p-3">Weekly / Lab Hrs</th>
                    <th className="p-3">Room Requirements</th>
                    <th className="p-3">Elective Group</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232323]">
                  {loadingSubjects ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#8A8A8A] font-mono">
                        Loading subject catalog...
                      </td>
                    </tr>
                  ) : subjects.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#8A8A8A] font-mono">
                        No subjects found. Click &apos;Add Subject&apos; or use &apos;Import&apos; to populate.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((s) => {
                      const dept = departments.find((d) => d.id === s.departmentId);
                      const eGroup = electiveGroups.find((g) => g.id === s.electiveGroupId);

                      return (
                        <tr key={s.id} className="hover:bg-[#111] transition-colors">
                          <td className="p-3 font-mono text-[#FAFAFA] font-medium">
                            {s.code}
                          </td>
                          <td className="p-3 font-medium text-[#FAFAFA]">{s.name}</td>
                          <td className="p-3 font-mono text-[#8A8A8A]">
                            {dept?.code || s.departmentId}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                s.type === 'lab'
                                  ? 'yellow'
                                  : s.type === 'theory'
                                    ? 'neutral'
                                    : 'green'
                              }
                            >
                              {s.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-[#FAFAFA]">{s.credits}</td>
                          <td className="p-3 font-mono text-[#8A8A8A]">
                            <span className="text-[#FAFAFA]">{s.weeklyHours}h</span>
                            {s.labHours > 0 && ` (${s.labHours}h lab)`}
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-[11px] text-[#FAFAFA]">
                              {s.requirements?.roomType} (&ge; {s.requirements?.minCapacity})
                            </div>
                            {s.requirements?.equipment && s.requirements.equipment.length > 0 && (
                              <div className="text-[10px] text-[#8A8A8A] font-mono truncate max-w-40">
                                {s.requirements.equipment.join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {s.isElective ? (
                              <Badge variant="yellow">
                                {eGroup ? eGroup.name : 'Elective'}
                              </Badge>
                            ) : (
                              <span className="text-[#8A8A8A] font-mono text-[11px]">Core</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Edit Subject"
                                onClick={() => {
                                  setSelectedSubject(s);
                                  setSubjectDialogOpen(true);
                                }}
                              >
                                <Edit className="w-3.5 h-3.5 text-[#FAFAFA]" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title={s.archived ? 'Unarchive' : 'Archive'}
                                onClick={() =>
                                  archiveMutation.mutate({
                                    entity: 'subject',
                                    id: s.id,
                                    archived: !s.archived,
                                  })
                                }
                              >
                                <Archive className="w-3.5 h-3.5 text-[#8A8A8A]" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 hover:border-[#EF4444]"
                                title="Delete"
                                onClick={() =>
                                  setDeleteConfirm({
                                    open: true,
                                    type: 'subject',
                                    id: s.id,
                                    name: `${s.name} (${s.code})`,
                                  })
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ROOMS TAB */}
          <TabsContent value="rooms">
            <div className="border border-[#232323] rounded-md overflow-x-auto bg-[#0A0A0A]">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#111] border-b border-[#232323] text-[#8A8A8A] font-mono">
                  <tr>
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Building</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Capacity</th>
                    <th className="p-3">Equipment</th>
                    <th className="p-3">Shared</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232323]">
                  {loadingRooms ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#8A8A8A] font-mono">
                        Loading rooms directory...
                      </td>
                    </tr>
                  ) : rooms.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#8A8A8A] font-mono">
                        No rooms registered. Click &apos;Add Room&apos; or use &apos;Import&apos; to populate.
                      </td>
                    </tr>
                  ) : (
                    rooms.map((r) => (
                      <tr key={r.id} className="hover:bg-[#111] transition-colors">
                        <td className="p-3 font-mono text-[#FAFAFA] font-medium">
                          {r.code}
                        </td>
                        <td className="p-3 font-medium text-[#FAFAFA]">{r.name}</td>
                        <td className="p-3 text-[#8A8A8A]">{r.building}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              r.type === 'lab'
                                ? 'yellow'
                                : r.type === 'lecture'
                                  ? 'neutral'
                                  : 'green'
                            }
                          >
                            {r.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-[#FAFAFA]">
                          {r.capacity} seats
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-48">
                            {r.equipment && r.equipment.length > 0 ? (
                              r.equipment.map((eq) => (
                                <span
                                  key={eq}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#111] border border-[#232323] text-[#FAFAFA]"
                                >
                                  {eq}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#8A8A8A] font-mono text-[10px]">
                                Basic
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          {r.shared ? (
                            <span className="text-[#22C55E]">Yes</span>
                          ) : (
                            <span className="text-[#8A8A8A]">No</span>
                          )}
                        </td>
                        <td className="p-3">
                          {r.archived ? (
                            <Badge variant="neutral">Archived</Badge>
                          ) : (
                            <Badge variant="green">Active</Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="Edit Room"
                              onClick={() => {
                                setSelectedRoom(r);
                                setRoomDialogOpen(true);
                              }}
                            >
                              <Edit className="w-3.5 h-3.5 text-[#FAFAFA]" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title={r.archived ? 'Unarchive' : 'Archive'}
                              onClick={() =>
                                archiveMutation.mutate({
                                    entity: 'room',
                                    id: r.id,
                                    archived: !r.archived,
                                  })
                              }
                            >
                              <Archive className="w-3.5 h-3.5 text-[#8A8A8A]" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 hover:border-[#EF4444]"
                              title="Delete"
                              onClick={() =>
                                setDeleteConfirm({
                                  open: true,
                                  type: 'room',
                                  id: r.id,
                                  name: `${r.name} (${r.code})`,
                                })
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal Dialogs */}
        <FacultyDialog
          open={facultyDialogOpen}
          onOpenChange={setFacultyDialogOpen}
          faculty={selectedFaculty}
          departments={departments}
          subjects={subjects}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['library', 'faculty'] });
          }}
        />

        <SubjectDialog
          open={subjectDialogOpen}
          onOpenChange={setSubjectDialogOpen}
          subject={selectedSubject}
          departments={departments}
          electiveGroups={electiveGroups}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['library', 'subjects'] });
          }}
        />

        <RoomDialog
          open={roomDialogOpen}
          onOpenChange={setRoomDialogOpen}
          room={selectedRoom}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['library', 'rooms'] });
          }}
        />

        <ElectiveGroupDialog
          open={electiveDialogOpen}
          onOpenChange={setElectiveDialogOpen}
          group={selectedGroup}
          subjects={subjects}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['library', 'elective-groups'] });
          }}
        />

        <ImportWizardDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          defaultEntity={activeTab === 'faculty' ? 'faculty' : activeTab === 'subjects' ? 'subjects' : 'rooms'}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['library'] });
          }}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
          title={`Delete ${deleteConfirm.name}?`}
          description="Are you sure you want to delete this resource? If it has linked timetable assignments or dependencies, deletions will be verified."
          variant="danger"
          confirmLabel="Delete Resource"
          onConfirm={() => {
            deleteMutation.mutate({
              type: deleteConfirm.type,
              id: deleteConfirm.id,
            });
          }}
        />
      </div>
    </AppLayout>
  );
}
