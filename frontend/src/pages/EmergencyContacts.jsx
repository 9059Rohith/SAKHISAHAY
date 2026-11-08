import { AnimatedHeading } from "../components/Motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/EmergencyContacts.css";
import { api, errorText } from "../lib/api";
import { Pagination } from "../components/PageShell";

const RELATIONSHIPS = ["Family", "Friend", "Guardian", "Other"];

const EMPTY_FORM = { name: "", phone: "", relationship: "" };

/* ---------- Inline SVG icons ---------- */

function LogoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 2.5 4.5 5.4v5.7c0 4.6 3.1 8.7 7.5 10.4 4.4-1.7 7.5-5.8 7.5-10.4V5.4L12 2.5Z"
        fill="currentColor"
      />
      <path
        d="M12 15.6s-3.2-2-3.2-4.2a1.8 1.8 0 0 1 3.2-1.1 1.8 1.8 0 0 1 3.2 1.1c0 2.2-3.2 4.2-3.2 4.2Z"
        fill="#fff"
      />
    </svg>
  );
}

function RelationshipIcon({ type }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 26,
    height: 26,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
  };

  switch (type) {
    case "Family":
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v9.5h13V10" />
          <path d="M10 19.5v-5h4v5" />
        </svg>
      );
    case "Friend":
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        </svg>
      );
    case "Guardian":
      return (
        <svg {...common}>
          <path d="M12 3 5 5.8v5.4c0 4.3 2.9 8.1 7 9.8 4.1-1.7 7-5.5 7-9.8V5.8L12 3Z" />
          <path d="m9 12 2.2 2.2L15.2 10" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
        </svg>
      );
  }
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

/* ---------- Page component ---------- */

