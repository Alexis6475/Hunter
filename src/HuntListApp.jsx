import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";

const SEGMENTS = [
  "Industrial Production",
  "Retail & Consumer Networks",
  "Healthcare & Social Care",
  "Banking & Financial Services",
  "Logistics & Transport",
  "Real Estate",
];

const SUB_SEGMENTS = {
  "Industrial Production": ["Automotive", "FMCG Manufacturing", "Heavy Industry", "Electronics", "Chemicals"],
  "Retail & Consumer Networks": ["Grocery Chains", "Fashion Retail", "DIY & Home", "Shopping Centers"],
  "Healthcare & Social Care": ["Hospitals", "Clinics", "Elderly Care", "Pharma Facilities"],
  "Banking & Financial Services": ["Retail Banking", "Corporate Banking", "Insurance", "FinTech"],
  "Logistics & Transport": ["Warehousing", "Distribution Centers", "Port Facilities", "Freight Hubs"],
  "Real Estate": ["Office Buildings", "Mixed-Use Complexes", "Industrial Parks", "Residential Estates"],
};

const REGIONS = ["Mazowieckie", "Śląskie", "Wielkopolskie", "Małopolskie", "Dolnośląskie", "Łódzkie", "Pomorskie", "Zachodniopomorskie"];
const STATUSES = ["New Suspect", "Lost Prospect", "Lost Client", "Current Client"];
const PRIORITIES = ["P1 - High Priority", "P2 - Opportunistic"];

function generateCompanies(count) {
  const pfx = ["Pol","War","Krak","Gdań","Wrocł","Łódź","Pozn","Szcz","Lub","Kat","Bial","Czest","Rad","Tor","Kiel","Ols","Rzesz","Opol","Gliwi","Zabrz","Bydg","Tychy","Sosnow","Elbl","Płock","Tarn","Chorzów","Bytom","Ruda"];
  const sfx = ["Tech Sp. z o.o.","Invest S.A.","Group Sp. z o.o.","Solutions S.A.","Holding Sp. z o.o.","Industrial S.A.","Logistics Sp. z o.o.","Development S.A.","Services Sp. z o.o.","Capital S.A.","Engineering Sp. z o.o.","Systems S.A.","Management Sp. z o.o.","Partners S.A.","International Sp. z o.o."];
  const companies = [], usedNames = new Set();
  const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
  const pick = (a) => a[Math.floor(Math.random()*a.length)];
  const rf = (a,b) => +(Math.random()*(b-a)+a).toFixed(1);
  for (let i=0;i<count;i++) {
    let name; do { name=pick(pfx)+pick(["a","o","ex","is","um","en","ia"])+" "+pick(sfx); } while(usedNames.has(name)); usedNames.add(name);
    const seg=pick(SEGMENTS), sub=pick(SUB_SEGMENTS[seg]), pub=Math.random()<0.12, rev=rand(50,2000);
    const prio=rev>200?"P1 - High Priority":Math.random()<0.55?"P1 - High Priority":"P2 - Opportunistic";
    companies.push({id:i+1,nip:`${rand(100,999)}-${rand(10,99)}-${rand(10,99)}-${rand(100,999)}`,name,segment:seg,subSegment:sub,region:pick(REGIONS),ownership:pub?"Public":"Private",priority:prio,status:pick(STATUSES),revenue:rev,profit:rf(1,18),outsourcingPropensity:pick(["High","Medium","Low"]),potentialSpend:rf(0.2,8),employees:rand(80,12000),sites:rand(1,45),businessScale:pick(["Large","Mid-Market","SME"]),avgSiteSize:rand(500,25000),prioritizedRegion:Math.random()<0.6,procurementCentralization:pick(["Centralized","Decentralized","Hybrid"]),providerStickiness:pick(["High","Medium","Low"]),existingRelationship:Math.random()<0.15,linkedinUrl:"",email:"",phone:""});
  }
  return companies;
}
const ALL_COMPANIES = generateCompanies(1390);

const WATERFALL_STEPS = [
  {label:"Active NIP codes\n(rev. >50m€)",value:4344,type:"total"},
  {label:"Non-priority\nsegments",value:-894,type:"decrease"},
  {label:"Priority\nsegments",value:3450,type:"subtotal"},
  {label:"Not mapped",value:-261,type:"decrease"},
  {label:"P2 -\nOpportunistic",value:-1613,type:"decrease"},
  {label:"P1 - High\npriority",value:1576,type:"subtotal"},
  {label:"Public",value:-186,type:"decrease"},
  {label:"Private\n(Hunt scope)",value:1390,type:"final"},
];

const SEGMENT_BREAKDOWN = [
  {segment:"Industrial Production",newSuspects:885,color:"#0891b2"},
  {segment:"Retail & Consumer",newSuspects:211,color:"#f97316"},
  {segment:"Healthcare & Social",newSuspects:18,color:"#a78bfa"},
  {segment:"Banking & Financial",newSuspects:97,color:"#22d3ee"},
  {segment:"Logistics & Transport",newSuspects:71,color:"#4ade80"},
  {segment:"Real Estate",newSuspects:74,color:"#f43f5e"},
];

