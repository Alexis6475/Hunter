import{useState,useMemo,useRef,useEffect,useCallback}from"react";
import*as d3 from"d3";

const P="#E87722",Dk="#1e2a3a",F="'DM Sans',system-ui,sans-serif";
const SEGMENTS=["Industrial Production","Retail & Consumer Networks","Healthcare & Social Care","Banking & Financial Services","Logistics & Transport","Real Estate"];
const SUB_SEG={"Industrial Production":["Automotive","FMCG Manufacturing","Heavy Industry","Electronics","Chemicals"],"Retail & Consumer Networks":["Grocery Chains","Fashion Retail","DIY & Home","Shopping Centers"],"Healthcare & Social Care":["Hospitals","Clinics","Elderly Care","Pharma Facilities"],"Banking & Financial Services":["Retail Banking","Corporate Banking","Insurance","FinTech"],"Logistics & Transport":["Warehousing","Distribution Centers","Port Facilities","Freight Hubs"],"Real Estate":["Office Buildings","Mixed-Use Complexes","Industrial Parks","Residential Estates"]};
const REGIONS=["Mazowieckie","Śląskie","Wielkopolskie","Małopolskie","Dolnośląskie","Łódzkie","Pomorskie","Zachodniopomorskie"];
const STATUSES=["New Suspect","Lost Prospect","Lost Client","Current Client"];
const PRIORITIES=["P1 - High Priority","P2 - Opportunistic"];
const SEGC={"Industrial Production":"#E87722","Retail & Consumer Networks":"#f59e0b","Healthcare & Social Care":"#8b5cf6","Banking & Financial Services":"#06b6d4","Logistics & Transport":"#10b981","Real Estate":"#f43f5e"};
const REGC={"Mazowieckie":"#E87722","Śląskie":"#f59e0b","Wielkopolskie":"#8b5cf6","Małopolskie":"#06b6d4","Dolnośląskie":"#10b981","Łódzkie":"#f43f5e","Pomorskie":"#2563eb","Zachodniopomorskie":"#6b7280"};
const STAC={"New Suspect":"#f59e0b","Lost Prospect":"#ef4444","Lost Client":"#ec4899","Current Client":"#10b981"};

function genCo(n){const pfx=["Pol","War","Krak","Gdań","Wrocł","Łódź","Pozn","Szcz","Lub","Kat","Bial","Czest","Rad","Tor","Kiel","Ols","Rzesz","Opol","Gliwi","Zabrz","Bydg","Tychy","Sosnow","Elbl","Płock","Tarn","Chorzów","Bytom","Ruda"],sfx=["Tech Sp. z o.o.","Invest S.A.","Group Sp. z o.o.","Solutions S.A.","Holding Sp. z o.o.","Industrial S.A.","Logistics Sp. z o.o.","Development S.A.","Services Sp. z o.o.","Capital S.A.","Engineering Sp. z o.o.","Systems S.A.","Management Sp. z o.o.","Partners S.A.","International Sp. z o.o."],co=[],u=new Set(),r=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,p=a=>a[Math.floor(Math.random()*a.length)],rf=(a,b)=>+(Math.random()*(b-a)+a).toFixed(1);
for(let i=0;i<n;i++){let nm;do{nm=p(pfx)+p(["a","o","ex","is","um","en","ia"])+" "+p(sfx)}while(u.has(nm));u.add(nm);const seg=p(SEGMENTS),rev=r(50,2000);co.push({id:i+1,nip:r(100,999)+"-"+r(10,99)+"-"+r(10,99)+"-"+r(100,999),name:nm,segment:seg,subSegment:p(SUB_SEG[seg]),region:p(REGIONS),ownership:Math.random()<.12?"Public":"Private",priority:rev>200?"P1 - High Priority":Math.random()<.55?"P1 - High Priority":"P2 - Opportunistic",status:p(STATUSES),revenue:rev,profit:rf(1,18),outsourcingPropensity:p(["High","Medium","Low"]),potentialSpend:rf(.2,8),employees:r(80,12000),sites:r(1,45),businessScale:p(["Large","Mid-Market","SME"])})}return co}

