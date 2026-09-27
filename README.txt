ShiftReady - deploy to Vercel
1. Create a new GitHub repo (e.g. shiftready-site) and upload index.html and sim.html.
2. In Vercel: Add New > Project > import the repo > Deploy (no build settings needed).
   index.html is the landing page; its "Try the free Monday shift" button opens sim.html,
   and the simulator has a "ShiftReady home" link back.
3. Waitlist: create a free form at formspree.io, copy its endpoint URL, and paste it into
   FORM_ENDPOINT near the bottom of index.html. Commit; Vercel redeploys automatically.
4. Optional: add a custom domain in Vercel > Project > Settings > Domains.
