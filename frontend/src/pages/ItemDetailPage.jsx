import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DayPicker } from "react-day-picker";

const ui = {
  pageBg: "#f3f4f6",
  cardBg: "#ffffff",
  cardAltBg: "#f9fafb",
  text: "#111827",
  muted: "#6b7280",
  border: "rgba(17, 24, 39, 0.12)",
  shadow: "0 1px 2px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)",
  radius: 18,
};

function formatDateMMDDYYYY(dateOrString) {
  
  if (dateOrString instanceof Date) {
    const month = String(dateOrString.getMonth() + 1).padStart(2, "0");
    const day = String(dateOrString.getDate()).padStart(2, "0");
    const year = dateOrString.getFullYear();
    return `${month}/${day}/${year}`;
  }

  const [y, m, d] = String(dateOrString).split("-").map(Number);
  const local = new Date(y, m - 1, d);

  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  const year = local.getFullYear();
  return `${month}/${day}/${year}`;
}

function expandBookedRangesToDates(bookedRanges) {
  const disabled = [];

  for (const r of bookedRanges) {
    const start = new Date(r.start_date);
    const end = new Date(r.end_date);

    // normalize to midnight
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      disabled.push(new Date(d));
    }
  }

  return disabled;
}

function daysInclusive(from, to) {
  const start = new Date(from);
  const end = new Date(to);

  // normalize to local midnight
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((end - start) / msPerDay);

  return diffDays + 1; // inclusive
}

function toYyyyMmDd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ItemDetailPage() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookedRanges, setBookedRanges] = useState([]);
  const [range, setRange] = useState();

  const [renterName, setRenterName] = useState("");
  const [renterEmail, setRenterEmail] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  const disabledDays = expandBookedRangesToDates(bookedRanges);

  const hasFullRange = !!range?.from && !!range?.to;

const selectedDays = hasFullRange
  ? daysInclusive(range.from, range.to)
  : 0;

