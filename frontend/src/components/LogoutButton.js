import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { toast } from "react-toastify";

const Logout = () => {
  const { setLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        await axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
        setLoggedIn(false);
        toast.success("Logged out successfully");
        navigate("/login");
      } catch (error) {
        toast.error("Logout failed");
        console.error("Logout error:", error);
      }
    };

    logout();
  }, [navigate, setLoggedIn]);

  return null; // You can show a spinner or "Logging out..." message here if you like
};

export default Logout;
