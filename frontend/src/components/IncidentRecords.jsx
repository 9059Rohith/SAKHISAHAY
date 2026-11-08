import { useCallback, useEffect, useState } from "react";
import { api, errorText } from "../lib/api";
import { Feedback, Pagination } from "./PageShell";

const empty = () => ({
  title: "",
  category: "other",
  description: "",
  incident_at: "",
  location: "",
});
const categories = {
  online: "Online harassment",
  stalking: "Stalking or following",
  verbal: "Verbal harassment",
  physical: "Physical harassment",
  workplace: "Workplace harassment",
  other: "Other",
};
const localDate = (value) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export default function IncidentRecords() {
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [records, setRecords] = useState({ items: [], pages: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const load = useCallback(async () => {
    const r = await api.get(
      `/reports?page=${page}&page_size=10&q=${encodeURIComponent(query)}${status ? `&status=${status}` : ""}`,
    );
    setRecords(r);
  }, [page, query, status]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .get(
        `/reports?page=${page}&page_size=10&q=${encodeURIComponent(query)}${status ? `&status=${status}` : ""}`,
      )
      .then((r) => {
        if (active) setRecords(r);
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, query, status]);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const body = {
        ...form,
        incident_at: new Date(form.incident_at).toISOString(),
      };
      if (editing)
        await api.patch(`/reports/${editing.id}`, {
          ...body,
          status: editing.status,
          version: editing.version,
        });
      else await api.post("/reports", body);
      setForm(empty());
      setEditing(null);
      setMessage("Your private incident record has been saved.");
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const edit = (record) => {
    setEditing(record);
    setForm({
      title: record.title,
      category: record.category,
      description: record.description,
      incident_at: localDate(record.incident_at),
      location: record.location,
    });
    document.getElementById("incident-title")?.focus();
  };
  const download = (record) => {
    const data = {
      title: record.title,
      category: record.category,
      incident_at: record.incident_at,
      location: record.location,
      description: record.description,
      status: record.status,
      saved_at: record.created_at,
      notice: "Private personal record. Not an official police complaint.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident-${record.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section
      aria-labelledby="private-records-title"
      style={{ margin: "35px 0" }}
    >
      <h2 id="private-records-title" style={{ marginBottom: 12 }}>
        Your private incident records
      </h2>
      <p className="small-note" style={{ marginBottom: 20 }}>
        Write down what happened at your own pace. Records are saved in your
        account. Saving here does not submit a complaint to police or notify
        another person. Avoid including information you do not want stored.
      </p>
      <Feedback error={error} message={message} />
      <div className="two-columns">
        <section className="glass-panel">
          <h3>{editing ? "Edit incident" : "Record an incident"}</h3>
          <form className="night-form" onSubmit={submit}>
            <label>
              Incident title
              <input
                id="incident-title"
                name="title"
                minLength={3}
                maxLength={160}
                required
                value={form.title}
                onChange={update}
              />
            </label>
            <label>
              Category
              <select name="category" value={form.category} onChange={update}>
                {Object.entries(categories).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date and time
              <input
                name="incident_at"
                type="datetime-local"
                required
                value={form.incident_at}
                onChange={update}
              />
            </label>
            <label>
              Location (optional)
              <input
                name="location"
                maxLength={300}
                value={form.location}
                onChange={update}
              />
            </label>
            <label>
              What happened?
              <textarea
                name="description"
                required
                minLength={10}
                maxLength={10000}
                value={form.description}
                onChange={update}
              />
            </label>
            {editing && (
              <label>
                Record status
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="recorded">Recorded</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
            )}
            <div className="action-row">
              <button className="night-button" disabled={busy}>
                {busy
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Save private record"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="night-button secondary"
                  onClick={() => {
                    setEditing(null);
                    setForm(empty());
                  }}
                >
                  Cancel editing
                </button>
              )}
            </div>
          </form>
        </section>
        <section className="glass-panel">
          <h3>Saved records ({records.total})</h3>
          <div className="night-form">
            <label>
              Search records
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Title or description"
              />
            </label>
            <label>
              Filter status
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All records</option>
                <option value="draft">Draft</option>
                <option value="recorded">Recorded</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>
          {loading ? (
            <p role="status">Loading your records…</p>
          ) : records.items.length ? (
            <div className="record-list">
              {records.items.map((record) => (
                <article className="record-item" key={record.id}>
                  <h3>{record.title}</h3>
                  <small>
                    {new Date(record.incident_at).toLocaleString()} ·{" "}
                    {categories[record.category]} · {record.status}
                  </small>
                  <p style={{ marginTop: 10 }}>{record.description}</p>
                  {record.location && (
                    <p className="small-note">{record.location}</p>
                  )}
                  {deleting === record.id ? (
                    <div className="feedback">
                      <p>Permanently delete this private record?</p>
                      <div className="action-row">
                        <button
                          className="night-button danger"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await api.delete(`/reports/${record.id}`);
                              setDeleting(null);
                              setMessage("Record deleted");
                              await load();
                              if (records.items.length === 1 && page > 1)
                                setPage(page - 1);
                            } catch (e) {
                              setError(errorText(e));
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Confirm delete
                        </button>
                        <button
                          className="night-button secondary"
                          onClick={() => setDeleting(null)}
                        >
                          Keep record
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="action-row">
                      <button
                        className="night-button secondary"
                        onClick={() => edit(record)}
                      >
                        Edit
                      </button>
                      <button
                        className="night-button secondary"
                        onClick={() => download(record)}
                      >
                        Download record
                      </button>
                      <button
                        className="night-button secondary"
                        onClick={() => setDeleting(record.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p style={{ marginTop: 20 }}>
              No incident records found. Your saved records will appear here.
            </p>
          )}
          <Pagination page={page} pages={records.pages} setPage={setPage} />
        </section>
      </div>
    </section>
  );
}
