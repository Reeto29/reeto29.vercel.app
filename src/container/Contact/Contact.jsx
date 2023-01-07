import React from 'react';
import './Contact.css';
import { images } from "../../constants";

const Contact = () => {
  return (
<div class="footerBoxbg">
  <footer class="footerBox">
            <form action="https://github.com/Reeto29" target="_blank"> 
              <button className='buttonImage' type="submit">
                <img className="button__styling" src={images.github} alt="GitHub"/>
              </button> 
            </form> 

            <form action="https://www.instagram.com/ldh_codeclub/" target="_blank"> 
            <button className='buttonImage' type="submit">
                <img className="button__styling" src={images.instagram} alt="Instagram"/>
              </button> 
            </form> 

            <form action="https://www.linkedin.com/in/reetoghosh/" target="_blank"> 
            <button className='buttonImage' type="submit">
                <img className="button__styling" src={images.linkedin} alt="Linkedin"/>
              </button> 
          </form> 
        </footer>
        </div>
  )
}

export default Contact