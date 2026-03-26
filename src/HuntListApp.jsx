import{useState,useMemo,useRef,useEffect}from"react";
import*as d3 from"d3";

/* ═══════════════════════════════════════════════════════════════
   ATALIAN POLAND — SALES EXCELLENCE TOOL v12
   Hubspot-inspired design · Dynamic waterfall · Atalian orange
   ═══════════════════════════════════════════════════════════════ */

const P="#E87722",Dk="#1e2a3a",F="'DM Sans',system-ui,sans-serif";

const SEGMENTS=["Industrial Production","Retail & Consumer Networks","Healthcare & Social Care","Banking & Financial Services","Logistics & Transport","Real Estate"];
const SUB_SEG={"Industrial Production":["Automotive","FMCG Manufacturing","Heavy Industry","Electronics","Chemicals"],"Retail & Consumer Networks":["Grocery Chains","Fashion Retail","DIY & Home","Shopping Centers"],"Healthcare & Social Care":["Hospitals","Clinics","Elderly Care","Pharma Facilities"],"Banking & Financial Services":["Retail Banking","Corporate Banking","Insurance","FinTech"],"Logistics & Transport":["Warehousing","Distribution Centers","Port Facilities","Freight Hubs"],"Real Estate":["Office Buildings","Mixed-Use Complexes","Industrial Parks","Residential Estates"]};
const REGIONS=["Mazowieckie","Śląskie","Wielkopolskie","Małopolskie","Dolnośląskie","Łódzkie","Pomorskie","Zachodniopomorskie"];
const STATUSES=["New Suspect","Lost Prospect","Lost Client","Current Client"];
const PRIORITIES=["P1 - High Priority","P2 - Opportunistic"];
const SEG_COLORS={"Industrial Production":"#E87722","Retail & Consumer Networks":"#f59e0b","Healthcare & Social Care":"#8b5cf6","Banking & Financial Services":"#06b6d4","Logistics & Transport":"#10b981","Real Estate":"#f43f5e"};

function genCo(n){const pfx=["Pol","War","Krak","Gdań","Wrocł","Łódź","Pozn","Szcz","Lub","Kat","Bial","Czest","Rad","Tor","Kiel","Ols","Rzesz","Opol","Gliwi","Zabrz","Bydg","Tychy","Sosnow","Elbl","Płock","Tarn","Chorzów","Bytom","Ruda"],sfx=["Tech Sp. z o.o.","Invest S.A.","Group Sp. z o.o.","Solutions S.A.","Holding Sp. z o.o.","Industrial S.A.","Logistics Sp. z o.o.","Development S.A.","Services Sp. z o.o.","Capital S.A.","Engineering Sp. z o.o.","Systems S.A.","Management Sp. z o.o.","Partners S.A.","International Sp. z o.o."],co=[],u=new Set(),r=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,p=a=>a[Math.floor(Math.random()*a.length)],rf=(a,b)=>+(Math.random()*(b-a)+a).toFixed(1);
for(let i=0;i<n;i++){let nm;do{nm=p(pfx)+p(["a","o","ex","is","um","en","ia"])+" "+p(sfx)}while(u.has(nm));u.add(nm);const seg=p(SEGMENTS),rev=r(50,2000);co.push({id:i+1,nip:`${r(100,999)}-${r(10,99)}-${r(10,99)}-${r(100,999)}`,name:nm,segment:seg,subSegment:p(SUB_SEG[seg]),region:p(REGIONS),ownership:Math.random()<.12?"Public":"Private",priority:rev>200?"P1 - High Priority":Math.random()<.55?"P1 - High Priority":"P2 - Opportunistic",status:p(STATUSES),revenue:rev,profit:rf(1,18),outsourcingPropensity:p(["High","Medium","Low"]),potentialSpend:rf(.2,8),employees:r(80,12000),sites:r(1,45),businessScale:p(["Large","Mid-Market","SME"])})}return co}
const ALL=genCo(1390);

