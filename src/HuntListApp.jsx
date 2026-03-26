import { useState, useMemo, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */
const SEGMENTS=["Industrial Production","Retail & Consumer Networks","Healthcare & Social Care","Banking & Financial Services","Logistics & Transport","Real Estate"];
const SUB_SEGMENTS={"Industrial Production":["Automotive","FMCG Manufacturing","Heavy Industry","Electronics","Chemicals"],"Retail & Consumer Networks":["Grocery Chains","Fashion Retail","DIY & Home","Shopping Centers"],"Healthcare & Social Care":["Hospitals","Clinics","Elderly Care","Pharma Facilities"],"Banking & Financial Services":["Retail Banking","Corporate Banking","Insurance","FinTech"],"Logistics & Transport":["Warehousing","Distribution Centers","Port Facilities","Freight Hubs"],"Real Estate":["Office Buildings","Mixed-Use Complexes","Industrial Parks","Residential Estates"]};
const REGIONS=["Mazowieckie","Śląskie","Wielkopolskie","Małopolskie","Dolnośląskie","Łódzkie","Pomorskie","Zachodniopomorskie"];
const STATUSES=["New Suspect","Lost Prospect","Lost Client","Current Client"];
const PRIORITIES=["P1 - High Priority","P2 - Opportunistic"];

function generateCompanies(count){
  const pfx=["Pol","War","Krak","Gdań","Wrocł","Łódź","Pozn","Szcz","Lub","Kat","Bial","Czest","Rad","Tor","Kiel","Ols","Rzesz","Opol","Gliwi","Zabrz","Bydg","Tychy","Sosnow","Elbl","Płock","Tarn","Chorzów","Bytom","Ruda"];
  const sfx=["Tech Sp. z o.o.","Invest S.A.","Group Sp. z o.o.","Solutions S.A.","Holding Sp. z o.o.","Industrial S.A.","Logistics Sp. z o.o.","Development S.A.","Services Sp. z o.o.","Capital S.A.","Engineering Sp. z o.o.","Systems S.A.","Management Sp. z o.o.","Partners S.A.","International Sp. z o.o."];
  const co=[],used=new Set(),r=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,p=a=>a[Math.floor(Math.random()*a.length)],rf=(a,b)=>+(Math.random()*(b-a)+a).toFixed(1);
  for(let i=0;i<count;i++){let n;do{n=p(pfx)+p(["a","o","ex","is","um","en","ia"])+" "+p(sfx)}while(used.has(n));used.add(n);
    const seg=p(SEGMENTS),sub=p(SUB_SEGMENTS[seg]),rev=r(50,2000),prio=rev>200?"P1 - High Priority":Math.random()<0.55?"P1 - High Priority":"P2 - Opportunistic";
    co.push({id:i+1,nip:`${r(100,999)}-${r(10,99)}-${r(10,99)}-${r(100,999)}`,name:n,segment:seg,subSegment:sub,region:p(REGIONS),ownership:Math.random()<0.12?"Public":"Private",priority:prio,status:p(STATUSES),revenue:rev,profit:rf(1,18),outsourcingPropensity:p(["High","Medium","Low"]),potentialSpend:rf(0.2,8),employees:r(80,12000),sites:r(1,45),businessScale:p(["Large","Mid-Market","SME"])});}
  return co;
}
const ALL_COMPANIES=generateCompanies(1390);

const WATERFALL_RAW=[
  {label:"Active NIP\n(>50m€)",val:4344,type:"total"},
  {label:"Non-priority",val:-894,type:"dec"},
  {label:"Priority\nsegments",val:3450,type:"sub"},
  {label:"Not mapped",val:-261,type:"dec"},
  {label:"P2 Opp.",val:-1613,type:"dec"},
  {label:"P1 High",val:1576,type:"sub"},
  {label:"Public",val:-186,type:"dec"},
  {label:"Private\n(Scope)",val:1390,type:"final"},
];

const SEG_BREAK=[
  {seg:"Industrial Prod.",n:885,color:"#0891b2"},
  {seg:"Retail & Consumer",n:211,color:"#f97316"},
  {seg:"Healthcare",n:18,color:"#a78bfa"},
  {seg:"Banking & Fin.",n:97,color:"#22d3ee"},
  {seg:"Logistics",n:71,color:"#4ade80"},
  {seg:"Real Estate",n:74,color:"#f43f5e"},
];

const PREQUAL=[
  {cat:"STRATEGIC FIT",color:"#be123c",items:[
    {id:"intent",name:"Intent to outsource FM",desc:"Is the client considering outsourcing part or all FM services? Is there a real trigger?",q:["Are you currently considering outsourcing any part of your FM services?","Is this a new need or reviewing current setup?","What is driving this reflection?"],w:3},
    {id:"scope",name:"Offer / service scope",desc:"Which FM services in scope? Single, bundled, or integrated FM?",q:["Which services are you looking for?","One provider for all or selected services?","Could scope expand over time?"],w:2},
  ]},
  {cat:"OPERATIONAL FIT",color:"#0891b2",items:[
    {id:"ability",name:"Ability of AP to respond",desc:"Does the opportunity fit AP capabilities: services, scale, SLAs, compliance?",q:["What are the key service requirements?","Any technical, safety, or compliance constraints?","What service levels expected?"],w:3},
    {id:"geo",name:"Geography / site footprint",desc:"Where are services needed? Local, regional, national, multi-site?",q:["Where are the sites located?","How many sites involved?","Single-site or multi-site?","All locations need coverage?"],w:2},
  ]},
  {cat:"LEAD QUALITY",color:"#f59e0b",items:[
    {id:"comp",name:"Competitor in place",desc:"Is another provider in place? How much of account can realistically be won?",q:["Who currently provides these services?","Satisfied with current provider?","Consider replacing or complementing?","Which parts open for review?"],w:2},
    {id:"interest",name:"Interest shown",desc:"How engaged is the client? Real openness to continue?",q:["Open to a follow-up with sales team?","How important is this topic today?","Want us to come back with details?"],w:2},
    {id:"need",name:"Detailed need / pain points",desc:"Does client have clear view of the business need?",q:["Challenges with current FM setup?","What to improve?","Ideal solution?","Top decision criteria?"],w:1},
  ]},
];

function calcWS(scores){let tw=0,tu=0;PREQUAL.forEach(c=>c.items.forEach(it=>{if(scores[it.id]){tw+=scores[it.id]*it.w;tu+=it.w}}));return tu===0?0:tw/tu}
function getQ(ws){
  if(ws>=3.8)return{label:"Sales Qualified Lead",abbr:"SQL",color:"#16a34a",bg:"#dcfce7",bdr:"#86efac"};
  if(ws>=2.5)return{label:"Marketing Qualified Lead",abbr:"MQL",color:"#f59e0b",bg:"#fef3c7",bdr:"#fcd34d"};
  if(ws>0)return{label:"Not Relevant",abbr:"NR",color:"#ef4444",bg:"#fee2e2",bdr:"#fca5a5"};
  return{label:"Not Scored",abbr:"—",color:"#94a3b8",bg:"#f8fafc",bdr:"#e2e8f0"};
}

/* ═══════════════════════════════════════════════════════════════
   STORAGE
   ═══════════════════════════════════════════════════════════════ */
function useStore(){
  const[data,setData]=useState(()=>{try{return JSON.parse(localStorage.getItem("atalian_pq")||"{}")}catch{return{}}});
  const save=(id,sc,nt)=>{setData(p=>{const nx={...p,[id]:{sc,nt,ts:Date.now()}};try{localStorage.setItem("atalian_pq",JSON.stringify(nx))}catch{}return nx})};
  const get=id=>data[id]||{sc:{},nt:{}};
  const qual=id=>{const d=data[id];if(!d?.sc||!Object.keys(d.sc).length)return null;return getQ(calcWS(d.sc))};
  const cnt=Object.keys(data).filter(k=>data[k]?.sc&&Object.keys(data[k].sc).length>0).length;
  return{save,get,qual,cnt,data};
}

/* ═══════════════════════════════════════════════════════════════
   PURE SVG WATERFALL (no d3)
   ═══════════════════════════════════════════════════════════════ */
function Waterfall(){
  const W=800,H=360,ml=55,mr=15,mt=30,mb=60;
  const cw=W-ml-mr,ch=H-mt-mb;
  const n=WATERFALL_RAW.length,bw=cw/n*0.6,gap=cw/n*0.4;
  const maxVal=5000;
  const y=v=>mt+ch*(1-v/maxVal);

  let running=0;
  const bars=WATERFALL_RAW.map((s,i)=>{
    let y0,y1;
    if(s.type==="total"||s.type==="sub"||s.type==="final"){y0=0;y1=Math.abs(s.val);running=y1}
    else{y1=running;y0=running+s.val;running=y0}
    const x=ml+i*(bw+gap)+gap/2;
    return{...s,y0,y1,x,absVal:Math.abs(s.val)};
  });

  return<svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto"}}>
    {/* Grid */}
    {[0,1000,2000,3000,4000,5000].map(v=><g key={v}>
      <line x1={ml} x2={W-mr} y1={y(v)} y2={y(v)} stroke="#f1f5f9" strokeWidth="1"/>
      <text x={ml-8} y={y(v)+4} textAnchor="end" fontSize="10" fill="#94a3b8">{v>0?(v/1000)+"k":""}</text>
    </g>)}
    {/* Connectors */}
    {bars.map((b,i)=>{if(i>=bars.length-1)return null;const nx=bars[i+1];const fromY=b.type==="dec"?y(b.y0):y(b.y1);
      return<line key={"c"+i} x1={b.x+bw} x2={nx.x} y1={fromY} y2={fromY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,3" opacity="0.5"/>})}
    {/* Bars */}
    {bars.map((b,i)=>{
      const top=y(Math.max(b.y0,b.y1)),bot=y(Math.min(b.y0,b.y1)),h=bot-top;
      const fill=b.type==="total"?"#1e293b":b.type==="sub"?"#475569":b.type==="final"?"#be123c":"#fda4af";
      return<g key={i}>
        <rect x={b.x} y={top} width={bw} height={h} rx={3} fill={fill}/>
        <text x={b.x+bw/2} y={top-6} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">{b.absVal.toLocaleString()}</text>
        {b.label.split("\n").map((ln,li)=><text key={li} x={b.x+bw/2} y={H-mb+14+li*12} textAnchor="middle" fontSize="9" fill="#64748b">{ln}</text>)}
      </g>})}
  </svg>;
}

/* ═══════════════════════════════════════════════════════════════
   PURE SVG DONUT (no d3)
   ═══════════════════════════════════════════════════════════════ */
function Donut(){
  const total=SEG_BREAK.reduce((s,x)=>s+x.n,0);
  const cx=130,cy=130,R=110,r=60;
  let cum=0;
  const arcs=SEG_BREAK.map(s=>{
    const start=cum/total*Math.PI*2-Math.PI/2;
    cum+=s.n;
    const end=cum/total*Math.PI*2-Math.PI/2;
    const lg=s.n/total>0.5?1:0;
    const path=`M ${cx+R*Math.cos(start)} ${cy+R*Math.sin(start)} A ${R} ${R} 0 ${lg} 1 ${cx+R*Math.cos(end)} ${cy+R*Math.sin(end)} L ${cx+r*Math.cos(end)} ${cy+r*Math.sin(end)} A ${r} ${r} 0 ${lg} 0 ${cx+r*Math.cos(start)} ${cy+r*Math.sin(start)} Z`;
    return{...s,path};
  });
  const[hov,setHov]=useState(null);
  return<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
    <svg viewBox="0 0 260 260" style={{width:220,height:220}}>
      {arcs.map((a,i)=><path key={i} d={a.path} fill={a.color} stroke="#fff" strokeWidth="2" opacity={hov===i?1:0.88} cursor="pointer" onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)} style={{transition:"opacity 0.2s"}}/>)}
      <text x={cx} y={cy-4} textAnchor="middle" fontSize="26" fontWeight="800" fill="#1e293b">1,356</text>
      <text x={cx} y={cy+14} textAnchor="middle" fontSize="10" fill="#94a3b8" letterSpacing="0.05em">NEW SUSPECTS</text>
    </svg>
    {hov!==null&&<div style={{background:"#f8fafc",borderRadius:8,padding:"6px 12px",fontSize:13,fontWeight:600,color:"#1e293b",border:`2px solid ${SEG_BREAK[hov].color}`}}>{SEG_BREAK[hov].seg}: {SEG_BREAK[hov].n}</div>}
    <div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px",justifyContent:"center"}}>{SEG_BREAK.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#64748b"}}><span style={{width:10,height:10,borderRadius:3,background:s.color,display:"inline-block"}}/>{s.seg}</div>)}</div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
