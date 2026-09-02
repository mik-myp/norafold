import { cn } from "@/lib/utils";

type FoldMarkProps = {
  className?: string;
};

export function FoldMark({ className }: FoldMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block size-8 shrink-0 overflow-hidden rounded-md border bg-surface-raised",
        className,
      )}
    >
      <span className="absolute top-1.5 bottom-1.5 left-2 w-0.5 rounded-full bg-success" />
      <span className="absolute top-2 right-2.5 size-1 rounded-full bg-primary" />
      <span className="absolute right-2.5 bottom-2 size-1 rounded-full bg-success" />
      <span className="absolute top-0 right-0 size-2.5 border-b border-l bg-background [clip-path:polygon(0_0,100%_100%,0_100%)]" />
    </span>
  );
}