/* ═══ PREQUAL ═══ */
const PQ=[
  {cat:"STRATEGIC FIT",color:"#e11d48",items:[
    {id:"intent",name:"Intent to outsource FM",desc:"Is the client considering outsourcing FM services?",q:["Considering outsourcing any FM?","New need or reviewing setup?","What's driving this?"],w:3},
    {id:"scope",name:"Offer / service scope",desc:"Which FM services in scope?",q:["Which services?","One provider or selected?","Scope expand over time?"],w:2},
  ]},
  {cat:"OPERATIONAL FIT",color:"#2563eb",items:[
    {id:"ability",name:"Ability of AP to respond",desc:"Does opportunity fit AP capabilities?",q:["Key requirements?","Technical/compliance constraints?","Expected service levels?"],w:3},
    {id:"geography",name:"Geography / site footprint",desc:"Where are services needed?",q:["Where are sites?","How many?","Single or multi-site?"],w:2},
  ]},
  {cat:"LEAD QUALITY",color:"#f59e0b",items:[
    {id:"competitor",name:"Competitor / share of wallet",desc:"Another provider in place?",q:["Who provides currently?","Satisfaction?","Replace or complement?"],w:2},
    {id:"interest",name:"Interest shown",desc:"How engaged is the client?",q:["Open to follow-up?","How important today?"],w:2},
    {id:"need",name:"Detailed need / pain points",desc:"Clear view of business need?",q:["Challenges with current FM?","What to improve?","Ideal solution?"],w:1},
  ]},
];

const PF_SEC=[
  {id:"general",title:"General Information",icon:"🏢",fields:[{id:"contactName",l:"Contact Name",t:"text"},{id:"contactTitle",l:"Job Title",t:"text"},{id:"contactEmail",l:"Email",t:"text"},{id:"contactPhone",l:"Phone",t:"text"},{id:"linkedinUrl",l:"LinkedIn",t:"text"},{id:"industry",l:"Industry",t:"text"}]},
  {id:"before",title:"Before Interaction",icon:"📋",fields:[{id:"companyProfile",l:"Company Profile",t:"area"},{id:"currentProvider",l:"Current FM Provider",t:"text"},{id:"contractExpiry",l:"Contract Expiry",t:"text"},{id:"totalSurface",l:"Surface (m²)",t:"text"},{id:"decisionMaker",l:"Decision Maker",t:"area"},{id:"keyPriorities",l:"Key Priorities",t:"area"}]},
  {id:"during",title:"During Interaction",icon:"💬",fields:[{id:"meetingDate",l:"Date",t:"text"},{id:"meetingType",l:"Type",t:"text"},{id:"attendees",l:"Attendees",t:"text"},{id:"expressedNeeds",l:"Needs",t:"area"},{id:"painPoints",l:"Pain Points",t:"area"},{id:"objections",l:"Objections",t:"area"},{id:"priceSensitivity",l:"Price Sensitivity",t:"text"},{id:"nextStepsAgreed",l:"Next Steps",t:"area"}]},
  {id:"after",title:"After Interaction",icon:"⚙️",fields:[{id:"debriefNotes",l:"Debrief",t:"area"},{id:"revisedProbability",l:"Win Probability",t:"text"},{id:"blockingPoints",l:"Blocking Points",t:"area"},{id:"nextActions",l:"Next Actions",t:"area"},{id:"followUpDate",l:"Follow-up Date",t:"text"},{id:"estimatedValue",l:"Est. Value (PLN)",t:"text"}]},
];

function calcWS(sc){let tw=0,tu=0;PQ.forEach(c=>c.items.forEach(it=>{if(sc[it.id]){tw+=sc[it.id]*it.w;tu+=it.w}}));return tu?tw/tu:0}
function getQ(ws){if(ws>=3.8)return{label:"SQL",full:"Sales Qualified Lead",color:"#16a34a",bg:"#dcfce7",bdr:"#86efac"};if(ws>=2.5)return{label:"MQL",full:"Marketing Qualified Lead",color:"#f59e0b",bg:"#fef3c7",bdr:"#fcd34d"};if(ws>0)return{label:"NR",full:"Not Relevant",color:"#ef4444",bg:"#fee2e2",bdr:"#fca5a5"};return null}

function useStore(){
  const[data,setData]=useState(()=>{try{return JSON.parse(localStorage.getItem("atalian_v3")||"{}")}catch{return{}}});
  const save=(id,key,val)=>{setData(p=>{const next={...p,[id]:{...p[id],[key]:val,ts:Date.now()}};try{localStorage.setItem("atalian_v3",JSON.stringify(next))}catch{}return next})};
  const get=id=>data[id]||{};
  const qual=id=>{const d=data[id];if(!d?.scores||!Object.keys(d.scores).length)return null;return getQ(calcWS(d.scores))};
  const hasFile=id=>{const d=data[id];return d?.prospect&&Object.values(d.prospect).some(v=>v&&v.trim&&v.trim())};
  const cnt=Object.keys(data).filter(k=>data[k]?.scores&&Object.keys(data[k].scores).length).length;
  const fileCnt=Object.keys(data).filter(k=>data[k]?.prospect&&Object.values(data[k].prospect).some(v=>v&&v.trim&&v.trim())).length;
  return{save,get,qual,hasFile,cnt,fileCnt};
}

