import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const useAuthCheck = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          toast.error("Session expired. Please log in.");
          navigate("/login");
          return;
        }

        const response = await axios.get("https://api.fcahptibbursaryps.com.ng/auth", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.authenticated) {
          setAuthenticated(true);
        } else {
          toast.error("Authentication failed.");
          navigate("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        toast.error("Unable to verify session.");
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  return { loading, authenticated };
};

export default useAuthCheck;