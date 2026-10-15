import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { PreferencesProvider } from "./accessibility/PreferencesContext";
import { AnnouncerProvider } from "./accessibility/Announcer";
import { GuidedTourProvider } from "./accessibility/GuidedTour";
import { AuthProvider } from "./auth/AuthContext";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreferencesProvider>
      <AnnouncerProvider>
        <GuidedTourProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </GuidedTourProvider>
      </AnnouncerProvider>
    </PreferencesProvider>
  </StrictMode>,
);
