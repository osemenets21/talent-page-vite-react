import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { isAdmin } from "../config/adminConfig";
import { saveTokens as saveTokensToLocalStorage } from "../utils/tokenManager";
import { authenticatedGet } from "../utils/apiUtils";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const tokenResponse = userCredential._tokenResponse;
      
      await saveTokensToLocalStorage(tokenResponse);
      
      // Check if user is admin
      if (isAdmin(user.email)) {
        // Admin user - redirect to admin dashboard
        navigate("/admin-dashboard");
        return;
      }
      
      // Wait for auth state to be properly established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Regular user - check if profile exists in backend using authenticated API
      const apiDomain = import.meta.env.VITE_API_DOMAIN;

      try {
        console.log('Attempting to fetch profile for email:', email);
        const res = await authenticatedGet(`${apiDomain}/talent/get?email=${email}`);
        
        if (res.ok) {
          const result = await res.json();
          console.log('Profile fetch result:', result);
          if (result.status === "success" && result.data) {
            // Store submissionId for MyProfile to use
            localStorage.setItem("submissionId", result.data.submissionId);
            // Profile exists, go to profile page
            navigate("/my-profile");
          } else {
            console.log('Profile not found, redirecting to registration');
            // Profile doesn't exist, go to talent form
            navigate("/register-talent");
          }
        } else {
          console.error('API call failed with status:', res.status);
          // Error or profile not found, go to talent form
          navigate("/register-talent");
        }
      } catch (apiError) {
        console.error('API call error:', apiError);
        // If API call fails, assume profile doesn't exist and go to talent form
        navigate("/register-talent");
      }
    } catch (error) {
      console.error('Login error:', error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <img
            className="mx-auto h-40 w-auto"
            src="/src/pictures/logo.png"
            alt="Your Company"
          />
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white space-y-6 px-6 py-8 shadow sm:rounded-lg sm:px-10"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-900"
            >
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-900"
            >
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-black shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Sign in
            </button>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </Link>
          </div>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}