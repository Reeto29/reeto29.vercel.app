import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="app__navbar">
      <ul className="app__navbar-links">
        <li className="p__opensans"><a href="#home">Home</a></li>
        <li className="p__opensans"><a href="#about">About</a></li>
        <li className="p__opensans"><a href="#Projects">Projects</a></li>
        <li className="p__opensans"><a href="#awards">Awards</a></li>
        <li className="p__opensans"><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;