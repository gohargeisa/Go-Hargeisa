"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Pencil, Plus, Trash2, X, ImagePlus } from "lucide-react";
import { createHotelRoom, deleteHotelRoom, updateHotelRoom, type HotelRoomInput } from "@/lib/actions/hotel-rooms";
import { ImageUploader } from "@/components/shared/image-uploader";
import { uploadImage } from "@/lib/supabase/storage";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import { roomTypeLabel, ROOM_TYPE_ORDER } from "@/lib/utils/room-type";
import type { Locale } from "@/lib/i18n/config";
import type { RoomType } from "@/types";

export interface HotelRoomManagerRow extends HotelRoomInput {
  id: string;
}

const BLANK: HotelRoomInput = {
  name: "",
  image: "",
  images: [],
  description: "",
  sizeSqm: undefined,
  maxGuests: 2,
  bedType: "",
  bathrooms: 1,
  features: [],
  pricePerNight: undefined,
  weekendPrice: undefined,
  discountPrice: undefined,
  totalRooms: 1,
  roomType: "standard",
  isAvailable: true,
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
  locale,
  initialRooms,
  revalidatePaths,
}: {
  hotelId: string;
  locale: Locale;
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
        images: room.images ?? [],
        description: room.description,
        sizeSqm: room.sizeSqm,
        maxGuests: room.maxGuests,
        bedType: room.bedType,
        bathrooms: room.bathrooms,
        features: room.features,
        pricePerNight: room.pricePerNight,
        weekendPrice: room.weekendPrice,
        discountPrice: room.discountPrice,
        totalRooms: room.totalRooms,
        roomType: room.roomType,
        isAvailable: room.isAvailable,
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
              locale={locale}
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
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{room.name}</p>
                  <span className="inline-flex shrink-0 items-center rounded-full bg-ink/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/60 dark:bg-white/10 dark:text-sand/60">
                    {roomTypeLabel(room.roomType, locale)}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      room.isAvailable
                        ? "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400"
                        : "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300"
                    }`}
                  >
                    {room.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
                <p className="text-xs text-ink/50 dark:text-sand/50">
                  {room.maxGuests} guests
                  {room.bedType ? ` • ${room.bedType}` : ""}
                  {room.pricePerNight
                    ? room.discountPrice
                      ? ` • $${room.discountPrice}/night (was $${room.pricePerNight})`
                      : ` • $${room.pricePerNight}/night`
                    : ""}
                  {` • ${room.totalRooms ?? 1} room${(room.totalRooms ?? 1) === 1 ? "" : "s"} total`}
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
            locale={locale}
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
  locale,
  setDraft,
  onSave,
  onCancel,
  isPending,
  error,
}: {
  draft: HotelRoomInput;
  locale: Locale;
  setDraft: (d: HotelRoomInput) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
}) {
  function update<K extends keyof HotelRoomInput>(key: K, value: HotelRoomInput[K]) {
    setDraft({ ...draft, [key]: value });
  }

  const images = draft.images ?? [];
  const [uploadingGalleryPhoto, setUploadingGalleryPhoto] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function onAddGalleryPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGalleryPhoto(true);
    try {
      const url = await uploadImage(file, { bucket: "listing-images", folder: "hotel-rooms/gallery" });
      update("images", [...images, url]);
    } finally {
      setUploadingGalleryPhoto(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3 rounded-xl2 border border-primary/30 bg-primary/5 p-4">
      <ImageUploader folder="hotel-rooms" value={draft.image ?? ""} onChange={(url) => update("image", url)} label="Room cover image" />

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink/60 dark:text-sand/60">Additional room photos</label>
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-ink/10 dark:border-white/15">
              <Image src={url} alt={`Room photo ${i + 1}`} fill sizes="64px" className="object-cover" />
              <button
                type="button"
                onClick={() => update("images", images.filter((_, idx) => idx !== i))}
                aria-label="Remove photo"
                className="absolute end-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-ink/20 text-ink/40 hover:border-primary hover:text-primary dark:border-white/20">
            {uploadingGalleryPhoto ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} aria-hidden="true" />}
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={onAddGalleryPhoto} className="hidden" />
          </label>
        </div>
      </div>

      <Field label="Description">
        <textarea
          rows={2}
          value={draft.description ?? ""}
          onChange={(e) => update("description", e.target.value)}
          className={inputClass}
          placeholder="Spacious room with a king bed and city view…"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Room name">
          <input
            value={draft.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
            placeholder="Deluxe King Room"
          />
        </Field>
        <Field label="Room type">
          <select
            value={draft.roomType}
            onChange={(e) => update("roomType", e.target.value as RoomType)}
            className={inputClass}
          >
            {ROOM_TYPE_ORDER.map((type) => (
              <option key={type} value={type}>
                {roomTypeLabel(type, locale)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Bed type">
          <input
            value={draft.bedType ?? ""}
            onChange={(e) => update("bedType", e.target.value)}
            className={inputClass}
            placeholder="King Bed"
          />
        </Field>
        <Field label="Availability">
          <select
            value={draft.isAvailable ? "available" : "unavailable"}
            onChange={(e) => update("isAvailable", e.target.value === "available")}
            className={inputClass}
          >
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
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
        <Field label="Bathrooms">
          <input
            type="number"
            min={0}
            value={draft.bathrooms ?? 1}
            onChange={(e) => update("bathrooms", Number(e.target.value) || 0)}
            className={inputClass}
          />
        </Field>
        <Field label="Total rooms">
          <input
            type="number"
            min={1}
            value={draft.totalRooms ?? 1}
            onChange={(e) => update("totalRooms", Number(e.target.value) || 1)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Base price / night">
          <input
            type="number"
            value={draft.pricePerNight ?? ""}
            onChange={(e) => update("pricePerNight", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </Field>
        <Field label="Weekend price / night">
          <input
            type="number"
            value={draft.weekendPrice ?? ""}
            onChange={(e) => update("weekendPrice", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
            placeholder="Optional"
          />
        </Field>
        <Field label="Discount price / night">
          <input
            type="number"
            value={draft.discountPrice ?? ""}
            onChange={(e) => update("discountPrice", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
            placeholder="Optional"
          />
        </Field>
      </div>

      <TagInput
        label="Amenities"
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
