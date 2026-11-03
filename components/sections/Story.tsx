import Image from "next/image";
import { imageNotice, images, story } from "@/content";
import { Headline } from "@/components/Headline";

/**
 * Vizualna zgodba: naslov in besedilo, pod njima sliki v isti vrstici.
 * Stolpca sta sorazmerna razmerjem slik, zato sta okvirja enako visoka in
 * se vozili prikažeta v celoti (brez obrezovanja).
 */
export function Story() {
  const front = images.front;
  const side = images.side;
  const frontRatio = (front.width / front.height).toFixed(4);
  const sideRatio = (side.width / side.height).toFixed(4);

  return (
    <section aria-labelledby="zgodba-naslov" className="bg-sand-50 py-20 sm:py-24 lg:py-32">
      <div className="container-page">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
          <Headline id="zgodba-naslov" text={story.title} className="display-2 lg:col-span-7" />
          <p className="lead max-w-[30rem] lg:col-span-5 lg:pb-1">{story.text}</p>
        </div>

        <figure className="mt-10 sm:mt-14">
          <div
            className="story-grid"
            style={
              {
                "--front-ratio": frontRatio,
                "--side-ratio": sideRatio,
              } as React.CSSProperties
            }
          >
            <div
              className="overflow-hidden rounded-[var(--radius-panel)]"
              style={{ backgroundColor: front.background }}
            >
              <Image
                src={front.src}
                width={front.width}
                height={front.height}
                alt={front.alt}
                quality={80}
                sizes="(min-width: 768px) 459px, calc(100vw - 32px)"
                className="mx-auto h-auto w-full max-w-[459px] object-contain"
              />
            </div>
            <div
              className="flex items-center overflow-hidden rounded-[var(--radius-panel)]"
              style={{ backgroundColor: side.background }}
            >
              <Image
                src={side.src}
                width={side.width}
                height={side.height}
                alt={side.alt}
                quality={80}
                sizes="(min-width: 1280px) 760px, (min-width: 768px) 62vw, calc(100vw - 32px)"
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
          <figcaption className="mt-4 max-w-[46rem] text-[0.8125rem] leading-relaxed text-ink-muted">
            {imageNotice}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
