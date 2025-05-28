import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  X,
  Tag,
  Home,
  Plus,
  Clock,
  Search,
  Settings,
  Calendar,
  BarChart2,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  ChevronRight,
  Bell,
  ExternalLink,
} from "lucide-react";
import {
  Pie,
  Cell,
  Line,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  PieChart,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import clsx from "clsx";

import {
  getUserFromToken,
  fetchTrackingList,
  fetchActivityData,
  fetchUpcomingSales,
  fetchTrendingProducts,
  fetchCombinedTrackingPriceHistories,
} from "../../services/authService";

import {
  getEndDate,
  getStartDate,
  getCategoryData,
  processAnalyticsData,
} from "../../utils/productUtils";

import Loading from "../../components/Loading";
import CustomLegend from "../../components/ui/CustomLegend";
import CustomTooltip from "../../components/ui/CustomTooltip";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28EFF",
  "#FF6699",
];

const missingDataMessage = "No tracking data available yet.";

export default function Dashboard() {
  const navigate = useNavigate();

  // Menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Tracked items
  const [trackingItems, setTrackingItems] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSavings: 0,
    avgDiscount: 0,
  });

  // Loading spinners
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User account details
  const [accountDetails, setAccountDetails] = useState(null);
  const [accountError, setAccountError] = useState(null);
  const { userId } = getUserFromToken();

  // Activity section
  const [activityData, setActivityData] = useState([]);
  const [errorActivity, setErrorActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Upcomimg sales
  const [salesData, setSalesData] = useState([]);
  const [errorSales, setErrorSales] = useState(null);
  const [loadingSales, setLoadingSales] = useState(true);

  // Trending products
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState(null);

  // Deal price trends
  const [priceTrends, setPriceTrends] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(true);

  const [aggregatedData, setAggregatedData] = useState({});

  /* USER Management */

  // Checking user auth status ...
  useEffect(() => {
    const user = getUserFromToken();

    if (!user) {
      navigate("/signin");
    }
  }, [navigate]);

  // Fetching user activity data ...
  useEffect(() => {
    const getActivity = async () => {
      try {
        const data = await fetchActivityData();
        setActivityData(data);
      } catch (err) {
        setErrorActivity(err.message || "Failed to fetch activity data.");
      } finally {
        setLoadingActivity(false);
      }
    };

    getActivity();
  }, []);

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
    }
  }, [userId]);

  /* FETCHING Product Information */

  // Fetching tracking list data and compute stats ...
  useEffect(() => {
    const getTrackingList = async () => {
      try {
        const list = await fetchTrackingList();

        // Calculate stats ...
        const totalProducts = list.length;
        const totalSavings = list.reduce((sum, item) => {
          const saving = item.currentPrice - item.hitPrice;
          return sum + (saving > 0 ? saving : 0);
        }, 0);
        const avgDiscount =
          totalProducts > 0
            ? Math.round(
                (totalSavings /
                  list.reduce((sum, item) => sum + item.currentPrice, 0)) *
                  100
              )
            : 0;

        // Sorted list by savings ...
        const sortedList = list.sort(
          (a, b) => b.currentPrice - b.hitPrice - (a.currentPrice - a.hitPrice)
        );

        setTrackingItems(sortedList);
        setStats({ totalProducts, totalSavings, avgDiscount });
      } catch (err) {
        setError(err.message || "Failed to fetch tracking list.");
      } finally {
        setLoading(false);
      }
    };

    getTrackingList();
  }, []);

  // Fetching upcoming sales data ...
  useEffect(() => {
    const getUpcomingSales = async () => {
      try {
        const sales = await fetchUpcomingSales();

        const filteredSales = sales
          .filter((sale) => {
            const endDate = getEndDate(sale.duration);
            const today = new Date();

            today.setHours(0, 0, 0, 0);
            return endDate >= today;
          })
          .sort((a, b) => {
            return getStartDate(a.duration) - getStartDate(b.duration);
          });

        setSalesData(filteredSales);
      } catch (err) {
        setErrorSales(err.message || "Failed to fetch upcoming sales.");
      } finally {
        setLoadingSales(false);
      }
    };

    getUpcomingSales();
  }, []);

  // Fetching trending products ...
  useEffect(() => {
    const fetchTrending = async () => {
      setTrendingLoading(true);

      try {
        const trending = await fetchTrendingProducts();
        setTrendingProducts(trending);
        setTrendingError(null);
      } catch (err) {
        console.error("Error fetching trending products : ", err);
        setTrendingError("Failed to fetch trending products.");
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrending();
  }, []);

  /* AGGREGATION of Product Information */

  // Fetch combined tracking price histories ...
  useEffect(() => {
    const fetchTestData = async () => {
      setLoadingTrends(true);

      try {
        const data = await fetchCombinedTrackingPriceHistories();

        if (data) setAggregatedData(data);
        else console.log(data);
      } catch (err) {
        setError(err.message || "Failed to fetch test data.");
        console.error("Failed to fetch test data.");
      } finally {
        setLoadingTrends(false);
      }
    };

    fetchTestData();
  }, [trackingItems]);

  // Fetch category-wise product data for PIE chart ...
  useEffect(() => {
    setCategoryData(getCategoryData(trackingItems));
  }, [trackingItems]);

  // Fetching data for price trends ...
  useEffect(() => {
    if (aggregatedData && Object.keys(aggregatedData).length > 0) {
      const trendData = processAnalyticsData(aggregatedData);
      setPriceTrends(trendData.priceTrends);
    }
  }, [aggregatedData]);

  // Calculated stats ...
  const { totalProducts, totalSavings, avgDiscount } = stats;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-center mb-2">Error</h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Oops! Something went wrong.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 w-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-medium py-2 px-4 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 md:hidden">
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold text-orange-500">CostCatcher</h1>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/dashboard"
                    className="flex items-center px-4 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700"
                  >
                    <Home className="mr-3 h-4 w-4" />
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/analytics"
                    className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <BarChart2 className="mr-3 h-4 w-4" />
                    Analytics
                  </Link>
                </li>
                <li></li>
                <li>
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Settings
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar - Desktop Only */}
        <aside className="hidden md:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 overflow-y-auto">
          <div className="p-6">
            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Navigation
            </h3>
            <nav className="mt-2 space-y-1 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Link
                to="/dashboard"
                className="flex items-center px-4 py-2.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700"
              >
                <Home className="mr-3 h-4 w-4" />
                Home
              </Link>
              <Link
                to="/analysis"
                className="flex items-center px-4 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <BarChart2 className="mr-3 h-4 w-4" />
                Analytics
              </Link>
              <Link
                to="/deals"
                className="flex items-center px-4 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Tag className="mr-3 h-4 w-4" />
                Deals
              </Link>
              <Link
                to="/account"
                className="flex items-center px-4 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </Link>
            </nav>

            {/* Telegram Notifications CTA */}
            <div className="mt-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="bg-white/20 p-2 rounded-lg mr-3">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">
                      Telegram Alerts
                    </h4>
                    <p className="text-blue-100 text-xs">
                      Get instant price drop alerts!
                    </p>
                  </div>
                </div>
                <a
                  href={process.env.REACT_APP_TELE_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md font-medium text-xs transition-colors duration-200 flex items-center justify-center"
                >
                  Set Up Now
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {accountDetails
                    ? `Welcome back, ${accountDetails.name}!`
                    : "Welcome back!"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Here's what's happening with your tracked products ...
                </p>
              </div>
              <div className="flex space-x-2 mt-4 md:mt-0">
                <Link to="/addProduct">
                  <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </button>
                </Link>
                <Link to="/trackinglist">
                  <button className="px-4 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-[#FF5252] focus:outline-none">
                    View All Products
                  </button>
                </Link>
              </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={clsx(
                    "pb-4 text-sm font-medium border-b-2 transition-colors duration-200",
                    {
                      "border-orange-500 text-orange-500":
                        activeTab === "overview",
                      "border-transparent hover:border-gray-300 dark:hover:border-gray-600":
                        activeTab !== "overview",
                    }
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={clsx(
                    "pb-4 text-sm font-medium border-b-2 transition-colors duration-200",
                    {
                      "border-orange-500 text-orange-500":
                        activeTab === "analytics",
                      "border-transparent hover:border-gray-300 dark:hover:border-gray-600":
                        activeTab !== "analytics",
                    }
                  )}
                >
                  Insights
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={clsx(
                    "pb-4 text-sm font-medium border-b-2 transition-colors duration-200",
                    {
                      "border-orange-500 text-orange-500":
                        activeTab === "activity",
                      "border-transparent hover:border-gray-300 dark:hover:border-gray-600":
                        activeTab !== "activity",
                    }
                  )}
                >
                  Activity
                </button>
              </div>
            </div>

            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Search - Mobile Only */}
                <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Deal Price Trend Over Time */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        Deal Price Trends
                      </h3>
                      <Link
                        to="/analysis"
                        className="text-sm text-orange-500 hover:underline flex items-center"
                      >
                        View Details <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                    <div className="p-4">
                      <div className="h-64 flex items-center justify-center">
                        {loadingTrends ? (
                          <Loading />
                        ) : priceTrends.length === 0 ? (
                          <div className="flex flex-1 items-center justify-center h-full">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              No price trend data available yet.
                            </span>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={priceTrends}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" />
                              <YAxis />
                              <Tooltip content={CustomTooltip} />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="deal_price"
                                stroke="#82ca9d"
                                name="Deal Price"
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="original_price"
                                stroke="#ff6666"
                                name="Original Price"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Savings */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Top Savings</h3>
                      <Link
                        to="/trackinglist"
                        className="text-sm text-orange-500 hover:underline flex items-center"
                      >
                        View Details <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                    <div className="p-4">
                      <div className="h-64 overflow-y-auto">
                        {trackingItems.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
                            No tracked products found.
                          </div>
                        ) : (
                          <ul className="space-y-[1.35rem]">
                            {trackingItems.slice(0, 5).map((item, index) => (
                              <li
                                key={item._id}
                                className="flex items-center space-x-3"
                              >
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
                                  #{index + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {item.productTitle.split("|")[0].trim()}
                                  </p>
                                  <p className="text-sm text-orange-500">
                                    Saved ₹
                                    {Math.max(
                                      item.currentPrice - item.hitPrice,
                                      0
                                    )}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trending Products */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        Trending Products
                      </h3>
                      <Link to="/trendingProducts">
                        <button className="text-sm text-orange-500 hover:underline flex items-center">
                          View All <ChevronRight className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                    <div className="p-4">
                      <div className="h-64 overflow-y-auto">
                        {trendingLoading ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center h-full justify-center">
                            Loading trending products...
                          </div>
                        ) : trendingError ? (
                          <div className="text-sm text-red-500 flex items-center h-full justify-center">
                            {trendingError}
                          </div>
                        ) : trendingProducts.length > 0 ? (
                          <ul className="space-y-[1.35rem]">
                            {trendingProducts
                              .slice(0, 5)
                              .map((product, index) => (
                                <li
                                  key={product._id}
                                  className="flex items-center space-x-4"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {product.name.split("|")[0].trim()}
                                    </p>
                                    <p className="text-sm text-orange-500">
                                      Deal Price ₹{product.deal_price}
                                    </p>
                                  </div>
                                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
                                    #{index + 1}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center h-full justify-center">
                            No trending products found.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Deals */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Upcoming Deals</h3>
                      <Link
                        to="/deals"
                        className="text-sm text-orange-500 hover:underline flex items-center"
                      >
                        View All <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                    <div className="p-4">
                      <div className="h-64 overflow-y-auto">
                        {loadingSales ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Loading deals...
                          </div>
                        ) : errorSales ? (
                          <div className="text-sm text-red-500">
                            {errorSales}
                          </div>
                        ) : salesData.length > 0 ? (
                          <ul className="space-y-4">
                            {salesData.slice(0, 5).map((deal) => (
                              <li
                                key={deal._id || deal.id}
                                className="flex items-start space-x-4"
                              >
                                <Calendar className="h-5 w-5 text-orange-500 mt-1" />
                                <div>
                                  <p className="font-medium">
                                    {deal.title || deal.name}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {deal.duration || deal.date}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {deal.description}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            No upcoming deals found.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6 w-full">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-2 col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 flex items-center">
                      <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20 text-orange-500 flex-shrink-0">
                        <DollarSign className="h-6 w-6" />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Potential Savings
                        </p>
                        <h3 className="text-2xl font-bold truncate">
                          ₹{totalSavings.toLocaleString()}
                        </h3>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 flex items-center">
                      <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500 flex-shrink-0">
                        <Tag className="h-6 w-6" />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Avg. Discount
                        </p>
                        <h3 className="text-2xl font-bold truncate">
                          {avgDiscount}%
                        </h3>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 flex items-center">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500 flex-shrink-0">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Products Tracked
                        </p>
                        <h3 className="text-2xl font-bold truncate">
                          {totalProducts}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Category Distribution */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 col-span-2">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold">
                        Tracking by Category
                      </h3>
                    </div>
                    <div className="p-4 h-80 flex items-center justify-center">
                      {categoryData.length === 0 ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400 text-center w-full">
                          {missingDataMessage}
                        </span>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => {
                                const maxLen = 15;
                                const displayName =
                                  name.length > maxLen
                                    ? name.slice(0, maxLen).trim() + "…"
                                    : name;

                                return `${displayName.replace(
                                  /\w\S*/g,
                                  (text) =>
                                    text.charAt(0).toUpperCase() +
                                    text.substring(1).toLowerCase()
                                )} ${(percent * 100).toFixed(0)}%`;
                              }}
                            >
                              {categoryData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={CustomTooltip} />
                            <Legend
                              verticalAlign="middle"
                              align="right"
                              layout="vertical"
                              iconType="circle"
                              content={CustomLegend}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-6">
                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                  </div>
                  <div className="p-4">
                    {loadingActivity ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Loading activity...
                      </p>
                    ) : errorActivity ? (
                      <p className="text-sm text-red-500">{errorActivity}</p>
                    ) : activityData.length > 0 ? (
                      <ul className="space-y-4">
                        {activityData
                          .slice(-5)
                          .reverse()
                          .map((activity) => (
                            <li
                              key={activity._id}
                              className="flex items-start space-x-4"
                            >
                              <Clock className="h-5 w-5 text-gray-500 mt-1" />
                              <div>
                                <p className="font-medium">
                                  {activity.activity}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    activity.timestamp
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No recent activity found.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
