import { LinkTabs } from "./ui";

const TOOLS = [
  { id: "verify", label: "Verify Contract", href: "/verifycontract" },
  { id: "verified", label: "Verified Contracts", href: "/contracts-verified" },
  { id: "reader", label: "Code Reader", href: "/code-reader" },
  { id: "similar", label: "Similar Contracts", href: "/find-similar-contracts" },
  { id: "search", label: "Contract Search", href: "/searchcontract" },
  { id: "diff", label: "Diff Checker", href: "/contractdiffchecker" },
  { id: "compiler", label: "Online Compiler", href: "/compiler" },
];

export default function ContractToolsTabs({ active }) {
  return <LinkTabs tabs={TOOLS} active={active} />;
}
