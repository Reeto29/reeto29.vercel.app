import React from 'react';

import { AboutUs, Header, Projects} from './container';
import { Navbar } from './components';
import './App.css';

import Projects from './container/Projects/Projects';

import Experience from './container/Experience/Experience';

const App = () => (
  <div>
    <Navbar />
    <Header />
    <Projects />
    <Experience />
    
  </div>
);

export default App;