function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const nameInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 0 });
  const loadContacts = async () => {
    const data = await api.get(
      `/contacts?page=${page}&page_size=20&q=${encodeURIComponent(query)}`,
    );
    setContacts(data.items);
    setMeta(data);
  };
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setNetworkError("");
    api
      .get(
        `/contacts?page=${page}&page_size=20&q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      )
      .then((data) => {
        setContacts(data.items);
        setMeta(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setNetworkError(errorText(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, query]);

  const isEditing = editingId !== null;

  /* ----- Form handlers ----- */

  const handleChange = (event) => {
    const { name, value } = event.target;

    // Phone: keep digits only, maximum 10
    const cleanedValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setFormData((prev) => ({ ...prev, [name]: cleanedValue }));

    // Clear the error of the field being edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const name = formData.name.trim();
    const phone = formData.phone.trim();

    if (!name) {
      newErrors.name = "Please enter the contact's full name.";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters long.";
    }

    if (!phone) {
      newErrors.phone = "Please enter a phone number.";
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = "Phone number must contain exactly 10 digits.";
    } else if (!/^[6-9]/.test(phone)) {
      newErrors.phone = "Indian mobile numbers start with 6, 7, 8 or 9.";
    } else if (contacts.some((c) => c.phone === phone && c.id !== editingId)) {
      newErrors.phone =
        "This phone number is already saved as an emergency contact.";
    }

    if (!formData.relationship) {
      newErrors.relationship = "Please choose a relationship.";
    }

    return newErrors;
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const cleanContact = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      relationship: formData.relationship,
    };

    if (busy) return;
    setBusy(true);
    setNetworkError("");
    try {
      if (isEditing) await api.patch(`/contacts/${editingId}`, cleanContact);
      else await api.post("/contacts", cleanContact);
      await loadContacts();
      setStatusMessage(
        `${cleanContact.name} was ${isEditing ? "updated" : "added to your emergency contacts"}.`,
      );
      resetForm();
    } catch (e) {
      setNetworkError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  /* ----- Edit / delete handlers ----- */

  const handleEdit = (contact) => {
    setEditingId(contact.id);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
    });
    setErrors({});
    setConfirmDeleteId(null);
    setStatusMessage("");

    if (nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleConfirmDelete = async (contact) => {
    setBusy(true);
    setNetworkError("");
    try {
      await api.delete(`/contacts/${contact.id}`);
      setConfirmDeleteId(null);
      setStatusMessage(`${contact.name} was removed.`);
      if (editingId === contact.id) resetForm();
      await loadContacts();
      if (contacts.length === 1 && page > 1) setPage(page - 1);
    } catch (e) {
      setNetworkError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  /* ----- Render ----- */

  return (
    <div className="ec-page">
      <header className="ec-topbar">
        <div className="ec-brand">
          <span className="ec-brand-icon">
            <LogoIcon />
          </span>
          <span className="ec-brand-name">SAKHISAHAY</span>
        </div>

        <Link to="/dashboard" className="ec-back-link">
          <BackIcon />
          <span>Back to Dashboard</span>
        </Link>
      </header>

      <main className="ec-main">
        <section className="ec-hero">
          <AnimatedHeading as="h1" className="ec-title">
            Emergency Contacts
          </AnimatedHeading>
          <p className="ec-subtitle">
            Add the trusted people who should be alerted when you need help.
            Keep their details up to date so support is always one step away.
          </p>
          <p className="ec-notice" role="note">
            <InfoIcon />
            <span>
              Contacts are saved securely in your account. SOS lets you call or
              open an SMS to these people; you confirm sending on your device.
            </span>
          </p>
        </section>

        {networkError && (
          <p className="feedback" role="alert">
            {networkError}{" "}
            <button
              onClick={() => {
                setLoading(true);
                loadContacts()
                  .then(() => setNetworkError(""))
                  .catch((e) => setNetworkError(errorText(e)))
                  .finally(() => setLoading(false));
              }}
            >
              Try again
            </button>
          </p>
        )}
        <div className="ec-layout">
          {/* ----- Add / edit form ----- */}
          <section
            className="ec-card ec-form-card"
            aria-labelledby="ec-form-heading"
          >
            <h2 id="ec-form-heading" className="ec-card-title">
              {isEditing ? "Edit contact" : "Add a contact"}
            </h2>

            <form onSubmit={handleSubmit} noValidate>
              <div className="ec-field">
                <label htmlFor="ec-name">Full name</label>
                <input
                  ref={nameInputRef}
                  id="ec-name"
                  name="name"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Anjali Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "ec-name-error" : undefined}
                  className={
                    errors.name ? "ec-input ec-input-error" : "ec-input"
                  }
                />
                {errors.name && (
                  <p id="ec-name-error" className="ec-error" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="ec-field">
                <label htmlFor="ec-phone">Phone number</label>
                <input
                  id="ec-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={
                    errors.phone ? "ec-phone-error" : "ec-phone-hint"
                  }
                  className={
                    errors.phone ? "ec-input ec-input-error" : "ec-input"
                  }
                />
                {errors.phone ? (
                  <p id="ec-phone-error" className="ec-error" role="alert">
                    {errors.phone}
                  </p>
                ) : (
                  <p id="ec-phone-hint" className="ec-hint">
                    Enter 10 digits without +91 or spaces.
                  </p>
                )}
              </div>

              <div className="ec-field">
                <label htmlFor="ec-relationship">Relationship</label>
                <select
                  id="ec-relationship"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.relationship)}
                  aria-describedby={
                    errors.relationship ? "ec-relationship-error" : undefined
                  }
                  className={
                    errors.relationship ? "ec-input ec-input-error" : "ec-input"
                  }
                >
                  <option value="">Select relationship</option>
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
                {errors.relationship && (
                  <p
                    id="ec-relationship-error"
                    className="ec-error"
                    role="alert"
                  >
                    {errors.relationship}
                  </p>
                )}
              </div>

              <div className="ec-form-actions">
                <button
                  type="submit"
                  disabled={busy}
                  className="ec-btn ec-btn-primary"
                >
                  {isEditing ? "Save changes" : "Add Contact"}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    className="ec-btn ec-btn-ghost"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* ----- Contact list ----- */}
          <section
            className="ec-list-section"
            aria-labelledby="ec-list-heading"
          >
            <div className="ec-list-header">
              <h2 id="ec-list-heading" className="ec-card-title">
                Your contacts
              </h2>
              <span className="ec-count">
                {meta.total} {meta.total === 1 ? "contact" : "contacts"}
              </span>
            </div>

            <p className="ec-sr-only" role="status" aria-live="polite">
              {statusMessage}
            </p>
            {statusMessage && (
              <p className="ec-status" aria-hidden="true">
                {statusMessage}
              </p>
            )}

            <label className="night-form" style={{ margin: "16px 0" }}>
              Search contacts
              <input
                className="filter-input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Name or phone"
              />
            </label>
            {loading && <p role="status">Loading your contacts…</p>}
            {!loading && contacts.length === 0 ? (
              <div className="ec-empty">
                <div className="ec-empty-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="40"
                    height="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="8.5" r="3.2" />
                    <path d="M3 19c.7-3.2 3.1-4.8 6-4.8s5.3 1.6 6 4.8" />
                    <path d="M18 8v6M15 11h6" />
                  </svg>
                </div>
                <h3>No emergency contacts yet</h3>
                <p>
                  Add someone you trust using the form. They will appear here,
                  ready to be reached in an emergency.
                </p>
              </div>
            ) : (
              <ul className="ec-contact-list">
                {contacts.map((contact) => (
                  <li
                    key={contact.id}
                    className={
                      contact.id === editingId
                        ? "ec-contact ec-contact-editing"
                        : "ec-contact"
                    }
                  >
                    <div className="ec-contact-main">
                      <span
                        className={`ec-avatar ec-avatar-${contact.relationship.toLowerCase()}`}
                      >
                        <RelationshipIcon type={contact.relationship} />
                      </span>

                      <div className="ec-contact-info">
                        <h3 className="ec-contact-name">{contact.name}</h3>
                        <p className="ec-contact-phone">
                          <PhoneIcon />
                          <span>+91 {contact.phone}</span>
                        </p>
                        <span className="ec-tag">{contact.relationship}</span>
                      </div>
                    </div>

                    {confirmDeleteId === contact.id ? (
                      <div
                        className="ec-confirm"
                        role="alertdialog"
                        aria-label={`Confirm deleting ${contact.name}`}
                      >
                        <p>Delete {contact.name}? This cannot be undone.</p>
                        <div className="ec-contact-actions">
                          <button
                            type="button"
                            className="ec-btn ec-btn-danger"
                            disabled={busy}
                            onClick={() => handleConfirmDelete(contact)}
                          >
                            Yes, delete
                          </button>
                          <button
                            type="button"
                            className="ec-btn ec-btn-ghost"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Keep contact
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="ec-contact-actions">
                        <button
                          type="button"
                          className="ec-btn ec-btn-outline"
                          onClick={() => handleEdit(contact)}
                          aria-label={`Edit ${contact.name}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ec-btn ec-btn-delete"
                          onClick={() => setConfirmDeleteId(contact.id)}
                          aria-label={`Delete ${contact.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Pagination page={page} pages={meta.pages} setPage={setPage} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default EmergencyContacts;
