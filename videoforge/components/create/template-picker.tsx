"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORIES, type PromptTemplate, type TemplateCategory } from "@/lib/templates";
import { cn } from "@/lib/utils";

export function TemplatePicker({ onApply, activeId }: { onApply: (t: PromptTemplate) => void; activeId?: string }) {
  const { t, locale } = useI18n();
  const [category, setCategory] = useState<TemplateCategory>("product");
  const items = PROMPT_TEMPLATES.filter((tpl) => tpl.category === category);
  return (
    <div className="grid gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t.create.templates}>
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={c === category}
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              c === category ? "border-primary bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.create.categories[c]}
          </button>
        ))}
      </div>
      <ul className="grid gap-2">
        {items.map((tpl) => (
          <li
            key={tpl.id}
            className={cn("flex items-start justify-between gap-3 rounded-lg border p-3", activeId === tpl.id && "border-primary")}
          >
            <div className="grid gap-1">
              <span className="text-sm font-medium">{tpl.title[locale]}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{tpl.prompt}</span>
              <span className="text-xs text-muted-foreground">
                {tpl.aspectRatio} · {tpl.duration} s
              </span>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => onApply(tpl)}>
              {t.create.useTemplate}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
