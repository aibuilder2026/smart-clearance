# SC-46: the console's sign-in with an email and a password

**The request** (the maintainer, 6 Oct 2026): email and password for everyone, every user onboarded with a default
password and no email ever sent; Find your workspace answers less; "I need this to be stitched with local UI and run
end to end from local".

**The options** (`board.html`):

- **A, one step in the card** (recommended): work email, password (show or hide), Sign in; one message for any wrong
  sign-in; no forgot-password.
- **B, email first, then the password**: as the workspace sign-in (SC-24), with the account pill and Change.

Both: Find your workspace names the workspace only, with no role line.

**The pick:** **A, one step in the card**, picked by the maintainer on 6 Oct 2026, the recommended option. The board
was published to platform v3 as `SC-46 design review.html`, with `SC-46 option A.html` and `SC-46 option B.html`.

The build: design3's console sign-in first (`console/console.jsx`, `console/console.css`), and Find your workspace
without the role line (`screens/auth.jsx`); then the SvelteKit console and `@smart-clearance/core`'s FindWorkspace,
signing in through Firebase Authentication against backend-api.
