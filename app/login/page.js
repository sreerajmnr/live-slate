import LoginForm from "../../components/LoginForm";
import Footer from "../../components/Footer";

export const metadata = { title: "Sign in · Live Slate" };

export default function LoginPage() {
  return (
    <div className="app-shell">
      <header className="header">
        <div className="brand">
          <span className="brand-logo">LS</span>
          <span className="brand-name">Live Slate</span>
        </div>
      </header>
      <main className="login-main">
        <LoginForm />
      </main>
      <Footer />
    </div>
  );
}
