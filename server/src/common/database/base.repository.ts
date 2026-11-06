export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findOne(filter: Record<string, unknown>): Promise<T | null>;
  find(filter?: Record<string, unknown>): Promise<T[]>;
  create(doc: Partial<T>): Promise<T>;
  update(id: string, update: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