const F="'DM Sans','Segoe UI',system-ui,-apple-system,sans-serif";
function KPI({label,value,sub,accent}){return<div style={{background:"#fff",borderRadius:12,padding:"20px 22px",borderLeft:`4px solid ${accent||"#be123c"}`,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",flex:"1 1 180px",minWidth:160}}><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",color:"#94a3b8",marginBottom:6,fontWeight:600}}>{label}</div><div style={{fontSize:28,fontWeight:800,color:"#1e293b",lineHeight:1.1}}>{value}</div>{sub&&<div style={{fontSize:12,color:"#64748b",marginTop:4}}>{sub}</div>}</div>}
function SBadge({s}){const c={"New Suspect":{bg:"#fef3c7",t:"#92400e",b:"#fbbf24"},"Lost Prospect":{bg:"#fee2e2",t:"#991b1b",b:"#fca5a5"},"Lost Client":{bg:"#fce7f3",t:"#9d174d",b:"#f9a8d4"},"Current Client":{bg:"#d1fae5",t:"#065f46",b:"#6ee7b7"}}[s]||{bg:"#f1f5f9",t:"#475569",b:"#cbd5e1"};return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600,background:c.bg,color:c.t,border:`1px solid ${c.b}`,whiteSpace:"nowrap"}}>{s}</span>}
function PBadge({p}){const p1=p.includes("P1");return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700,background:p1?"#be123c":"#f1f5f9",color:p1?"#fff":"#64748b",whiteSpace:"nowrap"}}>{p1?"P1 — High":"P2 — Opp."}</span>}
function ODot({v}){const c=v==="High"?"#16a34a":v==="Medium"?"#f59e0b":"#ef4444";return<span style={{display:"flex",alignItems:"center",gap:5,fontSize:12}}><span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>{v}</span>}
function QBadge({q}){if(!q)return<span style={{fontSize:11,color:"#cbd5e1"}}>—</span>;return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700,background:q.bg,color:q.color,border:`1px solid ${q.bdr}`,whiteSpace:"nowrap"}}>{q.abbr}</span>}