const PREQUALIFICATION_CRITERIA = [
  {category:"STRATEGIC FIT",color:"#be123c",criteria:[
    {id:"intent",name:"Intent to outsource FM",description:"Determine whether the client is considering outsourcing part or all of their FM services and whether there is a real trigger for change",questions:["Are you currently considering outsourcing any part of your FM services?","Is this a new need or are you reviewing your current setup?","What is driving this reflection?"],weight:3},
    {id:"scope",name:"Offer / service scope",description:"Clarify which FM services are in scope (cleaning, tech. FM, etc.) and whether the need is for single services, bundled services, or integrated FM",questions:["Which services are you looking for?","Are you looking for one provider for all services or only selected services?","Could the scope expand over time?"],weight:2},
  ]},
  {category:"OPERATIONAL FIT",color:"#0891b2",criteria:[
    {id:"ability",name:"Ability of AP to respond",description:"Check whether the opportunity fits AP capabilities in terms of services, scale, complexity, SLAs, technical needs, and compliance requirements",questions:["What are the key service requirements?","Are there any technical, safety, or compliance constraints?","What service levels would you expect from a provider?"],weight:3},
    {id:"geography",name:"Geography / site footprint",description:"Understand where the services are needed and whether the account is local, regional, national, or multi-site",questions:["Where are the sites located?","How many sites are involved?","Is this a single-site or multi-site opportunity?","Do all locations need to be covered?"],weight:2},
  ]},
  {category:"LEAD QUALITY",color:"#f59e0b",criteria:[
    {id:"competitor",name:"Competitor in place / share of wallet",description:"Identify whether another provider is already in place and how much of the account could realistically be won",questions:["Who currently provides these services?","How satisfied are you with the current provider?","Would you consider replacing or complementing them?","Which parts of the scope could be open for review?"],weight:2},
    {id:"interest",name:"Interest shown during the call",description:"Evaluate how engaged the client is and whether there is real openness to continue the discussion",questions:["Would you be open to a follow-up discussion with our sales team?","How important is this topic for you today?","Would you like us to come back with a more detailed discussion?"],weight:2},
    {id:"need",name:"Detailed need / pain points",description:"Check whether the client already has clear view of the business need behind the opportunity",questions:["What challenges are you facing with your current FM setup?","What would you like to improve?","What would an ideal solution look like?","What are your top decision criteria?"],weight:1},
  ]},
];

const TOTAL_WEIGHT = PREQUALIFICATION_CRITERIA.reduce((s,cat)=>s+cat.criteria.reduce((a,c)=>a+c.weight,0),0);

function getQualification(ws) {
  if(ws>=3.8) return {label:"Sales Qualified Lead",abbr:"SQL",color:"#16a34a",bg:"#dcfce7",border:"#86efac"};
  if(ws>=2.5) return {label:"Marketing Qualified Lead",abbr:"MQL",color:"#f59e0b",bg:"#fef3c7",border:"#fcd34d"};
  return {label:"Not Relevant",abbr:"NR",color:"#ef4444",bg:"#fee2e2",border:"#fca5a5"};
}

function WaterfallChart() {
  const svgRef=useRef(null), containerRef=useRef(null);
  const [dims,setDims]=useState({w:900,h:420});
  useEffect(()=>{const ro=new ResizeObserver(e=>{for(const en of e){const w=en.contentRect.width;if(w>100)setDims({w,h:Math.min(420,Math.max(300,w*0.45))})}});if(containerRef.current)ro.observe(containerRef.current);return()=>ro.disconnect()},[]);
  useEffect(()=>{
    if(!svgRef.current)return;const svg=d3.select(svgRef.current);svg.selectAll("*").remove();
    const m={top:40,right:20,bottom:80,left:60},w=dims.w-m.left-m.right,h=dims.h-m.top-m.bottom;
    const g=svg.append("g").attr("transform",`translate(${m.left},${m.top})`);
    const x=d3.scaleBand().domain(WATERFALL_STEPS.map(d=>d.label)).range([0,w]).padding(0.25);
    const y=d3.scaleLinear().domain([0,5000]).range([h,0]);
    let running=0;
    const bars=WATERFALL_STEPS.map(step=>{let y0,y1,dv;if(step.type==="total"||step.type==="subtotal"||step.type==="final"){y0=0;y1=Math.abs(step.value);dv=Math.abs(step.value);running=Math.abs(step.value)}else{y0=running+step.value;y1=running;dv=step.value;running=y0}return{...step,y0,y1,dv}});
    for(let i=0;i<bars.length-1;i++){const c=bars[i],n=bars[i+1],fy=c.type==="decrease"?y(c.y0):y(c.y1);g.append("line").attr("x1",x(c.label)+x.bandwidth()).attr("x2",x(n.label)).attr("y1",fy).attr("y2",fy).attr("stroke","#64748b").attr("stroke-width",1).attr("stroke-dasharray","4,3").attr("opacity",0.5)}
    const bg=g.selectAll(".bar").data(bars).join("g").attr("class","bar");
    bg.append("rect").attr("x",d=>x(d.label)).attr("width",x.bandwidth()).attr("y",d=>y(Math.max(d.y0,d.y1))).attr("height",0).attr("rx",3).attr("fill",d=>d.type==="total"?"#1e293b":d.type==="subtotal"?"#475569":d.type==="final"?"#be123c":"#fda4af").transition().duration(800).delay((_,i)=>i*100).attr("height",d=>Math.abs(y(d.y0)-y(d.y1)));
    bg.append("text").attr("x",d=>x(d.label)+x.bandwidth()/2).attr("y",d=>y(Math.max(d.y0,d.y1))-8).attr("text-anchor","middle").attr("font-size","13px").attr("font-weight",700).attr("fill","#1e293b").attr("opacity",0).text(d=>Math.abs(d.dv).toLocaleString()).transition().duration(400).delay((_,i)=>i*100+600).attr("opacity",1);
    g.append("g").attr("transform",`translate(0,${h})`).call(d3.axisBottom(x).tickSize(0)).selectAll("text").attr("font-size","10px").attr("fill","#64748b").style("text-anchor","middle");
    g.select(".domain").remove();
    g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(","))).selectAll("text").attr("font-size","10px").attr("fill","#94a3b8");
    g.selectAll(".tick line").attr("stroke","#e2e8f0").attr("stroke-dasharray","2,2");g.select(".domain").remove();
    g.append("g").selectAll("line").data(y.ticks(5)).join("line").attr("x1",0).attr("x2",w).attr("y1",d=>y(d)).attr("y2",d=>y(d)).attr("stroke","#f1f5f9").attr("stroke-width",1).lower();
  },[dims]);
  return <div ref={containerRef} style={{width:"100%"}}><svg ref={svgRef} viewBox={`0 0 ${dims.w} ${dims.h}`} style={{width:"100%",height:"auto"}}/></div>;
}

