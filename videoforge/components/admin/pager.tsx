import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pager({ basePath, page, hasNext, params }: { basePath: string; page: number; hasNext: boolean; params: Record<string, string | undefined> }) {
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, page: String(p) })) if (v) q.set(k, v);
    return `${basePath}?${q.toString()}`;
  };
  if (page === 1 && !hasNext) return null;
  return (
    <div className="flex items-center justify-end gap-2 text-sm">
      {page > 1 && (
        <Button asChild size="sm" variant="outline">
          <Link href={href(page - 1)}>←</Link>
        </Button>
      )}
      <span className="text-muted-foreground">{page}</span>
      {hasNext && (
        <Button asChild size="sm" variant="outline">
          <Link href={href(page + 1)}>→</Link>
        </Button>
      )}
    </div>
  );
}
