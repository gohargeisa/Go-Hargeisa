import { useEffect, useRef, useState } from "react";

/**
 * Backs every card's onLoad-gated image fade-in (skeleton → opacity-100).
 * `onLoad` alone has a well-documented React/<img> race: if the browser
 * already has the image in its disk cache and paints it synchronously
 * before this component's effect runs, the native `load` event has
 * already fired and is gone by the time onLoad is attached — `loaded`
 * would then stay false forever, leaving the photo stuck invisible
 * behind its skeleton for a repeat visit or back-navigation. Checking
 * `img.complete` on mount catches exactly that case as a fallback.
 */
export function useImageLoaded() {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return { loaded, imgRef, onLoad: () => setLoaded(true) };
}
