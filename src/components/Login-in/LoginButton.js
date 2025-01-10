import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import './Buttons.css'

const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  return <button className="nav-button" onClick={() => loginWithRedirect()}>Log In</button>;
};

export default LoginButton;