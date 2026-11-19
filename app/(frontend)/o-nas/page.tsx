import { PlatformShell } from "@/components/platform/PlatformShell";
import { RichText } from "@/components/platform/RichText";
import { PageIntro } from "@/components/platform/ui";
import { brand } from "@/content";
import { queryOptions, requireViewer } from "@/lib/cms";
import { routes } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "O nas",
  description: `Kdo stoji za ${brand.name} in kako pripravljamo vodiče in izbor opreme.`,
  path: routes.about,
});

export default async function AboutPage() {
  const viewer = await requireViewer();
  const about = await viewer.payload.findGlobal({ slug: "o-nas", ...queryOptions(viewer), depth: 1 }).catch(() => null);

  return (
    <PlatformShell preview={viewer.preview}>
      <PageIntro crumbs={[{ label: "O nas" }]} title={about?.naslov || "O nas"} lead={about?.uvod || brand.tagline} />
      <div className="container-page pb-16">
        <div className="max-w-3xl">
          {about?.vsebina ? (
            <RichText data={about.vsebina} />
          ) : (
            <p className="leading-relaxed text-ink-muted">Besedilo strani še ni vneseno.</p>
          )}
        </div>
      </div>
    </PlatformShell>
  );
}
