import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Tag,
  Pencil,
  Trash2,
  Calendar,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  ShoppingBag,
  ExternalLink,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import {
  Area,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import Edit from "../../components/Edit";
import Delete from "../../components/Delete";
import Loading from "../../components/Loading";

import { AuthContext } from "../../context/AuthContext";
import placeholder from "../../components/assets/placeholder.svg";

import { fetchProductData } from "../../api/productAPI";
import { extractProductID } from "../../utils/productUtils";
// import { getAmazonData } from "../../middleware/getAmazonData";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [priceHistory, setPriceHistory] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(true);

  /*
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_CC_API}/tracklist/products/${id}`
        );
        const data = await response.json();

        if (response.ok) {
          setProduct(data);
          const priceData = data["priceHistory"];

          if (
            response.ok &&
            priceData &&
            Array.isArray(priceData) &&
            priceData.length > 0
          ) {
            const transformedData = priceData.map((item, index) => ({
              date: new Date(item.time).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              dealPrice: Number.parseFloat(item.deal_price),
              originalPrice: Number.parseFloat(item.original_price),
              discount: Number.parseFloat(item.discount),
              timestamp: item.time,
            }));
            setPriceHistory(transformedData);
          }
        } else {
          setPriceHistory([]);
          setError(data.message || "Failed to fetch product details.");
        }
      } catch (err) {
        setError("Error fetching product details.");
      } finally {
        setLoading(false);
        setPriceHistoryLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, token]);
  */

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_CC_API}/tracklist/products/${id}`
        );
        const data = await response.json();

        if (response.ok) {
          const productLink = data.productLink;
          let amazonData = null;
          let amazonError = null;

          if (productLink) {
            const productId = extractProductID(productLink);
            if (productId) {
              const { data: fetchedData, error: fetchError } =
                await fetchProductData(productId);
              
              amazonData = fetchedData;
              amazonError = fetchError;
            }
          }

          setProduct({
            ...data,
            ...amazonData,
            productTitle: data.productTitle || amazonData?.title,
            currentPrice: data.currentPrice || amazonData?.deal_price,
            hitPrice: data.hitPrice,
            imageLink: amazonData?.image_url,
            productLink: data.productLink || amazonData?.product_url,
            category: data.category || amazonData?.category,
          });

          const priceData = data["priceHistory"];
          if (
            response.ok &&
            priceData &&
            Array.isArray(priceData) &&
            priceData.length > 0
          ) {
            const transformedData = priceData.map((item, index) => ({
              date: new Date(item.time).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              dealPrice: Number.parseFloat(item.deal_price),
              originalPrice: Number.parseFloat(item.original_price),
              discount: Number.parseFloat(item.discount),
              timestamp: item.time,
            }));
            setPriceHistory(transformedData);
          }
        } else {
          setPriceHistory([]);
          setError(data.message || "Failed to fetch product details.");
        }
      } catch (err) {
        setError("Error fetching product details.");
      } finally {
        setLoading(false);
        setPriceHistoryLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, token]);

  const handleEdit = async (productId, newHitPrice) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_CC_API}/trackinglist/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newHitPrice }),
        }
      );
      const result = await response.json();

      if (response.ok) {
        setProduct((prev) => ({
          ...prev,
          hitPrice: newHitPrice,
        }));
        setShowEditModal(false);
      } else {
        setError(result.message || "Failed to update hit price.");
      }
    } catch (err) {
      setError("Error editing product.");
    }
  };

  const handleDelete = async (productId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_CC_API}/tracklist/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();

      if (response.ok) {
        setShowDeleteModal(false);
        navigate("/");
      } else {
        setError(result.message || "Failed to delete product.");
      }
    } catch (err) {
      setError("Error deleting product.");
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.dataKey === "dealPrice"
                  ? "Deal Price"
                  : "Original Price"}
                :
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                ₹{entry.value?.toLocaleString()}
              </span>
            </div>
          ))}
          {payload[0]?.payload?.discount && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              {payload[0].payload.discount}% off
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
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
            {error}
          </p>
          <Link to="/trackinglist">
            <button className="mt-6 w-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-medium py-2 px-4 rounded-md">
              Return
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  // Product statistics
  const priceDifference = product.currentPrice - product.hitPrice;
  const isPriceHigher = priceDifference > 0;
  const pricePercentage = Math.round(
    (Math.abs(priceDifference) / product.currentPrice) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/trackinglist" className="mr-4">
                <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-500 focus:outline-none" />
              </Link>
              <h1 className="text-2xl font-bold">Product Details</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Product Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Product Image */}
            <div className="flex justify-center items-center">
              <img
                src={product.imageLink || placeholder}
                alt={product.productTitle}
                className="max-h-96 w-full object-contain rounded-lg shadow-md"
                onError={(e) =>
                  (e.target.src = "../../components/assets/pageHolder.png")
                }
              />
            </div>

            {/* Product Details */}
            <div className="flex flex-col justify-center space-y-6">
              <h1 className="text-2xl font-bold">{product.productTitle}</h1>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Current Price
                  </div>
                  <div className="text-3xl font-bold flex items-center">
                    ₹{product.currentPrice.toLocaleString()}
                    {isPriceHigher ? (
                      <TrendingDown className="h-5 w-5 text-green-500 ml-2" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-red-500 ml-2" />
                    )}
                  </div>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Target Price
                  </div>
                  <div className="text-3xl font-bold text-[#FF6B6B]">
                    ₹{product.hitPrice.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500 mr-3">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Price Difference
                    </div>
                    <div
                      className={`font-medium ${
                        isPriceHigher ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {isPriceHigher
                        ? "₹" + priceDifference.toLocaleString() + " above"
                        : "₹" +
                          Math.abs(priceDifference).toLocaleString() +
                          " below"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-500 mr-3">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Savings Potential
                    </div>
                    <div className="font-medium">
                      {pricePercentage}%{" "}
                      {isPriceHigher ? "potential savings" : "below target"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Target Price
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Product
                </button>

                <a
                  href={product.productLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF6B6B] hover:bg-[#ff5252] focus:outline-none"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Website
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Price History Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold">Price History</h3>
            </div>
          </div>

          <div className="p-6">
            {priceHistoryLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loading />
              </div>
            ) : priceHistory.length > 0 ? (
              <div className="space-y-4">
                {/* Chart Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-sm text-green-700 dark:text-green-300 mb-1">
                      Lowest Price
                    </div>
                    <div className="text-xl font-bold text-green-800 dark:text-green-200">
                      ₹
                      {Math.min(
                        ...priceHistory.map((p) => p.dealPrice)
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                      Average Price
                    </div>
                    <div className="text-xl font-bold text-blue-800 dark:text-blue-200">
                      ₹
                      {Math.round(
                        priceHistory.reduce((sum, p) => sum + p.dealPrice, 0) /
                          priceHistory.length
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">
                      Best Discount
                    </div>
                    <div className="text-xl font-bold text-purple-800 dark:text-purple-200">
                      {Math.max(...priceHistory.map((p) => p.discount))}%
                    </div>
                  </div>
                </div>

                {/* Price Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={priceHistory}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="dealPriceGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#FF6B6B"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#FF6B6B"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="originalPriceGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#94A3B8"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#94A3B8"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="date"
                        stroke="#6B7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#6B7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="originalPrice"
                        stroke="#94A3B8"
                        strokeWidth={2}
                        fill="url(#originalPriceGradient)"
                        strokeDasharray="5 5"
                      />
                      <Area
                        type="monotone"
                        dataKey="dealPrice"
                        stroke="#FF6B6B"
                        strokeWidth={3}
                        fill="url(#dealPriceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-[#FF6B6B] rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Deal Price
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-0.5 bg-[#94A3B8] rounded"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to right, #94A3B8 0, #94A3B8 3px, transparent 3px, transparent 6px)",
                      }}
                    ></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Original Price
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price history coming soon ...
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    We're tracking price changes for this product.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4 text-center">
              Edit Target Price
            </h2>
            <Edit
              productId={product._id}
              onEdit={handleEdit}
              onClose={() => setShowEditModal(false)}
            />
            <button
              onClick={() => setShowEditModal(false)}
              className="w-full mt-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4 text-center text-red-600 dark:text-red-400">
              Delete This Product?
            </h2>
            <Delete
              productId={product._id}
              productTitle={product.productTitle}
              onClose={() => setShowDeleteModal(false)}
              onDelete={handleDelete}
            />
            <button
              onClick={() => setShowDeleteModal(false)}
              className="w-full mt-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
