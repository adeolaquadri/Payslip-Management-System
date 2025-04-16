import { useAuth } from "./context/AuthContext";

const Logout = () => {
  const { setLoggedIn } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLoggedIn(false)
    window.localStorage.href = '/login';
  };
  handleLogout();
  return null; // You can show a spinner or "Logging out..." message here if you like
};

export default Logout;
