import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-semibold text-primary">404</p>
      <p className="text-sm text-muted-foreground">Stran ne obstaja · Page not found</p>
      <Button asChild variant="outline">
        <Link href="/">VideoForge AI</Link>
      </Button>
    </main>
  );
}
