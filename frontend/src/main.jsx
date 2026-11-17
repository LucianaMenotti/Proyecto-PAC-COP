import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/tema.css";
import "./hooks/useTema.js";
import App from "./App.jsx";
import { ProveedorAuth } from "./hooks/useAuth.jsx";
import { ProveedorTiempoReal } from "./hooks/useTiempoReal.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProveedorAuth>
        <ProveedorTiempoReal>
          <App />
        </ProveedorTiempoReal>
      </ProveedorAuth>
    </BrowserRouter>
  </React.StrictMode>
);
