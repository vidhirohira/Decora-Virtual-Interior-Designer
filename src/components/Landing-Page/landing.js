import React from "react";
import {
  Star,
  Calculator,
  ShoppingBag,
  Layers,
  Download,
  Mail,
  Clock,
  MapPin,
  Phone,
} from "lucide-react";
import "./Landing.css";
import landingImg from "./landingimg.png";
import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "../Login-in/LogoutButton";
import LoginButton from "../Login-in/LoginButton";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate(); // Initialize navigate function

  const testimonials = [
    {
      name: "Mohammed Bhadsorawala",
      role: "Interior Designer",
      rating: 5,
      text: "This virtual interior design tool has revolutionized how I present concepts to clients. The visualization capabilities are outstanding!",
    },
    {
      name: "Adi Awaskar",
      role: "Homeowner",
      rating: 5,
      text: "Transformed my space without the guesswork. The Budget Estimator is spot-on and helped me achieve exactly what I envisioned, while staying in budget.",
    },
    {
      name: "Aarya B",
      role: "Architect",
      rating: 4,
      text: "I'm really impressed with this tool! It's incredibly convenient and easy to use. I can now bring concepts to life faster than ever before.",
    },
  ];

  const features = [
    {
      icon: <Calculator className="feature-icon" />,
      title: "Budget Estimator",
      description:
        "Get accurate cost estimates for your interior design projects with our smart calculator.",
    },
    {
      icon: <ShoppingBag className="feature-icon" />,
      title: "Suggested Products",
      description:
        "Discover curated products that match your style and budget perfectly.",
    },
    {
      icon: <Layers className="feature-icon" />,
      title: "2D/3D Visualizations",
      description:
        "See your space come to life with detailed 2D and 3D visualizations.",
    },
    {
      icon: <Download className="feature-icon" />,
      title: "Easy Downloads",
      description:
        "Download your final designs instantly for offline access and sharing.",
    },
  ];

  const { isAuthenticated } = useAuth0(); // Auth0 hook for authentication

  return (
    <>
      <div className="landing-container">
        <div className="hero-section">
          <nav className="navbar">
            <div className="logo">Decora</div>
            <div className="nav-links">
              <a href="#about">About</a>
              <a href="#features">Features</a>
              <button className="login-btn">
                {isAuthenticated ? <LogoutButton /> : <LoginButton />}
              </button>
            </div>
          </nav>
        </div>

        {/* Hero Section */}
        <div className="hero-content">
          <div className="hero-text">
            <h1>Transform Your Space within minutes...</h1>
            <p>
              Experience the future of interior design at your fingertips. Turn
              your ideas into stylish designs in seconds.
            </p>
            <button
              className="start-designing-btn"
              onClick={() => navigate("/main-page")}
            >
              Get Started
            </button>
          </div>
          <div className="hero-image">
            <img src={landingImg} alt="Interior Design Preview" />
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="testimonials-section">
        <h2>What People Say</h2>
        <div className="testimonials-container">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="star-icon" />
                ))}
              </div>
              <p className="testimonial-text">{testimonial.text}</p>
              <div className="testimonial-author">
                <p className="author-name">{testimonial.name}</p>
                <p className="author-role">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2>Features</h2>
        <div className="features-container">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              {feature.icon}
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="contact-section">
        <div className="contact-container">
          <div className="contact-info">
            <h2>Contact Us</h2>
            <div className="contact-item">
              <Phone className="contact-icon" />
              <span className="contact-text">+91 12345 67890</span>
            </div>
            <div className="contact-item">
              <Clock className="contact-icon" />
              <span className="contact-text">Mon - Fri, 10am - 5pm</span>
            </div>
            <div className="contact-item">
              <Mail className="contact-icon" />
              <span className="contact-text">support@decora.com</span>
            </div>
            <div className="contact-item">
              <MapPin className="contact-icon" />
              <span className="contact-text">
                H R Mahajani Rd, Matunga East, Mumbai
              </span>
            </div>
          </div>

          {/* Contact Form (optional) */}
          {/* <div className="contact-form">
            <form>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your Name"
                />
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter a valid email address"
                />
                <textarea
                  className="form-textarea"
                  placeholder="Your message"
                ></textarea>
              </div>
              <button type="submit" className="submit-btn">
                SUBMIT
              </button>
            </form>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default Landing;
