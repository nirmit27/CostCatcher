import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

const Signup = () => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    email: "",
    phone: "",
  });

  const navigate = useNavigate();

  function handleChange(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    console.log(formData);

    const url = `${process.env.REACT_APP_CC_API}/signup`;
    try {
      const data = await fetch(url, {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify(formData),
      });

      const response = await data.json();
      if (response.token) {
        login(response.token);

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        console.error("Signup failed:", response.message);
        alert("fail: ", response.message);
      }
    } catch (error) {
      console.error("Error during signup:", error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300 font-inter px-6">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sign Up</h1>
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
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor="phone"
                >
                  Whatsapp Number
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 00000 00000"
                  value={formData.phone}
                  onChange={handleChange}
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
                  required
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex items-center py-2 px-6">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-black text-white h-10 px-4 py-2 w-full disabled:opacity-50 transition-colors duration-200 hover:bg-gray-800 active:bg-gray-900"
              >
                Sign Up
              </button>
            </div>
          </form>
          <div className="text-center py-4">
            <p className="text-sm">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="hover:underline font-semibold hover:text-orange-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
