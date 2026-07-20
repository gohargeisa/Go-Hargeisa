import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-px mx-auto flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Compass size={40} className="text-primary" />
      <h1 className="mt-4 font-display text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-sm text-ink/60 dark:text-sand/60">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link
        href="/en"
        className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
      >
        Back to homepage
      </Link>
    </div>
  );
}
