import React from 'react';

import { images } from "../../constants";
import './Experience.css';

const Experience = () => (
  <div className='app__aboutus section__padding' id="experience">
    <h1 className='app__experience-mainh1'>Experience</h1>

    <div class='centerBoxes'>
      <div class='contentBoxExperience'>
        <h1 class='app__experience-h1'>LDHSS Code Club</h1>
        <div className='app__projects-h1-box'/>
        <h2 class='app__experience-h2'> Co-Leader: November 2020 - June 2022</h2>
        <ul className='app__experience-p'>
            <li> Developed successful project goals and strategies in collaboration with team members. </li>
            <li> Reached out to university students and members of the tech industry to speak to our club. </li>
            <li> Designed and managed posts for Instagram page, and reached out to clubs like student council and mathletes to advertise events. </li>
            <li> Specialized Python & Java Workshops. </li>
        </ul>
        <form action="https://linktr.ee/ldh_codeclub" method="get" target="_blank">
         <button className='projects__button' type="submit">Click me</button>
        </form>
      </div>
      <img className="images__experience" src={images.codeClub} alt="code club image"/>
    </div>

    
    <div class='centerBoxes'>
      <div class='contentBoxExperience'>
        <h1 class='app__experience-h1'>LDHSS Roboravens</h1>
        <div className='app__projects-h1-box'/>
        <h2 class='app__experience-h2'> Design Team Member:</h2>
        <h2 class='app__experience-h2'> October 2019 - June 2021</h2>
        <ul className='app__experience-p'>
            <li> A key contribution of mine included the creation of a student handbook for the design process, which was then featured in club projects</li>
            <li> Presented design work to team members to share and challenge ideas. </li>
            <li> Used Autodesk Inventor to design mechanisms Coordinated drawings and plans from initial concepts to executable CAD documents and specifications.  </li>
            <li> Developed 2D and 3D drawings to support sample fabrication and assembly. </li>
        </ul>
        <form action="https://roboravens.ca/" method="get" target="_blank">
         <button className='projects__button' type="submit">Click me</button>
        </form>
      </div>
      <div class='contentBoxExperience'>
        <h1 class='app__experience-h1'>UO STEM Camp</h1>
        <div className='app__projects-h1-box'/>
        <h2 class='app__experience-h2'> Volunteer: July 2018 - August 2018</h2>
        <ul className='app__experience-p'>
            <li> Helped introduce aspects of STEM such as dissections, labs, and coding to young children.  </li>
            <li> Provided instructional support and assisted in daily project management decisions. </li>
            <li> Quickly learned days content to increase intructional efficiency. </li>
            <li> Volunteered for over 160 Hours. </li>
        </ul>
      </div>
    </div>
   

  </div>
);

export default Experience;
