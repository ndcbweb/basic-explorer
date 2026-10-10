import ContentPage from "@/components/ContentPage";
import Logo from "@/components/Logo";
import { config } from "@/lib/config";

export const metadata = { title: "Brand Assets" };

const COLORS = [
  { name: "Brand Blue", hex: "#2c6bed", cls: "bg-[#2c6bed]" },
  { name: "Night", hex: "#0a1020", cls: "bg-[#0a1020]" },
  { name: "Logo Ink", hex: "#1b2540", cls: "bg-[#1b2540]" },
  { name: "Sky", hex: "#6f9bff", cls: "bg-[#6f9bff]" },
  { name: "Canvas", hex: "#f5f6f8", cls: "bg-[#f5f6f8]" },
];

export default function BrandAssetsPage() {
  return (
    <ContentPage
      eyebrow="Brand Assets"
      title="Brand Assets"
      lead={`Logo, colours and usage guidelines for referencing the ${config.chainName} Explorer.`}
      toc={[
        { id: "logo", label: "Logo" },
        { id: "colors", label: "Colours" },
        { id: "usage", label: "Usage guidelines" },
      ]}
    >
      <h2 id="logo">Logo</h2>
      <p>Use the mark on its own or next to the network name. Keep clear space equal to half the mark&apos;s height on every side.</p>
      <div className="not-prose mb-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-[#f5f6f8] p-8">
          <Logo className="h-12 w-12" />
          <span className="text-lg font-semibold text-[#0a1020]">{config.chainName}</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-[#0a1020] p-8">
          <Logo className="h-12 w-12" />
          <span className="text-lg font-semibold text-white">{config.chainName}</span>
        </div>
      </div>
      <p>
        Download the vector mark: <a href="/icon.svg" download>icon.svg</a>.
      </p>

      <h2 id="colors">Colours</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {COLORS.map((color) => (
          <div key={color.hex} className="overflow-hidden rounded-xl border border-line">
            <div className={`h-16 ${color.cls}`} />
            <div className="px-3 py-2 text-xs">
              <p className="font-semibold text-ink">{color.name}</p>
              <p className="font-mono text-muted">{color.hex}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 id="usage">Usage guidelines</h2>
      <ul>
        <li>Do link back to the explorer when you use the logo.</li>
        <li>Do keep the mark&apos;s proportions and colours intact.</li>
        <li>Don&apos;t imply endorsement or partnership without written approval from Nadcab Labs.</li>
        <li>Don&apos;t combine the mark with other logos into a new lockup.</li>
      </ul>
    </ContentPage>
  );
}
