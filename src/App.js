import React from 'react';
import LandingPage from './components/Landing-Page/landing';
import { Auth0Provider } from '@auth0/auth0-react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import MainPage from './components/MainPage/MainPage.js';
import Floorplan2d from './components/Floorplan/Floorplan2d.js';
import FloorPlan3d from './components/Floorplan/Floorplan3d.js';

function App() {
  return (
    <Router>
      <Auth0Provider
        domain="dev-qlln6xdml3ddwv5r.us.auth0.com"
        clientId="edH6TdqvrAokBV0Z4ZHIRhJzJCWoWYk1"
        authorizationParams={{
          redirect_uri: "http://localhost:3000/main-page"
        }}
      >
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/main-page" element={<MainPage/>}/>
            <Route path = "/floorplan2d" element = {<Floorplan2d/>}/>
            <Route path = "/floorplan3d" element = {<FloorPlan3d/>}/>
          </Routes>
        </div>
      </Auth0Provider>
    </Router>
  );
}

export default App;