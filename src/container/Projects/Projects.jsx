import React from 'react';

import { images } from "../../constants";
import './Projects.css';

const Projects = () => (
  <div className='app__projects section__padding' id="Projects">
  <h1 className='app__projects-mainh1'>Projects</h1>


    <div class='centerBoxes'>
      <div class='contentBox'>
        <h1 class='app__projects-h1'>01: Basketball Bot</h1>
        <div className='app__projects-h1-box'/>
        <p className='app__projects-p'>
          I started this project over summer break to work on a productive and fun project. 
          My friend Daniel and I both love basketball and were really into the sports game NBA2K, which focused a lot on player stats. 
          Naturally, there are plenty of tools to check player stats NBA players already, 
          so we thought we'd make this Discord Bot to do just that and more as a fun side-project!
        </p>
        <form action="https://github.com/Reeto29/basketball-bot" method="get" target="_blank">
         <button className='projects__button' type="submit">Click me</button>
        </form>
      </div>
      <img className="images__projects" src={images.iphone} alt="bballbot image"/>
    </div>
    
    <div class='centerBoxes'>
      <div class='contentBox'>
        <h1 class='app__projects-h1'>02: Music Player</h1>
        <div className='app__projects-h1-box'/>
        <p className='app__projects-p'>
        As a means of learning more about python GUIs I decided to create a music player using Tkinter and pygame. 
        Listening to music is one of my favorite hobbies, and so is graphic design, 
        so creating a working and aesthically pleasing MP3 player seemed like a fun challenge to me.
        </p>
        <form action="github.com/Reeto29/Music-Player" method="get" target="_blank">
         <button className='projects__button' type="submit">Click me</button>
        </form>
      </div>
      <video className="images__projects" src={images.musicPlayerVideo} type="video/mp4" controls/>
    </div>

    <div class='centerBoxes'>
      <div class='contentBox'>
        <h1 class='app__projects-h1'>03: Banking App</h1>
        <div className='app__projects-h1-box'/>
        <p className='app__projects-p'>
        A java banking application created using NetBeans. 
        The program allows the user to check balances on various accounts such as their checking account, saving account, TFSA, RRSP. 
        It rudimentarily calculates tax and interest of the bank balance. Allows for transfer funds between accounts. 
        Allows deposit or withdrawal of money.
        </p>
        <form action="https://github.com/Reeto29" method="get" target="_blank">
         <button className='projects__button' type="submit">Click me</button>
        </form>
      </div>
      <video className="images__projects" src={images.bankingAppVideo} type="video/mp4" controls/>
    </div>

  </div>
);

export default Projects;
