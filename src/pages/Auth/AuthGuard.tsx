import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

const isTokenActive = (token: string | null): boolean => {
	if (!token) return false;

	try {
		const [, payload] = token.split(".");
		if (!payload) return false;
		const decodedPayload = JSON.parse(atob(payload));
		const exp = decodedPayload?.exp;

		if (typeof exp !== "number") {
			// If token has no exp claim, treat it as invalid for protected routes.
			return false;
		}

		return Date.now() < exp * 1000;
	} catch {
		return false;
	}
};

const AuthGuard = ({
	children,
	token,
}: {
	children: ReactNode;
	token: string | null;
	}) => {
	const location = useLocation();
	const isAuthenticated = isTokenActive(token);

	if (!isAuthenticated) {
		return <Navigate to="/auth" replace state={{ from: location }} />;
	}

	return <>{children}</>;
};

export default AuthGuard;
