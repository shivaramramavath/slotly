// Unit test suite for JsonCacheSerializer validating round trips, Date revivals, and type rejections.
import {
  JsonCacheSerializer,
  DeserializationException,
} from '../serializers/json-cache.serializer';

describe('JsonCacheSerializer', () => {
  let serializer: JsonCacheSerializer;

  beforeEach(() => {
    serializer = new JsonCacheSerializer();
  });

  it('serializes and deserializes primitives, arrays, and objects', () => {
    const data = { id: 'item_1', count: 42, active: true, tags: ['a', 'b'] };
    const serialized = serializer.serialize(data);
    expect(typeof serialized).toBe('string');

    const deserialized = serializer.deserialize<typeof data>(serialized);
    expect(deserialized).toEqual(data);
  });

  it('revives ISO timestamp strings to real Date instances', () => {
    const now = new Date();
    const payload = {
      id: 'event_1',
      createdAt: now.toISOString(),
      updatedAt: now,
    };

    interface EventPayload {
      id: string;
      createdAt: Date;
      updatedAt: Date;
    }

    const serialized = serializer.serialize(payload);
    const deserialized = serializer.deserialize<EventPayload>(serialized, [
      'createdAt',
      'updatedAt',
    ]);

    expect(deserialized.createdAt).toBeInstanceOf(Date);
    expect(deserialized.createdAt.getTime()).toBe(now.getTime());
    expect(deserialized.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects serialization of undefined values', () => {
    expect(() => serializer.serialize(undefined)).toThrow(TypeError);
  });

  it('rejects BigInt and functions to prevent invalid payloads', () => {
    expect(() => serializer.serialize({ big: BigInt(123) })).toThrow(TypeError);
    expect(() =>
      serializer.serialize({ fn: () => console.log('test') }),
    ).toThrow(TypeError);
  });

  it('throws DeserializationException on corrupted JSON', () => {
    expect(() => serializer.deserialize('{ invalid json ')).toThrow(
      DeserializationException,
    );
  });
});
