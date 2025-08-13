import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import LogEntry from "./pages/LogEntry";
import Trends from "./pages/Trends";
import Calendar from "./pages/Calendar";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(
    window.matchMedia("(max-width: 768px)").matches
  );

  // Handle authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Update isMobile on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gradient-blue">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-72 flex-shrink-0">
            <Navbar user={user} isMobile={false} />
          </div>
        )}

        {/* Main Content */}
        <main
          className="flex-grow p-6 flex justify-center"
          style={{
            paddingTop: isMobile ? 'var(--navbar-top-height)' : '0',
            paddingBottom: isMobile ? 'var(--navbar-bottom-height)' : '0',
            minHeight: isMobile
              ? 'calc(100vh - var(--navbar-top-height) - var(--navbar-bottom-height))'
              : '100vh',
            overflowY: 'auto',
          }}
        >
          <div className="w-full max-w-3xl">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/log" element={<LogEntry user={user} />} />
              <Route path="/trends" element=<Trends user={user} /> />
              <Route path="/calendar" element={<Calendar user={user} />} />
              <Route path="/history" element={<History user={user} />} />
              <Route path="/settings" element={<Settings user={user} />} />
              <Route
                path="/notifications"
                element={<Notifications user={user} />}
              />
            </Routes>
          </div>
        </main>

        {/* Mobile Navbar */}
        {isMobile && <Navbar user={user} isMobile={true} />}
      </div>
    </BrowserRouter>
  );
}

export default App;
