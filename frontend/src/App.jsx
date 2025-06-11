import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Volunteer from "./pages/Volunteer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/volunteer" element={<Volunteer />} />
        <Route path="/dashboard" element={<div>Dashboard Placeholder</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;