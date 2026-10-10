import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForms";
import { Container } from "@/components/ui";
import { currentUser, safeNext } from "@/lib/auth";
import { config } from "@/lib/config";

export const metadata = { title: "Sign Up" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  const next = safeNext(params?.next);
  if (await currentUser()) redirect(next);
  const loginHref = next === "/myaccount" ? "/login" : `/login?next=${encodeURIComponent(next)}`;

  return (
    <Container className="flex justify-center py-12">
      <section className="card w-full max-w-[480px] p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Register a New Account</h1>
        <p className="mt-1.5 mb-6 text-sm text-muted">
          Fill out the form to get started. Already have an account? <Link href={loginHref}>Sign In</Link>
        </p>
        <RegisterForm next={next} />
        <p className="mt-6 border-t border-line pt-4 text-xs text-faint">
          A free {config.chainName} Explorer account lets you keep a watch list, add private name tags and create API keys.
        </p>
      </section>
    </Container>
  );
}
