import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container stack-lg">
        <h1 className="display display-md">Page not found</h1>
        <p className="muted">The requested page does not exist.</p>
        <div>
          <Link href="/" className="btn btn-primary">
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
