"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";
import { addToInquiry, useInquiryList } from "@/lib/inquiry-store";
import { routes } from "@/lib/platform";

type Props = { id: number; naziv: string; href: string };

/** Gumb »Dodaj na seznam povpraševanja« (brez plačila). */
export function AddToInquiry({ id, naziv, href }: Props) {
  const added = useInquiryList().some((x) => x.id === id);

  if (added) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p role="status" className="text-[0.9375rem] font-medium text-success">
          ✓ Na seznamu povpraševanja
        </p>
        <Link href={routes.inquiry} className="btn-secondary">
          Odpri seznam in pošlji
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="btn-primary w-full sm:w-auto"
      onClick={() => {
        addToInquiry({ id, naziv, href });
        track("dodano_v_povprasevanje", { izdelek: id });
      }}
    >
      Dodaj na seznam povpraševanja
    </button>
  );
}
