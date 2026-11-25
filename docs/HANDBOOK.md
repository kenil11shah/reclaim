# Reclaim: deployment handbook

Everything here happens in your web browser. There is nothing to install, no terminal and no code to touch. Use your own Chrome, signed in to your GitHub account (kenil11shah).

**Good news compared with Wealthwise and Empathetic AI:** Reclaim has no database, no login and no AI service. So there is no Supabase, no Groq and no API keys. You only need GitHub and Vercel, and the whole thing takes about 15 minutes.

**What you will have at the end**

- A live website at a vercel.app address that anyone can open on their phone or laptop.
- The code on github.com/kenil11shah/reclaim with a green tick from the automatic tests.
- A site that stays up for free, with nothing to keep alive. It has no server, so it never sleeps.

## Part 1. Review the preview (5 minutes)

1. Open the **Reclaim preview** link I sent in the chat. It shows the English pages of the built site.
2. Click **See how it works** and go through the 8-step tour.
3. Click **Get help now** and answer the questions as if you were a user.
4. Note anything you want changed (wording, colours, a missing platform, a wrong fact) and send it to me in one message. I change the code, re-run the tests and update the preview.

The preview runs inside Claude, so a few things only work on the real site: Hindi pages, PDF downloads, the "Leave now" jump and the print dialog. You will test those in Part 4.

## Part 2. GitHub (3 minutes)

The one thing I cannot do is create a new repository for you. You click "Create repository" once, and I push everything.

1. Go to **github.com** and check you are signed in as **kenil11shah** (top right picture).
2. Click the **+** at the top right, then **New repository**.
3. Fill in:
   - **Repository name:** `reclaim`
   - **Description:** `Free, private help for people in India whose intimate or AI-made images were shared without consent, plus a public platform scorecard.`
   - **Public** (so recruiters can see it)
   - Leave **Add a README**, **.gitignore** and **license** all **unticked**. The repo must be empty.
4. Click **Create repository**.
5. Come back to this chat and send: **Repo created, push the code**.

I push the code with you as the author (Kenil Shah) and no AI names anywhere. Then:

6. On the repo page, click the **Actions** tab. You will see a run called **CI**. It installs the app, runs every test and builds the site. Wait for the **green tick** (about 4 minutes). If you see a red cross, send me a screenshot.

## Part 3. Vercel (5 minutes)

1. Go to **vercel.com** and click **Sign Up** (or **Log In**). Choose **Continue with GitHub** and approve.
   - If it asks for a plan, choose **Hobby** (free).
2. On the dashboard, click **Add New...** then **Project**.
3. Under **Import Git Repository**, find **reclaim** and click **Import**.
   - If you don't see it, click **Adjust GitHub App Permissions**, choose **Only select repositories**, add **reclaim**, and save.
4. On the **Configure Project** screen:
   - **Project Name:** `reclaim` (or `reclaim-ncii` if `reclaim` is taken)
   - **Framework Preset:** it should say **Next.js** on its own. Leave it.
   - **Root Directory:** leave it as `./`
   - **Build and Output Settings:** leave everything as it is.
   - **Environment Variables:** none needed. Leave it empty.
5. Click **Deploy**. Wait about 2 minutes for the confetti.
6. Click **Continue to Dashboard**. Your live address is under **Domains**, for example `reclaim-xyz.vercel.app`. Click it to open your site.

**Optional: a nicer address.** In your project, go to **Settings**, then **Domains**. Click **Edit** next to the vercel.app address, type something like `reclaim-ncii.vercel.app`, and save. If it is free, it switches in a few seconds.

**Optional: tell the site its own address.** This only improves link previews when you share the site. In **Settings**, then **Environment Variables**, add the name `NEXT_PUBLIC_SITE_URL` with your full address as the value (for example `https://reclaim-ncii.vercel.app`), click **Save**, then go to **Deployments**, click the three dots on the top one and choose **Redeploy**.

## Part 4. Test the live site (5 minutes)

Open your live address on your **phone** and tick these off.

