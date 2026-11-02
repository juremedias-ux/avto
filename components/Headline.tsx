import type { ElementType } from "react";

type HeadlineProps = {
  as?: ElementType;
  text: string;
  className?: string;
  id?: string;
};

/**
 * Kratek naslov iz več stavkov: vsak stavek v svoji vrstici, besedilo za
 * bralnike zaslona ostane nespremenjeno.
 */
export function Headline({ as: Tag = "h2", text, className, id }: HeadlineProps) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return (
    <Tag className={className} id={id}>
      {sentences.map((sentence, index) => (
        <span key={index} className="block">
          {sentence}
          {index < sentences.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
