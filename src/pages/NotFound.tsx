import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <main className="p-6 text-center">
      <h1 className="text-2xl">Page not found</h1>
      <Link className="underline" to="/">
        Return to Home
      </Link>
    </main>
  );
}
