import{useState,useMemo,useRef,useEffect}from"react";
import*as d3 from"d3";

/* ═══════════════════════════════════════════════════════════════
   ATALIAN POLAND — SALES EXCELLENCE TOOL
   Colors: Atalian blue #004B87, accent green #00A651, dark #0A1628
   SK accent #be123c (for scoring), neutral slate
   ═══════════════════════════════════════════════════════════════ */
const C={primary:"#E87722",dark:"#1a1a2e",accent:"#E87722",score:"#be123c",light:"#fef7f0",card:"#ffffff",text:"#1a1a2e",muted:"#6b7280",border:"#e5e7eb",bgPage:"#f9fafb"};
const F="'DM Sans','Segoe UI',system-ui,sans-serif";

/* ═══ DATA ═══ */
const SEGMENTS=["Industrial Production","Retail & Consumer Networks","Healthcare & Social Care","Banking & Financial Services","Logistics & Transport","Real Estate"];
const SUB_SEG={"Industrial Production":["Automotive","FMCG Manufacturing","Heavy Industry","Electronics","Chemicals"],"Retail & Consumer Networks":["Grocery Chains","Fashion Retail","DIY & Home","Shopping Centers"],"Healthcare & Social Care":["Hospitals","Clinics","Elderly Care","Pharma Facilities"],"Banking & Financial Services":["Retail Banking","Corporate Banking","Insurance","FinTech"],"Logistics & Transport":["Warehousing","Distribution Centers","Port Facilities","Freight Hubs"],"Real Estate":["Office Buildings","Mixed-Use Complexes","Industrial Parks","Residential Estates"]};
const REGIONS=["Mazowieckie","Śląskie","Wielkopolskie","Małopolskie","Dolnośląskie","Łódzkie","Pomorskie","Zachodniopomorskie"];
const STATUSES=["New Suspect","Lost Prospect","Lost Client","Current Client"];
const PRIORITIES=["P1 - High Priority","P2 - Opportunistic"];

function genCo(n){const pfx=["Pol","War","Krak","Gdań","Wrocł","Łódź","Pozn","Szcz","Lub","Kat","Bial","Czest","Rad","Tor","Kiel","Ols","Rzesz","Opol","Gliwi","Zabrz","Bydg","Tychy","Sosnow","Elbl","Płock","Tarn","Chorzów","Bytom","Ruda"],sfx=["Tech Sp. z o.o.","Invest S.A.","Group Sp. z o.o.","Solutions S.A.","Holding Sp. z o.o.","Industrial S.A.","Logistics Sp. z o.o.","Development S.A.","Services Sp. z o.o.","Capital S.A.","Engineering Sp. z o.o.","Systems S.A.","Management Sp. z o.o.","Partners S.A.","International Sp. z o.o."],co=[],u=new Set(),r=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,p=a=>a[Math.floor(Math.random()*a.length)],rf=(a,b)=>+(Math.random()*(b-a)+a).toFixed(1);
for(let i=0;i<n;i++){let nm;do{nm=p(pfx)+p(["a","o","ex","is","um","en","ia"])+" "+p(sfx)}while(u.has(nm));u.add(nm);const seg=p(SEGMENTS),rev=r(50,2000);co.push({id:i+1,nip:`${r(100,999)}-${r(10,99)}-${r(10,99)}-${r(100,999)}`,name:nm,segment:seg,subSegment:p(SUB_SEG[seg]),region:p(REGIONS),ownership:Math.random()<.12?"Public":"Private",priority:rev>200?"P1 - High Priority":Math.random()<.55?"P1 - High Priority":"P2 - Opportunistic",status:p(STATUSES),revenue:rev,profit:rf(1,18),outsourcingPropensity:p(["High","Medium","Low"]),potentialSpend:rf(.2,8),employees:r(80,12000),sites:r(1,45),businessScale:p(["Large","Mid-Market","SME"])})}return co}
const ALL=genCo(1390);

const WF=[{l:"Active NIP\n(>50m€)",v:4344,t:"total"},{l:"Non-priority",v:-894,t:"decrease"},{l:"Priority\nsegments",v:3450,t:"subtotal"},{l:"Not mapped",v:-261,t:"decrease"},{l:"P2 Opp.",v:-1613,t:"decrease"},{l:"P1 High",v:1576,t:"subtotal"},{l:"Public",v:-186,t:"decrease"},{l:"Private\n(Scope)",v:1390,t:"final"}];
const SBD=[{s:"Industrial Production",n:885,c:"#E87722"},{s:"Retail & Consumer",n:211,c:"#1a1a2e"},{s:"Healthcare & Social",n:18,c:"#6b7280"},{s:"Banking & Financial",n:97,c:"#f59e0b"},{s:"Logistics & Transport",n:71,c:"#d97706"},{s:"Real Estate",n:74,c:"#c2410c"}];

