import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import Signup from "./components/Signup.js";
import Home from "./components/Home.js";
import './App.css'
import Login from "./components/Login.js";
import axios from "axios";
import ResetPassword from "./components/Resetpassword.js";

axios.defaults.withCredentials = true;

const App = () => {

  return (
    <Router>
    <Routes>
    
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login/>} />
      <Route path="/reset_password" element={<ResetPassword />} />
      <Route path="/" element={<Home />} />
    </Routes>
    </Router>
  )
};

export default App;
