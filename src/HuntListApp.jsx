import{useState,useMemo,useRef,useEffect}from"react";
import*as d3 from"d3";

/* ═══ DATA ═══ */
const SEGMENTS=["Industrial Production","Retail & Consumer Networks","Healthcare & Social Care","Banking & Financial Services","Logistics & Transport","Real Estate"];
const SUB_SEG={"Industrial Production":["Automotive","FMCG Manufacturing","Heavy Industry","Electronics","Chemicals"],"Retail & Consumer Networks":["Grocery Chains","Fashion Retail","DIY & Home","Shopping Centers"],"Healthcare & Social Care":["Hospitals","Clinics","Elderly Care","Pharma Facilities"],"Banking & Financial Services":["Retail Banking","Corporate Banking","Insurance","FinTech"],"Logistics & Transport":["Warehousing","Distribution Centers","Port Facilities","Freight Hubs"],"Real Estate":["Office Buildings","Mixed-Use Complexes","Industrial Parks","Residential Estates"]};
const REGIONS=["Mazowieckie","Śląskie","Wielkopolskie","Małopolskie","Dolnośląskie","Łódzkie","Pomorskie","Zachodniopomorskie"];
const STATUSES=["New Suspect","Lost Prospect","Lost Client","Current Client"];
const PRIORITIES=["P1 - High Priority","P2 - Opportunistic"];
const F="'DM Sans','Segoe UI',system-ui,-apple-system,sans-serif";

function genCo(n){const pfx=["Pol","War","Krak","Gdań","Wrocł","Łódź","Pozn","Szcz","Lub","Kat","Bial","Czest","Rad","Tor","Kiel","Ols","Rzesz","Opol","Gliwi","Zabrz","Bydg","Tychy","Sosnow","Elbl","Płock","Tarn","Chorzów","Bytom","Ruda"],sfx=["Tech Sp. z o.o.","Invest S.A.","Group Sp. z o.o.","Solutions S.A.","Holding Sp. z o.o.","Industrial S.A.","Logistics Sp. z o.o.","Development S.A.","Services Sp. z o.o.","Capital S.A.","Engineering Sp. z o.o.","Systems S.A.","Management Sp. z o.o.","Partners S.A.","International Sp. z o.o."],co=[],u=new Set(),r=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,p=a=>a[Math.floor(Math.random()*a.length)],rf=(a,b)=>+(Math.random()*(b-a)+a).toFixed(1);
for(let i=0;i<n;i++){let nm;do{nm=p(pfx)+p(["a","o","ex","is","um","en","ia"])+" "+p(sfx)}while(u.has(nm));u.add(nm);const seg=p(SEGMENTS),rev=r(50,2000);co.push({id:i+1,nip:`${r(100,999)}-${r(10,99)}-${r(10,99)}-${r(100,999)}`,name:nm,segment:seg,subSegment:p(SUB_SEG[seg]),region:p(REGIONS),ownership:Math.random()<.12?"Public":"Private",priority:rev>200?"P1 - High Priority":Math.random()<.55?"P1 - High Priority":"P2 - Opportunistic",status:p(STATUSES),revenue:rev,profit:rf(1,18),outsourcingPropensity:p(["High","Medium","Low"]),potentialSpend:rf(.2,8),employees:r(80,12000),sites:r(1,45),businessScale:p(["Large","Mid-Market","SME"])})}return co}
const ALL=genCo(1390);

const WF_STEPS=[{l:"Active NIP codes\n(rev. >50m€)",v:4344,t:"total"},{l:"Non-priority\nsegments",v:-894,t:"decrease"},{l:"Priority\nsegments",v:3450,t:"subtotal"},{l:"Not mapped",v:-261,t:"decrease"},{l:"P2 -\nOpportunistic",v:-1613,t:"decrease"},{l:"P1 - High\npriority",v:1576,t:"subtotal"},{l:"Public",v:-186,t:"decrease"},{l:"Private\n(Hunt scope)",v:1390,t:"final"}];
const SEG_BD=[{s:"Industrial Production",n:885,c:"#0891b2"},{s:"Retail & Consumer",n:211,c:"#f97316"},{s:"Healthcare & Social",n:18,c:"#a78bfa"},{s:"Banking & Financial",n:97,c:"#22d3ee"},{s:"Logistics & Transport",n:71,c:"#4ade80"},{s:"Real Estate",n:74,c:"#f43f5e"}];

