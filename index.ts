import listAllComitOfUser, { getRate } from "./gitHubApi";
import * as fs from 'fs';
require('dotenv').config({ path: __dirname + '/.env' });
const path = require('path');
async function createProgress(username: string, DirName: string) {
  let progress: string = `
    <svg
    width="300"
    height="285"
    viewBox="0 0 300 285"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-labelledby="descId"
  >
    <title id="titleId"></title>
    <desc id="descId"></desc>
    <style>
      .header {
        font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
        fill: #61dafb;
        animation: fadeInAnimation 0.8s ease-in-out forwards;
      }
      @supports(-moz-appearance: auto) {
        /* Selector detects Firefox */
        .header { font-size: 15.5px; }
      }
      .lang-name { font: 400 11px 'Segoe UI', Ubuntu, Sans-Serif; fill: #ffffff }


/* Animations */
@keyframes scaleInAnimation {
  from {
    transform: translate(-5px, 5px) scale(0);
  }
  to {
    transform: translate(-5px, 5px) scale(1);
  }
}
@keyframes fadeInAnimation {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

      * { animation-duration: 0s !important; animation-delay: 0s !important; }
    </style>



    <rect
      data-testid="card-bg"
      x="0.5"
      y="0.5"
      rx="4.5"
      height="99%"
      stroke="#e4e2e2"
      width="299"
      fill="#20232a"
      stroke-opacity="1"
    />


  <g
    data-testid="card-title"
    transform="translate(25, 35)"
  >
    <g transform="translate(0, 0)">
  <text
    x="0"
    y="0"
    class="header"
    data-testid="header"
  >Most Used Languages</text>
</g>
  </g>
  <g
    data-testid="main-card-body"
    transform="translate(0, 55)"
  >
    <svg data-testid="lang-items" x="25">
    
`;
  const language = await listAllComitOfUser(username, undefined, ['0d14e31e796610802d493632c0b69cb5cfea30cf', '88cbbd4b8dcee8178f4b2ae17ebb753d4895df02']);
  let i = 0;
  console.log(language);
  console.log('sorting');
  const sortLanguage = new Map(Array.from(language).sort((a, b) => a[1].additions - b[1].additions).reverse());
  sortLanguage.delete('total');
  console.log(sortLanguage);
  sortLanguage.forEach((values, keys) => {
    if (i > 160) {
      return;
    }
    progress += `<g transform="translate(0, ${i})">
        <text data-testid="lang-name" x="2" y="15" class="lang-name">${keys}</text>
        <text x="215" y="34" class="lang-name">${((values.additions / language.get('total').additions) * 100).toFixed(2)}%</text>
        
        <svg width="205" x="0" y="25">
        <rect rx="5" ry="5" x="0" y="0" width="205" height="8" fill="#ddd"></rect>
        <rect
        height="8"
        fill="#e34c26"
        rx="5" ry="5" x="0" y="0"
        data-testid="lang-progress"
        width="${((values.additions / language.get('total').additions) * 100).toFixed(2)}%"
        >
          </rect>
        </svg>
      </g>
      `
    i += 40;
  });
  progress += `
    </svg>
  
    </g>
  </svg>`;
  console.log(progress);
}
console.log('start');
createProgress('unelDev', process.env.PATH);