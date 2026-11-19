"use client";

import Link from "next/link";
import { useInquiryList } from "@/lib/inquiry-store";
import { plural, routes } from "@/lib/platform";

/** Ikona seznama povpraševanja v glavi s številom izdelkov. */
export function InquiryCount() {
  const count = useInquiryList().length;
  const label = plural(count, ["izdelek", "izdelka", "izdelki", "izdelkov"]);
  return (
    <Link
      href={routes.inquiry}
      className="icon-button relative"
      aria-label={`Seznam povpraševanja${count ? `: ${label}` : ""}`}
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path d="M6 4h11l-1.5 7H7.2L5.6 2.8H3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 11h8" strokeLinecap="round" />
        <circle cx="8" cy="15.5" r="1.3" />
        <circle cx="14.5" cy="15.5" r="1.3" />
      </svg>
      {count ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-action px-1 text-[0.6875rem] font-bold text-white" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
