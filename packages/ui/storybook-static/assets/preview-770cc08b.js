import{s as E}from"./index-d475d2ea.js";import{d as M}from"./index-356e4a49.js";const{logger:x}=__STORYBOOK_MODULE_CLIENT_LOGGER__;var p="backgrounds",{document:s,window:B}=E,S=()=>B.matchMedia("(prefers-reduced-motion: reduce)").matches,_=(r,e=[],n)=>{if(r==="transparent")return"transparent";if(e.find(a=>a.value===r))return r;let t=e.find(a=>a.name===n);if(t)return t.value;if(n){let a=e.map(i=>i.name).join(", ");x.warn(M`
        Backgrounds Addon: could not find the default color "${n}".
        These are the available colors for your story based on your configuration:
        ${a}.
      `)}return"transparent"},v=r=>{(Array.isArray(r)?r:[r]).forEach(w)},w=r=>{let e=s.getElementById(r);e&&e.parentElement.removeChild(e)},A=(r,e)=>{let n=s.getElementById(r);if(n)n.innerHTML!==e&&(n.innerHTML=e);else{let t=s.createElement("style");t.setAttribute("id",r),t.innerHTML=e,s.head.appendChild(t)}},L=(r,e,n)=>{let t=s.getElementById(r);if(t)t.innerHTML!==e&&(t.innerHTML=e);else{let a=s.createElement("style");a.setAttribute("id",r),a.innerHTML=e;let i=`addon-backgrounds-grid${n?`-docs-${n}`:""}`,d=s.getElementById(i);d?d.parentElement.insertBefore(a,d):s.head.appendChild(a)}};const{useMemo:b,useEffect:k}=__STORYBOOK_MODULE_PREVIEW_API__;var O=(r,e)=>{var c;let{globals:n,parameters:t}=e,a=(c=n[p])==null?void 0:c.value,i=t[p],d=b(()=>i.disable?"transparent":_(a,i.values,i.default),[i,a]),o=b(()=>d&&d!=="transparent",[d]),g=e.viewMode==="docs"?`#anchor--${e.id} .docs-story`:".sb-show-main",u=b(()=>{let l="transition: background-color 0.3s;";return`
      ${g} {
        background: ${d} !important;
        ${S()?"":l}
      }
    `},[d,g]);return k(()=>{let l=e.viewMode==="docs"?`addon-backgrounds-docs-${e.id}`:"addon-backgrounds-color";if(!o){v(l);return}L(l,u,e.viewMode==="docs"?e.id:null)},[o,u,e]),r()},T=(r,e)=>{var y;let{globals:n,parameters:t}=e,a=t[p].grid,i=((y=n[p])==null?void 0:y.grid)===!0&&a.disable!==!0,{cellAmount:d,cellSize:o,opacity:g}=a,u=e.viewMode==="docs",c=t.layout===void 0||t.layout==="padded"?16:0,l=a.offsetX??(u?20:c),m=a.offsetY??(u?20:c),$=b(()=>{let f=e.viewMode==="docs"?`#anchor--${e.id} .docs-story`:".sb-show-main",h=[`${o*d}px ${o*d}px`,`${o*d}px ${o*d}px`,`${o}px ${o}px`,`${o}px ${o}px`].join(", ");return`
      ${f} {
        background-size: ${h} !important;
        background-position: ${l}px ${m}px, ${l}px ${m}px, ${l}px ${m}px, ${l}px ${m}px !important;
        background-blend-mode: difference !important;
        background-image: linear-gradient(rgba(130, 130, 130, ${g}) 1px, transparent 1px),
         linear-gradient(90deg, rgba(130, 130, 130, ${g}) 1px, transparent 1px),
         linear-gradient(rgba(130, 130, 130, ${g/2}) 1px, transparent 1px),
         linear-gradient(90deg, rgba(130, 130, 130, ${g/2}) 1px, transparent 1px) !important;
      }
    `},[o]);return k(()=>{let f=e.viewMode==="docs"?`addon-backgrounds-grid-docs-${e.id}`:"addon-backgrounds-grid";if(!i){v(f);return}A(f,$)},[i,$,e]),r()},H=[T,O],R={[p]:{grid:{cellSize:20,opacity:.5,cellAmount:5},values:[{name:"light",value:"#F8F8F8"},{name:"dark",value:"#333333"}]}},G={[p]:null};export{H as decorators,G as globals,R as parameters};
//# sourceMappingURL=preview-770cc08b.js.map
