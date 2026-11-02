import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Closing } from "@/components/sections/Closing";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { Preparing } from "@/components/sections/Preparing";
import { Story } from "@/components/sections/Story";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="vsebina" tabIndex={-1} className="outline-none">
        <Hero />
        <Preparing />
        <Story />
        <Faq />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}
