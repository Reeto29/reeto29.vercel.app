import React from 'react';
import './Navbar.css';
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdCloseFullscreen } from "react-icons/md";

const Navbar = () => {
  const [toggleMenu, setToggleMenu] = React.useState(false);
  return (
    <nav className="app__navbar">
      <ul className="app__navbar-links">
        <li className="p__opensans"><a href="#home">Home</a></li>
        <li className="p__opensans"><a href="#projects">Projects</a></li>
        <li className="p__opensans"><a href="#experience">Experience</a></li>
        <li className="p__opensans"><a href="#contact">Contact</a></li>
      </ul>
      <div className="app__navbar-smallscreen">
        <GiHamburgerMenu color="#000" fontSize={27} onClick={() => setToggleMenu(true)} />
        {toggleMenu && (
          <div className="app__navbar-smallscreen_overlay flex__center slide-bottom">
            <MdCloseFullscreen fontSize={27} className="overlay__close" onClick={() => setToggleMenu(false)} />
            <ul className="app__navbar-smallscreen_links">
              <li><a href="#home" onClick={() => setToggleMenu(false)}>Home</a></li>
              <li><a href="#projects" onClick={() => setToggleMenu(false)}>Projects</a></li>
              <li><a href="#experience" onClick={() => setToggleMenu(false)}>Experience</a></li>
              <li><a href="#contact" onClick={() => setToggleMenu(false)}>Contact</a></li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;






















// const Navbar = () => {
//   return (
//     <nav className="app__navbar">
//       <ul className="app__navbar-links">
//         <li className="p__opensans"><a href="#home">Home</a></li>
//         <li className="p__opensans"><a href="#about">About</a></li>
//         <li className="p__opensans"><a href="#Projects">Projects</a></li>
//         <li className="p__opensans"><a href="#Experience">Experience</a></li>
//         <li className="p__opensans"><a href="#awards">Awards</a></li>
//         <li className="p__opensans"><a href="#contact">Contact</a></li>
//       </ul>
//     </nav>
//   );
// };

// export default Navbar;