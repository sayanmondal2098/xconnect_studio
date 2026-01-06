import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Workflows from "./pages/Workflows";
import Studio from "./pages/Studio";
import Connections from "./pages/Connections";
import Settings from "./pages/Settings";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/workflows" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/workflows"
        element={
          <RequireAuth>
            <Workflows />
          </RequireAuth>
        }
      />

      <Route
        path="/studio"
        element={
          <RequireAuth>
            <Studio />
          </RequireAuth>
        }
      />

      <Route
        path="/connections"
        element={
          <RequireAuth>
            <Connections />
          </RequireAuth>
        }
      />

      <Route
        path="/settings"
        element={
          <RequireAuth>
            <Settings />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/workflows" replace />} />
    </Routes>
  );
}
