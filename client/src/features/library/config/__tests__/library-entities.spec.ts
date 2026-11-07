// Unit tests for library entity registry completeness and routing.
import { describe, it, expect } from 'vitest';
import {
  LIBRARY_ENTITIES,
  LIBRARY_ENTITY_LIST,
  getLibraryEntity,
  getLibraryEntityByRoute,
  type LibraryEntityKey,
} from '@/features/library/config/library-entities';

describe('library-entities registry', () => {
  const expectedKeys: LibraryEntityKey[] = ['faculty', 'subjects', 'rooms'];

  it('contains entries for faculty, subjects, and rooms', () => {
    expect([...Object.keys(LIBRARY_ENTITIES)].sort()).toEqual([...expectedKeys].sort());
  });

  it('ensures each entity has required properties and valid routes', () => {
    for (const key of expectedKeys) {
      const entity = LIBRARY_ENTITIES[key];
      expect(entity.key).toBe(key);
      expect(entity.label).toBeTruthy();
      expect(entity.singularLabel).toBeTruthy();
      expect(entity.route.startsWith('/library/')).toBe(true);
      expect(entity.addLabel).toBeTruthy();
      expect(entity.searchPlaceholder).toBeTruthy();
      expect(entity.exportKey).toBeTruthy();
      expect(entity.dialog).toBeTruthy();
      expect(entity.icon).toBeDefined();
      expect(entity.emptyTitle).toBeTruthy();
      expect(entity.emptyDescription).toBeTruthy();
    }
  });

  it('LIBRARY_ENTITY_LIST reflects all registry values in ordered form', () => {
    expect(LIBRARY_ENTITY_LIST).toHaveLength(3);
    expect(LIBRARY_ENTITY_LIST.map((e) => e.key)).toEqual(expectedKeys);
  });

  it('getLibraryEntity returns the matching entity or defaults to faculty', () => {
    expect(getLibraryEntity('subjects').key).toBe('subjects');
    expect(getLibraryEntity('rooms').key).toBe('rooms');
    expect(getLibraryEntity('unknown' as unknown as LibraryEntityKey).key).toBe('faculty');
    expect(getLibraryEntity(null).key).toBe('faculty');
  });

  it('getLibraryEntityByRoute resolves matching route prefixes', () => {
    expect(getLibraryEntityByRoute('/library/subjects').key).toBe('subjects');
    expect(getLibraryEntityByRoute('/library/rooms/new').key).toBe('rooms');
    expect(getLibraryEntityByRoute('/other/path').key).toBe('faculty');
  });
});
