import { Figtree } from "next/font/google";

// Pisava se prenese ob gradnji in streže z lastne domene (brez zahtev do Googla v brskalniku).
export const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-figtree",
  display: "swap",
});