- [ ] The home page loads and shows the demo banner at the top.
- [ ] **See how it works** runs the 8-step tour to the end. **Exit demo** clears it.
- [ ] **Get help now**: answer all the questions. You get an action plan in under 10 minutes.
- [ ] On the help flow, choose **The person shown is under 18**. It jumps straight to the child-safety page.
- [ ] **Save as my case**, then open **My case**. Each platform you picked has a card.
- [ ] Tap **I reported it just now** on one card. A 2-hour countdown starts.
- [ ] Load the demo case. The Telegram card shows **Deadline missed: escalate** in amber.
- [ ] **Drafts**: switch between the 4 templates and between EN and हिं. **Copy text** works. **Download PDF** saves a PDF (English). In Hindi it opens the print screen, where you choose Save as PDF.
- [ ] Tap **हिन्दी** at the top. The page switches to Hindi.
- [ ] Tap **Leave now**. It jumps to a weather search. Press **Back**: it must not return to Reclaim.
- [ ] On a laptop, press **Esc** on any page. It leaves the site the same way.
- [ ] Footer, **Delete everything**, confirm. The page reloads clean.
- [ ] Footer, **Privacy settings**: turn on **Neutral tab title**. The tab now says "Notes".

**Optional checks on a laptop**

- Lighthouse: in Chrome, right-click the page, **Inspect**, open the **Lighthouse** tab, choose **Mobile**, and click **Analyze page load**. All four scores should be 90 or more. (My tests scored 91 to 98 on every page.)
- Security headers: open **securityheaders.com**, paste your address, and scan. It should show an A grade.

## Part 5. Making changes later

You never edit code. When you want a change:

1. Tell me in this chat what to change.
2. I change it, run the tests, and push to GitHub.
3. Vercel sees the push and redeploys on its own in about 2 minutes.

Most content (platform steps, laws, helplines, scores) lives in plain files in the `content` folder, so updates are quick and safe.

## Part 6. Share it

**On your portfolio website:** add a project card with the live link, the GitHub link and one screenshot. The screenshots are in the repo under `docs/screenshots`. Suggested one-line description:

> Reclaim: a free, privacy-first web app that turns panic into a reporting plan for NCII victims in India, with a public scorecard of 8 platforms.

**On LinkedIn:** a draft post you can edit.

> I built Reclaim, a free web app for people in India whose intimate, morphed or AI-made images are shared without consent.
>
> I saw this up close when a friend's photo was morphed and posted online. The hardest part was not knowing where to go. Every platform has a different form, and almost nobody knows that since February 2026 platforms must remove such content within 2 hours of a complaint.
>
> Reclaim asks a few simple questions and builds a step-by-step plan. It drafts complaints for the cybercrime portal and Grievance Officers in English and Hindi, and runs a live countdown against the 2-hour deadline. It also scores 8 platforms on public, checkable criteria, and every point links to its source.
>
> It never asks for any image and stores nothing on a server. Everything stays on your own phone, and one tap deletes it.
>
> It is a prototype with fictional demo data and not legal advice. I would love feedback, especially from lawyers and people working with survivors.
>
> Live: [your vercel link]
> Code: github.com/kenil11shah/reclaim

## Troubleshooting

| What you see | What to do |
| --- | --- |
| GitHub says the name `reclaim` already exists | You may have made it before. Open it; if it is empty, tell me and I push. If not, name it `reclaim-ncii` and tell me the new name. |
| Vercel can't see the repo | **Adjust GitHub App Permissions**, add the repo, save, then refresh the import page. |
| Vercel build fails | Open the failed deployment, click **Build Logs**, scroll to the first red line, and send me a screenshot. |
| Actions shows a red cross | Click the run, then the red step, and send me a screenshot. |
| The site shows an old version | Wait 2 minutes after my push, then refresh. On a phone, close and reopen the tab. |
| Project name taken on Vercel | Use `reclaim-ncii` or `reclaim-india`. Nothing else changes. |
| Hindi PDF looks wrong | Hindi uses the browser's print dialog on purpose, because PDF libraries break Hindi letters. Choose **Save as PDF** as the printer. |

## Before any real public launch

The prototype is safe to show on LinkedIn and your portfolio as a prototype. Before promoting it to real victims:

1. Re-check every source and helpline. The build warns when anything is more than 90 days old, and a weekly GitHub job checks every link.
2. Fill the gaps marked "Not assessed" in the scorecard, starting with Reddit's India Grievance Officer route.
3. Get a review from a cyber-law expert and an NGO that works with survivors.
4. Have a fluent speaker review the Hindi text, then remove the "Translation under review" label.
5. Check that the name "Reclaim" and your chosen domain are free to use.
