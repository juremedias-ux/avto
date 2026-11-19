import { InquiryPanel } from "@/components/platform/inquiry/InquiryPanel";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PageIntro } from "@/components/platform/ui";
import { requireViewer } from "@/lib/cms";
import { routes } from "@/lib/platform";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Seznam povpraševanja",
  description: "Izbrane izdelke pošlji kot povpraševanje brez obveznosti.",
  path: routes.inquiry,
  noindex: true,
});

export default async function InquiryPage() {
  const viewer = await requireViewer();
  return (
    <PlatformShell preview={viewer.preview}>
      <PageIntro
        crumbs={[{ label: "Seznam povpraševanja" }]}
        title="Seznam povpraševanja"
        lead="Izbrane izdelke pošlji kot povpraševanje. Odgovorimo s podatki o dobavljivosti in ponudbo. Plačila na strani ni."
      />
      <div className="container-page pb-16">
        <InquiryPanel />
      </div>
    </PlatformShell>
  );
}
