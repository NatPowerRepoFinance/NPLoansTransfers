import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import Cookies from "js-cookie";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  refreshToken: string | null;
  setRefreshToken: (token: string | null) => void;
  refreshAuthToken: () => Promise<boolean>;
  enableHelp: boolean;
  setEnableHelp: (value: boolean) => void;
  lang: string;
  setLang: (lang: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem("poAccessToken")
  );
  const [enableHelp, setEnableHelp] = useState<boolean>(false);

  const [refreshToken, setRefreshTokenState] = useState<string | null>(
    () => Cookies.get("poRefreshToken") || null
  );
  const [lang, setLang] = useState<string>("en");

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("poAccessToken", newToken);
      const payloadBase64 = newToken.split(".")[1];
      const jsonString = atob(payloadBase64);
      const payload = JSON.parse(jsonString);
      localStorage.setItem("role", payload.role);
      localStorage.setItem("costCenter", JSON.stringify(payload.costCenter));
      localStorage.setItem("last_name", payload.last_name);
      localStorage.setItem("first_name", payload.first_name);
      localStorage.setItem("id", payload.id);
    } else {
      localStorage.removeItem("poAccessToken");
      localStorage.removeItem("role");
      localStorage.removeItem("costCenter");
      localStorage.removeItem("last_name");
      localStorage.removeItem("first_name");
      localStorage.removeItem("id");
    }
  };

  const setRefreshToken = (newToken: string | null) => {
    setRefreshTokenState(newToken);
    if (newToken) {
      Cookies.set("poRefreshToken", newToken, {
        sameSite: "strict",
        secure: true,
        path: "/",
        expires: 0.05,
      });
    } else {
      Cookies.remove("poRefreshToken");
    }
  };

  const refreshAuthToken = async (): Promise<boolean> => {
    if (!refreshToken) return false;
    try {
      const res = await fetch(
        "https://as-natpower-purchase-order-backend-uksouth.azurewebsites.net/auth/refresh-token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );

      const data = await res.json();

      if (res.ok && data?.data?.access_token) {
        setToken(data.data.access_token);
        if (data.data.refresh_token) {
          setRefreshToken(data.data.refresh_token);
        }
        localStorage.setItem("poLoginTime", Date.now().toString());
        return true;
      } else {
        setToken(null);
        setRefreshToken(null);
        return false;
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
      setToken(null);
      setRefreshToken(null);
      return false;
    }
  };

  const contextValue = useMemo(
    () => ({
      token,
      setToken,
      refreshToken,
      setRefreshToken,
      refreshAuthToken,
      enableHelp,
      setEnableHelp,
      lang,
      setLang,
    }),
    [token, refreshToken, enableHelp, lang]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