/* ═══ PREQUAL CRITERIA ═══ */
const PQ=[
  {cat:"STRATEGIC FIT",color:"#be123c",items:[
    {id:"intent",name:"Intent to outsource FM",desc:"Is the client considering outsourcing part or all FM services? Is there a real trigger?",q:["Are you currently considering outsourcing any part of your FM services?","Is this a new need or are you reviewing your current setup?","What is driving this reflection?"],w:3},
    {id:"scope",name:"Offer / service scope",desc:"Which FM services are in scope? Single, bundled, or integrated FM?",q:["Which services are you looking for?","Are you looking for one provider for all services or only selected services?","Could the scope expand over time?"],w:2},
  ]},
  {cat:"OPERATIONAL FIT",color:"#0891b2",items:[
    {id:"ability",name:"Ability of AP to respond",desc:"Does the opportunity fit AP capabilities in services, scale, SLAs, compliance?",q:["What are the key service requirements?","Are there any technical, safety, or compliance constraints?","What service levels would you expect from a provider?"],w:3},
    {id:"geography",name:"Geography / site footprint",desc:"Where are services needed? Local, regional, national, multi-site?",q:["Where are the sites located?","How many sites are involved?","Is this a single-site or multi-site opportunity?","Do all locations need to be covered?"],w:2},
  ]},
  {cat:"LEAD QUALITY",color:"#f59e0b",items:[
    {id:"competitor",name:"Competitor in place / share of wallet",desc:"Is another provider in place? How much can realistically be won?",q:["Who currently provides these services?","How satisfied are you with the current provider?","Would you consider replacing or complementing them?","Which parts of the scope could be open for review?"],w:2},
    {id:"interest",name:"Interest shown during the call",desc:"How engaged is the client? Is there real openness to continue?",q:["Would you be open to a follow-up discussion with our sales team?","How important is this topic for you today?","Would you like us to come back with a more detailed discussion?"],w:2},
    {id:"need",name:"Detailed need / pain points",desc:"Does the client have a clear view of the business need?",q:["What challenges are you facing with your current FM setup?","What would you like to improve?","What would an ideal solution look like?","What are your top decision criteria?"],w:1},
  ]},
];

/* ═══ PROSPECT FILE FIELDS ═══ */
const PF_SECTIONS=[
  {id:"general",title:"General Information",icon:"🏢",fields:[
    {id:"contactName",label:"Contact Name",type:"text"},
    {id:"contactTitle",label:"Job Title / Function",type:"text"},
    {id:"contactEmail",label:"Email",type:"text"},
    {id:"contactPhone",label:"Phone",type:"text"},
    {id:"linkedinUrl",label:"LinkedIn URL",type:"text"},
    {id:"industry",label:"Industry Details",type:"text"},
  ]},
  {id:"before",title:"Before Interaction",icon:"📋",fields:[
    {id:"companyProfile",label:"Company Profile Summary",type:"textarea"},
    {id:"currentProvider",label:"Current FM Provider",type:"text"},
    {id:"contractExpiry",label:"Contract Expiry Date",type:"text"},
    {id:"totalSurface",label:"Total Surface (m²)",type:"text"},
    {id:"decisionMaker",label:"Decision Maker Profile",type:"textarea"},
    {id:"keyPriorities",label:"Key Priorities / Sensitivities",type:"textarea"},
  ]},
  {id:"during",title:"During Interaction",icon:"💬",fields:[
    {id:"meetingDate",label:"Meeting / Call Date",type:"text"},
    {id:"meetingType",label:"Type of Interaction",type:"text"},
    {id:"attendees",label:"Attendees",type:"text"},
    {id:"expressedNeeds",label:"Expressed Needs",type:"textarea"},
    {id:"painPoints",label:"Pain Points Identified",type:"textarea"},
    {id:"objections",label:"Objections Raised",type:"textarea"},
    {id:"priceSensitivity",label:"Price Sensitivity",type:"text"},
    {id:"nextStepsAgreed",label:"Next Steps Agreed",type:"textarea"},
  ]},
  {id:"after",title:"After Interaction",icon:"⚙️",fields:[
    {id:"debriefNotes",label:"Debrief Notes / Key Takeaways",type:"textarea"},
    {id:"revisedProbability",label:"Revised Win Probability",type:"text"},
    {id:"blockingPoints",label:"Blocking Points",type:"textarea"},
    {id:"nextActions",label:"Next Actions (AP side)",type:"textarea"},
    {id:"followUpDate",label:"Follow-up Date",type:"text"},
    {id:"estimatedValue",label:"Estimated Contract Value (PLN)",type:"text"},
  ]},
];

/* ═══ HELPERS ═══ */
function calcWS(sc){let tw=0,tu=0;PQ.forEach(c=>c.items.forEach(it=>{if(sc[it.id]){tw+=sc[it.id]*it.w;tu+=it.w}}));return tu?tw/tu:0}
function getQ(ws){if(ws>=3.8)return{label:"Sales Qualified Lead",abbr:"SQL",color:"#16a34a",bg:"#dcfce7",bdr:"#86efac"};if(ws>=2.5)return{label:"Marketing Qualified Lead",abbr:"MQL",color:"#f59e0b",bg:"#fef3c7",bdr:"#fcd34d"};if(ws>0)return{label:"Not Relevant",abbr:"NR",color:"#ef4444",bg:"#fee2e2",bdr:"#fca5a5"};return{label:"—",abbr:"—",color:"#94a3b8",bg:"#f8fafc",bdr:"#e2e8f0"}}

/* ═══ STORAGE ═══ */
function useStore(){
  const[data,setData]=useState(()=>{try{return JSON.parse(localStorage.getItem("atalian_data")||"{}")}catch{return{}}});
  const save=(id,key,val)=>{setData(p=>{const next={...p,[id]:{...p[id],[key]:val,ts:Date.now()}};try{localStorage.setItem("atalian_data",JSON.stringify(next))}catch{}return next})};
  const get=(id)=>data[id]||{};
  const qual=(id)=>{const d=data[id];if(!d?.scores||!Object.keys(d.scores).length)return null;return getQ(calcWS(d.scores))};
  const hasFile=(id)=>{const d=data[id];if(!d?.prospect)return false;return Object.values(d.prospect).some(v=>v&&v.trim())};
  const cnt=Object.keys(data).filter(k=>data[k]?.scores&&Object.keys(data[k].scores).length).length;
  const fileCnt=Object.keys(data).filter(k=>data[k]?.prospect&&Object.values(data[k].prospect).some(v=>v&&v.trim())).length;
  return{save,get,qual,hasFile,cnt,fileCnt};
}

