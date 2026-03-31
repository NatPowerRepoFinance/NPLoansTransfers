import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authProvider";
import { API_BASE_URL } from "@/api";
import { loginRequest, msalConfig } from "@/msalConfig";
import {
  InteractionRequiredAuthError,
  PublicClientApplication,
} from "@azure/msal-browser";

const msalInstance = new PublicClientApplication(msalConfig);
const msalInitPromise = msalInstance.initialize();

const AuthLogin = () => {
	const { setToken, setRefreshToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

    const [error, setError] = useState<string | null>(null);

    const isAdminIntent = new URLSearchParams(location.search).get("admin") === "1";

    const handleMsalSignIn = async () => {
        try {
        
          // Ensure MSAL is initialized before calling any other MSAL API
          await msalInitPromise;
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
            } catch (error: any) {
              if (!(error instanceof InteractionRequiredAuthError)) {
                throw error;
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
          const tokenResponse = await fetch(
            `${API_BASE_URL}/api/v1/auth/sso-login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Access-Token": idToken,
              },
              body: JSON.stringify({}),
            }
          );

          const result = await tokenResponse.json();
          console.log("POST /api/v1/auth/sso-login response:",result);
     
          // On successful SSO login response, store tokens and decoded data
          if (response && result.data?.access_token) {
            const token = result.data.access_token;
            const refreshToken = result.data.refresh_token;

            setToken(token);
            setRefreshToken(refreshToken);
            localStorage.setItem("poLoginTime", Date.now().toString());

            const base64Payload = token.split(".")[1];
            const decodedPayload = JSON.parse(atob(base64Payload));
            const role = decodedPayload.role;

            document.cookie = `role=${role}; path=/;`;

            // If it's an admin intent, store a flag
            if (isAdminIntent) {
                localStorage.setItem("adminAuthenticated", "true");
                navigate("/admin");
            } else {
                navigate("/");
            }
        } else {
            setError(result.message || "Authentication failed");
        }
        } catch (error: any) {
          // MSAL may throw a benign hash_empty_error when there is no hash to process.
          // For popup flows this can be safely ignored and should not log as an error.
        
          console.error("Error during MSAL sign-in flow:", error);
        } finally {
         
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
						className="inline-flex items-center justify-center gap-3 rounded-full bg-emerald-500 px-10 py-2.5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(16,185,129,0.75)] transition-transform transition-colors duration-200 hover:bg-emerald-600 hover:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
					>
						<span>Sign in with Microsoft</span>
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