/* ═══ CSS-IN-JS helpers ═══ */
const card={background:"#fff",borderRadius:16,boxShadow:"0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03)",border:"1px solid #f0f0f5"};
const inputStyle={width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid #e5e7eb",fontSize:13,fontFamily:F,outline:"none",color:Dk,boxSizing:"border-box",background:"#fafafa",transition:"border .2s"};

/* ═══ DYNAMIC WATERFALL ═══ */
function DynWaterfall({data}){
  const ref=useRef(),cRef=useRef(),[dims,setDims]=useState({w:800,h:340});
  useEffect(()=>{const ro=new ResizeObserver(e=>{for(const en of e){const w=en.contentRect.width;if(w>100)setDims({w,h:Math.min(340,Math.max(240,w*.38))})}});if(cRef.current)ro.observe(cRef.current);return()=>ro.disconnect()},[]);

  const steps=useMemo(()=>{
    const total=data.length;
    const p1=data.filter(c=>c.priority.includes("P1")).length;
    const p2=total-p1;
    const priv=data.filter(c=>c.ownership==="Private").length;
    const pub=data.filter(c=>c.ownership==="Public").length;
    const ns=data.filter(c=>c.status==="New Suspect").length;
    const lp=data.filter(c=>c.status==="Lost Prospect").length;
    const lc=data.filter(c=>c.status==="Lost Client").length;
    const cc=data.filter(c=>c.status==="Current Client").length;
    return[
      {l:"Total\nScope",v:total,t:"total"},
      {l:"P2 Opp.",v:-p2,t:"decrease"},
      {l:"P1 High\nPriority",v:p1,t:"subtotal"},
      {l:"Public",v:-pub,t:"decrease"},
      {l:"Private\nScope",v:priv,t:"accent"},
      {l:"Current\nClients",v:-cc,t:"decrease"},
      {l:"Lost",v:-(lp+lc),t:"decrease"},
      {l:"New\nSuspects",v:ns,t:"final"},
    ];
  },[data]);

  useEffect(()=>{
    if(!ref.current)return;const svg=d3.select(ref.current);svg.selectAll("*").remove();
    const m={top:30,right:15,bottom:60,left:50},w=dims.w-m.left-m.right,h=dims.h-m.top-m.bottom;
    const g=svg.append("g").attr("transform",`translate(${m.left},${m.top})`);
    const maxVal=Math.max(...steps.map(s=>Math.abs(s.v)),steps[0].v)*1.15;
    const x=d3.scaleBand().domain(steps.map(d=>d.l)).range([0,w]).padding(.2);
    const y=d3.scaleLinear().domain([0,maxVal]).range([h,0]);
    let run=0;
    const bars=steps.map(s=>{let y0,y1;if(["total","subtotal","accent","final"].includes(s.t)){y0=0;y1=Math.abs(s.v);run=Math.abs(s.v)}else{y0=run+s.v;y1=run;run=y0}return{...s,y0,y1}});
    // connectors
    for(let i=0;i<bars.length-1;i++){const c=bars[i],n=bars[i+1],fy=["total","subtotal","accent","final"].includes(c.t)?y(c.y1):y(c.y0);g.append("line").attr("x1",x(c.l)+x.bandwidth()).attr("x2",x(n.l)).attr("y1",fy).attr("y2",fy).attr("stroke","#d1d5db").attr("stroke-width",1).attr("stroke-dasharray","3,3")}
    const bg=g.selectAll(".b").data(bars).join("g");
    bg.append("rect").attr("x",d=>x(d.l)).attr("width",x.bandwidth()).attr("y",d=>y(Math.max(d.y0,d.y1))).attr("height",0).attr("rx",6)
      .attr("fill",d=>d.t==="total"?Dk:d.t==="subtotal"?"#374151":d.t==="accent"?P:d.t==="final"?"#16a34a":"#e5e7eb")
      .transition().duration(600).delay((_,i)=>i*70).attr("height",d=>Math.abs(y(d.y0)-y(d.y1)));
    bg.append("text").attr("x",d=>x(d.l)+x.bandwidth()/2).attr("y",d=>y(Math.max(d.y0,d.y1))-6).attr("text-anchor","middle").attr("font-size",11).attr("font-weight",800).attr("fill",Dk).attr("opacity",0)
      .text(d=>Math.abs(d.t==="decrease"?d.v:d.v>=0?d.v:d.v).toLocaleString().replace("-",""))
      .transition().duration(300).delay((_,i)=>i*70+400).attr("opacity",1);
    g.append("g").attr("transform",`translate(0,${h})`).call(d3.axisBottom(x).tickSize(0)).selectAll("text").attr("font-size",9).attr("fill","#9ca3af").style("text-anchor","middle");
    g.selectAll(".domain").remove();
    g.append("g").call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(","))).selectAll("text").attr("font-size",9).attr("fill","#9ca3af");
    g.selectAll(".tick line").attr("stroke","#f3f4f6");g.selectAll(".domain").remove();
  },[dims,steps]);
  return<div ref={cRef} style={{width:"100%"}}><svg ref={ref} viewBox={`0 0 ${dims.w} ${dims.h}`} style={{width:"100%",height:"auto"}}/></div>;
}