function SegmentDonut() {
  const svgRef=useRef(null);const [hovered,setHovered]=useState(null);
  useEffect(()=>{
    if(!svgRef.current)return;const svg=d3.select(svgRef.current);svg.selectAll("*").remove();
    const s=260,r=s/2,inner=r*0.55,g=svg.append("g").attr("transform",`translate(${r},${r})`);
    const pie=d3.pie().value(d=>d.newSuspects).sort(null).padAngle(0.02);
    const arc=d3.arc().innerRadius(inner).outerRadius(r-4), arcH=d3.arc().innerRadius(inner).outerRadius(r);
    g.selectAll("path").data(pie(SEGMENT_BREAKDOWN)).join("path").attr("d",arc).attr("fill",d=>d.data.color).attr("stroke","#fff").attr("stroke-width",2).attr("cursor","pointer").attr("opacity",0.9)
      .on("mouseenter",function(_,d){d3.select(this).transition().duration(200).attr("d",arcH).attr("opacity",1);setHovered(d.data)})
      .on("mouseleave",function(){d3.select(this).transition().duration(200).attr("d",arc).attr("opacity",0.9);setHovered(null)});
    g.append("text").attr("text-anchor","middle").attr("dy","-0.3em").attr("font-size","28px").attr("font-weight",800).attr("fill","#1e293b").text("1,356");
    g.append("text").attr("text-anchor","middle").attr("dy","1.2em").attr("font-size","11px").attr("fill","#94a3b8").attr("letter-spacing","0.05em").text("NEW SUSPECTS");
  },[]);
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"}}>
    <svg ref={svgRef} viewBox="0 0 260 260" style={{width:"220px",height:"220px"}}/>
    {hovered&&<div style={{background:"#f8fafc",borderRadius:"8px",padding:"8px 14px",fontSize:"13px",fontWeight:600,color:"#1e293b",border:`2px solid ${hovered.color}`}}>{hovered.segment}: {hovered.newSuspects} suspects</div>}
    <div style={{display:"flex",flexWrap:"wrap",gap:"6px 14px",justifyContent:"center"}}>{SEGMENT_BREAKDOWN.map(s=><div key={s.segment} style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"11px",color:"#64748b"}}><span style={{width:10,height:10,borderRadius:3,background:s.color,display:"inline-block",flexShrink:0}}/>{s.segment}</div>)}</div>
  </div>;
}

