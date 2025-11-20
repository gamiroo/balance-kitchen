This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Theme Toggle QA Checklist

Use the following steps to verify the new light/dark toggle behaves as expected:

1. **Desktop header:** the sun/moon toggle appears to the left of the "Enquire now" CTA, reports `role="switch"` with `aria-checked="false"` in light mode, and flips both the icon and `aria-checked` value after each click.
2. **Mobile menu:** opening the hamburger menu reveals a "Theme" row above the CTA that exposes the same switch semantics and updates the site theme without closing the drawer.
3. **Footer:** the toggle mirrors the current state so QA can confirm theme persistence by toggling in the footer, reloading, and seeing the choice restored (we store the value under `localStorage['bk-theme-preference']`).
4. **Visual assets:** the header and modal logos automatically receive an inverted filter in dark mode, so the SVGs stay legible on both backgrounds.
5. **Regression:** run `npm test` to execute the new ThemeToggle unit tests that verify ARIA attributes and document-level `data-theme` updates.
