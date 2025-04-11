import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Route, Routes } from "react-router-dom";
import Signup from "./components/Signup.js";
import Home from "./components/Home.js";
import './App.css'
import Login from "./components/Login.js";
import axios from "axios";
import { useEffect, useState } from "react";
import PrivateRoute from "./components/privateRoutes.js";
import PayslipStatusHistory from "./components/PayslipStatusHistory.js";

axios.defaults.withCredentials = true;

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:5000/auth")
      .then(res => setLoggedIn(res.data.authenticated))
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <Routes>
      <Route
          path="/"
          element={
            <PrivateRoute loggedIn={loggedIn}>
              <Home />
            </PrivateRoute>
          }
        />
      <Route path="/signup" element={<Signup />} />
      <Route path="/status/history" element={<PayslipStatusHistory/>} />
      <Route path="/login" element={<Login setLoggedIn={setLoggedIn}/>} />
    </Routes>
  )
};

export default App;