const PQ=[
  {cat:"STRATEGIC FIT",color:"#e11d48",items:[
    {id:"intent",name:"Intent to outsource FM",desc:"Is the client considering outsourcing part or all FM services?",q:["Are you currently considering outsourcing any part of your FM services?","Is this a new need or reviewing current setup?","What is driving this reflection?"],w:3},
    {id:"scope",name:"Offer / service scope",desc:"Which FM services are in scope? Single, bundled, or integrated?",q:["Which services are you looking for?","One provider for all or selected services?","Could the scope expand over time?"],w:2},
  ]},
  {cat:"OPERATIONAL FIT",color:"#004B87",items:[
    {id:"ability",name:"Ability of AP to respond",desc:"Does the opportunity fit AP capabilities?",q:["Key service requirements?","Technical, safety, or compliance constraints?","Expected service levels?"],w:3},
    {id:"geography",name:"Geography / site footprint",desc:"Where are services needed? Local, regional, multi-site?",q:["Where are the sites located?","How many sites?","Single-site or multi-site?","All locations covered?"],w:2},
  ]},
  {cat:"LEAD QUALITY",color:"#f59e0b",items:[
    {id:"competitor",name:"Competitor / share of wallet",desc:"Is another provider in place? What can be won?",q:["Who currently provides?","Satisfaction with current provider?","Replace or complement?","Scope open for review?"],w:2},
    {id:"interest",name:"Interest shown",desc:"How engaged is the client?",q:["Open to follow-up?","How important today?","Come back with detailed discussion?"],w:2},
    {id:"need",name:"Detailed need / pain points",desc:"Clear view of business need?",q:["Challenges with current FM?","What to improve?","Ideal solution?","Top decision criteria?"],w:1},
  ]},
];

const PF_SEC=[
  {id:"general",title:"General Information",icon:"🏢",fields:[{id:"contactName",l:"Contact Name",t:"text"},{id:"contactTitle",l:"Job Title",t:"text"},{id:"contactEmail",l:"Email",t:"text"},{id:"contactPhone",l:"Phone",t:"text"},{id:"linkedinUrl",l:"LinkedIn URL",t:"text"},{id:"industry",l:"Industry",t:"text"}]},
  {id:"before",title:"Before Interaction",icon:"📋",fields:[{id:"companyProfile",l:"Company Profile",t:"area"},{id:"currentProvider",l:"Current FM Provider",t:"text"},{id:"contractExpiry",l:"Contract Expiry",t:"text"},{id:"totalSurface",l:"Total Surface (m²)",t:"text"},{id:"decisionMaker",l:"Decision Maker",t:"area"},{id:"keyPriorities",l:"Key Priorities",t:"area"}]},
  {id:"during",title:"During Interaction",icon:"💬",fields:[{id:"meetingDate",l:"Date",t:"text"},{id:"meetingType",l:"Type",t:"text"},{id:"attendees",l:"Attendees",t:"text"},{id:"expressedNeeds",l:"Expressed Needs",t:"area"},{id:"painPoints",l:"Pain Points",t:"area"},{id:"objections",l:"Objections",t:"area"},{id:"priceSensitivity",l:"Price Sensitivity",t:"text"},{id:"nextStepsAgreed",l:"Next Steps",t:"area"}]},
  {id:"after",title:"After Interaction",icon:"⚙️",fields:[{id:"debriefNotes",l:"Debrief Notes",t:"area"},{id:"revisedProbability",l:"Win Probability",t:"text"},{id:"blockingPoints",l:"Blocking Points",t:"area"},{id:"nextActions",l:"Next Actions",t:"area"},{id:"followUpDate",l:"Follow-up Date",t:"text"},{id:"estimatedValue",l:"Est. Contract Value (PLN)",t:"text"}]},
];

function calcWS(sc){let tw=0,tu=0;PQ.forEach(c=>c.items.forEach(it=>{if(sc[it.id]){tw+=sc[it.id]*it.w;tu+=it.w}}));return tu?tw/tu:0}
function getQ(ws){if(ws>=3.8)return{label:"SQL",full:"Sales Qualified Lead",color:"#16a34a",bg:"#dcfce7",bdr:"#86efac"};if(ws>=2.5)return{label:"MQL",full:"Marketing Qualified Lead",color:"#f59e0b",bg:"#fef3c7",bdr:"#fcd34d"};if(ws>0)return{label:"NR",full:"Not Relevant",color:"#ef4444",bg:"#fee2e2",bdr:"#fca5a5"};return null}

function useStore(){
  const[data,setData]=useState(()=>{try{return JSON.parse(localStorage.getItem("atalian_v2")||"{}")}catch{return{}}});
  const save=(id,key,val)=>{setData(p=>{const next={...p,[id]:{...p[id],[key]:val,ts:Date.now()}};try{localStorage.setItem("atalian_v2",JSON.stringify(next))}catch{}return next})};
  const get=id=>data[id]||{};
  const qual=id=>{const d=data[id];if(!d?.scores||!Object.keys(d.scores).length)return null;return getQ(calcWS(d.scores))};
  const hasFile=id=>{const d=data[id];return d?.prospect&&Object.values(d.prospect).some(v=>v&&v.trim&&v.trim())};
  const cnt=Object.keys(data).filter(k=>data[k]?.scores&&Object.keys(data[k].scores).length).length;
  const fileCnt=Object.keys(data).filter(k=>data[k]?.prospect&&Object.values(data[k].prospect).some(v=>v&&v.trim&&v.trim())).length;
  return{save,get,qual,hasFile,cnt,fileCnt};
}

