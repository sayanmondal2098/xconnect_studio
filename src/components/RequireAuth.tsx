import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../lib/api";

/**
 * Tiny gatekeeper. If the token is missing, we redirect to /login.
 * Backend will still enforce auth, so don’t get creative.
 */
export default function RequireAuth(props: { children: React.ReactNode }) {
  const token = getToken();
  const loc = useLocation();

  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  return <>{props.children}</>;
}
