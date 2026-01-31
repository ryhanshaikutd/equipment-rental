import { BrowserRouter, Routes, Route } from "react-router-dom";
import CatalogPage from "./pages/CatalogPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import { Link } from "react-router-dom";
import UploadTestPage from "./pages/UploadTestPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/upload-test" element={<UploadTestPage />} />
      </Routes>
    </BrowserRouter>
  );
}