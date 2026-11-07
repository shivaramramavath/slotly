// Provides centralized modal dialog management for library entities and resources.
'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FacultyDialog } from '@/features/library/components/faculty-dialog';
import { SubjectDialog } from '@/features/library/components/subject-dialog';
import { RoomDialog } from '@/features/library/components/room-dialog';
import { ElectiveGroupDialog } from '@/features/library/components/elective-group-dialog';
import { ImportWizardDialog } from '@/features/library/components/import-wizard-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { libraryApi } from '@/features/library/services/library.api';
import { institutionApi } from '@/features/institution/services/institution.api';
import { toast } from '@/components/ui/toast';
import type {
  FacultyDto,
  SubjectDto,
  RoomDto,
  ElectiveGroupDto,
  ImportEntity,
} from '@slotly/contracts';
import type { LibraryEntityKey } from '@/features/library/config/library-entities';

/** Delete target confirmation options. */
export interface DeleteTargetOptions {
  type: 'faculty' | 'subject' | 'room' | 'elective';
  id: string;
  name: string;
}

/** Archive target options. */
export interface ArchiveTargetOptions {
  entity: 'faculty' | 'subject' | 'room';
  id: string;
  archived: boolean;
}

/** Context shape for triggering library dialogs and entity mutations. */
export interface LibraryDialogsContextValue {
  openAdd: (entityKey: LibraryEntityKey) => void;
  openEdit: (
    entityKey: LibraryEntityKey,
    item: FacultyDto | SubjectDto | RoomDto,
  ) => void;
  openImport: (defaultEntity?: ImportEntity) => void;
  openElectiveGroups: (group?: ElectiveGroupDto | null) => void;
  confirmDelete: (options: DeleteTargetOptions) => void;
  archiveItem: (options: ArchiveTargetOptions) => Promise<void>;
  isArchiving: boolean;
  isDeleting: boolean;
}

const LibraryDialogsContext = React.createContext<LibraryDialogsContextValue | null>(null);

/**
 * Hook to access library dialog actions and mutation helpers.
 */
export function useLibraryDialogs(): LibraryDialogsContextValue {
  const ctx = React.useContext(LibraryDialogsContext);
  if (!ctx) {
    throw new Error('useLibraryDialogs must be used within a LibraryDialogsProvider');
  }
  return ctx;
}

/**
 * Provider wrapping the library shell to mount all modals once.
 */
