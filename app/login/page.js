import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { Container } from "@/components/ui";
import { currentUser, safeNext } from "@/lib/auth";
import { config } from "@/lib/config";

export const metadata = { title: "Sign In" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const next = safeNext(params?.next);
  if (await currentUser()) redirect(next);
  const registerHref = next === "/myaccount" ? "/register" : `/register?next=${encodeURIComponent(next)}`;

  return (
    <Container className="flex justify-center py-12">
      <section className="card w-full max-w-[480px] p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign In</h1>
        <p className="mt-1.5 mb-6 text-sm text-muted">
          Don&apos;t have an account? <Link href={registerHref}>Sign Up</Link>
        </p>
        <LoginForm next={next} />
        <p className="mt-6 border-t border-line pt-4 text-xs text-faint">
          Your {config.chainName} Explorer account keeps a watch list, private name tags and API keys. It is separate from any
          wallet — never enter a private key or seed phrase here.
        </p>
      </section>
    </Container>
  );
}
