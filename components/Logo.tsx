import Link from "next/link";
import { brand } from "@/content";
import { VanMark } from "@/components/VanMark";

type LogoProps = {
  href?: string;
  tone?: "light" | "dark";
  className?: string;
};

/** Besedilni logotip GradimoCamper z linijskim simbolom kombija. */
export function Logo({ href = "/", tone = "light", className = "" }: LogoProps) {
  const [first, second] = brand.nameParts;
  const ink = tone === "light" ? "text-ink" : "text-paper";
  const accent = tone === "light" ? "text-olive" : "text-olive-200";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md min-[376px]:gap-2 ${ink} ${className}`}
      aria-label={`${brand.name}, domov`}
    >
      <VanMark className={`h-6 w-6 shrink-0 min-[376px]:h-7 min-[376px]:w-7 ${accent}`} />
      <span className="text-base font-bold leading-none tracking-[-0.02em] min-[376px]:text-[1.0625rem] sm:text-lg">
        {first}
        <span className={accent}>{second}</span>
      </span>
    </Link>
  );
}
