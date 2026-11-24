/** What is stored and why: the privacy page (/gate/privacy) and the Mac app's privacy dialog */
export function Privacy() {
  return (
    <div className="privacy-body">
      <h2>Privacy</h2>
      <p>Nanoscale Revision is a study aid for UCL's ELEC0031. It keeps as little as it can, and nothing about you leaves it.</p>

      <h3>What is stored</h3>
      <ul>
        <li>
          <strong>Your email address</strong>, to sign you in. Only verified @ucl.ac.uk addresses can have an account.
        </li>
        <li>
          <strong>Your progress</strong>: which lesson steps you finished (and whether you peeked first), your Revise cards and when each is due, a log of
          your first answer to each question (right, wrong or peeked, and when), how well you know each fact, and your settings (theme, animation
          speed, where you were in the lesson, whether you have been through the gowning).
        </li>
        <li>
          <strong>Two cookies</strong> on the website, both needed for it to work: one says this browser entered the access code, the other keeps you
          signed in. The Mac app keeps the same two things in your macOS Keychain.
        </li>
        <li>A copy of your progress on your device, so the app works offline. Signing out removes it once everything has synced.</li>
        <li>To slow down guessing, failed access-code attempts are counted for 24 hours against a scrambled form of your IP address, never the address itself.</li>
      </ul>

      <h3>Why</h3>
      <p>Only so your progress follows you between the website and the Mac app, and so the course material stays within the cohort.</p>

      <h3>What is not collected</h3>
      <p>No analytics, no advertising, no third-party trackers, no fingerprinting. Nothing is sold or shared.</p>

      <h3>Where it lives</h3>
      <p>
        In a Supabase project (a Postgres database and file storage). Row-level security means each account can read and change only its own rows. The
        website is hosted on Vercel.
      </p>

      <h3>Export or delete</h3>
      <p>
        Open the account menu (the person icon, top right, inside the app). <em>Export my data</em> downloads everything stored about you as one JSON
        file. <em>Delete my account</em> removes your account and every row of your progress straight away, and the copy on that device.
      </p>
    </div>
  )
}
