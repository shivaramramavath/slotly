// Interface defining contract for managing list-based cached collections.

/** Interface defining contract for managing list-based cached collections. */
export interface IListCache<T> {
  /** Retrieves all items from a cached list or returns null if missing. */
  getList(id: string): Promise<T[] | null>;

  /** Overwrites a cached list with new items. */
  setList(id: string, items: T[], ttl?: number): Promise<void>;

  /** Atomically appends an item to the cached list. */
  addToList(id: string, item: T, ttl?: number): Promise<void>;

  /** Atomically removes items from the cached list matching the predicate. */
  removeFromList(
    id: string,
    predicate: (item: T) => boolean,
    ttl?: number,
  ): Promise<void>;

  /** Atomically updates items in the cached list matching the predicate. */
  updateInList(
    id: string,
    predicate: (item: T) => boolean,
    updatedItem: T,
    ttl?: number,
  ): Promise<void>;

  /** Deletes the entire cached list. */
  deleteList(id: string): Promise<void>;

  /** Retrieves a cached list or populates it via the loader function. */
  getOrSetList(
    id: string,
    loader: () => Promise<T[]>,
    ttl?: number,
  ): Promise<T[]>;
}
