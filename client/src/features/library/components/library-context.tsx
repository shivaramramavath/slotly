// Unified context provider managing library filters, tab counts, mutation actions, and modal dialogs.
'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { institutionApi } from '@/features/institution/services/institution.api';
import { libraryApi } from '../services/library.api';
import { FacultyDialog } from './faculty-dialog';
import { SubjectDialog } from './subject-dialog';
import { RoomDialog } from './room-dialog';
import { ElectiveGroupDialog } from './elective-group-dialog';
import { ImportWizardDialog } from './import-wizard-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getActiveLibraryTab, type LibraryTabKey } from './library-tabs';
import type {
  DepartmentDto,
  FacultyDto,
  SubjectDto,
  RoomDto,
  ElectiveGroupDto,
  ImportEntity,
} from '@slotly/contracts';

/** Context state interface for library feature. */
export interface LibraryContextValue {
  activeTab: LibraryTabKey;
  search: string;
  setSearch: (value: string) => void;
  selectedDeptId: string;
  setSelectedDeptId: (value: string) => void;
  showArchived: boolean;
  setShowArchived: (value: boolean | ((prev: boolean) => boolean)) => void;
  departments: DepartmentDto[];
  departmentsLoading: boolean;
  tabCounts: Partial<Record<LibraryTabKey, number | undefined>>;
  setTabCount: (tab: LibraryTabKey, count: number) => void;
  openAddFaculty: () => void;
  openEditFaculty: (faculty: FacultyDto) => void;
  openAddSubject: () => void;
  openEditSubject: (subject: SubjectDto) => void;
  openAddRoom: () => void;
  openEditRoom: (room: RoomDto) => void;
  openElectiveGroups: () => void;
  openImport: (entity?: ImportEntity) => void;
  confirmDelete: (args: {
    type: 'faculty' | 'subject' | 'room' | 'elective';
    id: string;
    name: string;
  }) => void;
  archiveResource: (args: {
    entity: 'faculty' | 'subject' | 'room';
    id: string;
    archived: boolean;
  }) => void;
}

const LibraryContext = React.createContext<LibraryContextValue | null>(null);

/** Props for LibraryProvider component. */
export interface LibraryProviderProps {
  children: React.ReactNode;
}

