import type { SVGProps } from "react";

/**
 * Inline SVG brand glyphs for the 3 social icons lucide-react doesn't ship
 * (WhatsApp, X, TikTok) — replaces react-icons/fa6, which was installed as
 * a whole extra icon-library dependency for exactly these 3 icons in
 * components/layout/site-footer.tsx and nowhere else. `size` mirrors
 * lucide-react's own icon prop so both families drop into the same
 * `{ icon: Icon }` array/`<Icon size={17} />` call pattern without changes
 * at the call site.
 */
type BrandIconProps = { size?: number } & Omit<SVGProps<SVGSVGElement>, "width" | "height">;

export function WhatsAppIcon({ size = 24, ...props }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.017 2c-5.505 0-9.965 4.459-9.965 9.964 0 1.762.463 3.462 1.34 4.958L2 22l5.223-1.372a9.9 9.9 0 0 0 4.794 1.221h.004c5.505 0 9.965-4.459 9.965-9.964A9.9 9.9 0 0 0 19.05 4.94 9.9 9.9 0 0 0 12.017 2zm5.455 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    </svg>
  );
}

export function XIcon({ size = 24, ...props }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  );
}

export function TikTokIcon({ size = 24, ...props }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.82a4.278 4.278 0 0 1-1.06-2.82h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  );
}
