import Image from "next/image";
import { isDoc } from "@/lib/cms-shared";
import type { Mediji } from "@/payload-types";

type Props = {
  media: unknown;
  sizes: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
};

/**
 * Slika iz urejevalnika. Datoteke v Vercel Blob gredo skozi optimizacijo
 * slik; lokalne datoteke (/api/…, samo razvoj) se prikažejo neposredno.
 */
export function Media({ media, sizes, className, priority = false, fill = false }: Props) {
  if (!isDoc<Mediji>(media) || !media.url) return null;
  const local = media.url.startsWith("/api/");
  const common = {
    src: media.url,
    alt: media.alt ?? "",
    sizes,
    className,
    quality: 80,
    unoptimized: local,
    ...(priority ? { preload: true, fetchPriority: "high" as const, loading: "eager" as const } : {}),
  };
  if (fill) return <Image {...common} alt={common.alt} fill />;
  return <Image {...common} alt={common.alt} width={media.width ?? 1200} height={media.height ?? 800} />;
}
