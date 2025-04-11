import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';

const Signup = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretkey, setSecretkey] = useState("");
  const navigate = useNavigate();

  const submitForm = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/signup", { email, password }, { withCredentials: true });
      if (response.status === 200) {
          toast.success(response.data.message);
          setInterval(()=>{navigate('/login')},5000)
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Signup failed:", error.response?.data?.error || error.message);
      toast.error(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={6}>
          <Card className="p-4 shadow-lg rounded-4">
            <Card.Body>
              <h2 className="text-center mb-2">SIGN UP!</h2>
              <p className="text-center text-muted mb-4">Register as an Admin.</p>

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
                <Form.Group controlId="form" className="mb-4">
                  <Form.Label>Secret Key</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="******************"
                    value={secretkey}
                    onChange={(e) => setSecretkey(e.target.value)}
                    required 
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100">
                  Sign up
                </Button>
              </Form>

              <ToastContainer />

              <p className="mt-3 text-center text-secondary">
                Already have an account? <a href="/login" className="text-primary">Sign in!</a>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Signup;
