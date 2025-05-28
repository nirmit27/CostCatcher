import { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  X,
  Sun,
  Bell,
  Menu,
  Moon,
  Mail,
  User,
  LogOut,
  HelpCircle,
  IndianRupee,
} from "lucide-react";
import Avatar from "react-avatar";
import { motion, AnimatePresence } from "framer-motion";

import { getUserFromToken } from "../services/authService";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";

import { Button } from "./ui/Button";
import { Switch } from "./ui/Switch";

/*
const recentAlerts = [
  {
    id: 1,
    product: "Sony WH-1000XM4",
    message: "Price dropped by 15%",
    time: "1 hour ago",
    type: "drop",
  },
  {
    id: 2,
    product: "MacBook Air M1",
    message: "Back in stock",
    time: "3 hours ago",
    type: "stock",
  },
  {
    id: 3,
    product: "PlayStation 5",
    message: "Price increased by 5%",
    time: "1 day ago",
    type: "increase",
  },
  {
    id: 4,
    product: "Nintendo Switch OLED",
    message: "Price dropped by 10%",
    time: "2 days ago",
    type: "drop",
  },
  {
    id: 5,
    product: 'iPad Pro 12.9"',
    message: "Price match found",
    time: "3 days ago",
    type: "match",
  },
];
*/

