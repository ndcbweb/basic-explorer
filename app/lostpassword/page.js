import Link from "next/link";
import { Container } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "Forgot Password" };

export default function LostPasswordPage() {
  return (
    <Container className="flex justify-center py-12">
      <section className="card w-full max-w-[480px] p-6 sm:p-8">
        <h1 className="text-xl font-medium text-ink">Forgot Password</h1>
        <p className="mt-1.5 mb-6 text-sm text-muted">
          Remembered it? <Link href="/login">Back to Sign In</Link>
        </p>
        <div role="status" className="rounded-lg border border-wait-700/25 bg-wait-50 px-4 py-3 text-sm text-wait-700">
          Password reset emails are not available: this explorer does not have an email delivery service configured.
        </div>
        <div className="mt-5 space-y-3 text-sm text-muted">
          <p>
            To recover access to your account, contact the {config.chainName} Explorer operator through the{" "}
            <Link href="/contact">Contact Us</Link> page. Include your username and, if you added one when signing up, the email
            address on the account so the operator can verify that it belongs to you.
          </p>
          <p>
            If you would rather start over, you can <Link href="/register">create a new account</Link> at any time. Watch lists,
            private name tags and API keys are stored per account and are not transferred automatically.
          </p>
        </div>
        <Link href="/contact" className="btn-primary mt-6 w-full">
          Contact the Operator
        </Link>
      </section>
    </Container>
  );
}
