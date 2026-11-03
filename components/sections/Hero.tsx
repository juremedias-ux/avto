import Image from "next/image";
import { hero, images } from "@/content";
import { Headline } from "@/components/Headline";
import { HERO_FORM_ID, HERO_FORM_PREFIX } from "@/components/SiteHeader";
import { WaitlistForm } from "@/components/WaitlistForm";

export function Hero() {
  return (
    <section aria-labelledby="naslov" className="pb-16 pt-8 sm:pt-12 lg:pb-24 lg:pt-12">
      <div className="container-page grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <Headline as="h1" id="naslov" text={hero.title} className="display-1 mt-5" />
          <p className="lead mt-5 max-w-[34rem]">{hero.lead}</p>

          <div
            id={HERO_FORM_ID}
            className="form-card mt-8 scroll-mt-24 sm:mt-10"
          >
            <WaitlistForm id={HERO_FORM_PREFIX} source="prvi_zaslon" />
          </div>
        </div>

        <figure className="lg:col-span-6">
          <div
            className="photo-panel aspect-[4/3] sm:aspect-[16/11] lg:aspect-square"
            style={{ backgroundColor: images.hero.background }}
          >
            <Image
              src={images.hero.src}
              width={images.hero.width}
              height={images.hero.height}
              alt={images.hero.alt}
              preload
              fetchPriority="high"
              loading="eager"
              quality={80}
              sizes="(min-width: 1024px) 459px, (min-width: 640px) 459px, calc(100vw - 64px)"
              className="h-auto w-full max-w-[459px] object-contain"
            />
          </div>
          <figcaption className="mt-3 text-[0.8125rem] text-ink-muted">
            Simbolična fotografija. Vozilo ni izdelek ali predelava GradimoCamper.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
