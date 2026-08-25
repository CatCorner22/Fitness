import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5">
      <h1 className="display text-4xl">Not here</h1>
      <p className="mt-3 text-muted">That page is missing, or it belongs to the other login.</p>
      <Link href="/" className="btn-primary mt-8">
        Back to Today
      </Link>
    </div>
  );
}
