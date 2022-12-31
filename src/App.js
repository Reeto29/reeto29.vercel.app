import React from 'react';

import { AboutUs, Header, } from './container';
import { Navbar } from './components';
import './App.css';

import Projects from './container/Projects/Projects';

const App = () => (
  <div>
    <Navbar />
    <Header />
    <Projects />
    
  </div>
);

export default App;
