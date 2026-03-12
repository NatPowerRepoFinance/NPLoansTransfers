import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

const AuthGuard = ({
	children,
	isAuthenticated,
}: {
	children: ReactNode;
	isAuthenticated: boolean;
	}) => {
	const location = useLocation();

	if (!isAuthenticated) {
		return <Navigate to="/auth" replace state={{ from: location }} />;
	}

	return <>{children}</>;
};

export default AuthGuard;
