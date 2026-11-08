import { Link } from "react-router-dom";
import { Lotus } from "./Icons";

export default function PageShell({ title, lead, children }) {
  return (
    <div className="page-shell">
      <header className="page-topbar">
        <Link className="night-brand" to="/">
          <Lotus size={36} />
          <span>SakhiSahay</span>
        </Link>
        <Link to="/dashboard">← Back to Dashboard</Link>
      </header>
      <main className="page-content">
        <h1>{title}</h1>
        {lead && <p className="page-lead">{lead}</p>}
        {children}
      </main>
    </div>
  );
}

export function Feedback({ error, message }) {
  if (error)
    return (
      <p className="feedback" role="alert">
        {error}
      </p>
    );
  return message ? (
    <p className="feedback success" role="status">
      {message}
    </p>
  ) : null;
}

export function Pagination({ page, pages, setPage }) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button disabled={page >= pages} onClick={() => setPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