const PQ=[{cat:"STRATEGIC FIT",color:"#e11d48",items:[{id:"intent",name:"Intent to outsource FM",desc:"Considering outsourcing FM?",q:["Considering outsourcing?","New need?","What's driving this?"],w:3},{id:"scope",name:"Service scope",desc:"Which FM services?",q:["Which services?","One or multiple providers?","Scope expand?"],w:2}]},{cat:"OPERATIONAL FIT",color:"#2563eb",items:[{id:"ability",name:"AP ability to respond",desc:"Fits AP capabilities?",q:["Key requirements?","Constraints?","Service levels?"],w:3},{id:"geography",name:"Geography / footprint",desc:"Where needed?",q:["Site locations?","How many?","Single/multi?"],w:2}]},{cat:"LEAD QUALITY",color:"#f59e0b",items:[{id:"competitor",name:"Competitor / wallet share",desc:"Another provider?",q:["Current provider?","Satisfaction?","Replace?"],w:2},{id:"interest",name:"Interest shown",desc:"Client engaged?",q:["Open to follow-up?","Important today?"],w:2},{id:"need",name:"Need / pain points",desc:"Clear business need?",q:["FM challenges?","Improve what?","Ideal solution?"],w:1}]}];
const PF_SEC=[{id:"general",title:"General Information",icon:"🏢",fields:[{id:"contactName",l:"Contact",t:"text"},{id:"contactTitle",l:"Title",t:"text"},{id:"contactEmail",l:"Email",t:"text"},{id:"contactPhone",l:"Phone",t:"text"},{id:"linkedinUrl",l:"LinkedIn",t:"text"},{id:"industry",l:"Industry",t:"text"}]},{id:"before",title:"Before Interaction",icon:"📋",fields:[{id:"companyProfile",l:"Profile",t:"area"},{id:"currentProvider",l:"Current Provider",t:"text"},{id:"contractExpiry",l:"Contract Expiry",t:"text"},{id:"totalSurface",l:"Surface (m²)",t:"text"},{id:"decisionMaker",l:"Decision Maker",t:"area"},{id:"keyPriorities",l:"Priorities",t:"area"}]},{id:"during",title:"During Interaction",icon:"💬",fields:[{id:"meetingDate",l:"Date",t:"text"},{id:"meetingType",l:"Type",t:"text"},{id:"attendees",l:"Attendees",t:"text"},{id:"expressedNeeds",l:"Needs",t:"area"},{id:"painPoints",l:"Pain Points",t:"area"},{id:"objections",l:"Objections",t:"area"},{id:"priceSensitivity",l:"Price Sensitivity",t:"text"},{id:"nextStepsAgreed",l:"Next Steps",t:"area"}]},{id:"after",title:"After Interaction",icon:"⚙️",fields:[{id:"debriefNotes",l:"Debrief",t:"area"},{id:"revisedProbability",l:"Win Prob.",t:"text"},{id:"blockingPoints",l:"Blockers",t:"area"},{id:"nextActions",l:"Actions",t:"area"},{id:"followUpDate",l:"Follow-up",t:"text"},{id:"estimatedValue",l:"Value (PLN)",t:"text"}]}];

function calcWS(sc){let tw=0,tu=0;PQ.forEach(c=>c.items.forEach(it=>{if(sc[it.id]){tw+=sc[it.id]*it.w;tu+=it.w}}));return tu?tw/tu:0}
function getQ(ws){if(ws>=3.8)return{label:"SQL",full:"Sales Qualified Lead",color:"#16a34a",bg:"#dcfce7",bdr:"#86efac"};if(ws>=2.5)return{label:"MQL",full:"Marketing Qualified Lead",color:"#f59e0b",bg:"#fef3c7",bdr:"#fcd34d"};if(ws>0)return{label:"NR",full:"Not Relevant",color:"#ef4444",bg:"#fee2e2",bdr:"#fca5a5"};return null}
function useStore(){const[data,setData]=useState(()=>{try{return JSON.parse(localStorage.getItem("at_v5")||"{}")}catch{return{}}});const save=(id,key,val)=>{setData(p=>{const next={...p,[id]:{...p[id],[key]:val}};try{localStorage.setItem("at_v5",JSON.stringify(next))}catch{}return next})};const get=id=>data[id]||{};const qual=id=>{const d=data[id];if(!d||!d.scores||!Object.keys(d.scores).length)return null;return getQ(calcWS(d.scores))};const hasFile=id=>{const d=data[id];return d&&d.prospect&&Object.values(d.prospect).some(v=>v&&typeof v==="string"&&v.trim())};return{save,get,qual,hasFile}}

const cd={background:"#fff",borderRadius:16,boxShadow:"0 1px 3px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.03)",border:"1px solid #f0f0f5"};
const inp={padding:"8px 11px",borderRadius:10,border:"1px solid #e5e7eb",fontSize:13,fontFamily:F,outline:"none",color:Dk,boxSizing:"border-box",background:"#fafafa",width:"100%"};

/* ═══ PURE REACT CHARTS (no d3 dependency issues) ═══ */
function HBar({items,colorMap}){const max=Math.max(...items.map(d=>d.v),1);return<div style={{display:"flex",flexDirection:"column",gap:6}}>{items.sort((a,b)=>b.v-a.v).map(d=><div key={d.k} style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:110,fontSize:10,fontWeight:600,color:"#6b7280",textAlign:"right",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.k}</div><div style={{flex:1,height:22,background:"#f3f4f6",borderRadius:6,overflow:"hidden",position:"relative"}}><div style={{height:"100%",width:(d.v/max*100)+"%",background:colorMap[d.k]||P,borderRadius:6,transition:"width .5s"}}/><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:10,fontWeight:800,color:d.v/max>.25?"#fff":"#374151"}}>{typeof d.v==="number"&&d.v>999?Math.round(d.v/1000)+"k":d.v}</span></div></div>)}</div>}