/* ═══ CHARTS ═══ */
function Waterfall(){const ref=useRef(),cRef=useRef(),[dims,setDims]=useState({w:900,h:400});useEffect(()=>{const ro=new ResizeObserver(e=>{for(const en of e){const w=en.contentRect.width;if(w>100)setDims({w,h:Math.min(400,Math.max(280,w*.42))})}});if(cRef.current)ro.observe(cRef.current);return()=>ro.disconnect()},[]);useEffect(()=>{if(!ref.current)return;const svg=d3.select(ref.current);svg.selectAll("*").remove();const m={top:35,right:20,bottom:70,left:55},w=dims.w-m.left-m.right,h=dims.h-m.top-m.bottom,g=svg.append("g").attr("transform",`translate(${m.left},${m.top})`);const x=d3.scaleBand().domain(WF.map(d=>d.l)).range([0,w]).padding(.22),y=d3.scaleLinear().domain([0,5000]).range([h,0]);let run=0;const bars=WF.map(s=>{let y0,y1,dv;if(["total","subtotal","final"].includes(s.t)){y0=0;y1=Math.abs(s.v);dv=Math.abs(s.v);run=Math.abs(s.v)}else{y0=run+s.v;y1=run;dv=s.v;run=y0}return{...s,y0,y1,dv}});for(let i=0;i<bars.length-1;i++){const c=bars[i],n=bars[i+1],fy=c.t==="decrease"?y(c.y0):y(c.y1);g.append("line").attr("x1",x(c.l)+x.bandwidth()).attr("x2",x(n.l)).attr("y1",fy).attr("y2",fy).attr("stroke",C.muted).attr("stroke-width",1).attr("stroke-dasharray","3,3").attr("opacity",.4)}const bg=g.selectAll(".b").data(bars).join("g");bg.append("rect").attr("x",d=>x(d.l)).attr("width",x.bandwidth()).attr("y",d=>y(Math.max(d.y0,d.y1))).attr("height",0).attr("rx",4).attr("fill",d=>d.t==="total"?C.dark:d.t==="subtotal"?C.primary:d.t==="final"?C.accent:"#cbd5e1").transition().duration(700).delay((_,i)=>i*90).attr("height",d=>Math.abs(y(d.y0)-y(d.y1)));bg.append("text").attr("x",d=>x(d.l)+x.bandwidth()/2).attr("y",d=>y(Math.max(d.y0,d.y1))-7).attr("text-anchor","middle").attr("font-size",12).attr("font-weight",800).attr("fill",C.text).attr("opacity",0).text(d=>Math.abs(d.dv).toLocaleString()).transition().duration(350).delay((_,i)=>i*90+500).attr("opacity",1);g.append("g").attr("transform",`translate(0,${h})`).call(d3.axisBottom(x).tickSize(0)).selectAll("text").attr("font-size",9).attr("fill",C.muted);g.select(".domain").remove();g.append("g").call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(","))).selectAll("text").attr("font-size",9).attr("fill",C.muted);g.selectAll(".tick line").attr("stroke",C.border);g.select(".domain").remove();g.append("g").selectAll("line").data(y.ticks(4)).join("line").attr("x1",0).attr("x2",w).attr("y1",d=>y(d)).attr("y2",d=>y(d)).attr("stroke",C.border).attr("stroke-width",.5).lower()},[dims]);return<div ref={cRef} style={{width:"100%"}}><svg ref={ref} viewBox={`0 0 ${dims.w} ${dims.h}`} style={{width:"100%",height:"auto"}}/></div>}

function Donut(){const ref=useRef(),[hov,setHov]=useState(null);useEffect(()=>{if(!ref.current)return;const svg=d3.select(ref.current);svg.selectAll("*").remove();const s=240,r=s/2,inner=r*.58,g=svg.append("g").attr("transform",`translate(${r},${r})`);const pie=d3.pie().value(d=>d.n).sort(null).padAngle(.015),arc=d3.arc().innerRadius(inner).outerRadius(r-3),arcH=d3.arc().innerRadius(inner).outerRadius(r);g.selectAll("path").data(pie(SBD)).join("path").attr("d",arc).attr("fill",d=>d.data.c).attr("stroke","#fff").attr("stroke-width",2).attr("cursor","pointer").attr("opacity",.9).on("mouseenter",function(_,d){d3.select(this).transition().duration(150).attr("d",arcH).attr("opacity",1);setHov(d.data)}).on("mouseleave",function(){d3.select(this).transition().duration(150).attr("d",arc).attr("opacity",.9);setHov(null)});g.append("text").attr("text-anchor","middle").attr("dy","-.2em").attr("font-size",26).attr("font-weight",900).attr("fill",C.primary).text("1,356");g.append("text").attr("text-anchor","middle").attr("dy","1.3em").attr("font-size",10).attr("fill",C.muted).attr("letter-spacing",".06em").text("NEW SUSPECTS")},[]);return<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}><svg ref={ref} viewBox="0 0 240 240" style={{width:210,height:210}}/>{hov&&<div style={{background:C.light,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,color:C.text,border:`2px solid ${hov.c}`}}>{hov.s}: {hov.n}</div>}<div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px",justifyContent:"center"}}>{SBD.map(s=><div key={s.s} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.muted}}><span style={{width:8,height:8,borderRadius:2,background:s.c,display:"inline-block"}}/>{s.s}</div>)}</div></div>}