const totalPreview =
  hasFullRange && item
    ? selectedDays * Number(item.daily_price)
    : 0;
    
    async function refreshBookedRanges() {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/items/${id}/booked-ranges`);
    
      if (res.ok) {
        const data = await res.json();
        setBookedRanges(data);
      } else {
        setBookedRanges([]);
      }
    }

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        setError("");

        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        const res = await fetch(`${baseUrl}/items/${id}`);
        if (res.status === 404) {
          setError("Item not found.");
          setItem(null);
          return;
        }

        if (!res.ok) {
          setError("Failed to load item.");
          setItem(null);
          return;
        }

        const data = await res.json();
        setItem(data);

        await refreshBookedRanges();

      } catch {
        setError("Failed to load item.");
        setItem(null);
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [id]);

  async function handleBook() {
    setBookingError("");
    setBookingSuccess(null);
  
    if (!item) {
      setBookingError("Item not loaded.");
      return;
    }
  
    if (!range?.from || !range?.to) {
      setBookingError("Please select a start and end date.");
      return;
    }
  
    if (!renterName.trim() || !renterEmail.trim()) {
      setBookingError("Please enter your name and email.");
      return;
    }
  
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
    try {
      setIsBooking(true);
  
      const res = await fetch(`${baseUrl}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item.id,
          start_date: toYyyyMmDd(range.from),
          end_date: toYyyyMmDd(range.to),
          renter_name: renterName.trim(),
          renter_email: renterEmail.trim(),
        }),
      });
  
      if (res.status === 409) {
        const data = await res.json();
        setBookingError(data?.message ?? "Those dates are already booked.");
        return;
      }
  
      if (!res.ok) {
        setBookingError(`Booking failed (${res.status}).`);
        return;
      }
  
      const data = await res.json();
      setBookingSuccess(Array.isArray(data) ? data[0] : data);
      await refreshBookedRanges();
    } catch {
      setBookingError("Booking failed. Try again.");
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        padding: 48,
        boxSizing: "border-box",
        background: ui.pageBg,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: 18 }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: ui.muted,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 16 }}>←</span>
            Back to catalog
          </Link>

          <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 30, letterSpacing: -0.6, color: ui.text }}>
              {item?.name ?? "Item Detail"}
            </h1>
            {item?.category && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(59,130,246,0.25)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#1d4ed8",
                  background: "rgba(59,130,246,0.10)",
                  textTransform: "capitalize",
                }}
              >
                {item.category}
              </span>
            )}
          </div>

          {item?.description && (
            <p style={{ marginTop: 10, marginBottom: 0, color: ui.muted, maxWidth: 760 }}>
              {item.description}
            </p>
          )}
        </header>

        <div
          style={{
            height: 1,
            width: "100%",
            background: "linear-gradient(to right, transparent, rgba(0,0,0,0.12), transparent)",
            margin: "18px 0 22px",
          }}
        />

        {loading && <p style={{ color: ui.muted }}>Loading...</p>}
        {!loading && error && <p style={{ color: "#b91c1c" }}>{error}</p>}

        {!loading && !error && item && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 18,
              alignItems: "start",
            }}
          >
            {/* Left Column: Image and Info */}
            <div>
              <div
                style={{
                  border: `1px solid ${ui.border}`,
                  borderRadius: ui.radius,
                  overflow: "hidden",
                  background: `linear-gradient(180deg, ${ui.cardBg}, ${ui.cardAltBg})`,
                  boxShadow: ui.shadow,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    height: 400,
                    background: "linear-gradient(135deg, #e5e7eb, #f3f4f6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.image_path ? (
                    <img
                      src={item.image_path}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ color: ui.muted }}>No image</span>
                  )}
                </div>

                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <h2 style={{ margin: 0, fontSize: 18, color: ui.text }}>Pricing</h2>
                    <span style={{ fontSize: 18, fontWeight: 700, color: ui.text }}>
                      ${item.daily_price}/day
                    </span>
                  </div>
                </div>
              </div>

              {/* Booked Ranges Card */}
              <div
                style={{
                  border: `1px solid ${ui.border}`,
                  borderRadius: ui.radius,
                  background: ui.cardBg,
                  boxShadow: ui.shadow,
                  padding: 16,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, color: ui.text, marginBottom: 12 }}>
                  Booked Ranges
                </h3>
                {bookedRanges.length === 0 ? (
                  <p style={{ margin: 0, color: ui.muted }}>None yet.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, color: ui.muted }}>
                    {bookedRanges.map((r, idx) => (
                      <li key={idx} style={{ marginBottom: 6 }}>
                        {formatDateMMDDYYYY(r.start_date)} to {formatDateMMDDYYYY(r.end_date)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right Column: Calendar and Booking */}
            <div>
              <div
                style={{
                  border: `1px solid ${ui.border}`,
                  borderRadius: ui.radius,
                  background: ui.cardBg,
                  boxShadow: ui.shadow,
                  padding: 16,
                  marginBottom: 18,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, color: ui.text, marginBottom: 8 }}>
                  Availability
                </h3>
                <p style={{ marginTop: 0, marginBottom: 14, color: ui.muted, fontSize: 14 }}>
                  Booked dates are disabled. Choose your rental dates.
                </p>

                <div
                  style={{
                    border: `1px solid ${ui.border}`,
                    borderRadius: 14,
                    padding: 10,
                    background: `linear-gradient(180deg, ${ui.cardBg}, ${ui.cardAltBg})`,
                  }}
                >
                  <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    disabled={disabledDays}
                    excludeDisabled={true}
                  />
                </div>

                {range?.from && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 14,
                      border: `1px solid ${ui.border}`,
                      background: `linear-gradient(180deg, ${ui.cardBg}, ${ui.cardAltBg})`,
                      color: ui.text,
                      fontSize: 14,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Selected dates</div>
                    <div style={{ color: ui.muted }}>
                      {formatDateMMDDYYYY(range.from)}
                      {range?.to ? ` to ${formatDateMMDDYYYY(range.to)}` : ""}
                    </div>
                  </div>
                )}

                {hasFullRange && item && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 14,
                      border: `1px solid ${ui.border}`,
                      background: `linear-gradient(180deg, ${ui.cardBg}, ${ui.cardAltBg})`,
                      color: ui.text,
                      fontSize: 14,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Price Preview</div>
                    <div style={{ color: ui.muted }}>
                      {selectedDays} day(s) × ${Number(item.daily_price)} = ${totalPreview.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Form Card */}
              <div
                style={{
                  border: `1px solid ${ui.border}`,
                  borderRadius: ui.radius,
                  background: ui.cardBg,
                  boxShadow: ui.shadow,
                  padding: 16,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, color: ui.text, marginBottom: 12 }}>
                  Book this item
                </h3>

                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ display: "block" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: ui.text, marginBottom: 6 }}>
                      Name
                    </div>
                    <input
                      value={renterName}
                      onChange={(e) => setRenterName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: `1px solid ${ui.border}`,
                        background: ui.cardBg,
                        outline: "none",
                        fontSize: 14,
                        color: ui.text,
                        boxSizing: "border-box",
                      }}
                    />
                  </label>

                  <label style={{ display: "block" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: ui.text, marginBottom: 6 }}>
                      Email
                    </div>
                    <input
                      value={renterEmail}
                      onChange={(e) => setRenterEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: `1px solid ${ui.border}`,
                        background: ui.cardBg,
                        outline: "none",
                        fontSize: 14,
                        color: ui.text,
                        boxSizing: "border-box",
                      }}
                    />
                  </label>

                  <button
                    onClick={handleBook}
                    disabled={!hasFullRange || isBooking}
                    style={{
                      border: "none",
                      padding: "12px 16px",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#065f46",
                      background: !hasFullRange || isBooking
                        ? "rgba(16,185,129,0.05)"
                        : "rgba(16,185,129,0.1)",
                      border: `1px solid ${!hasFullRange || isBooking ? ui.border : "rgba(16,185,129,0.2)"}`,
                      cursor: !hasFullRange || isBooking ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      marginTop: 4,
                    }}
                    onMouseEnter={(e) => {
                      if (!(!hasFullRange || isBooking)) {
                        e.currentTarget.style.background = "rgba(16,185,129,0.15)";
                        e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!(!hasFullRange || isBooking)) {
                        e.currentTarget.style.background = "rgba(16,185,129,0.1)";
                        e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {isBooking ? "Booking..." : "Book now"}
                  </button>

                  {bookingError && (
                    <p style={{ margin: 0, color: "#b91c1c", fontSize: 14 }}>{bookingError}</p>
                  )}

                  {bookingSuccess && (
                    <div
                      style={{
                        border: `1px solid ${ui.border}`,
                        padding: 12,
                        borderRadius: 14,
                        background: `linear-gradient(180deg, ${ui.cardBg}, ${ui.cardAltBg})`,
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 700, color: ui.text, marginBottom: 8 }}>
                        Booked!
                      </p>
                      <p style={{ margin: "4px 0", color: ui.muted, fontSize: 14 }}>
                        {formatDateMMDDYYYY(bookingSuccess.start_date)} to{" "}
                        {formatDateMMDDYYYY(bookingSuccess.end_date)}
                      </p>
                      <p style={{ margin: "4px 0", color: ui.text, fontSize: 14, fontWeight: 600 }}>
                        Total: ${bookingSuccess.total_price}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
