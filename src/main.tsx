import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { PreferencesProvider } from "./accessibility/PreferencesContext";
import { AnnouncerProvider } from "./accessibility/Announcer";
import { GuidedTourProvider } from "./accessibility/GuidedTour";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreferencesProvider>
      <AnnouncerProvider>
        <GuidedTourProvider>
          <App />
        </GuidedTourProvider>
      </AnnouncerProvider>
    </PreferencesProvider>
  </StrictMode>,
);
