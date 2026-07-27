"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { createHotelRoom, deleteHotelRoom, updateHotelRoom, type HotelRoomInput } from "@/lib/actions/hotel-rooms";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";

export interface HotelRoomManagerRow extends HotelRoomInput {
  id: string;
}

const BLANK: HotelRoomInput = {
  name: "",
  image: "",
  sizeSqm: undefined,
  maxGuests: 2,
  bedType: "",
  features: [],
  pricePerNight: undefined,
};

const FEATURE_SUGGESTIONS = [
  "Free WiFi",
  "Air Conditioning",
  "Breakfast Included",
  "Room Service",
  "Balcony",
  "Sea View",
  "Mini Fridge",
  "Work Desk",
];

/**
 * Inline CRUD for a hotel's rooms — only usable on the Edit Hotel page since
 * rooms need a real hotelId to attach to (see lib/actions/hotel-rooms.ts).
 * Follows the same client-mutation + router.refresh() pattern already used
 * by DeleteListingButton, since these actions revalidate server data but
 * this component's local state otherwise wouldn't pick up the fresh rows.
 */
export function HotelRoomsManager({
  hotelId,
  initialRooms,
  revalidatePaths,
}: {
  hotelId: string;
  initialRooms: HotelRoomManagerRow[];
  revalidatePaths: string[];
}) {
  const [rooms, setRooms] = useState(initialRooms);
  useEffect(() => setRooms(initialRooms), [initialRooms]);

  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<HotelRoomInput>(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function startEdit(room?: HotelRoomManagerRow) {
    setError(null);
    if (room) {
      setEditingId(room.id);
      setDraft({
        name: room.name,
        image: room.image,
        sizeSqm: room.sizeSqm,
        maxGuests: room.maxGuests,
        bedType: room.bedType,
        features: room.features,
        pricePerNight: room.pricePerNight,
      });
    } else {
      setEditingId("new");
      setDraft(BLANK);
    }
  }

  function save() {
    if (!draft.name.trim()) {
      setError("Room name is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result =
        editingId && editingId !== "new"
          ? await updateHotelRoom(editingId, hotelId, draft, revalidatePaths)
          : await createHotelRoom(hotelId, draft, revalidatePaths);
      if (result.ok) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this room?")) return;
    startTransition(async () => {
      const result = await deleteHotelRoom(id, hotelId, revalidatePaths);
      if (result.ok) router.refresh();
      else alert(result.error ?? "Delete failed.");
    });
  }

  return (
    <div className="space-y-4 rounded-xl2 border border-ink/8 p-5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Rooms</h3>
        {editingId === null && (
          <button
            type="button"
            onClick={() => startEdit()}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            <Plus size={13} /> Add room
          </button>
        )}
      </div>

      {rooms.length === 0 && editingId === null && (
        <p className="text-sm text-ink/50 dark:text-sand/50">No rooms added yet.</p>
      )}

      <div className="space-y-2">
        {rooms.map((room) =>
          editingId === room.id ? (
            <RoomForm
              key={room.id}
              draft={draft}
              setDraft={setDraft}
              onSave={save}
              onCancel={() => setEditingId(null)}
              isPending={isPending}
              error={error}
            />
          ) : (
            <div
              key={room.id}
              className="flex items-center gap-3 rounded-xl2 border border-ink/8 p-3 dark:border-white/10"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/5">
                {room.image && <Image src={room.image} alt={room.name} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{room.name}</p>
                <p className="text-xs text-ink/50 dark:text-sand/50">
                  {room.maxGuests} guests
                  {room.bedType ? ` • ${room.bedType}` : ""}
                  {room.pricePerNight ? ` • $${room.pricePerNight}/night` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(room)}
                aria-label={`Edit ${room.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 hover:border-primary hover:text-primary dark:border-white/15"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => remove(room.id)}
                disabled={isPending}
                aria-label={`Delete ${room.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 hover:border-red-500 hover:text-red-500 dark:border-white/15"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        )}

        {editingId === "new" && (
          <RoomForm
            draft={draft}
            setDraft={setDraft}
            onSave={save}
            onCancel={() => setEditingId(null)}
            isPending={isPending}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

function RoomForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  isPending,
  error,
}: {
  draft: HotelRoomInput;
  setDraft: (d: HotelRoomInput) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
}) {
  function update<K extends keyof HotelRoomInput>(key: K, value: HotelRoomInput[K]) {
    setDraft({ ...draft, [key]: value });
  }

  return (
    <div className="space-y-3 rounded-xl2 border border-primary/30 bg-primary/5 p-4">
      <ImageUploader folder="hotel-rooms" value={draft.image ?? ""} onChange={(url) => update("image", url)} label="Room image" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Room name">
          <input
            value={draft.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
            placeholder="Deluxe King Room"
          />
        </Field>
        <Field label="Bed type">
          <input
            value={draft.bedType ?? ""}
            onChange={(e) => update("bedType", e.target.value)}
            className={inputClass}
            placeholder="King Bed"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Size (m²)">
          <input
            type="number"
            value={draft.sizeSqm ?? ""}
            onChange={(e) => update("sizeSqm", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </Field>
        <Field label="Max guests">
          <input
            type="number"
            min={1}
            value={draft.maxGuests}
            onChange={(e) => update("maxGuests", Number(e.target.value) || 1)}
            className={inputClass}
          />
        </Field>
        <Field label="Price / night">
          <input
            type="number"
            value={draft.pricePerNight ?? ""}
            onChange={(e) => update("pricePerNight", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </Field>
      </div>

      <TagInput
        label="Features"
        values={draft.features}
        onChange={(v) => update("features", v)}
        placeholder="Free WiFi, Air Conditioning…"
        suggestions={FEATURE_SUGGESTIONS}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          Save room
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold dark:border-white/20"
        >
          <X size={12} /> Cancel
        </button>
      </div>
    </div>
  );
}
