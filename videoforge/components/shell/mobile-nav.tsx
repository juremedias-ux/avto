"use client";

import { useState, type ReactNode } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n/client";
import { NavLinks } from "@/components/shell/nav-links";

export function MobileNav({ isPlatformAdmin, header, footer }: { isPlatformAdmin: boolean; header: ReactNode; footer: ReactNode }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t.common.menu}>
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent title={t.common.menu} closeLabel={t.common.close}>
        {header}
        <NavLinks isPlatformAdmin={isPlatformAdmin} onNavigate={() => setOpen(false)} />
        <div className="mt-auto">{footer}</div>
      </SheetContent>
    </Sheet>
  );
}
