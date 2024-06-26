import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Footer from "./components/footer/Footer";
import Navbar from "./components/navbar/Navbar";
import Login from "./pages/Login/Login";
import Error from "./pages/Error/Error";
import styles from "./App.module.css";
import ProtectedRoute from "./components/protectedRoute/ProtectedRoute";
import { useSelector } from "react-redux";
import Signup from "./pages/Signup/Signup";

const App = () => {
  const isAuth = useSelector((state) => state.user.auth);
  return (
    <div className={styles.container}>
      <BrowserRouter>
        <div className={styles.layout}>
          <Navbar />
          <Routes>
            <Route
              path="/"
              element={
                <div className={styles.main}>
                  <Home />
                </div>
              }
            />
            <Route
              path="/crypto"
              element={<div className={styles.main}>Crypto Page</div>}
            />
            <Route
              path="/blogs"
              element={
                <ProtectedRoute isAuth={isAuth}>
                  <div className={styles.main}>Blogs</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/submit"
              element={
                <ProtectedRoute isAuth={isAuth}>
                  <div className={styles.main}>Submit a Blog</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <div className={styles.main}>
                  <Login />
                </div>
              }
            />
            <Route
              path="/signup"
              element={
                <div className={styles.main}>
                  <Signup />
                </div>
              }
            />
            <Route
              path="*"
              element={
                <div className={styles.main}>
                  <Error />
                </div>
              }
            />
          </Routes>

          <Footer />
        </div>
      </BrowserRouter>
    </div>
  );
};

export default App;
