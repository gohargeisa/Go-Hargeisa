"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={className ?? "flex items-center gap-2 text-sm font-medium text-ink/70 dark:text-sand/70 hover:text-red-500"}
    >
      {isPending ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
      Sign Out
    </button>
  );
}
