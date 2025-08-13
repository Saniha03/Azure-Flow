import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";
import {
  Home,
  Edit,
  TrendingUp,
  Calendar,
  Clock,
  LogIn,
  LogOut,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { collection, getDocs, query } from "firebase/firestore";

interface NavbarProps {
  user: User | null;
  isMobile: boolean;
}

interface Notification {
  id: string;
  read: boolean;
}

function Navbar({ user, isMobile }: NavbarProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]); // Updated to use Notification interface
  const location = useLocation();
  const provider = new GoogleAuthProvider();

  // Fetch unread notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const q = query(collection(db, `users/${user.uid}/notifications`));
          const querySnapshot = await getDocs(q);
          const unreadCount = querySnapshot.docs.filter(
            (doc) => !doc.data().read
          ).length;
          setNotifications(unreadCount);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      } else {
        setNotifications(0);
      }
    };
    fetchNotifications();
  }, [user]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowUserMenu(false);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/log", label: "Log Entry", icon: Edit },
    { path: "/trends", label: "Trends", icon: TrendingUp },
    { path: "/calendar", label: "Calendar", icon: Calendar },
    { path: "/history", label: "History", icon: Clock },
    { path: "/notifications", label: "Notifications", icon: Bell },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  if (isMobile) {
    return (
      <>
        {/* Mobile Top Bar */}
        <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-royal-blue via-blue-600 to-royal-blue text-white shadow-lg z-50 backdrop-blur-sm">
          <div className="container mx-auto flex justify-between items-center px-4 py-3">
            <Link
              to="/"
              className="text-xl font-bold flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Home size={18} className="text-white" />
              </div>
              <span className="bg-gradient-to-r from-sky-200 to-white bg-clip-text text-transparent">
                AzureFlow💙
              </span>
            </Link>

            <div className="flex items-center space-x-3">
              {/* Search Icon */}
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Search size={20} />
              </button>

              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </Link>

              {/* User Avatar or Menu Button */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <img
                      src={user.photoURL || "/default-avatar.png"}
                      alt={user.displayName || "User"}
                      className="w-8 h-8 rounded-full border-2 border-sky-300"
                    />
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        showUserMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-gray-800 truncate">
                          {user.displayName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        to="/settings"
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </Link>
                      <Link
                        to="/notifications"
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
                      >
                        <Bell size={16} />
                        <span>Notifications</span>
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center space-x-2 text-red-600"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="bg-gradient-to-r from-sky-400 to-blue-500 px-4 py-2 rounded-lg hover:scale-105 transition-transform duration-200 flex items-center space-x-2"
                >
                  <LogIn size={16} />
                  <span className="text-sm font-medium">Sign In</span>
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="grid grid-cols-5 gap-1 p-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 ${
                  isActiveRoute(path)
                    ? "bg-gradient-to-t from-royal-blue to-blue-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-royal-blue hover:bg-sky-50"
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium truncate">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile Slide-out Menu */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setIsOpen(false)}
          >
            <div className="fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] bg-white shadow-2xl transform animate-slide-in-right">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  {navItems.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                        isActiveRoute(path)
                          ? "bg-gradient-to-r from-royal-blue to-blue-500 text-white shadow-lg"
                          : "hover:bg-sky-50 text-gray-700 hover:text-royal-blue"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop Sidebar
  return (
    <nav className="bg-gradient-to-b from-royal-blue via-blue-700 to-royal-blue text-white w-72 h-full flex flex-col shadow-2xl relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-sky-300/20 to-transparent"></div>
        <div className="absolute top-1/4 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/4 left-0 w-24 h-24 bg-blue-300/10 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-3 mb-8 group hover:scale-105 transition-transform duration-200"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <Home size={24} className="text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold bg-gradient-to-r from-sky-200 to-white bg-clip-text text-transparent">
              AzureFlow💙
            </span>
            <p className="text-sky-200 text-sm opacity-80">
              Track your cycle with ease
            </p>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-200"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent backdrop-blur-sm"
          />
        </div>

        {/* Navigation Items */}
        <div className="space-y-2 mb-6">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
                isActiveRoute(path)
                  ? "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30"
                  : "hover:bg-white/10 text-sky-100 hover:text-white"
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isActiveRoute(path)
                    ? "bg-white/20 shadow-md"
                    : "group-hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
              </div>
              <span className="font-medium">{label}</span>
              {path === "/notifications" && notifications.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
              {isActiveRoute(path) && path !== "/notifications" && (
                <div className="ml-auto w-2 h-2 bg-sky-300 rounded-full animate-pulse"></div>
              )}
            </Link>
          ))}
        </div>

        {/* Notifications Panel */}
        <div className="bg-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sky-100">Notifications</h4>
            {notifications.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {notifications.length}
              </span>
            )}
          </div>
          <p className="text-sky-200 text-sm">
            {notifications.length > 0
              ? "You have new updates waiting"
              : "No new notifications"}
          </p>
        </div>
      </div>

      {/* User Section */}
      <div className="mt-auto p-6 relative z-10">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={user.photoURL || "/default-avatar.png"}
                  alt={user.displayName || "User"}
                  className="w-10 h-10 rounded-full border-2 border-sky-300 group-hover:border-white transition-colors"
                />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-white truncate">
                    {user.displayName}
                  </p>
                  <p className="text-sky-200 text-sm truncate">{user.email}</p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-sky-200 transition-transform ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 animate-fade-in">
                <Link
                  to="/settings"
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                <Link
                  to="/notifications"
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
                >
                  <Bell size={16} />
                  <span>Notifications</span>
                </Link>
                <hr className="my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center space-x-2 text-red-600"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <LogIn size={20} />
            <span className="font-semibold">Sign In with Google</span>
          </button>
        )}
      </div>

      {/* Version Info */}
      <div className="p-4 text-center relative z-10">
        <p className="text-sky-300 text-xs opacity-60">AzureFlow v2.1.0</p>
      </div>
    </nav>
  );
}

export default Navbar;

export default Navbar;
