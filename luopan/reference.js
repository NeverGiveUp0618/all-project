/* The supplied screenshots are the visual reference. Only the circular dial is
   sampled at runtime; phone status bars and app chrome are never drawn. */
(function(){
'use strict';
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
window.LuopanReference={ready:(async()=>{
 const [wide,detail]=await Promise.all([load('reference/wide.jpg'),load('reference/detail.jpg')]);
 const capture=im=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);const pixels=x.getImageData(0,0,c.width,c.height);c.width=c.height=0;return pixels};
 const a=capture(wide),b=capture(detail),size=2400,r=size/2,c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),out=x.createImageData(size,size),cos=Math.cos(Math.PI/360),sin=Math.sin(Math.PI/360),ratio=1184/625;
 const pixel=(im,px,py)=>{px=Math.max(0,Math.min(im.width-1,Math.round(px)));py=Math.max(0,Math.min(im.height-1,Math.round(py)));const i=(py*im.width+px)*4;return [im.data[i],im.data[i+1],im.data[i+2]]};
 for(let yy=0;yy<size;yy++)for(let xx=0;xx<size;xx++){
  const dx=(xx-r)*625/r,dy=(yy-r)*625/r;if(dx*dx+dy*dy>625*625)continue;
  const x1=640+dx,y1=1422+dy,x2=1150+(dx*cos-dy*sin)*ratio,y2=1600+(dx*sin+dy*cos)*ratio;
  const valid=x2>=3&&x2<detail.naturalWidth-3&&y2>=410&&y2<2650;
  const line1=Math.abs(dx)<2.8||Math.abs(dy)<2.8,line2=Math.abs(x2-1150)<4.7||Math.abs(y2-1600)<4.7;
  let rgb=valid&&!line2?pixel(b,x2,y2):!line1?pixel(a,x1,y1):null;
  // Where both screenshots cover a silk line, interpolate the immediate
  // circumferential neighbours. No glyphs or table values are invented.
  if(!rgb){let p,q;if(Math.abs(dx)<Math.abs(dy)){p=pixel(a,x1-4,y1);q=pixel(a,x1+4,y1)}else{p=pixel(a,x1,y1-4);q=pixel(a,x1,y1+4)}rgb=p.map((v,i)=>Math.round((v+q[i])/2))}
  // Original onboarding text covers a tiny arc in both supplied screenshots.
  // Keep the original glyphs elsewhere; this occluded arc is not a quiz source.
  const hint=x1>548&&x1<734&&y1>1018&&y1<1061;
  if(hint&&((rgb[0]>120&&rgb[2]>130)||(rgb[2]>55&&rgb[1]<110&&rgb[0]>60)))rgb=[247,231,159];
  const i=(yy*size+xx)*4;out.data[i]=rgb[0];out.data[i+1]=rgb[1];out.data[i+2]=rgb[2];out.data[i+3]=255;
 }
 x.putImageData(out,0,0);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));c.width=c.height=0;if(!blob)throw Error('reference render failed');const url=URL.createObjectURL(blob);return {url,sourceHeading:116.2};
})()};
})();
