import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authProvider";
import { ssoLogin } from "@/api";
import { loginRequest, msalConfig } from "@/msalConfig";
import {
  InteractionRequiredAuthError,
  PublicClientApplication,
} from "@azure/msal-browser";

const msalInstance = new PublicClientApplication(msalConfig);
const msalInitPromise = msalInstance.initialize();

const isBenignMsalAuthError = (error: unknown): boolean => {
  const errorCode =
    typeof error === "object" && error !== null && "errorCode" in error
      ? String((error as { errorCode?: unknown }).errorCode ?? "")
      : "";

  return errorCode === "hash_empty_error";
};

const AuthLogin = () => {
	const { setToken, setRefreshToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

    const [error, setError] = useState<string | null>(null);
    const [isSigningIn, setIsSigningIn] = useState(false);

    const isAdminIntent = new URLSearchParams(location.search).get("admin") === "1";

    const handleMsalSignIn = async () => {
        if (isSigningIn) {
          return;
        }

        setIsSigningIn(true);
        setError(null);

        try {
        
          // Ensure MSAL is initialized before calling any other MSAL API
          await msalInitPromise;

          // Let MSAL finish redirect hash processing before any interactive call.
          try {
            await msalInstance.handleRedirectPromise();
          } catch (redirectError) {
            if (!isBenignMsalAuthError(redirectError)) {
              throw redirectError;
            }
          }

          const request = {
            ...loginRequest,
            redirectUri: `${window.location.origin}/blank.html`,
          };
    
          let response;
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            try {
              response = await msalInstance.acquireTokenSilent({
                ...request,
                account: accounts[0],
              });
            } catch (silentError: any) {
              if (!(silentError instanceof InteractionRequiredAuthError)) {
                throw silentError;
              }
            }
          }
    
          if (!response) {
            response = await msalInstance.loginPopup(request);
          }
          console.log("MSAL login response:", response);
    
          const idToken = response.idToken;
          if (!idToken) {
            console.error("MSAL idToken not found in response");
            return;
          }

          // Exchange Microsoft idToken with backend JWT
          const result = await ssoLogin(idToken);
          console.log("POST /api/v1/auth/sso-login response:",result);
     
          // On successful SSO login response, store tokens and navigate only when access token is persisted.
          if (response && result.data) {
            const token = result.data.accessToken ?? result.data.access_token;
            const refreshToken = result.data.refreshToken ?? result.data.refresh_token;

            if (!token) {
              setError(result.message || "Authentication failed");
              return;
            }

            setToken(token);
            if (refreshToken) {
              setRefreshToken(refreshToken);
            }
            localStorage.setItem("poLoginTime", Date.now().toString());
            localStorage.setItem("user_first_name", String(result.data.firstName ?? ""));
            localStorage.setItem("user_last_name", String(result.data.lastName ?? ""));
            localStorage.setItem("user_role", String(result.data.role ?? ""));
            localStorage.setItem("user_country", String(result.data.country ?? ""));

            // Keep existing admin flag behavior, but route to home when poAccessToken is available.
            if (isAdminIntent) {
              localStorage.setItem("adminAuthenticated", "true");
            }

            const poAccessToken = localStorage.getItem("poAccessToken");
            if (poAccessToken) {
              navigate("/");
            } else {
              setError("Unable to persist access token");
            }
          } else {
            setError(result.message || "Authentication failed");
          }
        } catch (error: any) {
          // MSAL may throw a benign hash_empty_error when there is no hash to process.
          // For popup flows this can be safely ignored and should not log as an error.
          if (isBenignMsalAuthError(error)) {
            return;
          }

          const errorCode = String(error?.errorCode ?? "");
          if (errorCode === "interaction_in_progress") {
            setError("Authentication is already in progress. Please wait and try again.");
            return;
          }

          if (error instanceof Error && error.message.trim()) {
            setError(error.message.trim());
          } else {
            setError("Sign-in failed. Please try again.");
          }
          console.error("Error during MSAL sign-in flow:", error);
        } finally {
          setIsSigningIn(false);
        }
      };

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="w-full max-w-2xl rounded-3xl bg-gradient-to-br from-[#0b1220] via-[#071426] to-[#020617] shadow-[0_40px_80px_rgba(15,23,42,0.7)] px-16 py-20">
				<div className="flex flex-col items-center text-center space-y-8">
					<div className="space-y-3">
						<h2 className="text-3xl font-semibold tracking-tight text-white">
							Welcome back
						</h2>
						<p className="text-sm text-slate-300">
							Sign in to access your NP Loans And Transfers Account
						</p>
					</div>

					<button
						type="button"
						onClick={handleMsalSignIn}
            disabled={isSigningIn}
						className="inline-flex items-center justify-center gap-3 rounded-full bg-emerald-500 px-10 py-2.5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(16,185,129,0.75)] transition-transform transition-colors duration-200 hover:bg-emerald-600 hover:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
					>
						<span>{isSigningIn ? "Signing in..." : "Sign in with Microsoft"}</span>
						<span className="relative flex h-4 w-4 overflow-hidden rounded-sm">
							<span className="absolute inset-0 grid grid-cols-2 grid-rows-2">
								<span className="bg-[#f25022]" />
								<span className="bg-[#7fba00]" />
								<span className="bg-[#00a4ef]" />
								<span className="bg-[#ffb900]" />
							</span>
						</span>
					</button>

					{error && (
						<div className="text-xs text-red-400 mt-4">
							{error}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AuthLogin;
