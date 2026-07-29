import { Clock, Plus, Pencil, Trash2, Eye, EyeOff, Settings, ShieldCheck } from "lucide-react";

interface ActivityLogRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}

const ACTION_ICON: Record<string, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  publish: Eye,
  archive: EyeOff,
  settings_update: Settings,
  role_change: ShieldCheck,
};

const ENTITY_LABEL: Record<string, string> = {
  hotels: "hotel",
  restaurants: "restaurant",
  cafes: "cafe",
  attractions: "attraction",
  events: "event",
  articles: "article",
  city_service: "city service",
  partner_status: "partner status",
  subscription: "subscription",
  settings: "site settings",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityTimeline({ logs }: { logs: ActivityLogRow[] }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center gap-2">
        <Clock size={17} className="text-primary" aria-hidden="true" />
        <h3 className="font-display text-base font-bold">Activity Timeline</h3>
      </div>

      {logs.length === 0 ? (
        <p className="mt-4 text-sm text-ink/45 dark:text-sand/45">
          Nothing logged yet — actions you take across the control center will show up here.
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-4">
          {logs.map((log) => {
            const Icon = ACTION_ICON[log.action] ?? Pencil;
            const entity = ENTITY_LABEL[log.entity_type] ?? log.entity_type;
            return (
              <li key={log.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon size={14} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-ink/80 dark:text-sand/80">
                    <span className="font-semibold capitalize">{log.action.replace("_", " ")}</span> {entity}
                    {log.entity_id ? <span className="text-ink/45 dark:text-sand/45"> · {log.entity_id.slice(0, 8)}</span> : null}
                  </p>
                  <p className="text-xs text-ink/40 dark:text-sand/40">{timeAgo(log.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