/** React component providing library context and hosting dialog instances. */
export function LibraryProvider({ children }: LibraryProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab = getActiveLibraryTab(pathname);

  // Read URL query params
  const urlSearch = searchParams.get('search') || '';
  const selectedDeptId = searchParams.get('department') || '';
  const showArchived = searchParams.get('archived') === 'true';

  // Search input state with render-time sync for back/forward navigation
  const [search, setSearchState] = React.useState<string>(urlSearch);
  const [prevUrlSearch, setPrevUrlSearch] = React.useState<string>(urlSearch);

  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearchState(urlSearch);
  }

  // Tab counts map
  const [tabCounts, setTabCounts] = React.useState<
    Partial<Record<LibraryTabKey, number | undefined>>
  >({});

  const setTabCount = React.useCallback((tab: LibraryTabKey, count: number) => {
    setTabCounts((prev) => (prev[tab] === count ? prev : { ...prev, [tab]: count }));
  }, []);

  // Sync state changes with URL query string
  const updateUrl = React.useCallback(
    (newSearch: string, newDept: string, newArchived: boolean) => {
      const params = new URLSearchParams();
      if (newSearch) params.set('search', newSearch);
      if (newDept && activeTab !== 'rooms') params.set('department', newDept);
      if (newArchived) params.set('archived', 'true');

      const queryString = params.toString();
      const targetUrl = `${pathname}${queryString ? `?${queryString}` : ''}`;
      router.replace(targetUrl, { scroll: false });
    },
    [pathname, activeTab, router],
  );

  const setSearch = React.useCallback(
    (val: string) => {
      setSearchState(val);
      updateUrl(val, selectedDeptId, showArchived);
    },
    [selectedDeptId, showArchived, updateUrl],
  );

  const setSelectedDeptId = React.useCallback(
    (val: string) => {
      updateUrl(search, val, showArchived);
    },
    [search, showArchived, updateUrl],
  );

  const setShowArchived = React.useCallback(
    (updater: boolean | ((prev: boolean) => boolean)) => {
      const nextVal = typeof updater === 'function' ? updater(showArchived) : updater;
      updateUrl(search, selectedDeptId, nextVal);
    },
    [search, selectedDeptId, showArchived, updateUrl],
  );

  // Departments query
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['institution', 'departments'],
    queryFn: () => institutionApi.listDepartments(),
  });

  // Subjects query for qualifier & elective groups references
  const { data: subjectsData } = useQuery({
    queryKey: ['library', 'subjects', { archived: false, limit: 100 }],
    queryFn: () => libraryApi.listSubjects({ limit: 100 }),
  });
  const subjects = subjectsData?.items || [];

  // Elective groups query
  const { data: electiveGroups = [] } = useQuery({
    queryKey: ['library', 'elective-groups'],
    queryFn: () => libraryApi.listElectiveGroups(),
  });

  // Dialog open & selected state
  const [facultyDialogOpen, setFacultyDialogOpen] = React.useState(false);
  const [selectedFaculty, setSelectedFaculty] = React.useState<FacultyDto | null>(null);

  const [subjectDialogOpen, setSubjectDialogOpen] = React.useState(false);
  const [selectedSubject, setSelectedSubject] = React.useState<SubjectDto | null>(null);

  const [roomDialogOpen, setRoomDialogOpen] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState<RoomDto | null>(null);

  const [electiveDialogOpen, setElectiveDialogOpen] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState<ElectiveGroupDto | null>(null);

  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [importEntity, setImportEntity] = React.useState<ImportEntity>('faculty');

  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    open: boolean;
    type: 'faculty' | 'subject' | 'room' | 'elective';
    id: string;
    name: string;
  }>({ open: false, type: 'faculty', id: '', name: '' });

  // Dialog openers
  const openAddFaculty = React.useCallback(() => {
    setSelectedFaculty(null);
    setFacultyDialogOpen(true);
  }, []);

  const openEditFaculty = React.useCallback((faculty: FacultyDto) => {
    setSelectedFaculty(faculty);
    setFacultyDialogOpen(true);
  }, []);

  const openAddSubject = React.useCallback(() => {
    setSelectedSubject(null);
    setSubjectDialogOpen(true);
  }, []);

  const openEditSubject = React.useCallback((subject: SubjectDto) => {
    setSelectedSubject(subject);
    setSubjectDialogOpen(true);
  }, []);

  const openAddRoom = React.useCallback(() => {
    setSelectedRoom(null);
    setRoomDialogOpen(true);
  }, []);

  const openEditRoom = React.useCallback((room: RoomDto) => {
    setSelectedRoom(room);
    setRoomDialogOpen(true);
  }, []);

  const openElectiveGroups = React.useCallback(() => {
    setSelectedGroup(null);
    setElectiveDialogOpen(true);
  }, []);

  const openImport = React.useCallback((entity?: ImportEntity) => {
    setImportEntity(entity || activeTab);
    setImportDialogOpen(true);
  }, [activeTab]);

  const confirmDelete = React.useCallback(
    (args: {
      type: 'faculty' | 'subject' | 'room' | 'elective';
      id: string;
      name: string;
    }) => {
      setDeleteConfirm({
        open: true,
        type: args.type,
        id: args.id,
        name: args.name,
      });
    },
    [],
  );

  // Archive Mutation
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

  const archiveResource = React.useCallback(
    (args: { entity: 'faculty' | 'subject' | 'room'; id: string; archived: boolean }) => {
      archiveMutation.mutate(args);
    },
    [archiveMutation],
  );

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

  const value: LibraryContextValue = React.useMemo(
    () => ({
      activeTab,
      search,
      setSearch,
      selectedDeptId,
      setSelectedDeptId,
      showArchived,
      setShowArchived,
      departments,
      departmentsLoading,
      tabCounts,
      setTabCount,
      openAddFaculty,
      openEditFaculty,
      openAddSubject,
      openEditSubject,
      openAddRoom,
      openEditRoom,
      openElectiveGroups,
      openImport,
      confirmDelete,
      archiveResource,
    }),
    [
      activeTab,
      search,
      setSearch,
      selectedDeptId,
      setSelectedDeptId,
      showArchived,
      setShowArchived,
      departments,
      departmentsLoading,
      tabCounts,
      setTabCount,
      openAddFaculty,
      openEditFaculty,
      openAddSubject,
      openEditSubject,
      openAddRoom,
      openEditRoom,
      openElectiveGroups,
      openImport,
      confirmDelete,
      archiveResource,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>
      {children}

      {/* Modal Dialogs rendered once at layout level */}
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
        defaultEntity={importEntity}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['library'] });
        }}
      />

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
    </LibraryContext.Provider>
  );
}

/** Hook to consume library context state and actions. */
export function useLibrary(): LibraryContextValue {
  const context = React.useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
