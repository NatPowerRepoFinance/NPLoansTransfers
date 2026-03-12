import { Configuration, PopupRequest } from "@azure/msal-browser";

// Primary MSAL configuration (existing "Sign in with Microsoft" button)
export const msalConfig: Configuration = {
  auth: {
    clientId: "8b7a3d11-6ef1-4652-ad96-1d31bb91e927",
    authority: "https://login.microsoftonline.com/organizations",
    redirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest: PopupRequest = {
  scopes: ["User.Read"],
  redirectUri: window.location.origin,
};
