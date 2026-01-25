import { useState } from "react";
import { login } from "../api/auth";
import { Link, useNavigate } from "react-router-dom";

export const Login = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
  
    const handleLogin = async () => {
      try {
        setLoading(true);
        setError("");
        await login({email, password});
        // Login success → go to protected area
        navigate("/chat");
      } catch (error) {
        setError("Invalid email or password");
      }finally{
        setLoading(false);
      }
    };
  
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-96 border rounded p-6 space-y-4">
          <h1 className="text-xl font-bold">Login</h1>
  
          <input
            className="border p-2 w-full rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
  
          <input
            type="password"
            className="border p-2 w-full rounded"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
  
          {error && <p className="text-red-500">{error}</p>}
  
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-black text-white w-full p-2 rounded"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
  
          <p className="text-sm">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-600">
              Signup
            </Link>
          </p>
        </div>
      </div>
  );
};
