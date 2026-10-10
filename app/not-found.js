import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-16">
      <div className="card mx-auto max-w-xl px-6 py-12 text-center">
        <p className="text-sm font-semibold text-brand-600">Nothing found</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">We couldn’t find that on this chain</h1>
        <p className="mt-2 text-sm text-muted">
          Check the block number, transaction hash or address and try again. New transactions can take a few seconds to appear.
        </p>
        <div className="mx-auto mt-6 max-w-md text-left">
          <SearchBar />
        </div>
        <Link href="/" className="mt-6 inline-block text-sm font-medium">
          Back to home
        </Link>
      </div>
    </Container>
  );
}
