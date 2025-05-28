import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import {
  Tag,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  DollarSign,
  TrendingUp,
  PieChartIcon,
  ShoppingBag,
} from "lucide-react";

import {
  Bar,
  Pie,
  Cell,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  PieChart,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import Loading from "../../../components/Loading";
import CustomTooltip from "../../../components/ui/CustomTooltip";

import {
  fetchTrackingList,
  fetchCombinedTrackingPriceHistories,
} from "../../../services/authService";
import { getCategoryData } from "../../../utils/productUtils";
import { processAnalyticsData } from "../../../utils/productUtils";

const COLORS = ["#FF6B6B", "#FFB4B4", "#4ECDC4", "#556FB5", "#9D8DF1"];
const missingDataMessage = "No product tracking data available yet.";

export default function Analysis() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Test
  const [testData, setTestData] = useState({});
  const [testLoading, setTestLoading] = useState(false);

  const [trackingItems, setTrackingItems] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const [analytics, setAnalytics] = useState({
    categoryDistribution: [],
    averageDiscounts: [],
    priceTrends: [],
    topDiscounts: [],
  });

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSavings: 0,
    avgDiscount: 0,
  });

  const { totalSavings, totalProducts, avgDiscount } = stats;

  // TEST ...
  useEffect(() => {
    const fetchTestData = async () => {
      setTestLoading(true);

      try {
        const data = await fetchCombinedTrackingPriceHistories();

        if (data) setTestData(data);
        else console.log(data);
      } catch (err) {
        setError(err.message || "Failed to fetch test data.");
        console.error("Failed to fetch test data.");
      } finally {
        setTestLoading(false);
      }
    };

    fetchTestData();
  }, [trackingItems]);

  // Fetch category-wise product data for PIE chart ...
  useEffect(() => {
    setCategoryData(getCategoryData(trackingItems));
  }, [trackingItems]);

  // Fetching data for remaining graphs ...
  useEffect(() => {
    if (testData && Object.keys(testData).length > 0) {
      setAnalytics(processAnalyticsData(testData));
    }
  }, [testData]);

  // Fetch analytics data ...
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const list = await fetchTrackingList();

        // Calculate stats
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
        setError(err.message || "Failed to fetch analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

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
          <h2 className="text-xl font-semibold text-center mb-2">Error</h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-inter min-h-screen bg-gray-100 dark:bg-gray-900 text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/dashboard" className="mr-4">
                <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-orange-500 focus:outline-none" />
              </Link>
              <h1 className="text-2xl font-bold">Analytics</h1>
            </div>
            <button
              onClick={() => window.location.reload()}
              disabled={refreshing}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
              <RefreshCw
                className={`h-5 w-5 text-gray-500 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-orange-500 to-orange-400 dark:from-blue-700 dark:to-blue-500 pt-12 pb-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg mb-4">
            <BarChart3 className="h-12 w-12 text-orange-500 dark:text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-orange-100 dark:text-blue-200">
            Comprehensive insights into your price tracking performance.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 space-y-6 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
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
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500 flex-shrink-0">
                <Tag className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Avg. Discount
                </p>
                <h3 className="text-2xl font-bold truncate">{avgDiscount}%</h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500 flex-shrink-0">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Products Tracked
                </p>
                <h3 className="text-2xl font-bold truncate">{totalProducts}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <PieChartIcon className="h-5 w-5 text-orange-500 mr-2" />
              <h3 className="text-lg font-semibold">Category Distribution</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col lg:flex-row items-center">
              {/* Pie Chart */}
              <div className="w-full lg:w-2/3 h-80 flex items-center justify-center">
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
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => {
                          const maxLen = 15;
                          const displayName =
                            name.length > maxLen
                              ? name.slice(0, maxLen).trim() + "…"
                              : name;
                          return `${displayName} ${(percent * 100).toFixed(
                            0
                          )}%`;
                        }}
                        labelStyle={{ fontSize: 12 }}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={CustomTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend */}
              <div className="w-full lg:w-1/3 lg:pl-6 mt-4 lg:mt-0">
                <h4 className="text-lg font-semibold mb-4">Categories</h4>
                <div className="space-y-2">
                  {categoryData.length === 0 ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      No categories to display.
                    </span>
                  ) : (
                    categoryData.map((item, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div
                          className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="truncate">
                          {item.name} ({item.value})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Average Discounts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold">
                  Average Discount per Category
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center">
                {testLoading ? (
                  <Loading />
                ) : analytics.averageDiscounts.length === 0 ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400 text-center w-full">
                    {missingDataMessage}
                  </span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.averageDiscounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={CustomTooltip} />
                      <Bar dataKey="discount" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Top Discounts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold">Top 5 Discounts</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center">
                {testLoading ? (
                  <Loading />
                ) : analytics.topDiscounts.length === 0 ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400 text-center w-full">
                    {missingDataMessage}
                  </span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.topDiscounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="product_id" />
                      <YAxis />
                      <Tooltip content={CustomTooltip} />
                      <Bar dataKey="discount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Price Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
              <h3 className="text-lg font-semibold">
                Deal Price Trend Over Time
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="h-80 flex items-center justify-center">
              {testLoading ? (
                <Loading />
              ) : analytics.priceTrends.length === 0 ? (
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center w-full">
                  {missingDataMessage}
                </span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.priceTrends}>
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
      </div>
    </div>
  );
}
