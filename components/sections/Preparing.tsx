import { preparing } from "@/content";
import { Headline } from "@/components/Headline";

export function Preparing() {
  return (
    <section
      id="kaj-pripravljamo"
      aria-labelledby="kaj-pripravljamo-naslov"
      className="scroll-mt-20 border-t border-sand-200 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow">{preparing.eyebrow}</p>
            <Headline
              id="kaj-pripravljamo-naslov"
              text={preparing.title}
              className="display-2 mt-4"
            />
            <p className="body-muted mt-5 max-w-[26rem]">{preparing.intro}</p>
          </div>
        </div>

        <ol className="lg:col-span-7 lg:col-start-6">
          {preparing.items.map((item, index) => (
            <li
              key={item.title}
              className="grid grid-cols-[2.75rem_1fr] gap-x-4 border-t border-sand-300 py-8 first:border-t-0 first:pt-0 sm:grid-cols-[4rem_1fr_auto] sm:gap-x-6 sm:py-10 lg:first:pt-2"
            >
              <span
                className="pt-1 text-sm font-semibold tabular-nums tracking-wide text-olive"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[1.75rem]">
                  {item.title}
                </h3>
                <p className="body-muted mt-3 max-w-[30rem]">{item.text}</p>
              </div>
              <p className="col-start-2 mt-4 sm:col-start-3 sm:mt-1">
                <span className="status-pill">{item.status}</span>
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
