import { useState } from 'react'
import { HashRouter, Router, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import './App.css'

function App() {

  return (
    <>
      <Router>
        <Route path="/" element={<Navigate to="/Login" replace />} />
        <Route path="/Login" element={<Login/>} />
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Router>
    </>
  )
}

export default App