/* ═══ SMALL COMPONENTS ═══ */
function KPI({label,value,sub,accent}){return<div style={{background:C.card,borderRadius:12,padding:"18px 20px",borderLeft:`4px solid ${accent}`,boxShadow:"0 1px 4px rgba(0,40,80,.06)",flex:"1 1 170px",minWidth:155}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".1em",color:C.muted,marginBottom:5,fontWeight:700}}>{label}</div><div style={{fontSize:26,fontWeight:900,color:C.text,lineHeight:1.1}}>{value}</div>{sub&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{sub}</div>}</div>}
function SBadge({s}){const m={"New Suspect":{bg:"#fef3c7",t:"#92400e",b:"#fbbf24"},"Lost Prospect":{bg:"#fee2e2",t:"#991b1b",b:"#fca5a5"},"Lost Client":{bg:"#fce7f3",t:"#9d174d",b:"#f9a8d4"},"Current Client":{bg:"#d1fae5",t:"#065f46",b:"#6ee7b7"}}[s]||{bg:"#f1f5f9",t:"#475569",b:"#cbd5e1"};return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:m.bg,color:m.t,border:`1px solid ${m.b}`}}>{s}</span>}
function PBadge({p}){const p1=p.includes("P1");return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:800,background:p1?C.primary:"#f1f5f9",color:p1?"#fff":C.muted}}>{p1?"P1":"P2"}</span>}
function ODot({v}){const c=v==="High"?"#16a34a":v==="Medium"?"#f59e0b":"#ef4444";return<span style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}><span style={{width:7,height:7,borderRadius:"50%",background:c,display:"inline-block"}}/>{v}</span>}
function QBadge({q}){if(!q)return null;return<span style={{display:"inline-block",padding:"1px 6px",borderRadius:4,fontSize:9,fontWeight:800,background:q.bg,color:q.color,border:`1px solid ${q.bdr}`,marginLeft:6}}>{q.label}</span>}
function ScoreBtn({value,onChange,color}){return<div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>onChange(n)} style={{width:34,height:34,borderRadius:8,border:value===n?`2px solid ${color}`:`2px solid ${C.border}`,background:value===n?color:C.card,color:value===n?"#fff":C.muted,fontSize:13,fontWeight:800,cursor:"pointer",transition:"all .12s",fontFamily:"inherit"}}>{n}</button>)}</div>}
function Gauge({score}){const q=getQ(score),pct=Math.min(score/5,1)*100;return<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><div style={{fontSize:32,fontWeight:900,color:C.text,lineHeight:1}}>{score>0?score.toFixed(1):"—"}<span style={{fontSize:14,fontWeight:600,color:C.muted}}>/5</span></div><div style={{width:"100%",position:"relative",marginTop:2}}><div style={{display:"flex",height:10,borderRadius:5,overflow:"hidden"}}><div style={{flex:50,background:"#fca5a5"}}/><div style={{flex:26,background:"#fcd34d"}}/><div style={{flex:24,background:"#86efac"}}/></div>{score>0&&<div style={{position:"absolute",top:-3,left:`${pct}%`,transform:"translateX(-50%)",transition:"left .5s cubic-bezier(.34,1.56,.64,1)"}}><div style={{width:4,height:16,background:C.dark,borderRadius:2}}/></div>}<div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:8,fontWeight:800,color:"#ef4444"}}>NR</span><span style={{fontSize:8,fontWeight:800,color:"#f59e0b"}}>MQL</span><span style={{fontSize:8,fontWeight:800,color:"#16a34a"}}>SQL</span></div></div>{q&&<div style={{padding:"4px 14px",borderRadius:6,background:q.bg,border:`2px solid ${q.bdr}`,color:q.color,fontWeight:800,fontSize:12}}>{q.full}</div>}</div>}

