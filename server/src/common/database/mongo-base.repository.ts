// Database repository managing mongo-base.repository persistence.
import { Model, Document } from 'mongoose';
import { BaseRepository } from './base.repository';

/** Class implementing mongo base repository. */
export abstract class MongoBaseRepository<
  T,
  D extends Document = Document & T,
> implements BaseRepository<T> {
  constructor(protected readonly model: Model<D>) {}

  async findById(id: string): Promise<T | null> {
    const doc = await this.model.findById(id).lean<T>().exec();
    return doc ?? null;
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    const doc = await this.model.findOne(filter).lean<T>().exec();
    return doc ?? null;
  }

  async find(filter: Record<string, unknown> = {}): Promise<T[]> {
    const docs = await this.model.find(filter).lean<T[]>().exec();
    return docs;
  }

  async create(doc: Partial<T>): Promise<T> {
    const created = await this.model.create(doc as unknown as D);
    return (created as Document).toObject() as T;
  }

  async update(id: string, update: Partial<T>): Promise<T | null> {
    const updated = await this.model
      .findByIdAndUpdate(
        id,
        { $set: update as unknown as Record<string, unknown> },
        { new: true },
      )
      .lean<T>()
      .exec();
    return updated ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(id).exec();
    return res !== null;
  }
}
