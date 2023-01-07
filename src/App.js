import React from 'react';

import { AboutUs, Header} from './container';
import { Navbar } from './components';
import './App.css';
import Contact from './container/Contact/Contact';

import Projects from './container/Projects/Projects';

import Experience from './container/Experience/Experience';

const App = () => (
  <div>
    <Navbar />
    <Header />
    <Projects />
    <Experience />
    <Contact />
    
  </div>
);

export default App;