/* ═══ SIDE PANEL ═══ */
function Side({children,onClose}){return<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(10,22,40,.5)",backdropFilter:"blur(3px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div style={{position:"absolute",top:0,right:0,bottom:0,width:"min(700px,92vw)",background:C.bgPage,boxShadow:"-12px 0 40px rgba(0,20,60,.2)",overflowY:"auto",animation:"sl .2s ease-out"}}><style>{`@keyframes sl{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>{children}</div></div>}
function PanelHead({title,sub,onSave,saved,onClose}){return<div style={{background:`linear-gradient(135deg,${C.dark},${C.primary})`,padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}><div style={{flex:1,minWidth:0}}><h2 style={{margin:0,fontSize:16,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</h2>{sub&&<p style={{margin:"3px 0 0",fontSize:11,color:"rgba(255,255,255,.6)"}}>{sub}</p>}</div><div style={{display:"flex",gap:6}}><button onClick={onSave} style={{padding:"6px 14px",borderRadius:8,border:"none",background:saved?C.accent:C.score,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:F,transition:"background .2s"}}>{saved?"✓ Saved":"💾 Save"}</button><button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:"none",background:"rgba(255,255,255,.12)",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div></div>}

/* ═══ PREQUAL PANEL ═══ */
function PrequalPanel({co,store,onClose}){
  const s0=store.get(co.id);const[scores,setS]=useState(s0.scores||{});const[notes,setN]=useState(s0.notes||{});const[showQ,setSQ]=useState({});const[ok,setOk]=useState(false);
  useEffect(()=>{store.save(co.id,"scores",scores);store.save(co.id,"notes",notes)},[scores,notes]);
  const ws=useMemo(()=>calcWS(scores),[scores]);const tot=PQ.reduce((s,c)=>s+c.items.length,0);const done=Object.keys(scores).filter(k=>scores[k]).length;
  const doSave=()=>{store.save(co.id,"scores",scores);store.save(co.id,"notes",notes);setOk(true);setTimeout(()=>setOk(false),1500)};
  return<Side onClose={onClose}><PanelHead title={`🎯 ${co.name}`} sub={`${co.segment} · ${co.region} · ${co.revenue}m€`} onSave={doSave} saved={ok} onClose={onClose}/>
    <div style={{padding:"20px 24px"}}>
      <div style={{background:C.card,borderRadius:14,padding:18,boxShadow:"0 1px 4px rgba(0,40,80,.05)",marginBottom:20,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:180}}><Gauge score={ws}/></div>
        <div style={{display:"flex",flexDirection:"column",gap:5,minWidth:150}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600}}>{done}/{tot} criteria</div>
          {done>0&&<div style={{fontSize:9,color:C.muted,background:C.light,borderRadius:6,padding:"5px 7px",border:`1px solid ${C.border}`,lineHeight:1.7}}>
            {PQ.map(cat=>cat.items.filter(it=>scores[it.id]).map(it=><span key={it.id} style={{display:"block"}}><b style={{color:cat.color}}>{it.name.split("/")[0].trim().split(" ").slice(0,2).join(" ")}</b> {scores[it.id]}×{it.w}={scores[it.id]*it.w}</span>)).flat()}
            <span style={{display:"block",borderTop:`1px solid ${C.border}`,marginTop:3,paddingTop:3,fontWeight:800,color:C.text}}>= {ws.toFixed(1)}/5</span>
          </div>}
          {PQ.map(cat=>{const cs=cat.items.filter(c=>scores[c.id]);const avg=cs.length?cs.reduce((s,c)=>s+scores[c.id],0)/cs.length:0;return<div key={cat.cat}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:9,fontWeight:800,color:cat.color}}>{cat.cat}</span><span style={{fontSize:9,fontWeight:800,color:C.text}}>{avg.toFixed(1)}</span></div><div style={{height:4,background:C.border,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${(avg/5)*100}%`,background:cat.color,borderRadius:2,transition:"width .3s"}}/></div></div>})}
        </div>
      </div>
      {PQ.map(cat=><div key={cat.cat} style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{width:4,height:18,borderRadius:2,background:cat.color}}/><h3 style={{margin:0,fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:".1em",color:cat.color}}>{cat.cat}</h3></div>
        {cat.items.map(it=><div key={it.id} style={{background:C.card,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 3px rgba(0,40,80,.04)",borderLeft:`4px solid ${scores[it.id]?cat.color:C.border}`,marginBottom:10,transition:"border-color .2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><h4 style={{margin:0,fontSize:13,fontWeight:700,color:C.text}}>{it.name}</h4><span style={{fontSize:9,fontWeight:800,color:cat.color,background:cat.color+"15",padding:"1px 7px",borderRadius:4}}>weight={it.w}</span></div>
          <p style={{margin:"0 0 8px",fontSize:11,color:C.muted,lineHeight:1.5}}>{it.desc}</p>
          <ScoreBtn value={scores[it.id]||0} onChange={v=>setS(p=>({...p,[it.id]:v}))} color={cat.color}/>
          <button onClick={()=>setSQ(p=>({...p,[it.id]:!p[it.id]}))} style={{marginTop:6,background:"none",border:"none",cursor:"pointer",fontSize:11,color:C.primary,fontFamily:F,padding:0,fontWeight:600}}>{showQ[it.id]?"▾":"▸"} Questions ({it.q.length})</button>
          {showQ[it.id]&&<div style={{marginTop:4,paddingLeft:10,borderLeft:`2px solid ${C.border}`}}>{it.q.map((qq,qi)=><p key={qi} style={{margin:"2px 0",fontSize:11,color:C.muted}}>→ {qq}</p>)}</div>}
          <textarea placeholder="Notes…" value={notes[it.id]||""} onChange={e=>setN(p=>({...p,[it.id]:e.target.value}))} rows={2} style={{marginTop:6,width:"100%",padding:"7px 9px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:12,fontFamily:F,resize:"vertical",outline:"none",color:C.text,boxSizing:"border-box",background:C.light}}/>
        </div>)}
      </div>)}
    </div>
  </Side>;
}

/* ═══ PROSPECT FILE PANEL ═══ */
function ProspectPanel({co,store,onClose}){
  const s0=store.get(co.id);
  const defaults={industry:`${co.segment} — ${co.subSegment}`,companyProfile:`${co.name}\nNIP: ${co.nip}\nRegion: ${co.region}\nRevenue: ${co.revenue}m€\nEmployees: ${co.employees.toLocaleString()}\nSites: ${co.sites}\nScale: ${co.businessScale}\nOwnership: ${co.ownership}\nPriority: ${co.priority}\nOutsourcing: ${co.outsourcingPropensity}`};
  const merged={...defaults,...(s0.prospect||{})};
  const[fields,setF]=useState(merged);const[ok,setOk]=useState(false);
  useEffect(()=>{store.save(co.id,"prospect",fields)},[fields]);
  const doSave=()=>{store.save(co.id,"prospect",fields);setOk(true);setTimeout(()=>setOk(false),1500)};
  const filled=Object.values(fields).filter(v=>v&&v.trim&&v.trim()).length;const total=PF_SEC.reduce((s,sec)=>s+sec.fields.length,0);
  return<Side onClose={onClose}><PanelHead title={`📋 ${co.name}`} sub={`${co.segment} · ${co.region} · ${co.revenue}m€ · ${co.employees.toLocaleString()} emp.`} onSave={doSave} saved={ok} onClose={onClose}/>
    <div style={{padding:"20px 24px"}}>
      <div style={{background:C.card,borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 4px rgba(0,40,80,.05)",marginBottom:18,display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontSize:11,color:C.muted,fontWeight:700}}>{filled}/{total} fields</div>
        <div style={{flex:1,height:5,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(filled/total)*100}%`,background:C.primary,borderRadius:3,transition:"width .3s"}}/></div>
        <div style={{fontSize:9,color:C.muted}}>Auto-saved</div>
      </div>
      {PF_SEC.map(sec=><div key={sec.id} style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:16}}>{sec.icon}</span><h3 style={{margin:0,fontSize:13,fontWeight:800,color:C.text}}>{sec.title}</h3></div>
        <div style={{background:C.card,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 3px rgba(0,40,80,.04)",display:"flex",flexDirection:"column",gap:10}}>
          {sec.fields.map(f=><div key={f.id}>
            <label style={{display:"block",fontSize:10,fontWeight:800,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:3}}>{f.l}</label>
            {f.t==="area"?<textarea value={fields[f.id]||""} onChange={e=>setF(p=>({...p,[f.id]:e.target.value}))} rows={3} style={{width:"100%",padding:"7px 9px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:12,fontFamily:F,resize:"vertical",outline:"none",color:C.text,boxSizing:"border-box",background:C.light}}/>:
            <input type="text" value={fields[f.id]||""} onChange={e=>setF(p=>({...p,[f.id]:e.target.value}))} style={{width:"100%",padding:"7px 9px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:12,fontFamily:F,outline:"none",color:C.text,boxSizing:"border-box",background:C.light}}/>}
          </div>)}
        </div>
      </div>)}
    </div>
  </Side>;
}

/* ═══ MAIN ═══ */
const COLS=[{k:"name",l:"Company",w:200},{k:"segment",l:"Segment",w:150},{k:"region",l:"Region",w:115},{k:"priority",l:"Priority",w:80},{k:"status",l:"Status",w:120},{k:"revenue",l:"Rev. (m€)",w:85},{k:"employees",l:"Emp.",w:80},{k:"sites",l:"Sites",w:55},{k:"outsourcingPropensity",l:"Outsrc.",w:80}];

export default function App(){
  const[view,setView]=useState("dashboard");const[search,setSearch]=useState("");
  const[segF,setSegF]=useState("All");const[staF,setStaF]=useState("All");const[priF,setPriF]=useState("All");
  const[sortK,setSortK]=useState("revenue");const[sortD,setSortD]=useState("desc");
  const[page,setPage]=useState(0);const[panel,setPanel]=useState(null);const[hovRow,setHovRow]=useState(null);
  const store=useStore();const PS=25;

  const filtered=useMemo(()=>{let d=[...ALL];if(search){const q=search.toLowerCase();d=d.filter(c=>c.name.toLowerCase().includes(q)||c.nip.includes(q))}if(segF!=="All")d=d.filter(c=>c.segment===segF);if(staF!=="All")d=d.filter(c=>c.status===staF);if(priF!=="All")d=d.filter(c=>c.priority===priF);d.sort((a,b)=>{let av=a[sortK],bv=b[sortK];if(typeof av==="string"){av=av.toLowerCase();bv=bv.toLowerCase()}return sortD==="asc"?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0)});return d},[search,segF,staF,priF,sortK,sortD]);
  const pg=filtered.slice(page*PS,(page+1)*PS),tp=Math.ceil(filtered.length/PS);
  const hs=k=>{if(sortK===k)setSortD(sortD==="asc"?"desc":"asc");else{setSortK(k);setSortD("desc")}setPage(0)};
  const avg=(filtered.reduce((s,c)=>s+c.revenue,0)/(filtered.length||1)).toFixed(0);
  const p1=filtered.filter(c=>c.priority.includes("P1")).length;
  const ns=filtered.filter(c=>c.status==="New Suspect").length;

  return<div style={{fontFamily:F,background:C.bgPage,minHeight:"100vh",color:C.text}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet"/>

    {panel?.type==="prequal"&&<PrequalPanel co={panel.co} store={store} onClose={()=>setPanel(null)}/>}
    {panel?.type==="prospect"&&<ProspectPanel co={panel.co} store={store} onClose={()=>setPanel(null)}/>}

    {/* ═══ HEADER ═══ */}
    <header style={{background:`linear-gradient(135deg,${C.dark} 0%,${C.primary} 100%)`,padding:"22px 36px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:40,height:40,borderRadius:10,background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:18,boxShadow:"0 4px 12px rgba(232,119,34,.3)"}}>A</div>
        <div><h1 style={{margin:0,fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-.02em"}}>Atalian Poland</h1><p style={{margin:0,fontSize:11,color:"rgba(255,255,255,.55)",fontWeight:500}}>Sales Excellence · Hunt List · Pre-qualification · Prospect File</p></div>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {(store.cnt>0||store.fileCnt>0)&&<span style={{fontSize:11,color:"rgba(255,255,255,.5)",marginRight:6}}>{store.cnt} scored · {store.fileCnt} files</span>}
        {[{id:"dashboard",lb:"Dashboard"},{id:"table",lb:"Hunt List"}].map(v=><button key={v.id} onClick={()=>{setView(v.id);setPage(0)}} style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:F,background:view===v.id?"#fff":"rgba(255,255,255,.1)",color:view===v.id?C.primary:"rgba(255,255,255,.7)",transition:"all .2s",boxShadow:view===v.id?"0 2px 8px rgba(0,0,0,.1)":"none"}}>{v.lb}</button>)}
      </div>
    </header>

    <main style={{padding:"22px 32px 48px",maxWidth:1440,margin:"0 auto"}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:14,marginBottom:24}}>
        <KPI label="Total" value={filtered.length.toLocaleString()} sub="companies" accent={C.dark}/>
        <KPI label="P1 Priority" value={p1.toLocaleString()} sub={`${((p1/(filtered.length||1))*100).toFixed(0)}% of scope`} accent={C.primary}/>
        <KPI label="New Suspects" value={ns.toLocaleString()} sub="untouched" accent="#f59e0b"/>
        <KPI label="Avg Revenue" value={`${avg}m€`} sub="filtered" accent={C.accent}/>
      </div>

      {view==="dashboard"?<div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20,alignItems:"start"}}>
        <div style={{background:C.card,borderRadius:14,padding:"22px 24px",boxShadow:"0 1px 4px rgba(0,40,80,.05)"}}><h2 style={{margin:"0 0 2px",fontSize:15,fontWeight:800}}>Hunt Scope — Waterfall</h2><p style={{margin:"0 0 10px",fontSize:11,color:C.muted}}>NIP codes to private P1 scope</p><Waterfall/></div>
        <div style={{background:C.card,borderRadius:14,padding:22,boxShadow:"0 1px 4px rgba(0,40,80,.05)"}}><h2 style={{margin:"0 0 2px",fontSize:15,fontWeight:800}}>Suspects by Segment</h2><p style={{margin:"0 0 14px",fontSize:11,color:C.muted}}>1,356 new suspects</p><Donut/></div>
        <div style={{gridColumn:"1 / -1",background:C.card,borderRadius:14,padding:"22px 24px",boxShadow:"0 1px 4px rgba(0,40,80,.05)"}}><h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:800}}>By Segment & Status</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>{SEGMENTS.map(seg=>{const co=ALL.filter(c=>c.segment===seg),t=co.length,sc=STATUSES.map(st=>({st,n:co.filter(c=>c.status===st).length})),clr={"New Suspect":"#fbbf24","Lost Prospect":"#fca5a5","Lost Client":"#f9a8d4","Current Client":"#6ee7b7"};return<div key={seg} style={{padding:"12px 14px",background:C.light,borderRadius:10,border:`1px solid ${C.border}`}}><div style={{fontSize:12,fontWeight:800,color:C.text,marginBottom:3}}>{seg}</div><div style={{fontSize:20,fontWeight:900,color:C.primary,marginBottom:6}}>{t}</div><div style={{display:"flex",height:6,borderRadius:3,overflow:"hidden",gap:1}}>{sc.map(s=><div key={s.st} style={{flex:s.n,background:clr[s.st],borderRadius:2}}/>)}</div></div>})}</div></div>
      </div>:

      /* ═══ TABLE ═══ */
      <div>
        <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16,alignItems:"center"}}>
          <input type="text" placeholder="Search company or NIP…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} style={{padding:"8px 14px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:12,fontFamily:F,width:220,outline:"none",background:C.card}}/>
          {[{v:segF,s:setSegF,o:["All",...SEGMENTS],l:"Segment"},{v:staF,s:setStaF,o:["All",...STATUSES],l:"Status"},{v:priF,s:setPriF,o:["All",...PRIORITIES],l:"Priority"}].map(({v,s,o,l})=><select key={l} value={v} onChange={e=>{s(e.target.value);setPage(0)}} style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:12,fontFamily:F,background:C.card,color:C.text,cursor:"pointer"}}>{o.map(oo=><option key={oo} value={oo}>{oo==="All"?`${l}: All`:oo}</option>)}</select>)}
          <span style={{fontSize:11,color:C.muted,marginLeft:"auto",fontWeight:600}}>{pg.length} of {filtered.length}</span>
        </div>
        <div style={{background:C.card,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,40,80,.06)",border:`1px solid ${C.border}`}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr>{COLS.map(c=><th key={c.k} onClick={()=>hs(c.k)} style={{padding:"11px 14px",textAlign:"left",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:sortK===c.k?C.primary:C.muted,borderBottom:`2px solid ${C.border}`,cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",minWidth:c.w,background:"#fafcff"}}>{c.l} {sortK===c.k?(sortD==="asc"?"↑":"↓"):""}</th>)}</tr></thead>
              <tbody>{pg.map((c,i)=>{const q=store.qual(c.id);const hf=store.hasFile(c.id);const isHov=hovRow===c.id;
                return<tr key={c.id} style={{background:isHov?"#eef5ff":i%2===0?C.card:"#fafcff",transition:"background .12s",position:"relative"}} onMouseEnter={()=>setHovRow(c.id)} onMouseLeave={()=>setHovRow(null)}>
                  {COLS.map(col=><td key={col.k} style={{padding:"9px 14px",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap",color:"#334155"}}>
                    {col.k==="status"?<SBadge s={c[col.k]}/>:
                    col.k==="priority"?<PBadge p={c[col.k]}/>:
                    col.k==="outsourcingPropensity"?<ODot v={c[col.k]}/>:
                    col.k==="revenue"?<span style={{fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{c[col.k]}</span>:
                    col.k==="employees"||col.k==="sites"?<span style={{fontVariantNumeric:"tabular-nums"}}>{c[col.k].toLocaleString()}</span>:
                    col.k==="name"?<div style={{display:"flex",alignItems:"center"}}><span style={{fontWeight:700,color:C.text}}>{c[col.k]}</span>{q&&<QBadge q={q}/>}{hf&&<span style={{marginLeft:4,fontSize:9,color:C.primary}} title="Prospect file">📋</span>}</div>:
                    c[col.k]}
                  </td>)}
                  {isHov&&<td style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",display:"flex",gap:5,zIndex:5}}>
                    <button onClick={()=>setPanel({type:"prequal",co:c})} style={{padding:"5px 12px",borderRadius:7,border:"none",background:C.score,color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:F,boxShadow:"0 2px 10px rgba(190,18,60,.3)",letterSpacing:".02em"}}>🎯 Pre-qual</button>
                    <button onClick={()=>setPanel({type:"prospect",co:c})} style={{padding:"5px 12px",borderRadius:7,border:"none",background:C.dark,color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:F,boxShadow:"0 2px 10px rgba(26,26,46,.3)",letterSpacing:".02em"}}>📋 Prospect</button>
                  </td>}
                </tr>})}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,marginTop:16}}>
          <button disabled={page===0} onClick={()=>setPage(page-1)} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:page===0?C.bgPage:C.card,cursor:page===0?"default":"pointer",fontSize:11,fontFamily:F,color:page===0?"#cbd5e1":C.text,fontWeight:700}}>← Prev</button>
          <span style={{fontSize:11,color:C.muted,fontWeight:700}}>Page {page+1}/{tp}</span>
          <button disabled={page>=tp-1} onClick={()=>setPage(page+1)} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:page>=tp-1?C.bgPage:C.card,cursor:page>=tp-1?"default":"pointer",fontSize:11,fontFamily:F,color:page>=tp-1?"#cbd5e1":C.text,fontWeight:700}}>Next →</button>
        </div>
      </div>}
    </main>
    <footer style={{textAlign:"center",padding:14,fontSize:10,color:"#94a3b8",borderTop:`1px solid ${C.border}`,background:C.card}}>
      <span style={{fontWeight:700,color:C.primary}}>ATALIAN</span> × <span style={{fontWeight:700,color:C.score}}>Simon-Kucher</span> · Sales Excellence Tool · Poland
    </footer>
  </div>;
}
