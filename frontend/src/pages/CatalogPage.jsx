import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

export default function CatalogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadItems() {
      try {
        setLoading(true);
        setError("");

        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${baseUrl}/items`);

        if (!res.ok) {
          setError("Failed to load items.");
          setItems([]);
          return;
        }

        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setError("Failed to load items.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, []);

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
        {/* Header / Hero */}
        <header style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 30, letterSpacing: -0.6, color: ui.text }}>
            Equipment Rental
          </h1>
          <p style={{ marginTop: 8, color: ui.muted }}>
            Rent gear by the day. See availability instantly.
          </p>
        </header>

        {/* Toolbar (search + sort goes here next) */}
        <section style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              placeholder="Search items..."
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 14,
                border: `1px solid ${ui.border}`,
                background: ui.cardBg,
                outline: "none",
                fontSize: 14,
                color: ui.text,
              }}
              onChange={() => {}}
            />

            <select
              style={{
                padding: 10,
                borderRadius: 14,
                border: `1px solid ${ui.border}`,
                background: ui.cardBg,
                outline: "none",
                fontSize: 14,
                color: ui.text,
                cursor: "pointer",
              }}
              onChange={() => {}}
            >
              <option>Sort</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </section>

        {/* Grid container */}
        <main>
        {loading && <p style={{ color: ui.muted }}>Loading items...</p>}
        {!loading && error && <p style={{ color: "#b91c1c" }}>{error}</p>}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 16,
              width: "100%",
            }}
          >
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                style={{
                  textDecoration: "none",
                  color: ui.text,
                  border: `1px solid ${ui.border}`,
                  borderRadius: ui.radius,
                  overflow: "hidden",
                  background: `linear-gradient(180deg, ${ui.cardBg}, ${ui.cardAltBg})`,
                  boxShadow: ui.shadow,
                  display: "block",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05), 0 15px 40px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = ui.shadow;
                }}
              >
                {/* Image */}
                <div
                  style={{
                    height: 170,
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

                {/* Content */}
                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "baseline",
                      marginBottom: 8,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 16, color: ui.text }}>{item.name}</h3>

                    <span style={{ fontWeight: 700, fontSize: 16, color: ui.text }}>
                      ${item.daily_price}/day
                    </span>
                  </div>

                  {item.category && (
                    <div style={{ marginBottom: 8 }}>
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
                    </div>
                  )}

                  <p style={{ marginTop: 8, marginBottom: 0, color: ui.muted, lineHeight: 1.5 }}>
                    {(item.description ?? "").slice(0, 80)}
                    {(item.description ?? "").length > 80 ? "..." : ""}
                  </p>

                  <div style={{ marginTop: 12 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "10px 16px",
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#065f46",
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        transition: "all 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(16,185,129,0.15)";
                        e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(16,185,129,0.1)";
                        e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      View details
                      <span style={{ fontSize: 12, marginLeft: 2 }}>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