export default function Navbar() {
  const navigate = useNavigate();

  // User account details
  const [accountDetails, setAccountDetails] = useState(null);
  const [accountError, setAccountError] = useState(null);

  // Get userId safely
  const userTokenData = getUserFromToken();
  const userId = userTokenData ? userTokenData.userId : null;

  // Contexts
  const { isAuthenticated, logout, user, token } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // User menu
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const initialRenderDone = useRef(false);
  const menuRef = useRef(null);

  // Scrolling effect
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  // Notification menu
  const notifMenuRef = useRef(null);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const [activityData, setActivityData] = useState([]);
  const [errorActivity, setErrorActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Fetching user account details ...
  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_CC_API}/account/${userId}`
        );
        const data = await response.json();

        if (response.ok) {
          setAccountDetails(data.payload);
        } else {
          setAccountError(data.message || "Failed to fetch account details.");
        }
      } catch (error) {
        setAccountError("Error fetching account details.");
      }
    };

    if (userId) {
      fetchAccountDetails();
    } else {
      setAccountDetails(null); // Clear details if logged out
      setAccountError(null);
    }
  }, [userId]);

  // Fetch notifications/activity
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchActivityData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_CC_API}/activity`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        if (data.status === "Success") {
          setActivityData(data.payload);
        } else {
          setErrorActivity("Failed to fetch activity data.");
        }
      } catch (error) {
        console.error("Error fetching activity data:", error);
        setErrorActivity("Error fetching activity data.");
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchActivityData();
  }, [isAuthenticated, token]);

  // Handle opening/closing of notification menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notifMenuRef.current &&
        !notifMenuRef.current.contains(event.target)
      ) {
        setNotifMenuOpen(false);
      }
    }
    if (notifMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifMenuOpen]);

  // Handle opening/closing of user menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  // Closing the user menu on first render
  useEffect(() => {
    if (!initialRenderDone.current) {
      initialRenderDone.current = true;
      setUserMenuOpen(false);
    }
  }, []);

  // Keep menu closed on auth changes
  useEffect(() => {
    setUserMenuOpen(false);
  }, [isAuthenticated]);

  const toggleMenu = () => {
    setUserMenuOpen((prev) => !prev);
  };

  // Handling scrolling effects
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos, visible]);

  // Handle scroll to toggle navbar background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [mobileMenuOpen]);

  const handleSignout = () => {
    logout();
    navigate("/signin");
  };

  const links = isAuthenticated
    ? [{ to: "/dashboard", label: "Home" }]
    : [
        { to: "/about", label: "About" },
        { to: "/contact", label: "Contact" },
      ];

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-40 backdrop-blur-md border-b transition-transform duration-300 ease-in-out
        ${
          scrolled
            ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            : "bg-white/80 dark:bg-gray-800/80 border-transparent"
        } ${visible ? "md:translate-y-0" : "md:-translate-y-full"}`}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <IndianRupee className="h-6 w-6 text-orange-500" />
          <Link to="/" className="font-bold text-2xl">
            CostCatcher
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {links.map(({ to, label }) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button
                variant="ghost"
                className="text-gray-800 dark:text-gray-200 bg-transparent hover:bg-transparent hover:text-orange-500 dark:hover:text-orange-400 transform transition-all duration-300 ease-in-out rounded-full p-2"
              >
                <Link to={to}>{label}</Link>
              </Button>
            </motion.div>
          ))}

          {/* Get Started Button */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                onClick={() => navigate("/signin")}
                className="text-white bg-orange-500 hover:bg-orange-400 transform transition-all duration-300 ease-in-out rounded-full px-6 py-2"
              >
                Login
              </Button>
            </motion.div>
          )}

          {/* Dark Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2"
          >
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300"
              aria-label="Toggle Dark Mode"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-800" />
              )}
            </button>
          </motion.div>

          {/* User Menu */}
          {isAuthenticated && (
            <div className="relative flex items-center gap-2" ref={menuRef}>
              {/* Notification Bell Button */}
              <div ref={notifMenuRef} className="relative">
                <button
                  className={`p-2 rounded-full focus:outline-none relative transition-colors duration-200
      hover:bg-gray-100 dark:hover:bg-gray-700
      ${
        notifMenuOpen
          ? "ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900"
          : ""
      }
    `}
                  aria-label="Notifications"
                  onClick={() => {
                    setNotifMenuOpen((prev) => !prev);
                    if (!notifMenuOpen) setUserMenuOpen(false);
                  }}
                >
                  <Bell
                    className={`h-5 w-5 ${
                      notifMenuOpen
                        ? "text-orange-500"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  />
                  {activityData && activityData.length > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-orange-500"></span>
                  )}
                </button>

                {/* Notification Popup */}
                {notifMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200">
                      Notifications
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {loadingActivity ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Loading...
                        </div>
                      ) : errorActivity ? (
                        <div className="p-4 text-center text-red-500">
                          {errorActivity}
                        </div>
                      ) : activityData && activityData.length > 0 ? (
                        activityData
                          .filter(
                            (activity) =>
                              !(
                                activity.activity &&
                                activity.activity.includes("Recent Login")
                              )
                          )
                          .sort(
                            (a, b) =>
                              new Date(b.timestamp).getTime() -
                              new Date(a.timestamp).getTime()
                          )
                          .map((activity, idx) => (
                            <div
                              key={activity._id || idx}
                              className="px-4 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                              <div className="font-medium text-sm text-gray-800 dark:text-gray-100">
                                {activity.activity || "Activity"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {activity.message || activity.description}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-1">
                                {activity.time ||
                                  activity.date ||
                                  (activity.timestamp
                                    ? new Date(
                                        activity.timestamp
                                      ).toLocaleString()
                                    : "")}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No notifications.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu Toggle */}
              <button
                onClick={toggleMenu}
                className={`relative h-8 w-8 rounded-full focus:outline-none flex items-center justify-center ml-1
    ${userMenuOpen ? "ring-2 ring-orange-400" : ""}
  `}
                aria-label="User Menu"
              >
                <Avatar
                  name={accountDetails?.name || "User"}
                  size="32"
                  round={true}
                  color="#FF6B6B"
                />
              </button>

              {/* User Popup */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-[270px] w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    {(() => {
                      return accountDetails.name && accountDetails.email ? (
                        <>
                          <p className="text-sm font-medium">
                            {accountDetails.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {accountDetails.email}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          User details not available.
                        </p>
                      );
                    })()}
                  </div>
                  <div className="py-1">
                    <Link
                      to="/account"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <User className="inline-block w-4 h-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/contact"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Mail className="inline-block w-4 h-4 mr-2" />
                      Contact
                    </Link>
                    <Link
                      to="/help"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <HelpCircle className="inline-block w-4 h-4 mr-2" />
                      Help Center
                    </Link>
                  </div>
                  <div className="py-1 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      onClick={handleSignout}
                      className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="inline-block w-4 h-4 mr-2" />
                      Log out
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? (
            " "
          ) : (
            <Menu className="h-6 w-6 text-gray-800 dark:text-gray-200" />
          )}
        </Button>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="w-3/4 fixed top-0 right-0 z-30 bg-gray-100 dark:bg-gray-700 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <nav
              className="container h-screen pl-4 pr-2 py-4 flex flex-col space-y-2 border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between mx-4 mt-2 mb-3 rounded-md gap-2">
                <div className="flex flex-col grow space-y-2">
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    MENU
                  </h2>
                  {links.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-gray-800 hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 pb-2 rounded-md text-base font-medium"
                    >
                      {label}
                    </Link>
                  ))}
                  {isAuthenticated ? (
                    <Link
                      to="/signin"
                      onClick={() => {
                        handleSignout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-gray-800 hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 rounded-md text-base font-medium"
                    >
                      Sign Out
                    </Link>
                  ) : (
                    <Link
                      to="/signin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-gray-800 hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 rounded-md text-base font-medium"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close Menu"
                  className="self-start"
                >
                  <X className="h-6 w-6 text-gray-800 dark:text-gray-200" />
                </Button>
              </div>
              <hr className="border-t-2 dark:border-gray-600 border-gray-200 m-3" />
              <div className="flex items-center justify-center space-x-2 pt-2">
                <Sun className="h-5 w-5" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  aria-label="Toggle Dark Mode"
                />
                <Moon className="h-5 w-5" />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
