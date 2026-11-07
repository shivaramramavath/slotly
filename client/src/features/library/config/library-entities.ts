import type * as React from 'react';
import { Users, BookOpen, DoorOpen } from 'lucide-react';
import type { ImportEntity } from '@slotly/contracts';

export type LibraryEntityKey = 'faculty' | 'subjects' | 'rooms';
export type LibraryDialogType = 'faculty' | 'subject' | 'room';

export interface LibraryEntityConfig {
  key: LibraryEntityKey;
  label: string;
  singularLabel: string;
  route: string;
  addLabel: string;
  searchPlaceholder: string;
  exportKey: ImportEntity;
  dialog: LibraryDialogType;
  icon: React.ComponentType<{ className?: string }>;
  emptyTitle: string;
  emptyDescription: string;
}

export const LIBRARY_ENTITIES: Record<LibraryEntityKey, LibraryEntityConfig> = {
  faculty: {
    key: 'faculty',
    label: 'Faculty',
    singularLabel: 'Faculty Member',
    route: '/library/faculty',
    addLabel: 'Add faculty',
    searchPlaceholder: 'Search by code, name, designation...',
    exportKey: 'faculty',
    dialog: 'faculty',
    icon: Users,
    emptyTitle: 'No faculty members yet',
    emptyDescription: 'Add faculty members to start assigning teachers to subjects and batches.',
  },
  subjects: {
    key: 'subjects',
    label: 'Subjects',
    singularLabel: 'Subject',
    route: '/library/subjects',
    addLabel: 'Add subject',
    searchPlaceholder: 'Search by code, name, type...',
    exportKey: 'subjects',
    dialog: 'subject',
    icon: BookOpen,
    emptyTitle: 'No subjects cataloged yet',
    emptyDescription: 'Define theory, lab, and elective subjects required for academic terms.',
  },
  rooms: {
    key: 'rooms',
    label: 'Rooms & Facilities',
    singularLabel: 'Room',
    route: '/library/rooms',
    addLabel: 'Add room',
    searchPlaceholder: 'Search by name, building, type...',
    exportKey: 'rooms',
    dialog: 'room',
    icon: DoorOpen,
    emptyTitle: 'No rooms or facilities added yet',
    emptyDescription: 'Add lecture halls, laboratories, and seminar facilities with equipment info.',
  },
};

export const LIBRARY_ENTITY_LIST: LibraryEntityConfig[] = [
  LIBRARY_ENTITIES.faculty,
  LIBRARY_ENTITIES.subjects,
  LIBRARY_ENTITIES.rooms,
];

export function getLibraryEntity(key?: string | null): LibraryEntityConfig {
  if (key && key in LIBRARY_ENTITIES) {
    return LIBRARY_ENTITIES[key as LibraryEntityKey];
  }
  return LIBRARY_ENTITIES.faculty;
}

export function getLibraryEntityByRoute(pathname?: string | null): LibraryEntityConfig {
  if (!pathname) return LIBRARY_ENTITIES.faculty;
  const match = LIBRARY_ENTITY_LIST.find((e) => pathname.startsWith(e.route));
  return match || LIBRARY_ENTITIES.faculty;
}
