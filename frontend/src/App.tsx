import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Login } from "./features/auth/components/Login";
import { AppLayout } from "./layout/AppLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { useAuthStore } from "./store/useAuthStore";

function HomeRedirect() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return <Navigate to={accessToken ? "/app" : "/login"} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />} />
        </Route>
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
