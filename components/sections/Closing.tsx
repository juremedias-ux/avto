import { closing } from "@/content";
import { Headline } from "@/components/Headline";
import { VanMark } from "@/components/VanMark";
import { WaitlistForm } from "@/components/WaitlistForm";

export function Closing() {
  return (
    <section aria-labelledby="zakljucek-naslov" className="pb-6 sm:pb-8">
      <div className="container-page">
        <div className="dark-surface rounded-[var(--radius-panel)] bg-olive-deep px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <VanMark className="h-10 w-10 text-olive-200" />
              <Headline
                id="zakljucek-naslov"
                text={closing.title}
                className="display-2 mt-6 text-paper"
              />
            </div>
            <div className="lg:col-span-7">
              <div className="form-card light-surface">
                <WaitlistForm id="prijava-spodaj" source="zakljucek" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
