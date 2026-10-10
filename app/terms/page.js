import ContentPage from "@/components/ContentPage";
import { config } from "@/lib/config";

export const metadata = { title: "Terms & Privacy" };

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Terms & Privacy"
      title="Terms of Service & Privacy Policy"
      lead={`The rules for using the ${config.chainName} Explorer and how we handle data.`}
      toc={[
        { id: "terms", label: "Terms of service" },
        { id: "data", label: "Blockchain data" },
        { id: "api", label: "API use" },
        { id: "privacy", label: "Privacy policy" },
        { id: "changes", label: "Changes" },
      ]}
    >
      <h2 id="terms">Terms of service</h2>
      <p>
        By using this explorer you agree to these terms. The explorer is provided &quot;as is&quot;, without warranties of any kind. It is an
        informational tool and nothing on it is financial, legal or investment advice.
      </p>

      <h2 id="data">Blockchain data</h2>
      <p>
        All blocks, transactions, balances and token data come from the public {config.chainName} ledger. Token names and symbols are set by
        whoever deployed the contract and are not verified by us; a token appearing here is not an endorsement. While we work to keep the
        index accurate and current, it may lag the chain or contain errors, so verify critical information against a node.
      </p>

      <h2 id="api">API use</h2>
      <ul>
        <li>Use the API at a reasonable rate. Automated scraping that degrades the service for others may be blocked.</li>
        <li>Do not use the explorer or API for unlawful purposes.</li>
        <li>We may change or discontinue endpoints, with notice on the API documentation page where possible.</li>
      </ul>

      <h2 id="privacy">Privacy policy</h2>
      <p>
        The explorer has no user accounts and sets no tracking cookies. Your theme choice is stored only in your browser&apos;s local storage.
        Like any web server, ours may keep standard access logs (IP address, requested URL, user agent) for security and troubleshooting;
        these are not sold or shared for advertising.
      </p>
      <p>
        Remember that anything you put on-chain is public and permanent. Searching an address here does not link it to you, but on-chain
        activity itself is visible to everyone.
      </p>

      <h2 id="changes">Changes</h2>
      <p>We may update these terms from time to time. Continued use after a change means you accept the updated terms.</p>
    </ContentPage>
  );
}