export function LibraryDialogsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Dialog open & selected item state
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

  // Shared queries needed for dropdown selects in dialogs
  const { data: departments = [] } = useQuery({
    queryKey: ['institution', 'departments'],
    queryFn: () => institutionApi.listDepartments(),
  });

  const { data: subjectData } = useQuery({
    queryKey: ['library', 'subjects', 'all'],
    queryFn: () => libraryApi.listSubjects({ limit: 500, archived: false }),
  });
  const subjects = subjectData?.items || [];

  const { data: electiveGroups = [] } = useQuery({
    queryKey: ['library', 'elective-groups'],
    queryFn: () => libraryApi.listElectiveGroups(),
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async ({ entity, id, archived }: ArchiveTargetOptions) => {
      if (entity === 'faculty') return libraryApi.archiveFaculty(id, archived);
      if (entity === 'subject') return libraryApi.archiveSubject(id, archived);
      return libraryApi.archiveRoom(id, archived);
    },
    onSuccess: (_, vars) => {
      toast.success(
        'Status updated',
        `Record ${vars.archived ? 'archived' : 'unarchived'}.`,
      );
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
    onError: (err) => {
      toast.error('Error', err instanceof Error ? err.message : 'Operation failed');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: DeleteTargetOptions) => {
      if (type === 'faculty') return libraryApi.deleteFaculty(id);
      if (type === 'subject') return libraryApi.deleteSubject(id);
      if (type === 'elective') return libraryApi.deleteElectiveGroup(id);
      return libraryApi.deleteRoom(id);
    },
    onSuccess: () => {
      toast.success('Deleted', 'Resource has been removed.');
      queryClient.invalidateQueries({ queryKey: ['library'] });
      setDeleteConfirm((prev) => ({ ...prev, open: false }));
    },
    onError: (err) => {
      toast.error('Delete failed', err instanceof Error ? err.message : 'Operation failed');
    },
  });

  const openAdd = React.useCallback((entityKey: LibraryEntityKey) => {
    if (entityKey === 'faculty') {
      setSelectedFaculty(null);
      setFacultyDialogOpen(true);
    } else if (entityKey === 'subjects') {
      setSelectedSubject(null);
      setSubjectDialogOpen(true);
    } else if (entityKey === 'rooms') {
      setSelectedRoom(null);
      setRoomDialogOpen(true);
    }
  }, []);

  const openEdit = React.useCallback(
    (entityKey: LibraryEntityKey, item: FacultyDto | SubjectDto | RoomDto) => {
      if (entityKey === 'faculty') {
        setSelectedFaculty(item as FacultyDto);
        setFacultyDialogOpen(true);
      } else if (entityKey === 'subjects') {
        setSelectedSubject(item as SubjectDto);
        setSubjectDialogOpen(true);
      } else if (entityKey === 'rooms') {
        setSelectedRoom(item as RoomDto);
        setRoomDialogOpen(true);
      }
    },
    [],
  );

  const openImport = React.useCallback((defaultEntity?: ImportEntity) => {
    if (defaultEntity) setImportEntity(defaultEntity);
    setImportDialogOpen(true);
  }, []);

  const openElectiveGroups = React.useCallback((group?: ElectiveGroupDto | null) => {
    setSelectedGroup(group || null);
    setElectiveDialogOpen(true);
  }, []);

  const confirmDelete = React.useCallback((options: DeleteTargetOptions) => {
    setDeleteConfirm({
      open: true,
      type: options.type,
      id: options.id,
      name: options.name,
    });
  }, []);

  const archiveItem = React.useCallback(
    async (options: ArchiveTargetOptions) => {
      await archiveMutation.mutateAsync(options);
    },
    [archiveMutation],
  );

  const contextValue = React.useMemo<LibraryDialogsContextValue>(
    () => ({
      openAdd,
      openEdit,
      openImport,
      openElectiveGroups,
      confirmDelete,
      archiveItem,
      isArchiving: archiveMutation.isPending,
      isDeleting: deleteMutation.isPending,
    }),
    [
      openAdd,
      openEdit,
      openImport,
      openElectiveGroups,
      confirmDelete,
      archiveItem,
      archiveMutation.isPending,
      deleteMutation.isPending,
    ],
  );

  return (
    <LibraryDialogsContext.Provider value={contextValue}>
      {children}

      {/* Modal Dialogs mounted once at shell root */}
      <FacultyDialog
        open={facultyDialogOpen}
        onOpenChange={setFacultyDialogOpen}
        faculty={selectedFaculty}
        departments={departments}
        subjects={subjects}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['library'] });
        }}
      />

      <SubjectDialog
        open={subjectDialogOpen}
        onOpenChange={setSubjectDialogOpen}
        subject={selectedSubject}
        departments={departments}
        electiveGroups={electiveGroups}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['library'] });
        }}
      />

      <RoomDialog
        open={roomDialogOpen}
        onOpenChange={setRoomDialogOpen}
        room={selectedRoom}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['library'] });
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
        description="Are you sure you want to delete this resource? If it has linked timetable assignments or dependencies, deletion will be verified."
        variant="danger"
        confirmLabel="Delete resource"
        onConfirm={() => {
          deleteMutation.mutate({
            type: deleteConfirm.type,
            id: deleteConfirm.id,
            name: deleteConfirm.name,
          });
        }}
      />
    </LibraryDialogsContext.Provider>
  );
}
