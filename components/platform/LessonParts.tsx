import Link from "next/link";
import { ContentCard, ProductCard } from "@/components/platform/cards";
import { TrackClicks } from "@/components/platform/Track";
import { docs, isDoc, polyDocs } from "@/lib/cms-shared";
import { routes } from "@/lib/platform";
import type { Clanki, Datoteke, Faze, Izdelki, Teme, Videi } from "@/payload-types";

type Lesson = Pick<Clanki, "kljucniPoudarki" | "varnostnaOpomba" | "kontrolniSeznami" | "izdelki" | "sorodno" | "teme" | "faza">;

/** Ključni poudarki na začetku vsebine. */
export function KeyPoints({ items }: { items: Lesson["kljucniPoudarki"] }) {
  if (!items?.length) return null;
  return (
    <aside aria-labelledby="kljucno" className="rounded-2xl bg-[#eceadb] p-5 sm:p-6">
      <h2 id="kljucno" className="text-lg font-semibold">
        Ključno na kratko
      </h2>
      <ul className="mt-3 space-y-2 text-[1rem] leading-relaxed">
        {items.map((item) => (
          <li key={item.id ?? item.besedilo} className="flex gap-2">
            <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-olive" />
            <span>{item.besedilo}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Varnostna opomba (elektrika, plin, teža, pritrditve …). */
export function SafetyNote({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) return null;
  return (
    <aside className="safety-note" aria-label="Varnostna opomba">
      <p className="font-semibold">Varnost</p>
      <p className="mt-1 whitespace-pre-line leading-relaxed">{text}</p>
    </aside>
  );
}

/** Faza in teme z možnostjo nadaljnjega brskanja. */
export function LessonMeta({ faza, teme }: Pick<Lesson, "faza" | "teme">) {
  const stage = isDoc<Faze>(faza) ? faza : null;
  const topics = docs<Teme>(teme);
  if (!stage && !topics.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {stage ? (
        <Link href={`${routes.roadmap}#faza-${stage.stevilka}`} className="text-link">
          Faza {stage.stevilka}: {stage.naziv}
        </Link>
      ) : null}
      {topics.map((t) => (
        <Link
          key={t.id}
          href={routes.topic(t.slug ?? "")}
          className="inline-flex min-h-8 items-center rounded-full border border-sand-300 px-3 font-medium hover:border-ink"
        >
          {t.naziv}
        </Link>
      ))}
    </div>
  );
}

/** Kontrolni seznami in drugi dokumenti za prenos. */
export function Downloads({ files }: { files: Lesson["kontrolniSeznami"] }) {
  const list = docs<Datoteke>(files).filter((f) => f.url);
  if (!list.length) return null;
  return (
    <section aria-labelledby="prenosi" className="mt-10">
      <h2 id="prenosi" className="text-xl font-semibold">
        Za prenos
      </h2>
      <ul className="mt-3 space-y-2">
        {list.map((file) => (
          <li key={file.id}>
            <a href={file.url ?? "#"} className="text-link" download>
              {file.naslov}
            </a>
            {file.opis ? <span className="text-ink-muted"> – {file.opis}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Izdelki, uporabljeni v vodiču (jasno označeni kot izdelki). */
export function LessonProducts({ products, lessonId }: { products: Lesson["izdelki"]; lessonId: number }) {
  const list = docs<Izdelki>(products);
  if (!list.length) return null;
  return (
    <section aria-labelledby="izdelki-v-vodicu" className="border-t border-sand-200 py-12">
      <div className="container-page">
        <p className="eyebrow">Izdelki</p>
        <h2 id="izdelki-v-vodicu" className="display-3 mt-2">
          Uporabljeno v tem vodiču
        </h2>
        <p className="body-muted mt-2 max-w-2xl">
          Izdelki so ločeni od razlage: vodič velja ne glede na to, kje kupiš opremo.
        </p>
        <TrackClicks event="klik_izdelka_iz_vodica" data={{ vodic: lessonId }} className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </TrackClicks>
      </div>
    </section>
  );
}

/** Sorodni vodiči in videi. */
export function RelatedContent({ items }: { items: Lesson["sorodno"] }) {
  const list = polyDocs<Clanki | Videi>(items).map(({ relationTo, doc }) =>
    relationTo === "videi"
      ? ({ kind: "video", doc: doc as Videi } as const)
      : ({ kind: "clanek", doc: doc as Clanki } as const),
  );
  if (!list.length) return null;
  return (
    <section aria-labelledby="sorodno" className="border-t border-sand-200 py-12">
      <div className="container-page">
        <h2 id="sorodno" className="display-3">
          Nadaljuj z učenjem
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => (
            <ContentCard key={`${item.kind}-${item.doc.id}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
