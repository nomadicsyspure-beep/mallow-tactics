function sprOf(job){ return SPRITES[HERO_DB[job].spr]; }
/* character looks: hair and skin pixels of a job sprite are recolored on a canvas; female adds long hair behind the head.
   spr(job,look) gives an <img> its src (the plain sprite until the recolor is ready) and a key that is swapped in when done */
const HAIRS=[{n:'갈색',h:22,s:.62,v:1},{n:'검정',h:225,s:.25,v:.55},{n:'금발',h:44,s:.62,v:1.75},{n:'빨강',h:6,s:.75,v:1.2},{n:'은발',h:210,s:.08,v:1.9},{n:'파랑',h:215,s:.6,v:1.25}];
const SKINS=[{n:'밝음',h:24,s:.33,v:1.04},{n:'보통',h:24,s:.45,v:.97},{n:'구릿빛',h:22,s:.55,v:.78},{n:'짙음',h:20,s:.55,v:.56}];
function rgb2hsv(r,g,b){ r/=255;g/=255;b/=255; const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn; let h=0; if(d){ h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4; h*=60; if(h<0) h+=360; } return [h,mx?d/mx:0,mx]; }
function hsv2rgb(h,s,v){ const c=v*s, x=c*(1-Math.abs((h/60)%2-1)), m=v-c; let r=0,g=0,b=0; if(h<60)[r,g,b]=[c,x,0]; else if(h<120)[r,g,b]=[x,c,0]; else if(h<180)[r,g,b]=[0,c,x]; else if(h<240)[r,g,b]=[0,x,c]; else if(h<300)[r,g,b]=[x,0,c]; else [r,g,b]=[c,0,x]; return [(r+m)*255,(g+m)*255,(b+m)*255]; }
function swatch(c,v){ return 'rgb('+hsv2rgb(c.h,c.s,Math.min(1,v*c.v)).map(Math.round).join(',')+')'; }
const lookCache={}, lookBusy={};
function lookKey(job,look){ return `${job}-${look.sex}${look.hair}${look.skin}`; }
function spr(job,look){
  if(!look) return `src="${sprOf(job)}"`;
  const key=lookKey(job,look);
  if(!lookCache[key]&&!lookBusy[key]){ lookBusy[key]=1; recolor(sprOf(job),look,url=>{ lookCache[key]=url; document.querySelectorAll(`img[data-lk="${key}"]`).forEach(i=>{ i.src=url; }); }); }
  return `src="${lookCache[key]||sprOf(job)}" data-lk="${key}"`;
}
function recolor(src,look,cb){
  const img=new Image();
  img.onload=()=>{
    const W=img.width, H=img.height, c=document.createElement('canvas'); c.width=W; c.height=H;
    const x=c.getContext('2d'); x.drawImage(img,0,0); const d=x.getImageData(0,0,W,H), p=d.data;
    const hair=HAIRS[look.hair]||HAIRS[0], skin=SKINS[look.skin]||SKINS[0], mask=new Uint8Array(W*H), xs=[], ys=[];
    for(let y=0;y<H;y++) for(let i=0;i<W;i++){
      const o=(y*W+i)*4; if(p[o+3]<100) continue;
      const [h,s,v]=rgb2hsv(p[o],p[o+1],p[o+2]), warm=h<=40||h>=350;
      /* hair: saturated brown in the top third (boots and belt share the brown but sit lower); skin: mid-saturation peach */
      if(warm&&y<H*.31&&s>.45&&v<.72){ mask[y*W+i]=1; const [r,g,b]=hsv2rgb(hair.h,hair.s,Math.min(1,v*hair.v)); p[o]=r;p[o+1]=g;p[o+2]=b; xs.push(i); ys.push(y); }
      else if(warm&&s>.26&&s<.62&&v>.68){ const [r,g,b]=hsv2rgb(skin.h,skin.s+(s-.42)*.6,Math.min(1,v*skin.v)); p[o]=r;p[o+1]=g;p[o+2]=b; }
    }
    if(look.sex==='f'&&xs.length>20){
      /* long hair falling behind the head (the art faces right, so the back is on the left); percentiles keep a stray brown pixel from stretching the head box */
      const q=(a,f)=>a.slice().sort((m,n)=>m-n)[Math.floor(a.length*f)];
      const left=q(xs,.06), right=q(xs,.94), top=q(ys,.03), bot=q(ys,.97), hw=right-left;
      const x0=left-Math.round(hw*.04), x1=left+Math.round(hw*.5), y0=top+Math.round((bot-top)*.5), y1=Math.min(H-1,bot+Math.round(H*.17));
      const dark=hsv2rgb(hair.h,Math.min(1,hair.s+.1),Math.min(1,.26*hair.v)), mid=hsv2rgb(hair.h,hair.s,Math.min(1,.42*hair.v)), lite=hsv2rgb(hair.h,hair.s,Math.min(1,.6*hair.v));
      for(let y=y0;y<=y1;y++){
        const t=(y-y0)/(y1-y0), a=x0+Math.round(t*t*hw*.16), b=x1-Math.round(t*t*hw*.34);
        for(let i=Math.max(0,a);i<=b;i++){ const k=y*W+i, o=k*4; if(mask[k]) continue; const col=i===a||i===b||y===y1?dark:(i-a)%3===1?lite:mid; p[o]=col[0];p[o+1]=col[1];p[o+2]=col[2];p[o+3]=255; }
      }
    }
    x.putImageData(d,0,0); cb(c.toDataURL());
  };
  img.src=src;
}