/* ═══ CHARTS ═══ */
function Waterfall(){
  const ref=useRef(),cRef=useRef(),[dims,setDims]=useState({w:900,h:420});
  useEffect(()=>{const ro=new ResizeObserver(e=>{for(const en of e){const w=en.contentRect.width;if(w>100)setDims({w,h:Math.min(420,Math.max(300,w*.45))})}});if(cRef.current)ro.observe(cRef.current);return()=>ro.disconnect()},[]);
  useEffect(()=>{if(!ref.current)return;const svg=d3.select(ref.current);svg.selectAll("*").remove();const m={top:40,right:20,bottom:80,left:60},w=dims.w-m.left-m.right,h=dims.h-m.top-m.bottom,g=svg.append("g").attr("transform",`translate(${m.left},${m.top})`);const x=d3.scaleBand().domain(WF_STEPS.map(d=>d.l)).range([0,w]).padding(.25),y=d3.scaleLinear().domain([0,5000]).range([h,0]);let run=0;const bars=WF_STEPS.map(s=>{let y0,y1,dv;if(s.t==="total"||s.t==="subtotal"||s.t==="final"){y0=0;y1=Math.abs(s.v);dv=Math.abs(s.v);run=Math.abs(s.v)}else{y0=run+s.v;y1=run;dv=s.v;run=y0}return{...s,y0,y1,dv}});
  for(let i=0;i<bars.length-1;i++){const c=bars[i],n=bars[i+1],fy=c.t==="decrease"?y(c.y0):y(c.y1);g.append("line").attr("x1",x(c.l)+x.bandwidth()).attr("x2",x(n.l)).attr("y1",fy).attr("y2",fy).attr("stroke","#64748b").attr("stroke-width",1).attr("stroke-dasharray","4,3").attr("opacity",.5)}
  const bg=g.selectAll(".bar").data(bars).join("g");bg.append("rect").attr("x",d=>x(d.l)).attr("width",x.bandwidth()).attr("y",d=>y(Math.max(d.y0,d.y1))).attr("height",0).attr("rx",3).attr("fill",d=>d.t==="total"?"#1e293b":d.t==="subtotal"?"#475569":d.t==="final"?"#be123c":"#fda4af").transition().duration(800).delay((_,i)=>i*100).attr("height",d=>Math.abs(y(d.y0)-y(d.y1)));
  bg.append("text").attr("x",d=>x(d.l)+x.bandwidth()/2).attr("y",d=>y(Math.max(d.y0,d.y1))-8).attr("text-anchor","middle").attr("font-size",13).attr("font-weight",700).attr("fill","#1e293b").attr("opacity",0).text(d=>Math.abs(d.dv).toLocaleString()).transition().duration(400).delay((_,i)=>i*100+600).attr("opacity",1);
  g.append("g").attr("transform",`translate(0,${h})`).call(d3.axisBottom(x).tickSize(0)).selectAll("text").attr("font-size",10).attr("fill","#64748b");g.select(".domain").remove();g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(","))).selectAll("text").attr("font-size",10).attr("fill","#94a3b8");g.selectAll(".tick line").attr("stroke","#e2e8f0").attr("stroke-dasharray","2,2");g.select(".domain").remove();g.append("g").selectAll("line").data(y.ticks(5)).join("line").attr("x1",0).attr("x2",w).attr("y1",d=>y(d)).attr("y2",d=>y(d)).attr("stroke","#f1f5f9").attr("stroke-width",1).lower();},[dims]);
  return<div ref={cRef} style={{width:"100%"}}><svg ref={ref} viewBox={`0 0 ${dims.w} ${dims.h}`} style={{width:"100%",height:"auto"}}/></div>;
}
function Donut(){const ref=useRef(),[hov,setHov]=useState(null);useEffect(()=>{if(!ref.current)return;const svg=d3.select(ref.current);svg.selectAll("*").remove();const s=260,r=s/2,inner=r*.55,g=svg.append("g").attr("transform",`translate(${r},${r})`);const pie=d3.pie().value(d=>d.n).sort(null).padAngle(.02),arc=d3.arc().innerRadius(inner).outerRadius(r-4),arcH=d3.arc().innerRadius(inner).outerRadius(r);g.selectAll("path").data(pie(SEG_BD)).join("path").attr("d",arc).attr("fill",d=>d.data.c).attr("stroke","#fff").attr("stroke-width",2).attr("cursor","pointer").attr("opacity",.9).on("mouseenter",function(_,d){d3.select(this).transition().duration(200).attr("d",arcH).attr("opacity",1);setHov(d.data)}).on("mouseleave",function(){d3.select(this).transition().duration(200).attr("d",arc).attr("opacity",.9);setHov(null)});g.append("text").attr("text-anchor","middle").attr("dy","-.3em").attr("font-size",28).attr("font-weight",800).attr("fill","#1e293b").text("1,356");g.append("text").attr("text-anchor","middle").attr("dy","1.2em").attr("font-size",11).attr("fill","#94a3b8").attr("letter-spacing",".05em").text("NEW SUSPECTS")},[]);
return<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}><svg ref={ref} viewBox="0 0 260 260" style={{width:220,height:220}}/>{hov&&<div style={{background:"#f8fafc",borderRadius:8,padding:"8px 14px",fontSize:13,fontWeight:600,color:"#1e293b",border:`2px solid ${hov.c}`}}>{hov.s}: {hov.n}</div>}<div style={{display:"flex",flexWrap:"wrap",gap:"6px 14px",justifyContent:"center"}}>{SEG_BD.map(s=><div key={s.s} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#64748b"}}><span style={{width:10,height:10,borderRadius:3,background:s.c,display:"inline-block"}}/>{s.s}</div>)}</div></div>}

/* ═══ SMALL COMPONENTS ═══ */
function KPI({label,value,sub,accent}){return<div style={{background:"#fff",borderRadius:12,padding:"20px 22px",borderLeft:`4px solid ${accent}`,boxShadow:"0 1px 3px rgba(0,0,0,.06)",flex:"1 1 180px",minWidth:160}}><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".08em",color:"#94a3b8",marginBottom:6,fontWeight:600}}>{label}</div><div style={{fontSize:28,fontWeight:800,color:"#1e293b",lineHeight:1.1}}>{value}</div>{sub&&<div style={{fontSize:12,color:"#64748b",marginTop:4}}>{sub}</div>}</div>}
function SBadge({s}){const c={"New Suspect":{bg:"#fef3c7",t:"#92400e",b:"#fbbf24"},"Lost Prospect":{bg:"#fee2e2",t:"#991b1b",b:"#fca5a5"},"Lost Client":{bg:"#fce7f3",t:"#9d174d",b:"#f9a8d4"},"Current Client":{bg:"#d1fae5",t:"#065f46",b:"#6ee7b7"}}[s]||{bg:"#f1f5f9",t:"#475569",b:"#cbd5e1"};return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600,background:c.bg,color:c.t,border:`1px solid ${c.b}`,whiteSpace:"nowrap"}}>{s}</span>}
function PBadge({p}){const p1=p.includes("P1");return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700,background:p1?"#be123c":"#f1f5f9",color:p1?"#fff":"#64748b",whiteSpace:"nowrap"}}>{p1?"P1 — High":"P2 — Opp."}</span>}
function ODot({v}){const c=v==="High"?"#16a34a":v==="Medium"?"#f59e0b":"#ef4444";return<span style={{display:"flex",alignItems:"center",gap:5,fontSize:12}}><span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>{v}</span>}
function QBadge({q}){if(!q||q.abbr==="—")return<span style={{fontSize:11,color:"#cbd5e1"}}>—</span>;return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700,background:q.bg,color:q.color,border:`1px solid ${q.bdr}`,whiteSpace:"nowrap"}}>{q.abbr}</span>}
function ScoreBtn({value,onChange,color}){return<div style={{display:"flex",alignItems:"center",gap:12}}><div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>onChange(n)} style={{width:36,height:36,borderRadius:8,border:value===n?`2px solid ${color}`:"2px solid #e2e8f0",background:value===n?color:"#fff",color:value===n?"#fff":"#94a3b8",fontSize:14,fontWeight:700,cursor:"pointer",transition:"all .15s",fontFamily:"inherit"}}>{n}</button>)}</div><span style={{fontSize:11,color:"#94a3b8"}}>{value?`${value}/5`:"—"}</span></div>}
function Gauge({score}){const q=getQ(score),pct=Math.min(score/5,1)*100;return<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}><div style={{fontSize:36,fontWeight:900,color:"#1e293b",lineHeight:1}}>{score>0?score.toFixed(1):"—"}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:-4}}>out of 5.0</div><div style={{width:"100%",position:"relative",marginTop:4}}><div style={{display:"flex",height:12,borderRadius:6,overflow:"hidden"}}><div style={{flex:50,background:"#fca5a5"}}/><div style={{flex:26,background:"#fcd34d"}}/><div style={{flex:24,background:"#86efac"}}/></div>{score>0&&<div style={{position:"absolute",top:-4,left:`${pct}%`,transform:"translateX(-50%)",transition:"left .5s cubic-bezier(.34,1.56,.64,1)"}}><div style={{width:4,height:20,background:"#1e293b",borderRadius:2}}/></div>}<div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:9,fontWeight:700,color:"#ef4444"}}>NR</span><span style={{fontSize:9,fontWeight:700,color:"#f59e0b"}}>MQL</span><span style={{fontSize:9,fontWeight:700,color:"#16a34a"}}>SQL</span></div></div><div style={{padding:"6px 18px",borderRadius:8,background:q.bg,border:`2px solid ${q.bdr}`,color:q.color,fontWeight:800,fontSize:14,marginTop:4}}>{q.label}</div></div>}

