import Image from "next/image";
import type { GalleryImage } from "@/types";

export function Gallery({
  cover,
  images,
  alt,
}: {
  cover: string;
  images: GalleryImage[];
  alt: string;
}) {
  const rest = images.slice(0, 4);

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[320px] md:h-[440px] rounded-xl3 overflow-hidden">
      <div className="relative col-span-4 row-span-2 md:col-span-2">
        <Image
          src={cover}
          alt={alt}
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
      </div>

      {rest.map((img, i) => (
        <div
          key={i}
          className="relative hidden md:block col-span-1 row-span-1"
        >
          <Image
            src={img.url}
            alt={img.alt ?? ""}
            fill
            className="object-cover"
            sizes="25vw"
          />
        </div>
      ))}
    </div>
  );
}