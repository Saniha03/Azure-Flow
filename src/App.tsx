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
      <div className={`${isMobile ? 'flex flex-col' : 'flex'} min-h-screen bg-gradient-blue`}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-72 flex-shrink-0">
            <Navbar user={user} isMobile={false} />
          </div>
        )}

        {/* Main Content */}
        <main
          className={`
            ${isMobile ? 'flex-1 overflow-y-auto' : 'flex-grow'}
            ${isMobile ? 'pb-20' : ''} 
            p-4 sm:p-6 flex justify-center
          `}
          style={{
            // For mobile: ensure content can scroll within available space
            ...(isMobile && {
              maxHeight: 'calc(100vh - 80px)', // Subtract bottom nav height
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
            }),
            // For desktop: normal full height
            ...(!isMobile && {
              minHeight: '100vh',
              overflowY: 'auto'
            })
          }}
        >
          <div className="w-full max-w-3xl">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/log" element={<LogEntry user={user} />} />
              <Route path="/trends" element={<Trends user={user} />} />
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

        {/* Mobile Navbar - Fixed at bottom */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <Navbar user={user} isMobile={true} />
          </div>
        )}
      </div>

      {/* Global mobile styles */}
      <style jsx global>{`
        /* Ensure mobile viewport is handled correctly */
        @media (max-width: 768px) {
          body {
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Prevent bounce scrolling on iOS */
          body {
            position: fixed;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          
          #root {
            height: 100vh;
            overflow: hidden;
          }
          
          /* Allow scrolling only in main content area */
          main {
            position: relative;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Ensure forms and inputs are accessible */
          input, textarea, select {
            max-width: 100%;
          }
          
          /* Fix for iOS keyboard pushing content */
          .form-container {
            padding-bottom: 120px;
          }
        }
        
        /* Desktop styles */
        @media (min-width: 769px) {
          body {
            position: static;
            overflow: auto;
          }
          
          #root {
            height: auto;
            overflow: visible;
          }
        }
      `}</style>
    </BrowserRouter>
  );
}

export default App;


