import React from 'react';

//import { images } from "../../constants";
import './AboutUs.css';

const AboutUs = () => (
  <div className='app__aboutus section__padding' id="about">
    <h1 className='app__header-h1'>About Me</h1>
    <p className= 'subheading'style={{margin: '2rem 0'}}>
    I am a creative, passionate, and hardworking student. 
    I enjoy problem-solving and taking on difficult tasks. I put time and effort into all of my work, and thoroughly enjoy working in teams.     </p>

    <ul className= 'subheading'>
      <li>I am from Ottawa, ON</li>
      <li>My favourite sport is Basketball 🏀, and my favourite team is the Toronto Raptors.</li>
      <li>My favourite video game is NBA2K, although I have been trying to learn chess as of lately.</li>
    </ul>

  </div>
);

export default AboutUs;
