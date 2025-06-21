import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submitForm = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("https://api.fcahptibbursaryps.com.ng/login", {
        email,
        password,
      });

      if (response.data.token) {
        // Store token and user info
        localStorage.setItem("token", response.data.token);
        navigate('/');
      }
    } catch (error) {
      console.error("Login failed:", error.response?.data?.error || error.message);
      toast.error(error.response?.data?.message || "Login failed");
    }finally{
      setLoading(false);
      }
  };

  return (
    <>
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Row className="w-100 justify-content-center">
          <Col md={8} lg={6}>
            <Card className="p-4 shadow-lg rounded-4">
              <Card.Body>
                <h2 className="text-center mb-2">SIGN IN!</h2>
                <p className="text-center text-muted mb-4">Log in as an Admin.</p>

                <Form onSubmit={submitForm}>
                  <Form.Group controlId="formEmail" className="mb-3">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter a valid email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group controlId="formPassword" className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="******************"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button variant="primary" type="submit" className="w-100" disabled={loading}>
  {loading ? "Signing in..." : "Sign in"}
</Button>
                </Form>

                <ToastContainer />

                <p className="mt-3 text-center text-secondary">
                  Don't have an account? <a href="/signup" className="text-primary">Sign up!</a>
                </p>
                <p className="mt-3 text-center text-secondary">
                  Forgot Password? <a href="/reset_password" className="text-primary">Reset Password!</a>
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export default Login;