/* ═══ SEGMENT BARS (horizontal) ═══ */
function SegBars({data}){
  const segs=SEGMENTS.map(s=>({name:s,count:data.filter(c=>c.segment===s).length,color:SEG_COLORS[s]})).sort((a,b)=>b.count-a.count);
  const max=Math.max(...segs.map(s=>s.count),1);
  return<div style={{display:"flex",flexDirection:"column",gap:10}}>
    {segs.map(s=><div key={s.name} style={{display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:140,fontSize:11,fontWeight:600,color:"#374151",textAlign:"right",flexShrink:0}}>{s.name.replace("&","&")}</div>
      <div style={{flex:1,height:24,background:"#f3f4f6",borderRadius:8,overflow:"hidden",position:"relative"}}>
        <div style={{height:"100%",width:`${(s.count/max)*100}%`,background:s.color,borderRadius:8,transition:"width .6s ease"}}/>
        <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,fontWeight:800,color:s.count/max>.3?"#fff":"#374151"}}>{s.count}</span>
      </div>
    </div>)}
  </div>;
}

/* ═══ SMALL COMPONENTS ═══ */
function KPI({label,value,sub,accent,icon}){return<div style={{...card,padding:"18px 22px",flex:"1 1 170px",minWidth:155,position:"relative",overflow:"hidden"}}>
  <div style={{position:"absolute",top:12,right:14,fontSize:24,opacity:.12}}>{icon}</div>
  <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".12em",color:"#9ca3af",marginBottom:4,fontWeight:700}}>{label}</div>
  <div style={{fontSize:28,fontWeight:900,color:Dk,lineHeight:1.1}}>{value}</div>
  {sub&&<div style={{fontSize:11,color:"#6b7280",marginTop:3}}>{sub}</div>}
  <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:accent}}/>
</div>}

function SBadge({s}){const m={"New Suspect":{bg:"#fef3c7",t:"#92400e"},"Lost Prospect":{bg:"#fee2e2",t:"#991b1b"},"Lost Client":{bg:"#fce7f3",t:"#9d174d"},"Current Client":{bg:"#d1fae5",t:"#065f46"}}[s]||{bg:"#f3f4f6",t:"#374151"};return<span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:m.bg,color:m.t}}>{s}</span>}
function PBadge({p}){const p1=p.includes("P1");return<span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:p1?P:"#f3f4f6",color:p1?"#fff":"#6b7280"}}>{p1?"P1":"P2"}</span>}
function ODot({v}){const c=v==="High"?"#16a34a":v==="Medium"?"#f59e0b":"#ef4444";return<span style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}><span style={{width:8,height:8,borderRadius:"50%",background:c}}/>{v}</span>}
function QBadge({q}){if(!q)return null;return<span style={{display:"inline-block",padding:"2px 7px",borderRadius:20,fontSize:9,fontWeight:800,background:q.bg,color:q.color,marginLeft:6}}>{q.label}</span>}
function ScoreBtn({value,onChange,color}){return<div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>onChange(n)} style={{width:36,height:36,borderRadius:10,border:value===n?`2.5px solid ${color}`:"2px solid #e5e7eb",background:value===n?color:"#fff",color:value===n?"#fff":"#9ca3af",fontSize:14,fontWeight:800,cursor:"pointer",transition:"all .12s",fontFamily:"inherit"}}>{n}</button>)}</div>}
function Gauge({score}){const q=getQ(score),pct=Math.min(score/5,1)*100;return<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><div style={{fontSize:34,fontWeight:900,color:Dk,lineHeight:1}}>{score>0?score.toFixed(1):"—"}<span style={{fontSize:14,fontWeight:500,color:"#9ca3af"}}>/5</span></div><div style={{width:"100%",position:"relative",marginTop:2}}><div style={{display:"flex",height:10,borderRadius:20,overflow:"hidden"}}><div style={{flex:50,background:"#fca5a5"}}/><div style={{flex:26,background:"#fcd34d"}}/><div style={{flex:24,background:"#86efac"}}/></div>{score>0&&<div style={{position:"absolute",top:-3,left:`${pct}%`,transform:"translateX(-50%)",transition:"left .5s cubic-bezier(.34,1.56,.64,1)"}}><div style={{width:4,height:16,background:Dk,borderRadius:2}}/></div>}<div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:8,fontWeight:800,color:"#ef4444"}}>NR</span><span style={{fontSize:8,fontWeight:800,color:"#f59e0b"}}>MQL</span><span style={{fontSize:8,fontWeight:800,color:"#16a34a"}}>SQL</span></div></div>{q&&<div style={{padding:"4px 16px",borderRadius:20,background:q.bg,color:q.color,fontWeight:800,fontSize:12}}>{q.full}</div>}</div>}

