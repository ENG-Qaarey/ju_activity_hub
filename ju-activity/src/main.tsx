import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Providers
import { GoogleOAuthProvider } from "@react-oauth/google";
import ThemeProvider from "./components/providers/theme-provider";

const AppWithTheme = (
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    enableSystem
    disableTransitionOnChange
  >
    <App />
  </ThemeProvider>
);

// Compose the root component based on available keys
const AppComponent = GOOGLE_CLIENT_ID ? (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    {AppWithTheme}
  </GoogleOAuthProvider>
) : (
  AppWithTheme
);

// Add error handling
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  const root = createRoot(rootElement);
  root.render(AppComponent);
} catch (error) {
  console.error("Failed to render app:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Error Loading App</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
      <p>Please check the browser console for more details.</p>
    </div>
  `;
}
