import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { WishlistWrapper } from "./context/WishlistWrapper";
import { GOOGLE_CLIENT_ID } from "./lib/config";
import App from "./App.jsx";
import "./index.css";

const appShell = (
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WishlistWrapper>
          <CartProvider>
            <App />
          </CartProvider>
        </WishlistWrapper>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

createRoot(document.getElementById("root")).render(
  GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{appShell}</GoogleOAuthProvider>
  ) : (
    appShell
  )
);