function KPI({label,value,sub,accent}) {
  return <div style={{background:"#fff",borderRadius:"12px",padding:"20px 22px",borderLeft:`4px solid ${accent||"#be123c"}`,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",flex:"1 1 180px",minWidth:"160px"}}>
    <div style={{fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.08em",color:"#94a3b8",marginBottom:6,fontWeight:600}}>{label}</div>
    <div style={{fontSize:"28px",fontWeight:800,color:"#1e293b",lineHeight:1.1}}>{value}</div>
    {sub&&<div style={{fontSize:"12px",color:"#64748b",marginTop:4}}>{sub}</div>}
  </div>;
}

function ScoreSlider({value,onChange,color}) {
  return <div style={{display:"flex",alignItems:"center",gap:12}}>
    <div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>onChange(n)} style={{width:36,height:36,borderRadius:"8px",border:value===n?`2px solid ${color}`:"2px solid #e2e8f0",background:value===n?color:"#fff",color:value===n?"#fff":"#94a3b8",fontSize:"14px",fontWeight:700,cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit"}}>{n}</button>)}</div>
    <span style={{fontSize:"11px",color:"#94a3b8",minWidth:20}}>{value?`${value}/5`:"—"}</span>
  </div>;
}

function QualificationGauge({score}) {
  const qual=getQualification(score);
  const pct=Math.min(score/5,1);
  const angle=-90+pct*180;
  // Arc helper: angle in degrees from -90 (left) to 90 (right), radius 80, center (100,100)
  const arcPt=(deg)=>{const r=Math.PI/180;return{x:100+80*Math.cos(deg*r),y:100+80*Math.sin(deg*r)}};
  // Thresholds: NR < 2.5/5 = 50%, MQL < 3.8/5 = 76%, SQL >= 76%
  // Angles: -90 to 90. NR: -90 to 0, MQL: 0 to 46.8, SQL: 46.8 to 90
  const nrEnd=arcPt(-90+180*0.5); // 2.5/5 = 0°
  const mqlEnd=arcPt(-90+180*0.76); // 3.8/5 = 46.8°
  const needleTip={x:100+60*Math.cos(angle*Math.PI/180),y:100+60*Math.sin(angle*Math.PI/180)};
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
    <svg viewBox="0 0 200 120" style={{width:200,height:120}}>
      {/* Red zone: 0 - 2.5 (left half) */}
      <path d={`M 20 100 A 80 80 0 0 1 ${nrEnd.x} ${nrEnd.y}`} fill="none" stroke="#fca5a5" strokeWidth="16" strokeLinecap="round"/>
      {/* Yellow zone: 2.5 - 3.8 */}
      <path d={`M ${nrEnd.x} ${nrEnd.y} A 80 80 0 0 1 ${mqlEnd.x} ${mqlEnd.y}`} fill="none" stroke="#fcd34d" strokeWidth="16" strokeLinecap="round"/>
      {/* Green zone: 3.8 - 5 (right portion) */}
      <path d={`M ${mqlEnd.x} ${mqlEnd.y} A 80 80 0 0 1 180 100`} fill="none" stroke="#86efac" strokeWidth="16" strokeLinecap="round"/>
      {/* Needle */}
      <line x1="100" y1="100" x2={needleTip.x} y2={needleTip.y} stroke="#1e293b" strokeWidth="3" strokeLinecap="round" style={{transition:"all 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      <circle cx="100" cy="100" r="6" fill="#1e293b"/>
      {/* Labels */}
      <text x="20" y="118" fontSize="9" fill="#ef4444" fontWeight="700">NR</text>
      <text x="90" y="16" fontSize="9" fill="#f59e0b" fontWeight="700">MQL</text>
      <text x="168" y="118" fontSize="9" fill="#16a34a" fontWeight="700">SQL</text>
    </svg>
    <div style={{padding:"6px 16px",borderRadius:"8px",background:qual.bg,border:`2px solid ${qual.border}`,color:qual.color,fontWeight:800,fontSize:"14px"}}>{qual.label}</div>
  </div>;
}

function PrequalificationView({companies,fontStack}) {
  const [selId,setSelId]=useState(null);
  const [allData,setAllData]=useState(()=>{try{return JSON.parse(localStorage.getItem("atalian_prequal")||"{}")}catch{return{}}});
  const scores=selId&&allData[selId]?allData[selId].scores||{}:{};
  const notes=selId&&allData[selId]?allData[selId].notes||{}:{};
  const setScores=(fn)=>{setAllData(prev=>{const cur=prev[selId]||{scores:{},notes:{}};const newScores=typeof fn==="function"?fn(cur.scores):fn;const next={...prev,[selId]:{...cur,scores:newScores}};localStorage.setItem("atalian_prequal",JSON.stringify(next));return next})};
  const setNotes=(fn)=>{setAllData(prev=>{const cur=prev[selId]||{scores:{},notes:{}};const newNotes=typeof fn==="function"?fn(cur.notes):fn;const next={...prev,[selId]:{...cur,notes:newNotes}};localStorage.setItem("atalian_prequal",JSON.stringify(next));return next})};
  const [csearch,setCsearch]=useState("");
  const [showQ,setShowQ]=useState({});
  const sel=companies.find(c=>c.id===selId);
  const fc=useMemo(()=>{if(!csearch)return companies.slice(0,50);const q=csearch.toLowerCase();return companies.filter(c=>c.name.toLowerCase().includes(q)||c.nip.includes(q)).slice(0,50)},[companies,csearch]);
  const ws=useMemo(()=>{let tw=0,tu=0;PREQUALIFICATION_CRITERIA.forEach(cat=>cat.criteria.forEach(c=>{if(scores[c.id]){tw+=scores[c.id]*c.weight;tu+=c.weight}}));return tu===0?0:tw/tu},[scores]);
  const allScored=PREQUALIFICATION_CRITERIA.every(cat=>cat.criteria.every(c=>scores[c.id]));
  const scoredCount=Object.keys(scores).filter(k=>scores[k]).length;
  const totalCriteria=PREQUALIFICATION_CRITERIA.reduce((s,cat)=>s+cat.criteria.length,0);
  // Count how many companies have been scored
  const scoredCompanies=Object.keys(allData).filter(k=>{const d=allData[k];return d.scores&&Object.keys(d.scores).length>0}).length;

  return <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:24,alignItems:"start"}}>
    <div style={{background:"#fff",borderRadius:"14px",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",position:"sticky",top:24}}>
      <h3 style={{margin:"0 0 4px",fontSize:"14px",fontWeight:700,color:"#1e293b"}}>Select Account</h3>
      <p style={{margin:0,fontSize:"11px",color:"#94a3b8",marginBottom:12}}>{scoredCompanies} account{scoredCompanies!==1?"s":""} scored · Auto-saved</p>
      <input type="text" placeholder="Search company…" value={csearch} onChange={e=>setCsearch(e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:"8px",border:"1px solid #e2e8f0",fontSize:"13px",fontFamily:fontStack,outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
      <div style={{maxHeight:420,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
        {fc.map(c=>{const hasSaved=allData[c.id]&&allData[c.id].scores&&Object.keys(allData[c.id].scores).length>0;const savedWs=(()=>{if(!hasSaved)return 0;const sc=allData[c.id].scores;let tw=0,tu=0;PREQUALIFICATION_CRITERIA.forEach(cat=>cat.criteria.forEach(cr=>{if(sc[cr.id]){tw+=sc[cr.id]*cr.weight;tu+=cr.weight}}));return tu===0?0:tw/tu})();const savedQual=hasSaved?getQualification(savedWs):null;
        return <button key={c.id} onClick={()=>{setSelId(c.id);setShowQ({})}} style={{display:"flex",flexDirection:"column",alignItems:"flex-start",padding:"10px 12px",borderRadius:"8px",border:selId===c.id?"2px solid #be123c":"1px solid #f1f5f9",background:selId===c.id?"#fef2f2":"#fff",cursor:"pointer",textAlign:"left",fontFamily:fontStack,transition:"all 0.15s",width:"100%",boxSizing:"border-box",position:"relative"}}>
          <span style={{fontSize:"13px",fontWeight:600,color:"#0f172a"}}>{c.name}</span>
          <span style={{fontSize:"11px",color:"#94a3b8",marginTop:2}}>{c.segment} · {c.region} · {c.revenue}m€</span>
          {hasSaved&&<span style={{position:"absolute",top:8,right:8,fontSize:"10px",fontWeight:700,padding:"1px 6px",borderRadius:"4px",background:savedQual.bg,color:savedQual.color,border:`1px solid ${savedQual.border}`}}>{savedQual.abbr}</span>}
        </button>})}
      </div>
    </div>
    <div>
      {!sel?<div style={{background:"#fff",borderRadius:"14px",padding:"60px 40px",textAlign:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
        <div style={{fontSize:"48px",marginBottom:16}}>🎯</div>
        <h3 style={{margin:"0 0 8px",fontSize:"18px",fontWeight:700,color:"#1e293b"}}>Select an account to start</h3>
        <p style={{margin:0,fontSize:"14px",color:"#94a3b8"}}>Pick a company from the list to begin the pre-qualification assessment</p>
      </div>:<>
        <div style={{background:"#fff",borderRadius:"14px",padding:"20px 24px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
          <div>
            <h2 style={{margin:"0 0 4px",fontSize:"20px",fontWeight:800,color:"#0f172a"}}>{sel.name}</h2>
            <p style={{margin:0,fontSize:"13px",color:"#64748b"}}>{sel.segment} · {sel.subSegment} · {sel.region} · {sel.revenue}m€ · {sel.employees.toLocaleString()} emp. · {sel.sites} sites</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:"11px",color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600,marginBottom:2}}>Progress</div><div style={{fontSize:"18px",fontWeight:800,color:"#1e293b"}}>{scoredCount}/{totalCriteria}</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:"11px",color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600,marginBottom:2}}>Weighted Score</div><div style={{fontSize:"18px",fontWeight:800,color:"#1e293b"}}>{ws.toFixed(1)}/5.0</div></div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 240px",gap:20,alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {PREQUALIFICATION_CRITERIA.map(cat=><div key={cat.category}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{width:4,height:20,borderRadius:2,background:cat.color}}/><h3 style={{margin:0,fontSize:"12px",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",color:cat.color}}>{cat.category}</h3></div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {cat.criteria.map(cr=><div key={cr.id} style={{background:"#fff",borderRadius:"12px",padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",borderLeft:`4px solid ${scores[cr.id]?cat.color:"#e2e8f0"}`,transition:"border-color 0.2s"}}>
                  <div style={{marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <h4 style={{margin:0,fontSize:"14px",fontWeight:700,color:"#1e293b"}}>{cr.name}</h4>
                      <span style={{fontSize:"10px",fontWeight:700,color:"#94a3b8",background:"#f8fafc",padding:"2px 6px",borderRadius:"4px",border:"1px solid #f1f5f9"}}>Weight: {cr.weight}x</span>
                    </div>
                    <p style={{margin:0,fontSize:"12px",color:"#94a3b8",lineHeight:1.5}}>{cr.description}</p>
                  </div>
                  <ScoreSlider value={scores[cr.id]||0} onChange={v=>setScores(p=>({...p,[cr.id]:v}))} color={cat.color}/>
                  <button onClick={()=>setShowQ(p=>({...p,[cr.id]:!p[cr.id]}))} style={{marginTop:10,background:"none",border:"none",cursor:"pointer",fontSize:"12px",color:"#64748b",fontFamily:fontStack,padding:0,display:"flex",alignItems:"center",gap:4}}>{showQ[cr.id]?"▾":"▸"} Suggested questions ({cr.questions.length})</button>
                  {showQ[cr.id]&&<div style={{marginTop:8,paddingLeft:12,borderLeft:"2px solid #f1f5f9"}}>{cr.questions.map((q,i)=><p key={i} style={{margin:"4px 0",fontSize:"12px",color:"#64748b",lineHeight:1.5}}>→ {q}</p>)}</div>}
                  <textarea placeholder="Notes…" value={notes[cr.id]||""} onChange={e=>setNotes(p=>({...p,[cr.id]:e.target.value}))} rows={2} style={{marginTop:10,width:"100%",padding:"8px 10px",borderRadius:"8px",border:"1px solid #f1f5f9",fontSize:"12px",fontFamily:fontStack,resize:"vertical",outline:"none",color:"#334155",boxSizing:"border-box"}}/>
                </div>)}
              </div>
            </div>)}
          </div>
          <div style={{position:"sticky",top:24}}>
            <div style={{background:"#fff",borderRadius:"14px",padding:"24px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",textAlign:"center"}}>
              <h3 style={{margin:"0 0 16px",fontSize:"13px",fontWeight:700,color:"#1e293b",textTransform:"uppercase",letterSpacing:"0.06em"}}>Qualification Result</h3>
              <QualificationGauge score={ws}/>
              <div style={{marginTop:16,fontSize:"12px",color:"#94a3b8"}}>{scoredCount}/{totalCriteria} criteria scored</div>
              <div style={{marginTop:20,textAlign:"left"}}>
                {PREQUALIFICATION_CRITERIA.map(cat=>{const cs=cat.criteria.filter(c=>scores[c.id]);const avg=cs.length>0?cs.reduce((s,c)=>s+scores[c.id],0)/cs.length:0;return <div key={cat.category} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:"11px",fontWeight:700,color:cat.color}}>{cat.category}</span><span style={{fontSize:"11px",fontWeight:700,color:"#1e293b"}}>{avg.toFixed(1)}</span></div>
                  <div style={{height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(avg/5)*100}%`,background:cat.color,borderRadius:3,transition:"width 0.4s ease"}}/></div>
                </div>})}
              </div>
              {allScored&&<div style={{marginTop:16,padding:"10px",borderRadius:"8px",background:"#f0fdf4",border:"1px solid #86efac",fontSize:"12px",color:"#166534",fontWeight:600}}>✓ All criteria scored — qualification complete</div>}
              {scoredCount>0&&<div style={{marginTop:8,fontSize:"11px",color:"#94a3b8",textAlign:"center"}}>💾 Auto-saved in browser</div>}
            </div>
          </div>
        </div>
      </>}
    </div>
  </div>;
}

const COLS=[{key:"nip",label:"NIP",w:130},{key:"name",label:"Company Name",w:200},{key:"segment",label:"Segment",w:170},{key:"subSegment",label:"Sub-segment",w:150},{key:"region",label:"Region",w:130},{key:"ownership",label:"Public/Private",w:105},{key:"priority",label:"Priority",w:140},{key:"status",label:"Status",w:130},{key:"revenue",label:"Revenue (m€)",w:110},{key:"profit",label:"Profit (%)",w:85},{key:"outsourcingPropensity",label:"Outsourcing",w:100},{key:"potentialSpend",label:"Potential Spend (m€)",w:140},{key:"employees",label:"Employees",w:95},{key:"sites",label:"Sites in PL",w:85},{key:"businessScale",label:"Business Scale",w:115}];

function StatusBadge({status}) {
  const c={
    "New Suspect":{bg:"#fef3c7",text:"#92400e",border:"#fbbf24"},
    "Lost Prospect":{bg:"#fee2e2",text:"#991b1b",border:"#fca5a5"},
    "Lost Client":{bg:"#fce7f3",text:"#9d174d",border:"#f9a8d4"},
    "Current Client":{bg:"#d1fae5",text:"#065f46",border:"#6ee7b7"},
  }[status]||{bg:"#f1f5f9",text:"#475569",border:"#cbd5e1"};
  return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:"6px",fontSize:"11px",fontWeight:600,background:c.bg,color:c.text,border:`1px solid ${c.border}`,whiteSpace:"nowrap"}}>{status}</span>;
}

function PriorityBadge({priority}) {
  const p1=priority.includes("P1");
  return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:"6px",fontSize:"11px",fontWeight:700,background:p1?"#be123c":"#f1f5f9",color:p1?"#fff":"#64748b",whiteSpace:"nowrap"}}>{p1?"P1 — High":"P2 — Opp."}</span>;
}

function PropensityDot({value}) {
  const color=value==="High"?"#16a34a":value==="Medium"?"#f59e0b":"#ef4444";
  return <span style={{display:"flex",alignItems:"center",gap:5,fontSize:"12px"}}><span style={{width:8,height:8,borderRadius:"50%",background:color,display:"inline-block"}}/>{value}</span>;
}

export default function HuntListApp() {
  const [view,setView]=useState("dashboard");
  const [search,setSearch]=useState("");
  const [segFilter,setSegFilter]=useState("All");
  const [statusFilter,setStatusFilter]=useState("All");
  const [prioFilter,setPrioFilter]=useState("All");
  const [sortKey,setSortKey]=useState("revenue");
  const [sortDir,setSortDir]=useState("desc");
  const [page,setPage]=useState(0);
  const PAGE_SIZE=25;

  const filtered=useMemo(()=>{
    let data=[...ALL_COMPANIES];
    if(search){const q=search.toLowerCase();data=data.filter(c=>c.name.toLowerCase().includes(q)||c.nip.includes(q))}
    if(segFilter!=="All")data=data.filter(c=>c.segment===segFilter);
    if(statusFilter!=="All")data=data.filter(c=>c.status===statusFilter);
    if(prioFilter!=="All")data=data.filter(c=>c.priority===prioFilter);
    data.sort((a,b)=>{let av=a[sortKey],bv=b[sortKey];if(typeof av==="string")av=av.toLowerCase();if(typeof bv==="string")bv=bv.toLowerCase();if(av<bv)return sortDir==="asc"?-1:1;if(av>bv)return sortDir==="asc"?1:-1;return 0});
    return data;
  },[search,segFilter,statusFilter,prioFilter,sortKey,sortDir]);

  const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const handleSort=k=>{if(sortKey===k)setSortDir(sortDir==="asc"?"desc":"asc");else{setSortKey(k);setSortDir("desc")}setPage(0)};
  const avgRevenue=(filtered.reduce((s,c)=>s+c.revenue,0)/(filtered.length||1)).toFixed(0);
  const p1Count=filtered.filter(c=>c.priority.includes("P1")).length;
  const newSuspects=filtered.filter(c=>c.status==="New Suspect").length;
  const fontStack="'DM Sans','Segoe UI',system-ui,-apple-system,sans-serif";
  const VIEWS=[{id:"dashboard",label:"📊 Dashboard"},{id:"table",label:"📋 Hunt List"},{id:"prequalification",label:"🎯 Pre-qualification"}];

  return <div style={{fontFamily:fontStack,background:"#f8fafc",minHeight:"100vh",color:"#1e293b"}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
    <header style={{background:"linear-gradient(135deg,#1e293b 0%,#0f172a 100%)",padding:"28px 36px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
          <div style={{width:36,height:36,borderRadius:"8px",background:"#be123c",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:16}}>AP</div>
          <h1 style={{margin:0,fontSize:"22px",fontWeight:800,color:"#fff",letterSpacing:"-0.02em"}}>Atalian Poland — Sales Excellence</h1>
        </div>
        <p style={{margin:0,fontSize:"13px",color:"#94a3b8",marginTop:4}}>Hunt list · Pre-qualification · Commercial strategy tools</p>
      </div>
      <div style={{display:"flex",gap:6}}>
        {VIEWS.map(v=><button key={v.id} onClick={()=>{setView(v.id);setPage(0)}} style={{padding:"8px 16px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:fontStack,background:view===v.id?"#be123c":"rgba(255,255,255,0.08)",color:view===v.id?"#fff":"#94a3b8",transition:"all 0.2s"}}>{v.label}</button>)}
      </div>
    </header>

    <main style={{padding:"24px 32px 48px",maxWidth:1440,margin:"0 auto"}}>
      {view==="prequalification"?<PrequalificationView companies={ALL_COMPANIES} fontStack={fontStack}/>:<>
        <div style={{display:"flex",flexWrap:"wrap",gap:16,marginBottom:28}}>
          <KPI label="Total Companies" value={filtered.length.toLocaleString()} sub="In current scope" accent="#1e293b"/>
          <KPI label="P1 — High Priority" value={p1Count.toLocaleString()} sub={`${((p1Count/(filtered.length||1))*100).toFixed(0)}% of scope`} accent="#be123c"/>
          <KPI label="New Suspects" value={newSuspects.toLocaleString()} sub="Untouched prospects" accent="#f59e0b"/>
          <KPI label="Avg. Revenue" value={`${avgRevenue}m€`} sub="Across filtered scope" accent="#0891b2"/>
        </div>

        {view==="dashboard"?<div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:24,alignItems:"start"}}>
          <div style={{background:"#fff",borderRadius:"14px",padding:"24px 28px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <h2 style={{margin:"0 0 4px",fontSize:"16px",fontWeight:700,color:"#1e293b"}}>Hunt List Scope — Waterfall</h2>
            <p style={{margin:"0 0 12px",fontSize:"12px",color:"#94a3b8"}}>From total NIP codes to private P1 hunt scope</p>
            <WaterfallChart/>
          </div>
          <div style={{background:"#fff",borderRadius:"14px",padding:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <h2 style={{margin:"0 0 4px",fontSize:"16px",fontWeight:700,color:"#1e293b"}}>New Suspects by Segment</h2>
            <p style={{margin:"0 0 16px",fontSize:"12px",color:"#94a3b8"}}>Breakdown of 1,356 new suspects</p>
            <SegmentDonut/>
          </div>
          <div style={{gridColumn:"1 / -1",background:"#fff",borderRadius:"14px",padding:"24px 28px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <h2 style={{margin:"0 0 16px",fontSize:"16px",fontWeight:700}}>Prospect Distribution by Segment & Status</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
              {SEGMENTS.map(seg=>{const co=ALL_COMPANIES.filter(c=>c.segment===seg);const t=co.length;const sc=STATUSES.map(st=>({status:st,count:co.filter(c=>c.status===st).length}));const sclr={"New Suspect":"#fbbf24","Lost Prospect":"#fca5a5","Lost Client":"#f9a8d4","Current Client":"#6ee7b7"};
                return <div key={seg} style={{padding:"14px 16px",background:"#f8fafc",borderRadius:"10px",border:"1px solid #f1f5f9"}}>
                  <div style={{fontSize:"13px",fontWeight:700,color:"#1e293b",marginBottom:4}}>{seg}</div>
                  <div style={{fontSize:"22px",fontWeight:800,color:"#be123c",marginBottom:8}}>{t}</div>
                  <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",gap:1}}>{sc.map(s=><div key={s.status} style={{flex:s.count,background:sclr[s.status],borderRadius:2}} title={`${s.status}: ${s.count}`}/>)}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"2px 10px",marginTop:6}}>{sc.map(s=><span key={s.status} style={{fontSize:"10px",color:"#94a3b8"}}>{s.status.replace("New ","N.").replace("Lost ","L.").replace("Current ","C.")}: {s.count}</span>)}</div>
                </div>})}
            </div>
          </div>
        </div>:<div>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:18,alignItems:"center"}}>
            <input type="text" placeholder="Search company or NIP…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} style={{padding:"8px 14px",borderRadius:"8px",border:"1px solid #e2e8f0",fontSize:"13px",fontFamily:fontStack,width:240,outline:"none",background:"#fff"}}/>
            {[{val:segFilter,set:setSegFilter,opts:["All",...SEGMENTS],label:"Segment"},{val:statusFilter,set:setStatusFilter,opts:["All",...STATUSES],label:"Status"},{val:prioFilter,set:setPrioFilter,opts:["All",...PRIORITIES],label:"Priority"}].map(({val,set,opts,label})=>
              <select key={label} value={val} onChange={e=>{set(e.target.value);setPage(0)}} style={{padding:"8px 12px",borderRadius:"8px",border:"1px solid #e2e8f0",fontSize:"13px",fontFamily:fontStack,background:"#fff",color:"#1e293b",cursor:"pointer"}}>
                {opts.map(o=><option key={o} value={o}>{o==="All"?`${label}: All`:o}</option>)}
              </select>)}
            <span style={{fontSize:"12px",color:"#94a3b8",marginLeft:"auto"}}>Showing {paged.length} of {filtered.length} companies</span>
          </div>
          <div style={{background:"#fff",borderRadius:"14px",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #f1f5f9"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                <thead><tr>{COLS.map(col=><th key={col.key} onClick={()=>handleSort(col.key)} style={{padding:"12px 14px",textAlign:"left",fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:sortKey===col.key?"#be123c":"#94a3b8",borderBottom:"2px solid #f1f5f9",cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",minWidth:col.w,background:"#fafbfc",position:"sticky",top:0}}>{col.label} {sortKey===col.key?(sortDir==="asc"?"↑":"↓"):""}</th>)}</tr></thead>
                <tbody>{paged.map((c,i)=><tr key={c.id} style={{background:i%2===0?"#fff":"#fafbfc",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#fafbfc"}>
                  {COLS.map(col=><td key={col.key} style={{padding:"10px 14px",borderBottom:"1px solid #f1f5f9",whiteSpace:"nowrap",color:"#334155"}}>
                    {col.key==="status"?<StatusBadge status={c[col.key]}/>:col.key==="priority"?<PriorityBadge priority={c[col.key]}/>:col.key==="outsourcingPropensity"?<PropensityDot value={c[col.key]}/>:col.key==="revenue"||col.key==="potentialSpend"?<span style={{fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{c[col.key]}</span>:col.key==="profit"?<span style={{fontVariantNumeric:"tabular-nums"}}>{c[col.key]}%</span>:col.key==="employees"||col.key==="sites"?<span style={{fontVariantNumeric:"tabular-nums"}}>{c[col.key].toLocaleString()}</span>:col.key==="name"?<span style={{fontWeight:600,color:"#0f172a"}}>{c[col.key]}</span>:c[col.key]}
                  </td>)}
                </tr>)}</tbody>
              </table>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,marginTop:18}}>
            <button disabled={page===0} onClick={()=>setPage(page-1)} style={{padding:"6px 14px",borderRadius:"7px",border:"1px solid #e2e8f0",background:page===0?"#f8fafc":"#fff",cursor:page===0?"default":"pointer",fontSize:"12px",fontFamily:fontStack,color:page===0?"#cbd5e1":"#1e293b",fontWeight:600}}>← Prev</button>
            <span style={{fontSize:"12px",color:"#64748b",fontWeight:600}}>Page {page+1} / {totalPages}</span>
            <button disabled={page>=totalPages-1} onClick={()=>setPage(page+1)} style={{padding:"6px 14px",borderRadius:"7px",border:"1px solid #e2e8f0",background:page>=totalPages-1?"#f8fafc":"#fff",cursor:page>=totalPages-1?"default":"pointer",fontSize:"12px",fontFamily:fontStack,color:page>=totalPages-1?"#cbd5e1":"#1e293b",fontWeight:600}}>Next →</button>
          </div>
        </div>}
      </>}
    </main>
    <footer style={{textAlign:"center",padding:"16px",fontSize:"11px",color:"#cbd5e1",borderTop:"1px solid #f1f5f9"}}>© Simon-Kucher · Atalian International × Simon-Kucher · Commercial Strategy — Sales Excellence Tool (POC)</footer>
  </div>;
}
