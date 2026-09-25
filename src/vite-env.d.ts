/// <reference types="vite/client" />

declare module "*.ttf" {
  const content: string;
  export default content;
}

declare module "@react-pdf/fontkit";
declare module "fontkit";
declare module "harfbuzzjs/hbjs.js";
