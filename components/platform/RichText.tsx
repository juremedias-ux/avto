import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import {
  defaultJSXConverters,
  LinkJSXConverter,
  RichText as PayloadRichText,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";
import { Media } from "@/components/platform/Media";
import { routes } from "@/lib/platform";

type LinkDoc = { relationTo: string; value: unknown };

function internalHref({ linkNode }: { linkNode: { fields: { doc?: LinkDoc | null } } }): string {
  const ref = linkNode.fields.doc;
  const value = ref?.value as { slug?: string; kategorija?: { slug?: string } } | undefined;
  const slug = value?.slug;
  if (!ref || !slug) return "#";
  switch (ref.relationTo) {
    case "clanki":
      return routes.article(slug);
    case "videi":
      return routes.video(slug);
    case "izdelki":
      return value?.kategorija?.slug ? routes.product(value.kategorija.slug, slug) : routes.products;
    default:
      return "#";
  }
}

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref: internalHref as never }),
  upload: ({ node }) => {
    const value = (node as { value?: unknown }).value;
    const caption = (value as { alt?: string } | undefined)?.alt;
    return (
      <figure className="my-8">
        <Media media={value} sizes="(min-width: 768px) 720px, 100vw" className="h-auto w-full rounded-2xl" />
        {caption ? <figcaption className="mt-2 text-sm text-ink-muted">{caption}</figcaption> : null}
      </figure>
    );
  },
});

/** Prikaz obogatenega besedila iz urejevalnika v slogu strani. */
export function RichText({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;
  return (
    <PayloadRichText
      data={data as SerializedEditorState}
      converters={converters}
      className="prose-gc"
      disableContainer={false}
    />
  );
}

export { defaultJSXConverters };
