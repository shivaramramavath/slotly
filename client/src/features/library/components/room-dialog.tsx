// React component for room-dialog.
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AvailabilityGrid } from './availability-grid';
import { libraryApi } from '../services/library.api';
import { toast } from '@/components/ui/toast';
import type { RoomDto, RoomType } from '@slotly/contracts';
import { Plus, X } from 'lucide-react';

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: RoomDto | null;
  onSuccess: () => void;
}

/** React component rendering room dialog. */
export function RoomDialog({
  open,
  onOpenChange,
  room,
  onSuccess,
}: RoomDialogProps) {
  const [code, setCode] = useState(room?.code || '');
  const [name, setName] = useState(room?.name || '');
  const [building, setBuilding] = useState(room?.building || '');
  const [type, setType] = useState<RoomType>(room?.type || 'lecture');
  const [capacity, setCapacity] = useState(room?.capacity ?? 40);
  const [shared, setShared] = useState(room?.shared ?? true);
  const [equipmentList, setEquipmentList] = useState<string[]>(
    room?.equipment || ['Projector'],
  );
  const [newEquipment, setNewEquipment] = useState('');
  const [availability, setAvailability] = useState<boolean[][]>(
    room?.availability || Array.from({ length: 7 }, () => Array(8).fill(true)),
  );
  const [loading, setLoading] = useState(false);
  const [prevRoom, setPrevRoom] = useState(room);
  const [prevOpen, setPrevOpen] = useState(open);

  // React 19 render-phase state adjustment
  if (room !== prevRoom || open !== prevOpen) {
    setPrevRoom(room);
    setPrevOpen(open);
    if (room) {
      setCode(room.code);
      setName(room.name);
      setBuilding(room.building);
      setType(room.type);
      setCapacity(room.capacity);
      setShared(room.shared);
      setEquipmentList(room.equipment || []);
      setAvailability(
        room.availability ||
          Array.from({ length: 7 }, () => Array(8).fill(true)),
      );
    } else {
      setCode('');
      setName('');
      setBuilding('');
      setType('lecture');
      setCapacity(40);
      setShared(true);
      setEquipmentList(['Projector']);
      setAvailability(Array.from({ length: 7 }, () => Array(8).fill(true)));
    }
  }

  const handleAddEquipment = () => {
    const trimmed = newEquipment.trim();
    if (!trimmed) return;
    if (!equipmentList.includes(trimmed)) {
      setEquipmentList([...equipmentList, trimmed]);
    }
    setNewEquipment('');
  };

  const handleRemoveEquipment = (eq: string) => {
    setEquipmentList(equipmentList.filter((item) => item !== eq));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !building.trim()) {
      toast.error('Validation Error', 'Please fill in code, name, and building.');
      return;
    }

    setLoading(true);
    try {
      if (room) {
        await libraryApi.updateRoom(room.id, {
          code: code.toUpperCase().trim(),
          name: name.trim(),
          building: building.trim(),
          type,
          capacity: Number(capacity),
          shared,
          equipment: equipmentList,
          availability,
        });
        toast.success('Room Updated', `Room ${code} updated.`);
      } else {
        await libraryApi.createRoom({
          code: code.toUpperCase().trim(),
          name: name.trim(),
          building: building.trim(),
          type,
          capacity: Number(capacity),
          shared,
          equipment: equipmentList,
          availability,
          labFor: [],
          archived: false,
        });
        toast.success('Room Created', `Room ${code} created.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
        <DialogHeader>
          <DialogTitle>
            {room ? `Edit Room: ${room.code}` : 'Add New Room'}
          </DialogTitle>
          <DialogDescription>
            Configure capacity, room classification, facilities equipment, and
            weekly booking availability.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Room Code *</label>
            <Input
              placeholder="e.g. LH-101"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Room Name *</label>
            <Input
              placeholder="e.g. Lecture Hall 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Building / Block *</label>
            <Input
              placeholder="e.g. Science Block"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Room Type</label>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as RoomType)}
            >
              <option value="lecture">Lecture Hall / Classroom</option>
              <option value="lab">Laboratory</option>
              <option value="seminar">Seminar Room</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">Seating Capacity *</label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 border border-[#232323] rounded-md bg-[#0A0A0A]">
          <div>
            <span className="text-xs font-mono text-[#FAFAFA]">Shared Room</span>
            <p className="text-[10px] text-[#8A8A8A]">
              Can be shared across multiple departments
            </p>
          </div>
          <Switch checked={shared} onCheckedChange={setShared} />
        </div>

        {/* Equipment Manager */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-[#FAFAFA]">
            Equipment & Facilities
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Projector, Sound System, 40 PCs"
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddEquipment();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddEquipment}
              className="shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {equipmentList.map((eq) => (
              <span
                key={eq}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-[#111] border border-[#232323] text-[#FAFAFA]"
              >
                {eq}
                <button
                  type="button"
                  onClick={() => handleRemoveEquipment(eq)}
                  className="text-[#8A8A8A] hover:text-[#EF4444]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Weekly Availability Grid */}
        <AvailabilityGrid
          value={availability}
          onChange={setAvailability}
          periodsCount={8}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {room ? 'Save Changes' : 'Create Room'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
