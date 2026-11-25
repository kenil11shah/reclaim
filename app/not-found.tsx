import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-start justify-center px-4 py-24">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">This page does not exist. You can start from the home page.</p>
      <Link href="/" replace className="mt-6 rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand">Go home</Link>
    </main>
  );
}