/* ═══ SIDE PANEL ═══ */
function SidePanel({children,onClose}){
  return<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(15,23,42,.4)",backdropFilter:"blur(2px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div style={{position:"absolute",top:0,right:0,bottom:0,width:"min(680px,90vw)",background:"#f8fafc",boxShadow:"-8px 0 30px rgba(0,0,0,.2)",overflowY:"auto",animation:"slideIn .25s ease-out"}}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
      {children}
    </div>
  </div>;
}

/* ═══ PREQUAL PANEL ═══ */
function PrequalPanel({co,store,onClose}){
  const saved0=store.get(co.id);
  const[scores,setS]=useState(saved0.scores||{});
  const[notes,setN]=useState(saved0.notes||{});
  const[showQ,setSQ]=useState({});
  const[ok,setOk]=useState(false);
  useEffect(()=>{store.save(co.id,"scores",scores);store.save(co.id,"notes",notes)},[scores,notes]);
  const ws=useMemo(()=>calcWS(scores),[scores]);
  const tot=PQ.reduce((s,c)=>s+c.items.length,0);
  const done=Object.keys(scores).filter(k=>scores[k]).length;
  const all=PQ.every(c=>c.items.every(it=>scores[it.id]));
  const doSave=()=>{store.save(co.id,"scores",scores);store.save(co.id,"notes",notes);setOk(true);setTimeout(()=>setOk(false),2000)};

  return<SidePanel onClose={onClose}>
    <div style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}>
      <div style={{flex:1,minWidth:0}}><h2 style={{margin:0,fontSize:17,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{co.name}</h2><p style={{margin:"4px 0 0",fontSize:11,color:"#94a3b8"}}>{co.segment} · {co.region} · {co.revenue}m€</p></div>
      <div style={{display:"flex",gap:8}}><button onClick={doSave} style={{padding:"7px 16px",borderRadius:8,border:"none",background:ok?"#16a34a":"#be123c",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:F,transition:"background .2s"}}>{ok?"✓ Saved":"💾 Save"}</button><button onClick={onClose} style={{width:32,height:32,borderRadius:8,border:"none",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>
    </div>
    <div style={{padding:"20px 24px"}}>
      <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,.05)",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200}}><Gauge score={ws}/></div>
          <div style={{display:"flex",flexDirection:"column",gap:6,minWidth:160}}>
            <div style={{fontSize:12,color:"#94a3b8"}}>{done}/{tot} criteria scored</div>
            {done>0&&<div style={{fontSize:10,color:"#64748b",background:"#f8fafc",borderRadius:6,padding:"6px 8px",border:"1px solid #f1f5f9",lineHeight:1.6}}>
              {PQ.map(cat=>cat.items.filter(it=>scores[it.id]).map(it=><span key={it.id} style={{display:"block"}}><span style={{color:cat.color,fontWeight:700}}>{it.name.split("/")[0].trim().split(" ").slice(0,2).join(" ")}</span> {scores[it.id]}×{it.w} = {scores[it.id]*it.w}</span>)).flat()}
              <span style={{display:"block",borderTop:"1px solid #e2e8f0",marginTop:4,paddingTop:4,fontWeight:700,color:"#1e293b"}}>= {ws.toFixed(1)}/5</span>
            </div>}
            {PQ.map(cat=>{const cs=cat.items.filter(c=>scores[c.id]);const avg=cs.length?cs.reduce((s,c)=>s+scores[c.id],0)/cs.length:0;return<div key={cat.cat}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,fontWeight:700,color:cat.color}}>{cat.cat}</span><span style={{fontSize:10,fontWeight:700,color:"#1e293b"}}>{avg.toFixed(1)}</span></div><div style={{height:4,background:"#f1f5f9",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${(avg/5)*100}%`,background:cat.color,borderRadius:2,transition:"width .4s"}}/></div></div>})}
            {all&&<div style={{padding:6,borderRadius:6,background:"#f0fdf4",border:"1px solid #86efac",fontSize:10,color:"#166534",fontWeight:600,textAlign:"center"}}>✓ Complete</div>}
          </div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {PQ.map(cat=><div key={cat.cat}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{width:4,height:20,borderRadius:2,background:cat.color}}/><h3 style={{margin:0,fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:cat.color}}>{cat.cat}</h3></div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {cat.items.map(it=><div key={it.id} style={{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,.05)",borderLeft:`4px solid ${scores[it.id]?cat.color:"#e2e8f0"}`,transition:"border-color .2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><h4 style={{margin:0,fontSize:14,fontWeight:700,color:"#1e293b"}}>{it.name}</h4><span style={{fontSize:10,fontWeight:700,color:cat.color,background:cat.color+"18",padding:"2px 8px",borderRadius:4,border:`1px solid ${cat.color}33`}}>weight = {it.w}</span></div>
              <p style={{margin:"0 0 10px",fontSize:12,color:"#94a3b8",lineHeight:1.5}}>{it.desc}</p>
              <ScoreBtn value={scores[it.id]||0} onChange={v=>setS(p=>({...p,[it.id]:v}))} color={cat.color}/>
              <button onClick={()=>setSQ(p=>({...p,[it.id]:!p[it.id]}))} style={{marginTop:8,background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#64748b",fontFamily:F,padding:0}}>{showQ[it.id]?"▾":"▸"} Questions ({it.q.length})</button>
              {showQ[it.id]&&<div style={{marginTop:6,paddingLeft:12,borderLeft:"2px solid #f1f5f9"}}>{it.q.map((qq,qi)=><p key={qi} style={{margin:"3px 0",fontSize:12,color:"#64748b",lineHeight:1.5}}>→ {qq}</p>)}</div>}
              <textarea placeholder="Notes…" value={notes[it.id]||""} onChange={e=>setN(p=>({...p,[it.id]:e.target.value}))} rows={2} style={{marginTop:8,width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #f1f5f9",fontSize:12,fontFamily:F,resize:"vertical",outline:"none",color:"#334155",boxSizing:"border-box"}}/>
            </div>)}
          </div>
        </div>)}
      </div>
    </div>
  </SidePanel>;
}

/* ═══ PROSPECT FILE PANEL ═══ */
function ProspectPanel({co,store,onClose}){
  const saved0=store.get(co.id);
  // Pre-fill from hunt list data if prospect fields are empty
  const defaults={
    contactName:"",contactTitle:"",contactEmail:"",contactPhone:"",linkedinUrl:"",
    industry:`${co.segment} — ${co.subSegment}`,
    companyProfile:`${co.name}\nNIP: ${co.nip}\nRegion: ${co.region}\nRevenue: ${co.revenue}m€\nEmployees: ${co.employees.toLocaleString()}\nSites in Poland: ${co.sites}\nBusiness Scale: ${co.businessScale}\nOwnership: ${co.ownership}\nPriority: ${co.priority}\nOutsourcing Propensity: ${co.outsourcingPropensity}`,
    currentProvider:"",contractExpiry:"",totalSurface:"",
    decisionMaker:"",keyPriorities:"",
    meetingDate:"",meetingType:"",attendees:"",expressedNeeds:"",painPoints:"",objections:"",priceSensitivity:"",nextStepsAgreed:"",
    debriefNotes:"",revisedProbability:"",blockingPoints:"",nextActions:"",followUpDate:"",estimatedValue:"",
  };
  const merged={...defaults,...(saved0.prospect||{})};
  const[fields,setFields]=useState(merged);
  const[ok,setOk]=useState(false);
  useEffect(()=>{store.save(co.id,"prospect",fields)},[fields]);
  const doSave=()=>{store.save(co.id,"prospect",fields);setOk(true);setTimeout(()=>setOk(false),2000)};
  const filledCount=Object.values(fields).filter(v=>v&&v.trim()).length;
  const totalFields=PF_SECTIONS.reduce((s,sec)=>s+sec.fields.length,0);

  return<SidePanel onClose={onClose}>
    <div style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}>
      <div style={{flex:1,minWidth:0}}><h2 style={{margin:0,fontSize:17,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📋 {co.name}</h2><p style={{margin:"4px 0 0",fontSize:11,color:"#94a3b8"}}>{co.segment} · {co.region} · {co.revenue}m€ · {co.employees.toLocaleString()} emp. · {co.sites} sites</p></div>
      <div style={{display:"flex",gap:8}}><button onClick={doSave} style={{padding:"7px 16px",borderRadius:8,border:"none",background:ok?"#16a34a":"#be123c",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:F,transition:"background .2s"}}>{ok?"✓ Saved":"💾 Save"}</button><button onClick={onClose} style={{width:32,height:32,borderRadius:8,border:"none",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>
    </div>
    <div style={{padding:"20px 24px"}}>
      {/* Progress */}
      <div style={{background:"#fff",borderRadius:12,padding:"14px 18px",boxShadow:"0 1px 4px rgba(0,0,0,.05)",marginBottom:20,display:"flex",alignItems:"center",gap:16}}>
        <div style={{fontSize:12,color:"#64748b",fontWeight:600}}>{filledCount}/{totalFields} fields filled</div>
        <div style={{flex:1,height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(filledCount/totalFields)*100}%`,background:"#be123c",borderRadius:3,transition:"width .4s"}}/></div>
        <div style={{fontSize:10,color:"#94a3b8"}}>Auto-saved</div>
      </div>
      {/* Sections */}
      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        {PF_SECTIONS.map(sec=><div key={sec.id}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span style={{fontSize:18}}>{sec.icon}</span><h3 style={{margin:0,fontSize:14,fontWeight:800,color:"#1e293b"}}>{sec.title}</h3></div>
          <div style={{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,.05)",display:"flex",flexDirection:"column",gap:12}}>
            {sec.fields.map(f=><div key={f.id}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{f.label}</label>
              {f.type==="textarea"?
                <textarea value={fields[f.id]||""} onChange={e=>setFields(p=>({...p,[f.id]:e.target.value}))} rows={3} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #f1f5f9",fontSize:13,fontFamily:F,resize:"vertical",outline:"none",color:"#1e293b",boxSizing:"border-box"}}/>:
                <input type="text" value={fields[f.id]||""} onChange={e=>setFields(p=>({...p,[f.id]:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #f1f5f9",fontSize:13,fontFamily:F,outline:"none",color:"#1e293b",boxSizing:"border-box"}}/>
              }
            </div>)}
          </div>
        </div>)}
      </div>
    </div>
  </SidePanel>;
}

/* ═══ MAIN ═══ */
const COLS=[
  {k:"name",l:"Company",w:200},{k:"segment",l:"Segment",w:155},{k:"region",l:"Region",w:120},
  {k:"priority",l:"Priority",w:115},{k:"status",l:"Status",w:125},{k:"revenue",l:"Rev. (m€)",w:90},
  {k:"employees",l:"Emp.",w:80},{k:"sites",l:"Sites",w:60},{k:"outsourcingPropensity",l:"Outsrc.",w:85},
];

export default function App(){
  const[view,setView]=useState("dashboard");
  const[search,setSearch]=useState("");
  const[segF,setSegF]=useState("All");const[staF,setStaF]=useState("All");const[priF,setPriF]=useState("All");
  const[sortK,setSortK]=useState("revenue");const[sortD,setSortD]=useState("desc");
  const[page,setPage]=useState(0);
  const[panel,setPanel]=useState(null); // {type:'prequal'|'prospect', co}
  const[hovRow,setHovRow]=useState(null);
  const store=useStore();
  const PS=25;

  const filtered=useMemo(()=>{let d=[...ALL];if(search){const q=search.toLowerCase();d=d.filter(c=>c.name.toLowerCase().includes(q)||c.nip.includes(q))}if(segF!=="All")d=d.filter(c=>c.segment===segF);if(staF!=="All")d=d.filter(c=>c.status===staF);if(priF!=="All")d=d.filter(c=>c.priority===priF);d.sort((a,b)=>{let av=a[sortK],bv=b[sortK];if(typeof av==="string"){av=av.toLowerCase();bv=bv.toLowerCase()}return sortD==="asc"?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0)});return d},[search,segF,staF,priF,sortK,sortD]);

  const pg=filtered.slice(page*PS,(page+1)*PS),tp=Math.ceil(filtered.length/PS);
  const hs=k=>{if(sortK===k)setSortD(sortD==="asc"?"desc":"asc");else{setSortK(k);setSortD("desc")}setPage(0)};
  const avg=(filtered.reduce((s,c)=>s+c.revenue,0)/(filtered.length||1)).toFixed(0);
  const p1=filtered.filter(c=>c.priority.includes("P1")).length;
  const ns=filtered.filter(c=>c.status==="New Suspect").length;

  return<div style={{fontFamily:F,background:"#f8fafc",minHeight:"100vh",color:"#1e293b"}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>

    {panel?.type==="prequal"&&<PrequalPanel co={panel.co} store={store} onClose={()=>setPanel(null)}/>}
    {panel?.type==="prospect"&&<ProspectPanel co={panel.co} store={store} onClose={()=>setPanel(null)}/>}

    <header style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",padding:"28px 36px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}><div style={{width:36,height:36,borderRadius:8,background:"#be123c",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:16}}>AP</div><h1 style={{margin:0,fontSize:22,fontWeight:800,color:"#fff",letterSpacing:"-.02em"}}>Atalian Poland — Sales Excellence</h1></div>
        <p style={{margin:0,fontSize:13,color:"#94a3b8",marginTop:4}}>Hunt list · Pre-qualification · Prospect file</p>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {(store.cnt>0||store.fileCnt>0)&&<span style={{fontSize:12,color:"#94a3b8",marginRight:8}}>{store.cnt} scored · {store.fileCnt} files</span>}
        {[{id:"dashboard",lb:"📊 Dashboard"},{id:"table",lb:"📋 Hunt List"}].map(v=><button key={v.id} onClick={()=>{setView(v.id);setPage(0)}} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:F,background:view===v.id?"#be123c":"rgba(255,255,255,.08)",color:view===v.id?"#fff":"#94a3b8",transition:"all .2s"}}>{v.lb}</button>)}
      </div>
    </header>

    <main style={{padding:"24px 32px 48px",maxWidth:1440,margin:"0 auto"}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:16,marginBottom:28}}>
        <KPI label="Total Companies" value={filtered.length.toLocaleString()} sub="In scope" accent="#1e293b"/>
        <KPI label="P1 — High Priority" value={p1.toLocaleString()} sub={`${((p1/(filtered.length||1))*100).toFixed(0)}%`} accent="#be123c"/>
        <KPI label="New Suspects" value={ns.toLocaleString()} sub="Untouched" accent="#f59e0b"/>
        <KPI label="Avg. Revenue" value={`${avg}m€`} sub="Filtered" accent="#0891b2"/>
      </div>

      {view==="dashboard"?<div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:24,alignItems:"start"}}>
        <div style={{background:"#fff",borderRadius:14,padding:"24px 28px",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}><h2 style={{margin:"0 0 4px",fontSize:16,fontWeight:700}}>Hunt List Scope — Waterfall</h2><p style={{margin:"0 0 12px",fontSize:12,color:"#94a3b8"}}>From total NIP codes to private P1 hunt scope</p><Waterfall/></div>
        <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}><h2 style={{margin:"0 0 4px",fontSize:16,fontWeight:700}}>New Suspects by Segment</h2><p style={{margin:"0 0 16px",fontSize:12,color:"#94a3b8"}}>Breakdown of 1,356 new suspects</p><Donut/></div>
        <div style={{gridColumn:"1 / -1",background:"#fff",borderRadius:14,padding:"24px 28px",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}><h2 style={{margin:"0 0 16px",fontSize:16,fontWeight:700}}>By Segment & Status</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>{SEGMENTS.map(seg=>{const co=ALL.filter(c=>c.segment===seg),t=co.length,sc=STATUSES.map(st=>({st,n:co.filter(c=>c.status===st).length})),clr={"New Suspect":"#fbbf24","Lost Prospect":"#fca5a5","Lost Client":"#f9a8d4","Current Client":"#6ee7b7"};return<div key={seg} style={{padding:"14px 16px",background:"#f8fafc",borderRadius:10,border:"1px solid #f1f5f9"}}><div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>{seg}</div><div style={{fontSize:22,fontWeight:800,color:"#be123c",marginBottom:8}}>{t}</div><div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",gap:1}}>{sc.map(s=><div key={s.st} style={{flex:s.n,background:clr[s.st],borderRadius:2}} title={`${s.st}: ${s.n}`}/>)}</div></div>})}</div></div>
      </div>:

      /* ═══ HUNT LIST TABLE ═══ */
      <div>
        <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:18,alignItems:"center"}}>
          <input type="text" placeholder="Search…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,fontFamily:F,width:220,outline:"none",background:"#fff"}}/>
          {[{v:segF,s:setSegF,o:["All",...SEGMENTS],l:"Segment"},{v:staF,s:setStaF,o:["All",...STATUSES],l:"Status"},{v:priF,s:setPriF,o:["All",...PRIORITIES],l:"Priority"}].map(({v,s,o,l})=><select key={l} value={v} onChange={e=>{s(e.target.value);setPage(0)}} style={{padding:"8px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,fontFamily:F,background:"#fff",color:"#1e293b",cursor:"pointer"}}>{o.map(oo=><option key={oo} value={oo}>{oo==="All"?`${l}: All`:oo}</option>)}</select>)}
          <span style={{fontSize:12,color:"#94a3b8",marginLeft:"auto"}}>{pg.length} of {filtered.length}</span>
        </div>
        <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.05)",border:"1px solid #f1f5f9"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr>{COLS.map(c=><th key={c.k} onClick={()=>hs(c.k)} style={{padding:"12px 14px",textAlign:"left",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:sortK===c.k?"#be123c":"#94a3b8",borderBottom:"2px solid #f1f5f9",cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",minWidth:c.w,background:"#fafbfc"}}>{c.l} {sortK===c.k?(sortD==="asc"?"↑":"↓"):""}</th>)}</tr></thead>
              <tbody>{pg.map((c,i)=>{const q=store.qual(c.id);const hf=store.hasFile(c.id);const isHov=hovRow===c.id;
                return<tr key={c.id} style={{background:isHov?"#f0f9ff":i%2===0?"#fff":"#fafbfc",transition:"background .15s",position:"relative"}} onMouseEnter={()=>setHovRow(c.id)} onMouseLeave={()=>setHovRow(null)}>
                  {COLS.map(col=><td key={col.k} style={{padding:"10px 14px",borderBottom:"1px solid #f1f5f9",whiteSpace:"nowrap",color:"#334155"}}>
                    {col.k==="status"?<SBadge s={c[col.k]}/>:
                    col.k==="priority"?<PBadge p={c[col.k]}/>:
                    col.k==="outsourcingPropensity"?<ODot v={c[col.k]}/>:
                    col.k==="revenue"?<span style={{fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{c[col.k]}</span>:
                    col.k==="employees"||col.k==="sites"?<span style={{fontVariantNumeric:"tabular-nums"}}>{c[col.k].toLocaleString()}</span>:
                    col.k==="name"?<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:600,color:"#0f172a"}}>{c[col.k]}</span>{q&&<QBadge q={q}/>}{hf&&<span style={{fontSize:10,color:"#0891b2"}} title="Prospect file started">📋</span>}</div>:
                    c[col.k]}
                  </td>)}
                  {/* Overlay buttons */}
                  {isHov&&<td style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",display:"flex",gap:6,zIndex:5}}>
                    <button onClick={()=>setPanel({type:"prequal",co:c})} style={{padding:"5px 12px",borderRadius:6,border:"none",background:"#be123c",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F,whiteSpace:"nowrap",boxShadow:"0 2px 8px rgba(0,0,0,.15)"}}>🎯 {q?"Edit score":"Pre-qual"}</button>
                    <button onClick={()=>setPanel({type:"prospect",co:c})} style={{padding:"5px 12px",borderRadius:6,border:"none",background:"#0891b2",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F,whiteSpace:"nowrap",boxShadow:"0 2px 8px rgba(0,0,0,.15)"}}>📋 {hf?"Edit file":"Prospect file"}</button>
                  </td>}
                </tr>})}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,marginTop:18}}>
          <button disabled={page===0} onClick={()=>setPage(page-1)} style={{padding:"6px 14px",borderRadius:7,border:"1px solid #e2e8f0",background:page===0?"#f8fafc":"#fff",cursor:page===0?"default":"pointer",fontSize:12,fontFamily:F,color:page===0?"#cbd5e1":"#1e293b",fontWeight:600}}>← Prev</button>
          <span style={{fontSize:12,color:"#64748b",fontWeight:600}}>Page {page+1}/{tp}</span>
          <button disabled={page>=tp-1} onClick={()=>setPage(page+1)} style={{padding:"6px 14px",borderRadius:7,border:"1px solid #e2e8f0",background:page>=tp-1?"#f8fafc":"#fff",cursor:page>=tp-1?"default":"pointer",fontSize:12,fontFamily:F,color:page>=tp-1?"#cbd5e1":"#1e293b",fontWeight:600}}>Next →</button>
        </div>
      </div>}
    </main>
    <footer style={{textAlign:"center",padding:16,fontSize:11,color:"#cbd5e1",borderTop:"1px solid #f1f5f9"}}>© Simon-Kucher · Atalian International — Sales Excellence Tool (POC)</footer>
  </div>;
}
