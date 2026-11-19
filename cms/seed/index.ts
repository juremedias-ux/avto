import { readFile } from "node:fs/promises";
import path from "node:path";
import { convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
import type { CollectionSlug, Payload } from "payload";
import { slugify } from "@/lib/slugify";
import {
  sampleAbout,
  sampleArticle,
  sampleCategories,
  sampleHome,
  samplePath,
  sampleProducts,
  sampleStages,
  sampleTopics,
  sampleVideo,
} from "./content";

export type SeedResult = { ustvarjeno: string[]; preskoceno: string[]; opozorila: string[] };

const ASSETS = {
  video: { file: "vzorcni-video.mp4", mimetype: "video/mp4" },
  captions: { file: "vzorcni-video.vtt", mimetype: "text/vtt" },
  poster: { file: "vzorcni-video-poster.jpg", mimetype: "image/jpeg" },
} as const;

/** Vzorčna datoteka iz public/vzorci: z diska ali, na Vercelu, z lastne strani. */
async function loadAsset(name: string, origin: string | null): Promise<Buffer | null> {
  try {
    return await readFile(path.join(process.cwd(), "public", "vzorci", name));
  } catch {
    // Na Vercelu mapa public ni del strežniške funkcije.
  }
  if (!origin) return null;
  try {
    const response = await fetch(new URL(`/vzorci/${name}`, origin), { cache: "no-store" });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Ustvari vzorčne vsebine. Večkratni zagon je varen: obstoječih vnosov
 * (po URL-ju) ne podvoji in ne spreminja.
 */
export async function seedSampleContent(payload: Payload, options: { origin?: string | null } = {}): Promise<SeedResult> {
  const result: SeedResult = { ustvarjeno: [], preskoceno: [], opozorila: [] };
  const origin = options.origin ?? null;

  async function findSlug(collection: CollectionSlug, slug: string): Promise<{ id: number } | null> {
    const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true });
    return (found.docs[0] as { id: number } | undefined) ?? null;
  }

  /** Vrne obstoječi dokument ali ga ustvari. created = ali je nov. */
  async function ensure(collection: CollectionSlug, label: string, data: Record<string, unknown>) {
    const slug = String(data.slug);
    const existing = await findSlug(collection, slug);
    if (existing) {
      result.preskoceno.push(label);
      return { id: existing.id, created: false };
    }
    const doc = (await payload.create({ collection, data: data as never, overrideAccess: true })) as { id: number };
    result.ustvarjeno.push(label);
    return { id: doc.id, created: true };
  }

  async function upload(collection: "mediji" | "video-datoteke" | "datoteke", asset: { file: string; mimetype: string }, data: Record<string, unknown>) {
    const buffer = await loadAsset(asset.file, origin);
    if (!buffer) {
      result.opozorila.push(`Datoteke ${asset.file} ni bilo mogoče naložiti.`);
      return null;
    }
    try {
      const doc = (await payload.create({
        collection,
        data: data as never,
        overrideAccess: true,
        file: { data: buffer, mimetype: asset.mimetype, name: asset.file, size: buffer.length },
      })) as { id: number };
      result.ustvarjeno.push(`Datoteka: ${asset.file}`);
      return doc.id;
    } catch {
      result.opozorila.push(`Nalaganje datoteke ${asset.file} ni uspelo.`);
      return null;
    }
  }

  const editorConfig = await editorConfigFactory.default({ config: payload.config });
  const richText = (markdown: string) => convertMarkdownToLexical({ editorConfig, markdown });

  // Faze in teme
  const stageIds = new Map<number, number>();
  for (const stage of sampleStages) {
    const { id } = await ensure("faze", `Faza ${stage.stevilka}: ${stage.naziv}`, {
      ...stage,
      slug: slugify(stage.naziv),
      cilji: stage.cilji.map((besedilo) => ({ besedilo })),
    });
    stageIds.set(stage.stevilka, id);
  }
  const topicIds = new Map<string, number>();
  for (const topic of sampleTopics) {
    const { id } = await ensure("teme", `Tema: ${topic.naziv}`, { ...topic, slug: slugify(topic.naziv) });
    topicIds.set(topic.naziv, id);
  }

  // Kategorije
  const categoryIds: number[] = [];
  for (const category of sampleCategories) {
    const { id } = await ensure("kategorije-izdelkov", `Kategorija: ${category.naziv}`, {
      ...category,
      slug: slugify(category.naziv),
    });
    categoryIds.push(id);
  }

  // Članek
  const article = await ensure("clanki", `Članek: ${sampleArticle.naslov}`, {
    naslov: sampleArticle.naslov,
    slug: slugify(sampleArticle.naslov),
    povzetek: sampleArticle.povzetek,
    casBranja: Math.max(1, Math.round(sampleArticle.markdown.split(/\s+/).length / 200)),
    zahtevnost: "zacetnik",
    faza: stageIds.get(1),
    teme: [topicIds.get("Načrtovanje"), topicIds.get("Varnost")].filter(Boolean),
    vsebina: richText(sampleArticle.markdown),
    kljucniPoudarki: sampleArticle.kljucniPoudarki.map((besedilo) => ({ besedilo })),
    varnostnaOpomba: sampleArticle.varnostnaOpomba,
    vzorec: true,
    _status: "published",
  });

  // Video lekcija (datoteke samo, če je video nov)
  const videoSlug = slugify(sampleVideo.naslov);
  let video = await findSlug("videi", videoSlug);
  let videoCreated = false;
  if (video) {
    result.preskoceno.push(`Video: ${sampleVideo.naslov}`);
  } else {
    const fileId = await upload("video-datoteke", ASSETS.video, { naslov: "Vzorčni video" });
    const captionsId = fileId ? await upload("datoteke", ASSETS.captions, { naslov: "Podnapisi: vzorčni video" }) : null;
    const posterId = await upload("mediji", ASSETS.poster, {
      alt: "Naslovna slika vzorčnega videa: napis GradimoCamper, vzorčni video, na olivno zeleni podlagi.",
      avtorstvo: "GradimoCamper (vzorec)",
    });
    const created = (await payload.create({
      collection: "videi",
      overrideAccess: true,
      data: {
        naslov: sampleVideo.naslov,
        slug: videoSlug,
        povzetek: sampleVideo.povzetek,
        vir: fileId ? "datoteka" : "ni",
        datoteka: fileId,
        podnapisi: captionsId,
        poster: posterId,
        trajanje: sampleVideo.trajanje,
        zahtevnost: "zacetnik",
        faza: stageIds.get(5) as number,
        teme: [topicIds.get("Elektrika")].filter(Boolean) as number[],
        poglavja: sampleVideo.poglavja,
        opis: richText(sampleVideo.markdown) as never,
        prepis: sampleVideo.prepis,
        kljucniPoudarki: sampleVideo.kljucniPoudarki.map((besedilo) => ({ besedilo })),
        varnostnaOpomba: sampleVideo.varnostnaOpomba,
        sorodno: [{ relationTo: "clanki", value: article.id }],
        vzorec: true,
        _status: "published",
      },
    })) as { id: number };
    video = { id: created.id };
    videoCreated = true;
    result.ustvarjeno.push(`Video: ${sampleVideo.naslov}`);
  }

  // Izdelki (v kategoriji Elektrika in solarni sistem)
  const productIds: number[] = [];
  for (const product of sampleProducts) {
    const { id } = await ensure("izdelki", `Izdelek: ${product.naziv}`, {
      ...product,
      slug: slugify(product.naziv),
      kategorija: categoryIds[0],
      faze: [stageIds.get(5)],
      tehnicniPodatki: [...product.tehnicniPodatki],
      primeriUporabe: product.primeriUporabe.map((besedilo) => ({ besedilo })),
      pogostaVprasanja: "pogostaVprasanja" in product ? [...product.pogostaVprasanja] : [],
      vodici: [{ relationTo: "videi", value: video.id }],
      vzorec: true,
      _status: "published",
    });
    productIds.push(id);
  }

  // Povezave, ki potrebujejo že ustvarjene vnose
  if (videoCreated) {
    await payload.update({ collection: "videi", id: video.id, overrideAccess: true, data: { izdelki: productIds } });
  }
  if (article.created) {
    await payload.update({
      collection: "clanki",
      id: article.id,
      overrideAccess: true,
      data: { sorodno: [{ relationTo: "videi", value: video.id }] },
    });
  }

  // Učna pot
  await ensure("ucne-poti", `Učna pot: ${samplePath.naslov}`, {
    naslov: samplePath.naslov,
    slug: slugify(samplePath.naslov),
    opis: samplePath.opis,
    zaKoga: samplePath.zaKoga,
    koraki: [
      { vsebina: { relationTo: "clanki", value: article.id }, opomba: samplePath.opombe[0] },
      { vsebina: { relationTo: "videi", value: video.id }, opomba: samplePath.opombe[1] },
    ],
    izpostavljena: true,
    vzorec: true,
    _status: "published",
  });

  // Domača stran in O nas: samo, če še nista izpolnjeni
  const home = await payload.findGlobal({ slug: "domaca-stran", depth: 0 });
  if (!home?.prviZaslon?.naslov) {
    await payload.updateGlobal({
      slug: "domaca-stran",
      overrideAccess: true,
      data: {
        prviZaslon: sampleHome.prviZaslon,
        izpostavljeniVodici: [
          { relationTo: "clanki", value: article.id },
          { relationTo: "videi", value: video.id },
        ],
        izpostavljeneKategorije: categoryIds,
        zaupanje: sampleHome.zaupanje,
      },
    });
    result.ustvarjeno.push("Domača stran");
  } else {
    result.preskoceno.push("Domača stran");
  }

  const about = await payload.findGlobal({ slug: "o-nas", depth: 0 });
  if (!about?.uvod && !about?.vsebina) {
    await payload.updateGlobal({
      slug: "o-nas",
      overrideAccess: true,
      data: { naslov: sampleAbout.naslov, uvod: sampleAbout.uvod, vsebina: richText(sampleAbout.markdown) as never },
    });
    result.ustvarjeno.push("Stran O nas");
  } else {
    result.preskoceno.push("Stran O nas");
  }

  return result;
}
