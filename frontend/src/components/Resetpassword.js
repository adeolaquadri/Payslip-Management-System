import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from './Footer';


const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [secretkey, setSecretkey] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");


  const submitForm = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.put("http://localhost:5000/reset_password", 
         { email, secretkey, password, confirm },);
      if (response.status === 200) {
        toast.success(response.data.message);
        setInterval(()=>{window.location.href = '/login'},5000)
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Login failed:", error.response?.data?.error || error.message);
      toast.error(error.response?.data?.message || "Signup failed");
    }
  };

  return (
   <>
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={6}>
          <Card className="p-4 shadow-lg rounded-4">
            <Card.Body>
              <h2 className="text-center mb-2">RESET PASSWORD!</h2>
              {/* <p className="text-center text-muted mb-4">Log in as an Admin.</p> */}

              <Form onSubmit={submitForm}>
                <Form.Group controlId="formEmail" className="mb-3">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </Form.Group>

                <Form.Group controlId="formSecret" className="mb-3">
                  <Form.Label>Secret Key</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Enter your secret key"
                    value={secretkey}
                    onChange={(e) => setSecretkey(e.target.value)}
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

                <Form.Group controlId="formRetype" className="mb-4">
                  <Form.Label>Re-type Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="******************"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required 
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100">
                  Reset Password
                </Button>
              </Form>

              <ToastContainer />

              <p className="mt-3 text-center text-secondary"> <a href="/login" className="text-primary">Sign in!</a>
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

export default ResetPassword;
