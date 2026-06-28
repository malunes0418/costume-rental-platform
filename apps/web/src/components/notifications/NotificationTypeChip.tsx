import { getNotificationTypeMeta } from "@/lib/notificationDisplay";
import { cn } from "@/lib/utils";

interface NotificationTypeChipProps {
  type: string;
  className?: string;
}

export function NotificationTypeChip({ type, className }: NotificationTypeChipProps) {
  const meta = getNotificationTypeMeta(type);

  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
        meta.chipClassName,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
