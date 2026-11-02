import { faq } from "@/content";

export function Faq() {
  return (
    <section
      id="pogosta-vprasanja"
      aria-labelledby="pogosta-vprasanja-naslov"
      className="scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-page grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <h2 id="pogosta-vprasanja-naslov" className="display-2">
            {faq.title}
          </h2>
        </div>
        <dl className="lg:col-span-7 lg:col-start-6">
          {faq.items.map((item) => (
            <div
              key={item.q}
              className="border-t border-sand-300 py-7 first:border-t-0 first:pt-0 sm:py-8 lg:first:pt-2"
            >
              <dt className="text-xl font-semibold leading-snug tracking-[-0.015em] text-ink sm:text-[1.375rem]">
                {item.q}
              </dt>
              <dd className="body-muted mt-3 max-w-[34rem]">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
