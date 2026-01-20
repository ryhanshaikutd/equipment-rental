import { useEffect, useState } from "react";

function App() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    async function loadItems() {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/items`);

        if (!response.ok) {
          setStatus(`Error: HTTP ${response.status}`);
          return;
        }

        const data = await response.json();
        setItems(data);
        setStatus(`Loaded ${data.length} items`);
      } catch (error) {
        setStatus(`Request failed: ${error.message}`);
      }
    }

    loadItems();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Equipment Rental</h1>
      <p>API base URL: {import.meta.env.VITE_API_BASE_URL}</p>
      <p>{status}</p>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name} — ${item.daily_price} per day
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;