function MiniDonut({items,colorMap,size}){
  const total=items.reduce((s,d)=>s+d.v,0);let cum=0;const sz=size||140;
  const arcs=items.map(d=>{const start=cum/total*360;cum+=d.v;return{...d,start,end:cum/total*360}});
  function arcPath(cx,cy,r,startDeg,endDeg){const s=startDeg-90,e=endDeg-90,sr=s*Math.PI/180,er=e*Math.PI/180,large=endDeg-startDeg>180?1:0;return"M "+(cx+r*Math.cos(sr))+" "+(cy+r*Math.sin(sr))+" A "+r+" "+r+" 0 "+large+" 1 "+(cx+r*Math.cos(er))+" "+(cy+r*Math.sin(er))}
  const r=sz/2,inner=r*.55;
  return<svg viewBox={"0 0 "+sz+" "+sz} width={sz} height={sz}>
    {arcs.map((a,i)=><path key={i} d={arcPath(r,r,r-2,a.start,Math.min(a.end,a.start+359.9))+" L "+(r+(inner)*Math.cos((a.end-90)*Math.PI/180))+" "+(r+(inner)*Math.sin((a.end-90)*Math.PI/180))+" A "+inner+" "+inner+" 0 "+(a.end-a.start>180?1:0)+" 0 "+(r+inner*Math.cos((a.start-90)*Math.PI/180))+" "+(r+inner*Math.sin((a.start-90)*Math.PI/180))+" Z"} fill={colorMap[a.k]||"#ccc"}/>)}
    <text x={r} y={r} textAnchor="middle" dy=".35em" fontSize={14} fontWeight={900} fill={Dk}>{total.toLocaleString()}</text>
  </svg>;
}

/* ═══ WATERFALL (d3 - isolated) ═══ */
function Waterfall({total,p1,p2,priv,pub,ns,cc,lost}){
  const ref=useRef(),cRef=useRef(),[ww,setWW]=useState(500);
  useEffect(()=>{const ro=new ResizeObserver(e=>{const w=e[0]&&e[0].contentRect.width;if(w>50)setWW(w)});if(cRef.current)ro.observe(cRef.current);return()=>ro.disconnect()},[]);
  useEffect(()=>{
    if(!ref.current||!total)return;const svg=d3.select(ref.current);svg.selectAll("*").remove();
    const steps=[{l:"Total",v:total,t:"total"},{l:"P2",v:-p2,t:"dec"},{l:"P1",v:p1,t:"sub"},{l:"Public",v:-pub,t:"dec"},{l:"Private",v:priv,t:"acc"},{l:"Current",v:-cc,t:"dec"},{l:"Lost",v:-lost,t:"dec"},{l:"Suspects",v:ns,t:"fin"}];
    const h=250,m={top:25,right:10,bottom:50,left:45},iw=ww-m.left-m.right,ih=h-m.top-m.bottom;
    const g=svg.attr("viewBox","0 0 "+ww+" "+h).append("g").attr("transform","translate("+m.left+","+m.top+")");
    const x=d3.scaleBand().domain(steps.map(function(d){return d.l})).range([0,iw]).padding(.18);
    const mx=Math.max.apply(null,steps.filter(function(s){return s.v>0}).map(function(s){return s.v}))*1.15;
    const y=d3.scaleLinear().domain([0,mx]).range([ih,0]);
    var run=0;var bars=steps.map(function(s){var y0,y1;if(s.t==="total"||s.t==="sub"||s.t==="acc"||s.t==="fin"){y0=0;y1=Math.abs(s.v);run=Math.abs(s.v)}else{y0=run+s.v;y1=run;run=y0}return Object.assign({},s,{y0:y0,y1:y1})});
    for(var i=0;i<bars.length-1;i++){var c=bars[i],n=bars[i+1],fy=(c.t==="dec")?y(c.y0):y(c.y1);g.append("line").attr("x1",x(c.l)+x.bandwidth()).attr("x2",x(n.l)).attr("y1",fy).attr("y2",fy).attr("stroke","#d1d5db").attr("stroke-dasharray","3,3")}
    var bg=g.selectAll(".b").data(bars).join("g");
    bg.append("rect").attr("x",function(d){return x(d.l)}).attr("width",x.bandwidth()).attr("y",function(d){return y(Math.max(d.y0,d.y1))}).attr("height",0).attr("rx",5).attr("fill",function(d){return d.t==="total"?Dk:d.t==="sub"?"#475569":d.t==="acc"?P:d.t==="fin"?"#16a34a":"#e5e7eb"}).transition().duration(500).delay(function(_,i){return i*60}).attr("height",function(d){return Math.abs(y(d.y0)-y(d.y1))});
    bg.append("text").attr("x",function(d){return x(d.l)+x.bandwidth()/2}).attr("y",function(d){return y(Math.max(d.y0,d.y1))-5}).attr("text-anchor","middle").attr("font-size",10).attr("font-weight",800).attr("fill",Dk).attr("opacity",0).text(function(d){return Math.abs(d.v).toLocaleString()}).transition().duration(250).delay(function(_,i){return i*60+350}).attr("opacity",1);
    g.append("g").attr("transform","translate(0,"+ih+")").call(d3.axisBottom(x).tickSize(0)).selectAll("text").attr("font-size",9).attr("fill","#9ca3af");g.selectAll(".domain").remove();
    g.append("g").call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(","))).selectAll("text").attr("font-size",9).attr("fill","#9ca3af");g.selectAll(".tick line").attr("stroke","#f3f4f6");g.selectAll(".domain").remove();
  },[total,p1,p2,priv,pub,ns,cc,lost,ww]);
  return<div ref={cRef} style={{width:"100%"}}><svg ref={ref} style={{width:"100%",height:"auto"}}/></div>;
}

