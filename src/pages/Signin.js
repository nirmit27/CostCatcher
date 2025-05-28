import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Signin = () => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_CC_API}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok && data.token) {
        login(data.token);
        navigate("/dashboard");
      } else {
        setErrorMessage(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Error during sign-in : ", err);
      setErrorMessage("An error occurred during sign-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300 font-inter px-6">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sign In</h1>
        </div>
        <div
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-card text-card-foreground shadow-sm"
          data-v0-t="card"
        >
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  id="email"
                  name="email"
                  placeholder="m@example.com"
                  type="email"
                  onChange={handleChange}
                  value={formData.email}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  onChange={handleChange}
                  value={formData.password}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex items-center py-2 px-6">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-black text-white h-10 px-4 py-2 w-full disabled:opacity-50 transition-colors duration-200 hover:bg-gray-800 active:bg-gray-900"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
            {errorMessage && (
              <div className="text-red-500 text-sm pl-8">{errorMessage}</div>
            )}
          </form>
          <div className="text-center py-4">
            <p className="text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="hover:underline font-semibold hover:text-orange-500"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
