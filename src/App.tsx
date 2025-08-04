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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="flex flex-col md:flex-row min-h-screen bg-gradient-blue">
        <div className="hidden md:block">
          <Navbar user={user} isMobile={false} />
        </div>
        <main className="flex-grow p-6 flex justify-center">
          <div className="w-full max-w-3xl">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/log" element={<LogEntry user={user} />} />
              <Route path="/trends" element={<Trends />} />
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
        <div className="md:hidden">
          <Navbar user={user} isMobile={true} />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
