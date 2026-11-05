import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span>
        VideoForge <span className="text-primary">AI</span>
      </span>
    </Link>
  );
}
