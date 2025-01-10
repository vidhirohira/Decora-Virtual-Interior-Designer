import React from 'react'

import LogoutButton from "../Login-in/LogoutButton";
import LoginButton from "../Login-in/LoginButton";
import { useAuth0 } from '@auth0/auth0-react';

import './Navbar.css'
export default function Navbar() {
    const {isAuthenticated} = useAuth0()
  return (
    <div className="hero-section">
        <nav className="navbar">
          <div className="logo">Decora</div>
          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#features">Features</a>
            {
              isAuthenticated ? <LogoutButton/> : <LoginButton/>
            }
          </div>
        </nav>
    </div>

        
  )
}
