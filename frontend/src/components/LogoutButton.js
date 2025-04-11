import axios from "axios";
import { useNavigate } from "react-router-dom";

const LogoutButton = ({ setLoggedIn }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
      setLoggedIn(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return <button className="btn btn-danger" onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;
