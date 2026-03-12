import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { JSX } from "react";

export const AdminGuard = ({ children }: { children: JSX.Element }) => {
    const role = Cookies.get("role");
    const adminAuthenticated = localStorage.getItem("adminAuthenticated") === "true";

    if (role !== "Super Admin" || !adminAuthenticated) {
        return <Navigate to="/auth?admin=1" replace />;
    }

    return children;
};