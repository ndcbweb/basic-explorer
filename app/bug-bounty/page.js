import ContentPage, { HelpCard } from "@/components/ContentPage";
import { config } from "@/lib/config";

export const metadata = { title: "Bug Bounty" };

const SEVERITY = [
  { level: "Critical", examples: "Remote code execution on explorer or node hosts, exposure of validator keys" },
  { level: "High", examples: "Authentication bypass on management endpoints, stored XSS on any explorer page" },
  { level: "Medium", examples: "Reflected XSS, indexer data corruption from crafted transactions" },
  { level: "Low", examples: "Information disclosure without direct impact, missing security headers" },
];

export default function BugBountyPage() {
  return (
    <ContentPage
      eyebrow="Bug Bounty"
      title="Bug Bounty Program"
      lead={`Help keep ${config.chainName} and its explorer secure. We appreciate responsible disclosure of security issues.`}
      toc={[
        { id: "scope", label: "Scope" },
        { id: "severity", label: "Severity" },
        { id: "rules", label: "Rules" },
        { id: "report", label: "How to report" },
      ]}
      aside={
        <HelpCard title="Not a security issue?">
          For regular bugs, open a public issue on{" "}
          <a href="https://github.com/ndcbweb/basic-explorer/issues" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>{" "}
          instead.
        </HelpCard>
      }
    >
      <h2 id="scope">Scope</h2>
      <ul>
        <li>This explorer&apos;s web application and API.</li>
        <li>The explorer source code at github.com/ndcbweb/basic-explorer.</li>
        <li>The Nadcab Console that provisions this network.</li>
      </ul>
      <p>Out of scope: denial-of-service attacks, social engineering, spam, and issues in third-party wallets or contracts deployed by users.</p>

      <h2 id="severity">Severity</h2>
      <div className="mb-6 overflow-hidden rounded-xl border border-line">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Severity</th>
              <th scope="col">Examples</th>
            </tr>
          </thead>
          <tbody>
            {SEVERITY.map((row) => (
              <tr key={row.level}>
                <td className="font-medium whitespace-nowrap">{row.level}</td>
                <td className="text-muted" style={{ whiteSpace: "normal" }}>
                  {row.examples}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Rewards are decided case by case based on impact and report quality.</p>

      <h2 id="rules">Rules</h2>
      <ul>
        <li>Only test against accounts and data you own; never access other users&apos; data.</li>
        <li>Do not degrade service for others. Stop and report as soon as you confirm an issue.</li>
        <li>Give us reasonable time to fix the issue before any public disclosure.</li>
      </ul>

      <h2 id="report">How to report</h2>
      <p>
        Report privately through a{" "}
        <a href="https://github.com/ndcbweb/basic-explorer/security/advisories/new" target="_blank" rel="noopener noreferrer">
          GitHub security advisory
        </a>{" "}
        with steps to reproduce, affected URLs and the impact you observed.
      </p>
    </ContentPage>
  );
}
