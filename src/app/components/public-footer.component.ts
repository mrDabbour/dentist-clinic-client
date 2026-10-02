import { Component } from '@angular/core';
@Component({ selector: 'app-public-footer', template: `
  <footer><div><strong>Dintest Dental Clinic</strong><p>Clear information. A simpler path to your next visit.</p></div>
    <nav aria-label="Footer"><a routerLink="/about">About us</a><a routerLink="/team">Our team</a><a routerLink="/services">Services</a><a routerLink="/contact">Contact</a></nav>
    <div><a href="mailto:mohammeddabboornz@gmail.com">mohammeddabboornz@gmail.com</a><a href="tel:+64225974228">022 597 4228</a></div></footer>`,
  styles: [`footer{display:flex;justify-content:space-between;gap:30px;padding:35px max(24px,calc((100vw - 1100px)/2));border-top:1px solid #dce8e3;background:#edf5f2;font:12px Arial,sans-serif;color:#40645f}strong{font-size:15px}p{max-width:260px;line-height:1.7;color:#6a8680}nav,footer>div:last-child{display:flex;flex-direction:column;gap:12px}a{color:#40645f;text-decoration:none}a:hover{text-decoration:underline}a:focus-visible{outline:3px solid #d6b24f;outline-offset:3px}@media(max-width:650px){footer{flex-direction:column;gap:24px}nav{flex-direction:row;flex-wrap:wrap}}`] })
export class PublicFooterComponent {}