/* ═══════════════════════════════════════════════════════════════
   GAUGE — horizontal bar
   ═══════════════════════════════════════════════════════════════ */
function Gauge({score}){
  const q=getQ(score);const pct=Math.min(score/5,1)*100;
  return<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
    <div style={{fontSize:36,fontWeight:900,color:"#1e293b",lineHeight:1}}>{score>0?score.toFixed(1):"—"}</div>
    <div style={{fontSize:11,color:"#94a3b8",marginTop:-4}}>out of 5.0</div>
    <div style={{width:"100%",position:"relative",marginTop:4}}>
      <div style={{display:"flex",height:12,borderRadius:6,overflow:"hidden",width:"100%"}}>
        <div style={{flex:50,background:"#fca5a5"}}/>
        <div style={{flex:26,background:"#fcd34d"}}/>
        <div style={{flex:24,background:"#86efac"}}/>
      </div>
      {score>0&&<div style={{position:"absolute",top:-4,left:`${pct}%`,transform:"translateX(-50%)",transition:"left 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}><div style={{width:4,height:20,background:"#1e293b",borderRadius:2}}/></div>}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
        <span style={{fontSize:9,fontWeight:700,color:"#ef4444"}}>NR</span>
        <span style={{fontSize:9,fontWeight:700,color:"#f59e0b"}}>MQL</span>
        <span style={{fontSize:9,fontWeight:700,color:"#16a34a"}}>SQL</span>
      </div>
    </div>
    <div style={{padding:"6px 18px",borderRadius:8,background:q.bg,border:`2px solid ${q.bdr}`,color:q.color,fontWeight:800,fontSize:14,marginTop:4}}>{q.label}</div>
  </div>;
}

function ScoreBtn({value,onChange,color}){
  return<div style={{display:"flex",alignItems:"center",gap:12}}>
    <div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>onChange(n)} style={{width:36,height:36,borderRadius:8,border:value===n?`2px solid ${color}`:"2px solid #e2e8f0",background:value===n?color:"#fff",color:value===n?"#fff":"#94a3b8",fontSize:14,fontWeight:700,cursor:"pointer",transition:"all 0.15s",fontFamily:F}}>{n}</button>)}</div>
    <span style={{fontSize:11,color:"#94a3b8"}}>{value?`${value}/5`:"—"}</span>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════
   SCORING MODAL
   ═══════════════════════════════════════════════════════════════ */
function ScoreModal({co,store,onClose}){
  const sv=store.get(co.id);
  const[scores,setS]=useState(sv.sc||{});
  const[notes,setN]=useState(sv.nt||{});
  const[showQ,setSQ]=useState({});
  const[saved,setSaved]=useState(false);

  useEffect(()=>{store.save(co.id,scores,notes)},[scores,notes]);

  const ws=useMemo(()=>calcWS(scores),[scores]);
  const tot=PREQUAL.reduce((s,c)=>s+c.items.length,0);
  const done=Object.keys(scores).filter(k=>scores[k]).length;
  const all=PREQUAL.every(c=>c.items.every(it=>scores[it.id]));

  const doSave=()=>{store.save(co.id,scores,notes);setSaved(true);setTimeout(()=>setSaved(false),2000)};

  return<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(15,23,42,0.4)",backdropFilter:"blur(2px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div style={{position:"absolute",top:0,right:0,bottom:0,width:"min(680px, 90vw)",background:"#f8fafc",boxShadow:"-8px 0 30px rgba(0,0,0,0.2)",overflowY:"auto",animation:"slideIn 0.25s ease-out"}}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,position:"sticky",top:0,zIndex:10}}>
        <div style={{flex:1,minWidth:0}}>
          <h2 style={{margin:0,fontSize:17,fontWeight:800,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{co.name}</h2>
          <p style={{margin:"4px 0 0",fontSize:11,color:"#94a3b8"}}>{co.segment} · {co.region} · {co.revenue}m€ · {co.employees.toLocaleString()} emp.</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={doSave} style={{padding:"7px 16px",borderRadius:8,border:"none",background:saved?"#16a34a":"#be123c",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:F,transition:"background 0.2s"}}>{saved?"✓ Saved":"💾 Save"}</button>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,border:"none",background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:16,cursor:"pointer",fontFamily:F,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
      </div>

      <div style={{padding:"20px 24px"}}>
        {/* Gauge at top */}
        <div style={{background:"#fff",borderRadius:14,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200}}>
              <Gauge score={ws}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,minWidth:160}}>
              <div style={{fontSize:12,color:"#94a3b8"}}>{done}/{tot} criteria scored</div>
              {PREQUAL.map(cat=>{const cs=cat.items.filter(c=>scores[c.id]);const avg=cs.length?cs.reduce((s,c)=>s+scores[c.id],0)/cs.length:0;
                return<div key={cat.cat}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,fontWeight:700,color:cat.color}}>{cat.cat}</span><span style={{fontSize:10,fontWeight:700,color:"#1e293b"}}>{avg.toFixed(1)}</span></div>
                  <div style={{height:4,background:"#f1f5f9",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${(avg/5)*100}%`,background:cat.color,borderRadius:2,transition:"width 0.4s"}}/></div>
                </div>})}
              {all&&<div style={{padding:"6px 8px",borderRadius:6,background:"#f0fdf4",border:"1px solid #86efac",fontSize:10,color:"#166534",fontWeight:600,textAlign:"center",marginTop:2}}>✓ Complete</div>}
            </div>
          </div>
        </div>

        {/* Criteria */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {PREQUAL.map(cat=><div key={cat.cat}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:4,height:20,borderRadius:2,background:cat.color}}/>
              <h3 style={{margin:0,fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",color:cat.color}}>{cat.cat}</h3>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {cat.items.map(it=><div key={it.id} style={{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",borderLeft:`4px solid ${scores[it.id]?cat.color:"#e2e8f0"}`,transition:"border-color 0.2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <h4 style={{margin:0,fontSize:14,fontWeight:700,color:"#1e293b"}}>{it.name}</h4>
                  <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",background:"#f8fafc",padding:"2px 6px",borderRadius:4,border:"1px solid #f1f5f9"}}>×{it.w}</span>
                </div>
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
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */
const COLS=[
  {k:"name",l:"Company",w:200},{k:"segment",l:"Segment",w:155},{k:"region",l:"Region",w:120},
  {k:"priority",l:"Priority",w:115},{k:"status",l:"Status",w:125},{k:"revenue",l:"Rev. (m€)",w:90},
  {k:"employees",l:"Employees",w:85},{k:"sites",l:"Sites",w:65},{k:"outsourcingPropensity",l:"Outsourcing",w:90},
  {k:"qual",l:"Qualification",w:95},{k:"act",l:"",w:75},
];

export default function HuntListApp(){
  const[view,setView]=useState("dashboard");
  const[search,setSearch]=useState("");
  const[segF,setSegF]=useState("All");
  const[staF,setStaF]=useState("All");
  const[priF,setPriF]=useState("All");
  const[sortK,setSortK]=useState("revenue");
  const[sortD,setSortD]=useState("desc");
  const[page,setPage]=useState(0);
  const[scoring,setScoring]=useState(null);
  const store=useStore();
  const PS=25;

  const filtered=useMemo(()=>{
    let d=[...ALL_COMPANIES];
    if(search){const q=search.toLowerCase();d=d.filter(c=>c.name.toLowerCase().includes(q)||c.nip.includes(q))}
    if(segF!=="All")d=d.filter(c=>c.segment===segF);
    if(staF!=="All")d=d.filter(c=>c.status===staF);
    if(priF!=="All")d=d.filter(c=>c.priority===priF);
    d.sort((a,b)=>{let av=a[sortK],bv=b[sortK];if(typeof av==="string"){av=av.toLowerCase();bv=bv.toLowerCase()}return sortD==="asc"?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0)});
    return d;
  },[search,segF,staF,priF,sortK,sortD]);

  const pg=filtered.slice(page*PS,(page+1)*PS),tp=Math.ceil(filtered.length/PS);
  const hs=k=>{if(sortK===k)setSortD(sortD==="asc"?"desc":"asc");else{setSortK(k);setSortD("desc")}setPage(0)};
  const avg=(filtered.reduce((s,c)=>s+c.revenue,0)/(filtered.length||1)).toFixed(0);
  const p1=filtered.filter(c=>c.priority.includes("P1")).length;
  const ns=filtered.filter(c=>c.status==="New Suspect").length;

  return<div style={{fontFamily:F,background:"#f8fafc",minHeight:"100vh",color:"#1e293b"}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>

    {scoring&&<ScoreModal co={scoring} store={store} onClose={()=>setScoring(null)}/>}

    <header style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",padding:"28px 36px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
          <div style={{width:36,height:36,borderRadius:8,background:"#be123c",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:16}}>AP</div>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:"#fff",letterSpacing:"-0.02em"}}>Atalian Poland — Sales Excellence</h1>
        </div>
        <p style={{margin:0,fontSize:13,color:"#94a3b8",marginTop:4}}>Hunt list · Pre-qualification · Commercial strategy tools</p>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {store.cnt>0&&<span style={{fontSize:12,color:"#94a3b8",marginRight:8}}>{store.cnt} scored</span>}
        {[{id:"dashboard",lb:"📊 Dashboard"},{id:"table",lb:"📋 Hunt List"}].map(v=><button key={v.id} onClick={()=>{setView(v.id);setPage(0)}} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:F,background:view===v.id?"#be123c":"rgba(255,255,255,0.08)",color:view===v.id?"#fff":"#94a3b8",transition:"all 0.2s"}}>{v.lb}</button>)}
      </div>
    </header>

    <main style={{padding:"24px 32px 48px",maxWidth:1440,margin:"0 auto"}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:16,marginBottom:28}}>
        <KPI label="Total Companies" value={filtered.length.toLocaleString()} sub="In scope" accent="#1e293b"/>
        <KPI label="P1 — High Priority" value={p1.toLocaleString()} sub={`${((p1/(filtered.length||1))*100).toFixed(0)}%`} accent="#be123c"/>
        <KPI label="New Suspects" value={ns.toLocaleString()} sub="Untouched" accent="#f59e0b"/>
        <KPI label="Avg. Revenue" value={`${avg}m€`} sub="Filtered scope" accent="#0891b2"/>
      </div>

      {view==="dashboard"?<div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:24,alignItems:"start"}}>
        <div style={{background:"#fff",borderRadius:14,padding:"24px 28px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
          <h2 style={{margin:"0 0 4px",fontSize:16,fontWeight:700}}>Hunt List Scope — Waterfall</h2>
          <p style={{margin:"0 0 12px",fontSize:12,color:"#94a3b8"}}>From total NIP codes to private P1 hunt scope</p>
          <Waterfall/>
        </div>
        <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
          <h2 style={{margin:"0 0 4px",fontSize:16,fontWeight:700}}>New Suspects by Segment</h2>
          <p style={{margin:"0 0 16px",fontSize:12,color:"#94a3b8"}}>Breakdown of 1,356 new suspects</p>
          <Donut/>
        </div>
        <div style={{gridColumn:"1 / -1",background:"#fff",borderRadius:14,padding:"24px 28px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
          <h2 style={{margin:"0 0 16px",fontSize:16,fontWeight:700}}>By Segment & Status</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
            {SEGMENTS.map(seg=>{const co=ALL_COMPANIES.filter(c=>c.segment===seg);const t=co.length;const sc=STATUSES.map(st=>({st,n:co.filter(c=>c.status===st).length}));const clr={"New Suspect":"#fbbf24","Lost Prospect":"#fca5a5","Lost Client":"#f9a8d4","Current Client":"#6ee7b7"};
              return<div key={seg} style={{padding:"14px 16px",background:"#f8fafc",borderRadius:10,border:"1px solid #f1f5f9"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>{seg}</div>
                <div style={{fontSize:22,fontWeight:800,color:"#be123c",marginBottom:8}}>{t}</div>
                <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",gap:1}}>{sc.map(s=><div key={s.st} style={{flex:s.n,background:clr[s.st],borderRadius:2}} title={`${s.st}: ${s.n}`}/>)}</div>
              </div>})}
          </div>
        </div>
      </div>:
      <div>
        <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:18,alignItems:"center"}}>
          <input type="text" placeholder="Search…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,fontFamily:F,width:220,outline:"none",background:"#fff"}}/>
          {[{v:segF,s:setSegF,o:["All",...SEGMENTS],l:"Segment"},{v:staF,s:setStaF,o:["All",...STATUSES],l:"Status"},{v:priF,s:setPriF,o:["All",...PRIORITIES],l:"Priority"}].map(({v,s,o,l})=>
            <select key={l} value={v} onChange={e=>{s(e.target.value);setPage(0)}} style={{padding:"8px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,fontFamily:F,background:"#fff",color:"#1e293b",cursor:"pointer"}}>
              {o.map(oo=><option key={oo} value={oo}>{oo==="All"?`${l}: All`:oo}</option>)}
            </select>)}
          <span style={{fontSize:12,color:"#94a3b8",marginLeft:"auto"}}>{pg.length} of {filtered.length}</span>
        </div>
        <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #f1f5f9"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr>{COLS.map(c=><th key={c.k} onClick={()=>c.k!=="act"&&c.k!=="qual"&&hs(c.k)} style={{padding:"12px 14px",textAlign:"left",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:sortK===c.k?"#be123c":"#94a3b8",borderBottom:"2px solid #f1f5f9",cursor:c.k==="act"||c.k==="qual"?"default":"pointer",userSelect:"none",whiteSpace:"nowrap",minWidth:c.w,background:"#fafbfc"}}>{c.l} {sortK===c.k?(sortD==="asc"?"↑":"↓"):""}</th>)}</tr></thead>
              <tbody>{pg.map((c,i)=>{const q=store.qual(c.id);return<tr key={c.id} onClick={()=>setScoring(c)} style={{background:i%2===0?"#fff":"#fafbfc",transition:"background 0.15s",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#fafbfc"}>
                {COLS.map(col=><td key={col.k} style={{padding:"10px 14px",borderBottom:"1px solid #f1f5f9",whiteSpace:"nowrap",color:"#334155"}}>
                  {col.k==="act"?<button onClick={()=>setScoring(c)} style={{padding:"4px 12px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",color:"#1e293b",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F,transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#be123c";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#be123c"}} onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.color="#1e293b";e.currentTarget.style.borderColor="#e2e8f0"}}>{q?"Edit":"Score"}</button>:
                  col.k==="qual"?<QBadge q={q}/>:
                  col.k==="status"?<SBadge s={c[col.k]}/>:
                  col.k==="priority"?<PBadge p={c[col.k]}/>:
                  col.k==="outsourcingPropensity"?<ODot v={c[col.k]}/>:
                  col.k==="revenue"?<span style={{fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{c[col.k]}</span>:
                  col.k==="employees"||col.k==="sites"?<span style={{fontVariantNumeric:"tabular-nums"}}>{c[col.k].toLocaleString()}</span>:
                  col.k==="name"?<span style={{fontWeight:600,color:"#0f172a"}}>{c[col.k]}</span>:
                  c[col.k]}
                </td>)}
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