/* ═══ SMALL COMPONENTS ═══ */
function KPI({label,value,sub,accent}){return<div style={Object.assign({},cd,{padding:"16px 20px",flex:"1 1 160px",minWidth:145,position:"relative",overflow:"hidden"})}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".12em",color:"#9ca3af",marginBottom:3,fontWeight:700}}>{label}</div><div style={{fontSize:26,fontWeight:900,color:Dk,lineHeight:1.1}}>{value}</div>{sub&&<div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{sub}</div>}<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:accent}}/></div>}
function SBadge({s}){var m={"New Suspect":{bg:"#fef3c7",t:"#92400e"},"Lost Prospect":{bg:"#fee2e2",t:"#991b1b"},"Lost Client":{bg:"#fce7f3",t:"#9d174d"},"Current Client":{bg:"#d1fae5",t:"#065f46"}}[s]||{bg:"#f3f4f6",t:"#374151"};return<span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:m.bg,color:m.t}}>{s}</span>}
function PBadge({p}){var p1=p.includes("P1");return<span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:p1?P:"#f3f4f6",color:p1?"#fff":"#6b7280"}}>{p1?"P1":"P2"}</span>}
function ODot({v}){var c=v==="High"?"#16a34a":v==="Medium"?"#f59e0b":"#ef4444";return<span style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}><span style={{width:8,height:8,borderRadius:"50%",background:c}}/>{v}</span>}
function QBadge({q}){if(!q)return null;return<span style={{display:"inline-block",padding:"2px 7px",borderRadius:20,fontSize:9,fontWeight:800,background:q.bg,color:q.color,marginLeft:6}}>{q.label}</span>}
function ScoreBtn({value,onChange,color}){return<div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(function(n){return<button key={n} onClick={function(){onChange(n)}} style={{width:36,height:36,borderRadius:10,border:value===n?"2.5px solid "+color:"2px solid #e5e7eb",background:value===n?color:"#fff",color:value===n?"#fff":"#9ca3af",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{n}</button>})}</div>}
function Gauge({score}){var q=getQ(score),pct=Math.min(score/5,1)*100;return<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><div style={{fontSize:32,fontWeight:900,color:Dk,lineHeight:1}}>{score>0?score.toFixed(1):"—"}<span style={{fontSize:13,fontWeight:500,color:"#9ca3af"}}>/5</span></div><div style={{width:"100%",position:"relative",marginTop:2}}><div style={{display:"flex",height:10,borderRadius:20,overflow:"hidden"}}><div style={{flex:50,background:"#fca5a5"}}/><div style={{flex:26,background:"#fcd34d"}}/><div style={{flex:24,background:"#86efac"}}/></div>{score>0&&<div style={{position:"absolute",top:-3,left:pct+"%",transform:"translateX(-50%)",transition:"left .5s"}}><div style={{width:4,height:16,background:Dk,borderRadius:2}}/></div>}<div style={{display:"flex",justifyContent:"space-between",marginTop:3}}><span style={{fontSize:8,fontWeight:800,color:"#ef4444"}}>NR</span><span style={{fontSize:8,fontWeight:800,color:"#f59e0b"}}>MQL</span><span style={{fontSize:8,fontWeight:800,color:"#16a34a"}}>SQL</span></div></div>{q&&<div style={{padding:"4px 16px",borderRadius:20,background:q.bg,color:q.color,fontWeight:800,fontSize:12}}>{q.full}</div>}</div>}

/* ═══ SIDE PANELS ═══ */
function Side({children,onClose}){return<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.35)",backdropFilter:"blur(4px)"}} onClick={function(e){if(e.target===e.currentTarget)onClose()}}><div style={{position:"absolute",top:0,right:0,bottom:0,width:"min(660px,92vw)",background:"#fafafa",boxShadow:"-12px 0 40px rgba(0,0,0,.12)",overflowY:"auto",animation:"sl .22s ease-out"}}><style>{"@keyframes sl{from{transform:translateX(100%)}to{transform:translateX(0)}}"}</style>{children}</div></div>}
function PHead({title,sub,onSave,saved,onClose}){return<div style={{background:"linear-gradient(135deg,"+Dk+",#2d3748)",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}><div style={{flex:1,minWidth:0}}><h2 style={{margin:0,fontSize:15,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</h2>{sub&&<p style={{margin:"2px 0 0",fontSize:10,color:"rgba(255,255,255,.5)"}}>{sub}</p>}</div><div style={{display:"flex",gap:5}}><button onClick={onSave} style={{padding:"5px 14px",borderRadius:10,border:"none",background:saved?"#16a34a":P,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:F}}>{saved?"✓":"Save"}</button><button onClick={onClose} style={{width:28,height:28,borderRadius:8,border:"none",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div></div>}

function PrequalPanel({co,store,onClose}){
  var s0=store.get(co.id);var[scores,setS]=useState(s0.scores||{});var[notes,setN]=useState(s0.notes||{});var[showQ,setSQ]=useState({});var[ok,setOk]=useState(false);
  useEffect(function(){store.save(co.id,"scores",scores);store.save(co.id,"notes",notes)},[scores,notes]);
  var ws=useMemo(function(){return calcWS(scores)},[scores]);var tot=PQ.reduce(function(s,c){return s+c.items.length},0);var done=Object.keys(scores).filter(function(k){return scores[k]}).length;
  return<Side onClose={onClose}><PHead title={"🎯 "+co.name} sub={co.segment+" · "+co.region+" · "+co.revenue+"m€"} onSave={function(){setOk(true);setTimeout(function(){setOk(false)},1200)}} saved={ok} onClose={onClose}/>
    <div style={{padding:"16px 20px"}}>
      <div style={Object.assign({},cd,{padding:16,marginBottom:16,display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"})}><div style={{flex:1,minWidth:160}}><Gauge score={ws}/></div>
        <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:130}}><div style={{fontSize:11,color:"#6b7280"}}>{done}/{tot} criteria</div>
          {done>0&&<div style={{fontSize:9,color:"#6b7280",background:"#f9fafb",borderRadius:8,padding:"4px 7px",border:"1px solid #e5e7eb",lineHeight:1.7}}>{PQ.map(function(cat){return cat.items.filter(function(it){return scores[it.id]}).map(function(it){return<span key={it.id} style={{display:"block"}}><b style={{color:cat.color}}>{it.name.split("/")[0].split(" ").slice(0,2).join(" ")}</b> {scores[it.id]}×{it.w}={scores[it.id]*it.w}</span>})}).flat()}<span style={{display:"block",borderTop:"1px solid #e5e7eb",marginTop:2,paddingTop:2,fontWeight:800,color:Dk}}>= {ws.toFixed(1)}/5</span></div>}
          {PQ.map(function(cat){var cs=cat.items.filter(function(c){return scores[c.id]});var avg=cs.length?cs.reduce(function(s,c){return s+scores[c.id]},0)/cs.length:0;return<div key={cat.cat}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:9,fontWeight:800,color:cat.color}}>{cat.cat}</span><span style={{fontSize:9,fontWeight:800}}>{avg.toFixed(1)}</span></div><div style={{height:3,background:"#e5e7eb",borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:(avg/5*100)+"%",background:cat.color,borderRadius:20}}/></div></div>})}</div></div>
      {PQ.map(function(cat){return<div key={cat.cat} style={{marginBottom:14}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}><div style={{width:3,height:14,borderRadius:3,background:cat.color}}/><span style={{fontSize:10,fontWeight:900,textTransform:"uppercase",letterSpacing:".1em",color:cat.color}}>{cat.cat}</span></div>
        {cat.items.map(function(it){return<div key={it.id} style={Object.assign({},cd,{padding:"12px 14px",marginBottom:7,borderLeft:"3px solid "+(scores[it.id]?cat.color:"#e5e7eb")})}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}><span style={{fontSize:12,fontWeight:700,color:Dk}}>{it.name}</span><span style={{fontSize:9,fontWeight:800,color:cat.color,background:cat.color+"12",padding:"1px 7px",borderRadius:20}}>w={it.w}</span></div>
          <p style={{margin:"0 0 6px",fontSize:11,color:"#6b7280"}}>{it.desc}</p>
          <ScoreBtn value={scores[it.id]||0} onChange={function(v){setS(function(p){var n=Object.assign({},p);n[it.id]=v;return n})}} color={cat.color}/>
          <button onClick={function(){setSQ(function(p){var n=Object.assign({},p);n[it.id]=!p[it.id];return n})}} style={{marginTop:4,background:"none",border:"none",cursor:"pointer",fontSize:10,color:P,fontFamily:F,padding:0,fontWeight:700}}>{showQ[it.id]?"▾":"▸"} Questions</button>
          {showQ[it.id]&&<div style={{marginTop:3,paddingLeft:8,borderLeft:"2px solid #e5e7eb"}}>{it.q.map(function(q,i){return<p key={i} style={{margin:"1px 0",fontSize:10,color:"#6b7280"}}>→ {q}</p>})}</div>}
          <textarea placeholder="Notes…" value={notes[it.id]||""} onChange={function(e){var id=it.id,val=e.target.value;setN(function(p){var n=Object.assign({},p);n[id]=val;return n})}} rows={2} style={Object.assign({},inp,{marginTop:5,fontSize:12})}/>
        </div>})}</div>})}</div></Side>;
}

function ProspectPanel({co,store,onClose}){
  var s0=store.get(co.id);var defs={industry:co.segment+" — "+co.subSegment,companyProfile:co.name+"\nNIP: "+co.nip+"\nRegion: "+co.region+"\nRevenue: "+co.revenue+"m€\nEmployees: "+co.employees.toLocaleString()+"\nSites: "+co.sites+"\nScale: "+co.businessScale};
  var[fields,setF]=useState(Object.assign({},defs,s0.prospect||{}));var[ok,setOk]=useState(false);
  useEffect(function(){store.save(co.id,"prospect",fields)},[fields]);
  var filled=Object.values(fields).filter(function(v){return v&&typeof v==="string"&&v.trim()}).length;var total=PF_SEC.reduce(function(s,sec){return s+sec.fields.length},0);
  return<Side onClose={onClose}><PHead title={"📋 "+co.name} sub={co.segment+" · "+co.region+" · "+co.revenue+"m€"} onSave={function(){setOk(true);setTimeout(function(){setOk(false)},1200)}} saved={ok} onClose={onClose}/>
    <div style={{padding:"16px 20px"}}>
      <div style={Object.assign({},cd,{padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10})}><span style={{fontSize:10,fontWeight:700,color:"#6b7280"}}>{filled}/{total}</span><div style={{flex:1,height:5,background:"#e5e7eb",borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:(filled/total*100)+"%",background:P,borderRadius:20}}/></div></div>
      {PF_SEC.map(function(sec){return<div key={sec.id} style={{marginBottom:16}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}><span style={{fontSize:14}}>{sec.icon}</span><span style={{fontSize:12,fontWeight:800,color:Dk}}>{sec.title}</span></div>
        <div style={Object.assign({},cd,{padding:"12px 14px",display:"flex",flexDirection:"column",gap:8})}>{sec.fields.map(function(f){return<div key={f.id}><label style={{display:"block",fontSize:9,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>{f.l}</label>
          {f.t==="area"?<textarea value={fields[f.id]||""} onChange={function(e){var id=f.id,val=e.target.value;setF(function(p){var n=Object.assign({},p);n[id]=val;return n})}} rows={3} style={inp}/>:<input value={fields[f.id]||""} onChange={function(e){var id=f.id,val=e.target.value;setF(function(p){var n=Object.assign({},p);n[id]=val;return n})}} style={inp}/>}</div>})}</div></div>})}</div></Side>;
}

/* ═══ EDITABLE CELL ═══ */
function EditCell({value,onSave,type,options,render}){
  var[editing,setEditing]=useState(false);var[val,setVal]=useState(value);var ref=useRef();
  useEffect(function(){if(editing&&ref.current){ref.current.focus();if(ref.current.select)ref.current.select()}},[editing]);
  useEffect(function(){setVal(value)},[value]);
  if(!editing)return<span onDoubleClick={function(){setEditing(true)}} style={{cursor:"default"}} title="Double-click to edit">{render?render(value):(typeof value==="number"?value.toLocaleString():value)}</span>;
  var done=function(){setEditing(false);if(val!==value)onSave(type==="number"?Number(val):val)};
  if(options)return<select ref={ref} value={val} onChange={function(e){setVal(e.target.value);onSave(e.target.value);setEditing(false)}} onBlur={function(){setEditing(false)}} style={Object.assign({},inp,{width:"auto",fontSize:12,padding:"2px 6px"})}>{options.map(function(o){return<option key={o} value={o}>{o}</option>})}</select>;
  return<input ref={ref} type={type==="number"?"number":"text"} value={val} onChange={function(e){setVal(e.target.value)}} onBlur={done} onKeyDown={function(e){if(e.key==="Enter")done()}} style={Object.assign({},inp,{width:type==="number"?70:140,fontSize:12,padding:"2px 6px"})}/>;
}

/* ═══ MAIN ═══ */
var COLS=[{k:"name",l:"Company",w:190},{k:"segment",l:"Segment",w:145},{k:"region",l:"Region",w:105},{k:"priority",l:"Prio",w:60},{k:"status",l:"Status",w:115},{k:"revenue",l:"Rev (m€)",w:80},{k:"employees",l:"Emp",w:70},{k:"sites",l:"Sites",w:50},{k:"outsourcingPropensity",l:"Outsrc",w:78}];

export default function App(){
  var[companies,setCo]=useState(function(){return genCo(1390)});
  var[view,setView]=useState("dashboard");var[search,setSearch]=useState("");
  var[segF,setSegF]=useState("All");var[staF,setStaF]=useState("All");var[priF,setPriF]=useState("All");
  var[sortK,setSortK]=useState("revenue");var[sortD,setSortD]=useState("desc");
  var[page,setPage]=useState(0);var[panel,setPanel]=useState(null);var[hovRow,setHovRow]=useState(null);
  var store=useStore();var PS=30;

  var updateCo=useCallback(function(id,key,val){setCo(function(prev){return prev.map(function(c){if(c.id===id){var n=Object.assign({},c);n[key]=val;return n}return c})})},[]);

  var filtered=useMemo(function(){var d=companies.slice();if(search){var q=search.toLowerCase();d=d.filter(function(c){return c.name.toLowerCase().includes(q)||c.nip.includes(q)})}if(segF!=="All")d=d.filter(function(c){return c.segment===segF});if(staF!=="All")d=d.filter(function(c){return c.status===staF});if(priF!=="All")d=d.filter(function(c){return c.priority===priF});d.sort(function(a,b){var av=a[sortK],bv=b[sortK];if(typeof av==="string"){av=av.toLowerCase();bv=bv.toLowerCase()}return sortD==="asc"?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0)});return d},[companies,search,segF,staF,priF,sortK,sortD]);

  var pg=filtered.slice(page*PS,(page+1)*PS),tp=Math.ceil(filtered.length/PS);
  var hs=function(k){if(sortK===k)setSortD(sortD==="asc"?"desc":"asc");else{setSortK(k);setSortD("desc")}setPage(0)};
  var avg=(filtered.reduce(function(s,c){return s+c.revenue},0)/(filtered.length||1)).toFixed(0);
  var p1c=filtered.filter(function(c){return c.priority.includes("P1")}).length;
  var nsc=filtered.filter(function(c){return c.status==="New Suspect"}).length;
  var wfTotal=filtered.length,wfP1=p1c,wfP2=wfTotal-wfP1,wfPriv=filtered.filter(function(c){return c.ownership==="Private"}).length,wfPub=wfTotal-wfPriv,wfNs=nsc,wfCc=filtered.filter(function(c){return c.status==="Current Client"}).length,wfLost=filtered.filter(function(c){return c.status.includes("Lost")}).length;

  var segItems=SEGMENTS.map(function(s){return{k:s.replace(/ & /g," "),v:filtered.filter(function(c){return c.segment===s}).length}});
  var staItems=STATUSES.map(function(s){return{k:s,v:filtered.filter(function(c){return c.status===s}).length}});
  var regItems=REGIONS.map(function(r){return{k:r,v:filtered.filter(function(c){return c.region===r}).length}});
  var revItems=SEGMENTS.map(function(s){return{k:s.split(" ")[0],v:Math.round(filtered.filter(function(c){return c.segment===s}).reduce(function(a,c){return a+c.revenue},0))}});
  var segCM=Object.fromEntries(SEGMENTS.map(function(s){return[s.replace(/ & /g," "),SEGC[s]]}));
  var revCM=Object.fromEntries(SEGMENTS.map(function(s){return[s.split(" ")[0],SEGC[s]]}));

  return<div style={{fontFamily:F,background:"#f3f4f6",minHeight:"100vh",color:Dk}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&display=swap" rel="stylesheet"/>
    {panel&&panel.type==="prequal"&&<PrequalPanel co={panel.co} store={store} onClose={function(){setPanel(null)}}/>}
    {panel&&panel.type==="prospect"&&<ProspectPanel co={panel.co} store={store} onClose={function(){setPanel(null)}}/>}

    <header style={{background:Dk,padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:8,background:P,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:14}}>A</div><div style={{fontSize:14,fontWeight:800,color:"#fff"}}>ATALIAN <span style={{fontWeight:400,opacity:.5}}>Poland</span></div></div>
      <div style={{display:"flex",gap:3}}>{[{id:"dashboard",lb:"Dashboard"},{id:"table",lb:"Hunt List"}].map(function(v){return<button key={v.id} onClick={function(){setView(v.id);setPage(0)}} style={{padding:"5px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:F,background:view===v.id?P:"transparent",color:view===v.id?"#fff":"rgba(255,255,255,.5)"}}>{v.lb}</button>})}</div>
    </header>

    <main style={{padding:"18px 24px 36px",maxWidth:1380,margin:"0 auto"}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:18}}>
        <KPI label="Companies" value={filtered.length.toLocaleString()} sub="in scope" accent={Dk}/>
        <KPI label="P1 Priority" value={p1c.toLocaleString()} sub={((p1c/(filtered.length||1))*100).toFixed(0)+"%"} accent={P}/>
        <KPI label="New Suspects" value={nsc.toLocaleString()} sub="to contact" accent="#f59e0b"/>
        <KPI label="Avg Revenue" value={avg+"m€"} sub="per company" accent="#16a34a"/>
      </div>

      {view==="dashboard"?<div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div style={Object.assign({},cd,{padding:"18px 20px"})}><h3 style={{margin:"0 0 8px",fontSize:14,fontWeight:800}}>Pipeline Funnel</h3><Waterfall total={wfTotal} p1={wfP1} p2={wfP2} priv={wfPriv} pub={wfPub} ns={wfNs} cc={wfCc} lost={wfLost}/></div>
          <div style={Object.assign({},cd,{padding:"18px 20px"})}><h3 style={{margin:"0 0 8px",fontSize:14,fontWeight:800}}>By Segment</h3><HBar items={segItems} colorMap={segCM}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <div style={Object.assign({},cd,{padding:"18px 20px"})}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:800}}>By Status</h3><div style={{display:"flex",alignItems:"center",gap:16}}><MiniDonut items={staItems} colorMap={STAC}/><div style={{display:"flex",flexDirection:"column",gap:6}}>{staItems.map(function(d){return<div key={d.k} style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,borderRadius:3,background:STAC[d.k]}}/><span style={{fontSize:11,color:"#6b7280"}}>{d.k}</span><span style={{fontSize:11,fontWeight:800,color:Dk,marginLeft:"auto"}}>{d.v}</span></div>})}</div></div></div>
          <div style={Object.assign({},cd,{padding:"18px 20px"})}><h3 style={{margin:"0 0 8px",fontSize:14,fontWeight:800}}>Revenue by Segment</h3><HBar items={revItems} colorMap={revCM}/></div>
          <div style={Object.assign({},cd,{padding:"18px 20px"})}><h3 style={{margin:"0 0 8px",fontSize:14,fontWeight:800}}>By Region</h3><HBar items={regItems} colorMap={REGC}/></div>
        </div>
      </div>:

      <div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12,alignItems:"center"}}>
          <input placeholder="Search…" value={search} onChange={function(e){setSearch(e.target.value);setPage(0)}} style={Object.assign({},inp,{width:200,background:"#fff"})}/>
          {[{v:segF,s:setSegF,o:["All"].concat(SEGMENTS),l:"Segment"},{v:staF,s:setStaF,o:["All"].concat(STATUSES),l:"Status"},{v:priF,s:setPriF,o:["All"].concat(PRIORITIES),l:"Priority"}].map(function(f){return<select key={f.l} value={f.v} onChange={function(e){f.s(e.target.value);setPage(0)}} style={Object.assign({},inp,{width:"auto",background:"#fff",cursor:"pointer"})}>{f.o.map(function(o){return<option key={o} value={o}>{o==="All"?f.l:o}</option>})}</select>})}
          <span style={{fontSize:10,color:"#9ca3af",marginLeft:"auto",fontWeight:600}}>{filtered.length} results · double-click to edit</span>
        </div>
        <div style={Object.assign({},cd,{overflow:"hidden"})}><div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{COLS.map(function(c){return<th key={c.k} onClick={function(){hs(c.k)}} style={{padding:"9px 12px",textAlign:"left",fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:sortK===c.k?P:"#9ca3af",borderBottom:"2px solid #f0f0f5",cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",minWidth:c.w,background:"#fafafa"}}>{c.l}{sortK===c.k?(sortD==="asc"?" ↑":" ↓"):""}</th>})}</tr></thead>
            <tbody>{pg.map(function(c,i){var q=store.qual(c.id);var hf=store.hasFile(c.id);var isH=hovRow===c.id;
              return<tr key={c.id} style={{background:isH?"#eef2ff":i%2===0?"#fff":"#fafafa",transition:"background .1s",position:"relative"}} onMouseEnter={function(){setHovRow(c.id)}} onMouseLeave={function(){setHovRow(null)}}>
                {COLS.map(function(col){return<td key={col.k} style={{padding:"8px 12px",borderBottom:"1px solid #f0f0f5",whiteSpace:"nowrap",color:"#374151"}}>
                  {col.k==="name"?<div style={{display:"flex",alignItems:"center"}}><EditCell value={c.name} onSave={function(v){updateCo(c.id,"name",v)}} render={function(v){return<span style={{fontWeight:700,color:Dk}}>{v}</span>}}/>{q&&<QBadge q={q}/>}{hf&&<span style={{marginLeft:3,fontSize:9,color:P}}>📋</span>}</div>:
                  col.k==="segment"?<EditCell value={c.segment} onSave={function(v){updateCo(c.id,"segment",v)}} options={SEGMENTS}/>:
                  col.k==="region"?<EditCell value={c.region} onSave={function(v){updateCo(c.id,"region",v)}} options={REGIONS}/>:
                  col.k==="priority"?<EditCell value={c.priority} onSave={function(v){updateCo(c.id,"priority",v)}} options={PRIORITIES} render={function(v){return<PBadge p={v}/>}}/>:
                  col.k==="status"?<EditCell value={c.status} onSave={function(v){updateCo(c.id,"status",v)}} options={STATUSES} render={function(v){return<SBadge s={v}/>}}/>:
                  col.k==="revenue"?<EditCell value={c.revenue} onSave={function(v){updateCo(c.id,"revenue",v)}} type="number" render={function(v){return<span style={{fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{Number(v).toLocaleString()}</span>}}/>:
                  col.k==="employees"?<EditCell value={c.employees} onSave={function(v){updateCo(c.id,"employees",v)}} type="number" render={function(v){return<span style={{fontVariantNumeric:"tabular-nums"}}>{Number(v).toLocaleString()}</span>}}/>:
                  col.k==="sites"?<EditCell value={c.sites} onSave={function(v){updateCo(c.id,"sites",v)}} type="number"/>:
                  col.k==="outsourcingPropensity"?<EditCell value={c.outsourcingPropensity} onSave={function(v){updateCo(c.id,"outsourcingPropensity",v)}} options={["High","Medium","Low"]} render={function(v){return<ODot v={v}/>}}/>:
                  c[col.k]}
                </td>})}
                {isH&&<td style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",display:"flex",gap:4,zIndex:5}}>
                  <button onClick={function(){setPanel({type:"prequal",co:c})}} style={{padding:"5px 12px",borderRadius:8,border:"none",background:P,color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:F,boxShadow:"0 2px 10px "+P+"44"}}>🎯 Pre-qual</button>
                  <button onClick={function(){setPanel({type:"prospect",co:c})}} style={{padding:"5px 12px",borderRadius:8,border:"none",background:Dk,color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:F,boxShadow:"0 2px 10px "+Dk+"44"}}>📋 Prospect</button>
                </td>}
              </tr>})}</tbody>
          </table></div></div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:6,marginTop:12}}>
          <button disabled={page===0} onClick={function(){setPage(page-1)}} style={{padding:"5px 14px",borderRadius:8,border:"1px solid #e5e7eb",background:page===0?"#f3f4f6":"#fff",cursor:page===0?"default":"pointer",fontSize:11,fontFamily:F,color:page===0?"#d1d5db":Dk,fontWeight:700}}>←</button>
          <span style={{fontSize:11,color:"#6b7280",fontWeight:700}}>{page+1}/{tp}</span>
          <button disabled={page>=tp-1} onClick={function(){setPage(page+1)}} style={{padding:"5px 14px",borderRadius:8,border:"1px solid #e5e7eb",background:page>=tp-1?"#f3f4f6":"#fff",cursor:page>=tp-1?"default":"pointer",fontSize:11,fontFamily:F,color:page>=tp-1?"#d1d5db":Dk,fontWeight:700}}>→</button>
        </div>
      </div>}
    </main>
    <footer style={{textAlign:"center",padding:12,fontSize:10,color:"#9ca3af"}}><b style={{color:P}}>ATALIAN</b> × <b>Simon-Kucher</b> · Sales Excellence · Poland</footer>
  </div>;
}
