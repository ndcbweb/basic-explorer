import { assetUrl } from "@/lib/settings";

export default function Logo({ className = "h-8 w-8" }) {
  const custom = assetUrl("logo");
  if (custom) {
    const height = className.split(/\s+/).filter((item) => !/^w-/.test(item)).join(" ");
    return <img src={custom} alt="" className={`${height} w-auto max-w-44 object-contain`} />;
  }
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1b2540" />
      <path
        d="M9 22V10l14 12V10"
        fill="none"
        stroke="#6f9bff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