/* ═══ SIDE PANEL ═══ */
function Side({children,onClose}){return<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.35)",backdropFilter:"blur(4px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div style={{position:"absolute",top:0,right:0,bottom:0,width:"min(660px,92vw)",background:"#fafafa",boxShadow:"-12px 0 40px rgba(0,0,0,.12)",overflowY:"auto",animation:"sl .22s ease-out"}}><style>{`@keyframes sl{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>{children}</div></div>}
function PHead({title,sub,onSave,saved,onClose}){return<div style={{background:`linear-gradient(135deg,${Dk},#2d3748)`,padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}><div style={{flex:1,minWidth:0}}><h2 style={{margin:0,fontSize:16,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</h2>{sub&&<p style={{margin:"2px 0 0",fontSize:11,color:"rgba(255,255,255,.5)"}}>{sub}</p>}</div><div style={{display:"flex",gap:6}}><button onClick={onSave} style={{padding:"6px 16px",borderRadius:10,border:"none",background:saved?"#16a34a":P,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:F}}>{saved?"✓ Saved":"Save"}</button><button onClick={onClose} style={{width:30,height:30,borderRadius:10,border:"none",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div></div>}

/* ═══ PREQUAL PANEL ═══ */
function PrequalPanel({co,store,onClose}){
  const s0=store.get(co.id);const[scores,setS]=useState(s0.scores||{});const[notes,setN]=useState(s0.notes||{});const[showQ,setSQ]=useState({});const[ok,setOk]=useState(false);
  useEffect(()=>{store.save(co.id,"scores",scores);store.save(co.id,"notes",notes)},[scores,notes]);
  const ws=useMemo(()=>calcWS(scores),[scores]);const tot=PQ.reduce((s,c)=>s+c.items.length,0);const done=Object.keys(scores).filter(k=>scores[k]).length;
  const doSave=()=>{store.save(co.id,"scores",scores);store.save(co.id,"notes",notes);setOk(true);setTimeout(()=>setOk(false),1500)};
  return<Side onClose={onClose}><PHead title={`🎯 ${co.name}`} sub={`${co.segment} · ${co.region} · ${co.revenue}m€`} onSave={doSave} saved={ok} onClose={onClose}/>
    <div style={{padding:"18px 22px"}}>
      <div style={{...card,padding:18,marginBottom:18,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:170}}><Gauge score={ws}/></div>
        <div style={{display:"flex",flexDirection:"column",gap:5,minWidth:140}}>
          <div style={{fontSize:11,color:"#6b7280",fontWeight:600}}>{done}/{tot} criteria</div>
          {done>0&&<div style={{fontSize:9,color:"#6b7280",background:"#f9fafb",borderRadius:8,padding:"5px 8px",border:"1px solid #e5e7eb",lineHeight:1.7}}>
            {PQ.map(cat=>cat.items.filter(it=>scores[it.id]).map(it=><span key={it.id} style={{display:"block"}}><b style={{color:cat.color}}>{it.name.split("/")[0].trim().split(" ").slice(0,2).join(" ")}</b> {scores[it.id]}×{it.w}={scores[it.id]*it.w}</span>)).flat()}
            <span style={{display:"block",borderTop:"1px solid #e5e7eb",marginTop:3,paddingTop:3,fontWeight:800,color:Dk}}>= {ws.toFixed(1)}/5</span>
          </div>}
          {PQ.map(cat=>{const cs=cat.items.filter(c=>scores[c.id]);const avg=cs.length?cs.reduce((s,c)=>s+scores[c.id],0)/cs.length:0;return<div key={cat.cat}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:9,fontWeight:800,color:cat.color}}>{cat.cat}</span><span style={{fontSize:9,fontWeight:800,color:Dk}}>{avg.toFixed(1)}</span></div><div style={{height:4,background:"#e5e7eb",borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:`${(avg/5)*100}%`,background:cat.color,borderRadius:20,transition:"width .3s"}}/></div></div>})}
        </div>
      </div>
      {PQ.map(cat=><div key={cat.cat} style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:4,height:16,borderRadius:4,background:cat.color}}/><h3 style={{margin:0,fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:".1em",color:cat.color}}>{cat.cat}</h3></div>
        {cat.items.map(it=><div key={it.id} style={{...card,padding:"14px 16px",marginBottom:8,borderLeft:`4px solid ${scores[it.id]?cat.color:"#e5e7eb"}`,transition:"border-color .2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}><h4 style={{margin:0,fontSize:13,fontWeight:700,color:Dk}}>{it.name}</h4><span style={{fontSize:9,fontWeight:800,color:cat.color,background:cat.color+"12",padding:"2px 8px",borderRadius:20}}>w={it.w}</span></div>
          <p style={{margin:"0 0 8px",fontSize:11,color:"#6b7280",lineHeight:1.4}}>{it.desc}</p>
          <ScoreBtn value={scores[it.id]||0} onChange={v=>setS(p=>({...p,[it.id]:v}))} color={cat.color}/>
          <button onClick={()=>setSQ(p=>({...p,[it.id]:!p[it.id]}))} style={{marginTop:6,background:"none",border:"none",cursor:"pointer",fontSize:11,color:P,fontFamily:F,padding:0,fontWeight:700}}>{showQ[it.id]?"▾":"▸"} Questions</button>
          {showQ[it.id]&&<div style={{marginTop:4,paddingLeft:10,borderLeft:"2px solid #e5e7eb"}}>{it.q.map((qq,qi)=><p key={qi} style={{margin:"2px 0",fontSize:11,color:"#6b7280"}}>→ {qq}</p>)}</div>}
          <textarea placeholder="Notes…" value={notes[it.id]||""} onChange={e=>setN(p=>({...p,[it.id]:e.target.value}))} rows={2} style={{...inputStyle,marginTop:6}}/>
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
  return<Side onClose={onClose}><PHead title={`📋 ${co.name}`} sub={`${co.segment} · ${co.region} · ${co.revenue}m€`} onSave={doSave} saved={ok} onClose={onClose}/>
    <div style={{padding:"18px 22px"}}>
      <div style={{...card,padding:"12px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:11,color:"#6b7280",fontWeight:700}}>{filled}/{total}</span>
        <div style={{flex:1,height:6,background:"#e5e7eb",borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:`${(filled/total)*100}%`,background:P,borderRadius:20,transition:"width .3s"}}/></div>
      </div>
      {PF_SEC.map(sec=><div key={sec.id} style={{marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><span style={{fontSize:16}}>{sec.icon}</span><h3 style={{margin:0,fontSize:13,fontWeight:800,color:Dk}}>{sec.title}</h3></div>
        <div style={{...card,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
          {sec.fields.map(f=><div key={f.id}><label style={{display:"block",fontSize:10,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>{f.l}</label>
            {f.t==="area"?<textarea value={fields[f.id]||""} onChange={e=>setF(p=>({...p,[f.id]:e.target.value}))} rows={3} style={inputStyle}/>:<input type="text" value={fields[f.id]||""} onChange={e=>setF(p=>({...p,[f.id]:e.target.value}))} style={inputStyle}/>}
          </div>)}
        </div>
      </div>)}
    </div>
  </Side>;
}

/* ═══ MAIN ═══ */
const COLS=[{k:"name",l:"Company",w:200},{k:"segment",l:"Segment",w:150},{k:"region",l:"Region",w:110},{k:"priority",l:"Prio",w:65},{k:"status",l:"Status",w:120},{k:"revenue",l:"Rev (m€)",w:80},{k:"employees",l:"Emp",w:75},{k:"sites",l:"Sites",w:55},{k:"outsourcingPropensity",l:"Outsrc",w:80}];

export default function App(){
  const[view,setView]=useState("dashboard");const[search,setSearch]=useState("");
  const[segF,setSegF]=useState("All");const[staF,setStaF]=useState("All");const[priF,setPriF]=useState("All");
  const[sortK,setSortK]=useState("revenue");const[sortD,setSortD]=useState("desc");
  const[page,setPage]=useState(0);const[panel,setPanel]=useState(null);const[hovRow,setHovRow]=useState(null);
  const store=useStore();const PS=30;

  const filtered=useMemo(()=>{let d=[...ALL];if(search){const q=search.toLowerCase();d=d.filter(c=>c.name.toLowerCase().includes(q)||c.nip.includes(q))}if(segF!=="All")d=d.filter(c=>c.segment===segF);if(staF!=="All")d=d.filter(c=>c.status===staF);if(priF!=="All")d=d.filter(c=>c.priority===priF);d.sort((a,b)=>{let av=a[sortK],bv=b[sortK];if(typeof av==="string"){av=av.toLowerCase();bv=bv.toLowerCase()}return sortD==="asc"?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0)});return d},[search,segF,staF,priF,sortK,sortD]);
  const pg=filtered.slice(page*PS,(page+1)*PS),tp=Math.ceil(filtered.length/PS);
  const hs=k=>{if(sortK===k)setSortD(sortD==="asc"?"desc":"asc");else{setSortK(k);setSortD("desc")}setPage(0)};
  const avg=(filtered.reduce((s,c)=>s+c.revenue,0)/(filtered.length||1)).toFixed(0);
  const p1=filtered.filter(c=>c.priority.includes("P1")).length;
  const ns=filtered.filter(c=>c.status==="New Suspect").length;
  const totalRev=(filtered.reduce((s,c)=>s+c.revenue,0)/1000).toFixed(1);

  return<div style={{fontFamily:F,background:"#f3f4f6",minHeight:"100vh",color:Dk}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet"/>
    {panel?.type==="prequal"&&<PrequalPanel co={panel.co} store={store} onClose={()=>setPanel(null)}/>}
    {panel?.type==="prospect"&&<ProspectPanel co={panel.co} store={store} onClose={()=>setPanel(null)}/>}

    <header style={{background:Dk,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:36,height:36,borderRadius:10,background:P,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:16}}>A</div>
        <div><div style={{fontSize:16,fontWeight:800,color:"#fff",letterSpacing:".01em"}}>ATALIAN <span style={{fontWeight:400,opacity:.6}}>Poland</span></div><div style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>Sales Excellence Tool</div></div>
      </div>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        {(store.cnt>0||store.fileCnt>0)&&<span style={{fontSize:10,color:"rgba(255,255,255,.4)",marginRight:8}}>{store.cnt} scored · {store.fileCnt} files</span>}
        {[{id:"dashboard",lb:"Dashboard"},{id:"table",lb:"Hunt List"}].map(v=><button key={v.id} onClick={()=>{setView(v.id);setPage(0)}} style={{padding:"6px 16px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:F,background:view===v.id?P:"transparent",color:view===v.id?"#fff":"rgba(255,255,255,.6)",transition:"all .15s"}}>{v.lb}</button>)}
      </div>
    </header>

    <main style={{padding:"20px 28px 40px",maxWidth:1400,margin:"0 auto"}}>
      {/* KPIs */}
      <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
        <KPI label="Companies" value={filtered.length.toLocaleString()} sub="in scope" accent={Dk} icon="🏢"/>
        <KPI label="P1 Priority" value={p1.toLocaleString()} sub={`${((p1/(filtered.length||1))*100).toFixed(0)}% of total`} accent={P} icon="🎯"/>
        <KPI label="New Suspects" value={ns.toLocaleString()} sub="to contact" accent="#f59e0b" icon="🔍"/>
        <KPI label="Total Revenue" value={`${totalRev}B€`} sub={`avg ${avg}m€`} accent="#16a34a" icon="💰"/>
      </div>

      {view==="dashboard"?
      <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:16,alignItems:"start"}}>
        <div style={{...card,padding:"20px 22px"}}><h2 style={{margin:"0 0 2px",fontSize:15,fontWeight:800}}>Pipeline Funnel</h2><p style={{margin:"0 0 8px",fontSize:11,color:"#9ca3af"}}>Dynamic — reflects current filters</p><DynWaterfall data={filtered}/></div>
        <div style={{...card,padding:"20px 22px"}}><h2 style={{margin:"0 0 2px",fontSize:15,fontWeight:800}}>By Segment</h2><p style={{margin:"0 0 14px",fontSize:11,color:"#9ca3af"}}>{filtered.length} companies</p><SegBars data={filtered}/></div>
      </div>:

      /* TABLE */
      <div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14,alignItems:"center"}}>
          <input type="text" placeholder="Search…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} style={{...inputStyle,width:220,background:"#fff"}}/>
          {[{v:segF,s:setSegF,o:["All",...SEGMENTS],l:"Segment"},{v:staF,s:setStaF,o:["All",...STATUSES],l:"Status"},{v:priF,s:setPriF,o:["All",...PRIORITIES],l:"Priority"}].map(({v,s,o,l})=><select key={l} value={v} onChange={e=>{s(e.target.value);setPage(0)}} style={{...inputStyle,width:"auto",background:"#fff",cursor:"pointer"}}>{o.map(oo=><option key={oo} value={oo}>{oo==="All"?`${l}: All`:oo}</option>)}</select>)}
          <span style={{fontSize:11,color:"#9ca3af",marginLeft:"auto",fontWeight:600}}>{filtered.length} results</span>
        </div>
        <div style={{...card,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr>{COLS.map(c=><th key={c.k} onClick={()=>hs(c.k)} style={{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:sortK===c.k?P:"#9ca3af",borderBottom:"2px solid #f0f0f5",cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",minWidth:c.w,background:"#fafafa"}}>{c.l}{sortK===c.k?(sortD==="asc"?" ↑":" ↓"):""}</th>)}</tr></thead>
              <tbody>{pg.map((c,i)=>{const q=store.qual(c.id);const hf=store.hasFile(c.id);const isH=hovRow===c.id;
                return<tr key={c.id} style={{background:isH?"#eef2ff":i%2===0?"#fff":"#fafafa",transition:"background .1s",position:"relative"}} onMouseEnter={()=>setHovRow(c.id)} onMouseLeave={()=>setHovRow(null)}>
                  {COLS.map(col=><td key={col.k} style={{padding:"9px 14px",borderBottom:"1px solid #f0f0f5",whiteSpace:"nowrap",color:"#374151"}}>
                    {col.k==="status"?<SBadge s={c[col.k]}/>:
                    col.k==="priority"?<PBadge p={c[col.k]}/>:
                    col.k==="outsourcingPropensity"?<ODot v={c[col.k]}/>:
                    col.k==="revenue"?<span style={{fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{c[col.k]}</span>:
                    col.k==="employees"||col.k==="sites"?<span style={{fontVariantNumeric:"tabular-nums"}}>{c[col.k].toLocaleString()}</span>:
                    col.k==="name"?<div style={{display:"flex",alignItems:"center"}}><span style={{fontWeight:700,color:Dk}}>{c[col.k]}</span>{q&&<QBadge q={q}/>}{hf&&<span style={{marginLeft:4,fontSize:10,color:P}}>📋</span>}</div>:
                    c[col.k]}
                  </td>)}
                  {isH&&<td style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",display:"flex",gap:5,zIndex:5}}>
                    <button onClick={()=>setPanel({type:"prequal",co:c})} style={{padding:"6px 14px",borderRadius:10,border:"none",background:P,color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:F,boxShadow:`0 3px 12px ${P}44`}}>🎯 Pre-qual</button>
                    <button onClick={()=>setPanel({type:"prospect",co:c})} style={{padding:"6px 14px",borderRadius:10,border:"none",background:Dk,color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:F,boxShadow:`0 3px 12px ${Dk}44`}}>📋 Prospect</button>
                  </td>}
                </tr>})}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:6,marginTop:14}}>
          <button disabled={page===0} onClick={()=>setPage(page-1)} style={{padding:"6px 16px",borderRadius:10,border:"1px solid #e5e7eb",background:page===0?"#f3f4f6":"#fff",cursor:page===0?"default":"pointer",fontSize:11,fontFamily:F,color:page===0?"#d1d5db":Dk,fontWeight:700}}>← Prev</button>
          <span style={{fontSize:11,color:"#6b7280",fontWeight:700,padding:"0 8px"}}>{page+1} / {tp}</span>
          <button disabled={page>=tp-1} onClick={()=>setPage(page+1)} style={{padding:"6px 16px",borderRadius:10,border:"1px solid #e5e7eb",background:page>=tp-1?"#f3f4f6":"#fff",cursor:page>=tp-1?"default":"pointer",fontSize:11,fontFamily:F,color:page>=tp-1?"#d1d5db":Dk,fontWeight:700}}>Next →</button>
        </div>
      </div>}
    </main>
    <footer style={{textAlign:"center",padding:14,fontSize:10,color:"#9ca3af"}}>
      <b style={{color:P}}>ATALIAN</b> × <b>Simon-Kucher</b> · Sales Excellence · Poland
    </footer>
  </div>;
}
