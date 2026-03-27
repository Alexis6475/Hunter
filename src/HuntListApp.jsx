import{useState,useMemo,useRef,useEffect,useCallback}from"react";
import*as d3 from"d3";

var P="#E87722",Dk="#1e2a3a",F="'DM Sans',system-ui,sans-serif";
var SEGMENTS=["Banking & Financial Services","Logistics & Transport","Retail & Consumer Networks","Industrial Production","Real Estate"];
var SUB_SEG={"Banking & Financial Services":["Financial service activities"],"Logistics & Transport":["Warehousing and support activities"],"Retail & Consumer Networks":["Retail trade"],"Industrial Production":["Basic metals","Computers & electronics","Motor vehicles"],"Real Estate":["Real estate activities"]};
var REGIONS=["Mazowieckie","Śląskie","Wielkopolskie","Małopolskie","Dolnośląskie","Łódzkie","Pomorskie","Zachodniopomorskie"];
var CLUSTERS=["New Prospect","Current Client"];
var SEGC={"Banking & Financial Services":"#E87722","Retail & Consumer Networks":"#f59e0b","Industrial Production":"#8b5cf6","Logistics & Transport":"#06b6d4","Real Estate":"#f43f5e"};
var REGC={"Mazowieckie":"#E87722","Śląskie":"#f59e0b","Wielkopolskie":"#8b5cf6","Małopolskie":"#06b6d4","Dolnośląskie":"#10b981","Łódzkie":"#f43f5e","Pomorskie":"#2563eb","Zachodniopomorskie":"#6b7280"};
var CLUC={"New Prospect":"#f59e0b","Current Client":"#10b981"};
var SEG_W={"Banking & Financial Services":42,"Logistics & Transport":24,"Retail & Consumer Networks":20,"Industrial Production":10,"Real Estate":4};
var STAGES=["New","Contacted","Qualified","Proposal","Won","Lost"];
var STAGE_C={"New":"#94a3b8","Contacted":"#2563eb","Qualified":"#E87722","Proposal":"#8b5cf6","Won":"#16a34a","Lost":"#ef4444"};
var STAGE_IC={"New":"📋","Contacted":"📞","Qualified":"🎯","Proposal":"📄","Won":"🏆","Lost":"❌"};

function genCo(n){
  var pfx=["Pol","War","Krak","Gdań","Wrocł","Łódź","Pozn","Szcz","Lub","Kat","Bial","Czest","Rad","Tor","Kiel","Ols","Rzesz","Opol","Gliwi","Zabrz","Bydg","Tychy","Sosnow","Elbl","Płock","Tarn","Biel","Legn","Nowy","Stary","Wielk","Mało","Piotr","Siedl","Zamość","Radom","Toruń","Elblag"];
  var sfx=["Bank S.A.","Finance S.A.","Logistics Sp. z o.o.","Transport S.A.","Trade Sp. z o.o.","Retail S.A.","Metals Sp. z o.o.","Motors S.A.","Tech S.A.","Real Estate S.A.","Capital S.A.","Invest S.A.","Group S.A.","Services Sp. z o.o.","Holdings S.A.","Solutions S.A.","Partners S.A.","Management S.A.","Development S.A.","International S.A."];
  var co=[],u=new Set();
  var r=function(a,b){return Math.floor(Math.random()*(b-a+1))+a};
  var p=function(a){return a[Math.floor(Math.random()*a.length)]};
  var rf=function(a,b){return+(Math.random()*(b-a)+a).toFixed(2)};
  var skeys=Object.keys(SEG_W),stot=Object.values(SEG_W).reduce(function(a,b){return a+b},0);
  for(var i=0;i<n;i++){
    var nm;do{nm=p(pfx)+p(["a","o","ex","is","um","en","ia"])+" "+p(sfx)}while(u.has(nm));u.add(nm);
    var rnd=Math.random()*stot,cum=0,seg=skeys[0];
    for(var si=0;si<skeys.length;si++){cum+=SEG_W[skeys[si]];if(rnd<=cum){seg=skeys[si];break}}
    var revPLN=rf(500000000,82000000000);var profitPLN=revPLN*rf(0.05,0.7);var revBnEur=+(revPLN/4166000000).toFixed(2);var profitBnEur=+(profitPLN/4166000000).toFixed(2);var profitPct=+(profitPLN/revPLN*100).toFixed(1);var potSpend=+(revBnEur*rf(0.3,0.6)).toFixed(2);
    var isPrioritySeg=Math.random()<.79;var isMapped=Math.random()<.95;var isP1=isPrioritySeg&&isMapped?Math.random()<.52:false;
    co.push({id:i+1,nip:r(1000000000,9999999999)+"",name:nm,segment:seg,subSegment:p(SUB_SEG[seg]),segPriority:isPrioritySeg?"Priority":"Non-priority",mapped:isPrioritySeg?isMapped:true,priority:isPrioritySeg&&isMapped?(isP1?"P1 - High priority":"P2 - Opportunistic"):"N/A",ownership:isPrioritySeg&&isMapped&&isP1?(Math.random()<.12?"Public":"Private"):"N/A",revenuePLN:Math.round(revPLN),profitPLN:Math.round(profitPLN),profitBnEur:profitBnEur,revenueBnEur:revBnEur,profitPct:profitPct,outsourcingPropensity:Math.random()<.6?4.75:5,potentialSpendMEur:potSpend,cluster:Math.random()<.96?"New Prospect":"Current Client",score:rf(1.5,5),region:p(REGIONS),contactName:"",stage:"New"});
  }return co}

/* ── Pre-qual & Prospect Config ── */
var PQ=[{cat:"STRATEGIC FIT",color:"#e11d48",items:[{id:"intent",name:"Intent to outsource FM",desc:"Is the client considering outsourcing FM services?",q:["Are you currently considering outsourcing any part of your FM services?","Is this a new need or are you reviewing your current setup?","What is driving this reflection?"],w:3},{id:"scope",name:"Offer / service scope",desc:"Which FM services are in scope?",q:["Which services are you looking for?","Are you looking for one provider for all services or only selected services?","Could the scope expand over time?"],w:2}]},{cat:"OPERATIONAL FIT",color:"#2563eb",items:[{id:"ability",name:"Ability of AP to respond",desc:"Does the opportunity fit AP capabilities?",q:["What are the key service requirements?","Are there any technical, safety, or compliance constraints?","What service levels would you expect from a provider?"],w:3},{id:"geography",name:"Geography / site footprint",desc:"Where are the services needed?",q:["Where are the sites located?","How many sites are involved?","Is this a single-site or multi-site opportunity?"],w:2}]},{cat:"LEAD QUALITY",color:"#f59e0b",items:[{id:"competitor",name:"Competitor in place",desc:"Is another provider already in place?",q:["Who currently provides these services?","How satisfied are you with the current provider?","Would you consider replacing or complementing them?"],w:2},{id:"interest",name:"Interest shown during call",desc:"How engaged is the client?",q:["Would you be open to a follow-up discussion?","How important is this topic for you today?"],w:2},{id:"need",name:"Detailed need / pain points",desc:"Does the client have a clear view of their need?",q:["What challenges are you facing with your current FM setup?","What would you like to improve?","What would an ideal solution look like?"],w:1}]}];
var PF_FIELDS=[{id:"contactName",l:"Contact",t:"text",s:"general"},{id:"contactTitle",l:"Title",t:"text",s:"general"},{id:"contactEmail",l:"Email",t:"text",s:"general"},{id:"contactPhone",l:"Phone",t:"text",s:"general"},{id:"companyProfile",l:"Company Profile",t:"area",s:"before"},{id:"currentProvider",l:"Current Provider",t:"text",s:"before"},{id:"contractExpiry",l:"Contract Expiry",t:"text",s:"before"},{id:"decisionMaker",l:"Decision Maker",t:"area",s:"before"},{id:"meetingDate",l:"Meeting Date",t:"text",s:"during"},{id:"expressedNeeds",l:"Needs Expressed",t:"area",s:"during"},{id:"painPoints",l:"Pain Points",t:"area",s:"during"},{id:"objections",l:"Objections",t:"area",s:"during"},{id:"nextStepsAgreed",l:"Next Steps",t:"area",s:"during"},{id:"debriefNotes",l:"Debrief Notes",t:"area",s:"after"},{id:"revisedProbability",l:"Win Probability",t:"text",s:"after"},{id:"nextActions",l:"Next Actions",t:"area",s:"after"},{id:"followUpDate",l:"Follow-up Date",t:"text",s:"after"},{id:"estimatedValue",l:"Est. Value (PLN)",t:"text",s:"after"}];
var PF_SECS=[{id:"general",title:"General",icon:"🏢"},{id:"before",title:"Before Interaction",icon:"📋"},{id:"during",title:"During Interaction",icon:"💬"},{id:"after",title:"After Interaction",icon:"⚙️"}];

function calcWS(sc){var tw=0,tu=0;PQ.forEach(function(c){c.items.forEach(function(it){if(sc[it.id]){tw+=sc[it.id]*it.w;tu+=it.w}})});return tu?tw/tu:0}
function getQ(ws){if(ws>=3.8)return{label:"SQL",full:"Sales Qualified Lead",color:"#16a34a",bg:"#dcfce7"};if(ws>=2.5)return{label:"MQL",full:"Marketing Qualified Lead",color:"#f59e0b",bg:"#fef3c7"};if(ws>0)return{label:"NR",full:"Not Relevant",color:"#ef4444",bg:"#fee2e2"};return null}
function useStore(){
  var[data,setData]=useState(function(){try{return JSON.parse(localStorage.getItem("at_v7")||"{}")}catch(e){return{}}});
  var save=function(id,key,val){setData(function(p){var next=Object.assign({},p);next[id]=Object.assign({},p[id]||{});next[id][key]=val;try{localStorage.setItem("at_v7",JSON.stringify(next))}catch(e){}return next})};
  var get=function(id){return data[id]||{}};
  var qual=function(id){var d=data[id];if(!d||!d.scores||!Object.keys(d.scores).length)return null;return getQ(calcWS(d.scores))};
  var hasFile=function(id){var d=data[id];return d&&d.prospect&&Object.values(d.prospect).some(function(v){return v&&typeof v==="string"&&v.trim()})};
  return{save:save,get:get,qual:qual,hasFile:hasFile,data:data}
}

var cd={background:"#fff",borderRadius:16,boxShadow:"0 1px 3px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.03)",border:"1px solid #f0f0f5"};
var inp={padding:"8px 11px",borderRadius:10,border:"1px solid #e5e7eb",fontSize:13,fontFamily:F,outline:"none",color:Dk,boxSizing:"border-box",background:"#fafafa",width:"100%"};

/* ── Reusable Components ── */

function ScoreBtn(props){return<div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(function(n){return<button key={n} onClick={function(){props.onChange(n)}} style={{width:34,height:34,borderRadius:10,border:props.value===n?"2.5px solid "+props.color:"2px solid #e5e7eb",background:props.value===n?props.color:"#fff",color:props.value===n?"#fff":"#9ca3af",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{n}</button>})}</div>}
function Gauge(props){var score=props.score;var q=getQ(score),pct=Math.min(score/5,1)*100;return<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}><div style={{fontSize:28,fontWeight:900,color:Dk,lineHeight:1}}>{score>0?score.toFixed(1):"—"}<span style={{fontSize:12,fontWeight:500,color:"#9ca3af"}}>/5</span></div><div style={{width:"100%",position:"relative",marginTop:2}}><div style={{display:"flex",height:8,borderRadius:20,overflow:"hidden"}}><div style={{flex:50,background:"#fca5a5"}}/><div style={{flex:26,background:"#fcd34d"}}/><div style={{flex:24,background:"#86efac"}}/></div>{score>0&&<div style={{position:"absolute",top:-2,left:pct+"%",transform:"translateX(-50%)",transition:"left .5s"}}><div style={{width:3,height:12,background:Dk,borderRadius:2}}/></div>}<div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{fontSize:8,fontWeight:800,color:"#ef4444"}}>NR</span><span style={{fontSize:8,fontWeight:800,color:"#f59e0b"}}>MQL</span><span style={{fontSize:8,fontWeight:800,color:"#16a34a"}}>SQL</span></div></div>{q&&<div style={{padding:"3px 12px",borderRadius:20,background:q.bg,color:q.color,fontWeight:800,fontSize:11}}>{q.full}</div>}</div>}
function StageBadge(props){var s=props.stage;return<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:STAGE_C[s]+"18",color:STAGE_C[s],border:"1.5px solid "+STAGE_C[s]+"30"}}>{STAGE_IC[s]} {s}</span>}

function EditCell(props){var value=props.value,onSave=props.onSave,type=props.type,options=props.options,render=props.render;
  var[editing,setEditing]=useState(false);var[val,setVal]=useState(value);var ref=useRef();
  useEffect(function(){if(editing&&ref.current){ref.current.focus();if(ref.current.select)ref.current.select()}},[editing]);
  useEffect(function(){setVal(value)},[value]);
  if(!editing)return<span onDoubleClick={function(){setEditing(true)}} style={{cursor:"default"}} title="Double-click to edit">{render?render(value):(typeof value==="number"?value.toLocaleString():value)}</span>;
  var done=function(){setEditing(false);if(val!==value)onSave(type==="number"?Number(val):val)};
  if(options)return<select ref={ref} value={val} onChange={function(e){setVal(e.target.value);onSave(e.target.value);setEditing(false)}} onBlur={function(){setEditing(false)}} style={Object.assign({},inp,{width:"auto",fontSize:12,padding:"2px 6px"})}>{options.map(function(o){return<option key={o} value={o}>{o}</option>})}</select>;
  return<input ref={ref} type={type==="number"?"number":"text"} value={val} onChange={function(e){setVal(e.target.value)}} onBlur={done} onKeyDown={function(e){if(e.key==="Enter")done()}} style={Object.assign({},inp,{width:type==="number"?80:140,fontSize:12,padding:"2px 6px"})}/>;
}

function Waterfall(props){
  var ref=useRef(),cRef=useRef();var[ww,setWW]=useState(500);
  useEffect(function(){var ro=new ResizeObserver(function(e){var w=e[0]&&e[0].contentRect.width;if(w>50)setWW(w)});if(cRef.current)ro.observe(cRef.current);return function(){ro.disconnect()}},[]);
  useEffect(function(){
    if(!ref.current||!props.total)return;var svg=d3.select(ref.current);svg.selectAll("*").remove();
    var steps=[{l:"Active NIP",v:props.total,t:"total"},{l:"Non-prio",v:-props.nonPrio,t:"dec"},{l:"Priority",v:props.prio,t:"sub"},{l:"Not mapped",v:-props.notMapped,t:"dec"},{l:"P2 Opp.",v:-props.p2,t:"dec"},{l:"P1 High",v:props.p1,t:"sub"},{l:"Public",v:-props.pub,t:"dec"},{l:"Private",v:props.priv,t:"fin"}];
    var h=220,m={top:20,right:10,bottom:45,left:40},iw=ww-m.left-m.right,ih=h-m.top-m.bottom;
    var g=svg.attr("viewBox","0 0 "+ww+" "+h).append("g").attr("transform","translate("+m.left+","+m.top+")");
    var x=d3.scaleBand().domain(steps.map(function(d){return d.l})).range([0,iw]).padding(.18);
    var y=d3.scaleLinear().domain([0,props.total*1.15]).range([ih,0]);
    var run=0;var bars=steps.map(function(s){var y0,y1;if(s.t==="total"||s.t==="sub"||s.t==="fin"){y0=0;y1=Math.abs(s.v);run=Math.abs(s.v)}else{y1=run;y0=run+s.v;run=y0}return{l:s.l,v:s.v,t:s.t,y0:y0,y1:y1}});
    for(var i=0;i<bars.length-1;i++){var c=bars[i],n=bars[i+1];var fy=c.t==="dec"?y(c.y0):y(c.y1);g.append("line").attr("x1",x(c.l)+x.bandwidth()).attr("x2",x(n.l)).attr("y1",fy).attr("y2",fy).attr("stroke","#94a3b8").attr("stroke-width",1).attr("stroke-dasharray","4,3")}
    var bg=g.selectAll(".b").data(bars).join("g");
    bg.append("rect").attr("x",function(d){return x(d.l)}).attr("width",x.bandwidth()).attr("y",function(d){return y(Math.max(d.y0,d.y1))}).attr("height",0).attr("rx",4).attr("fill",function(d){return d.t==="total"?Dk:d.t==="sub"?"#475569":d.t==="fin"?"#be123c":"#fda4af"}).transition().duration(500).delay(function(_,i){return i*80}).attr("height",function(d){return Math.abs(y(d.y0)-y(d.y1))});
    bg.append("text").attr("x",function(d){return x(d.l)+x.bandwidth()/2}).attr("y",function(d){return y(Math.max(d.y0,d.y1))-4}).attr("text-anchor","middle").attr("font-size",10).attr("font-weight",800).attr("fill",Dk).attr("opacity",0).text(function(d){return Math.abs(d.v).toLocaleString()}).transition().duration(300).delay(function(_,i){return i*80+400}).attr("opacity",1);
    g.append("g").attr("transform","translate(0,"+ih+")").call(d3.axisBottom(x).tickSize(0)).selectAll("text").attr("font-size",8).attr("fill","#9ca3af");g.selectAll(".domain").remove();
    g.append("g").call(d3.axisLeft(y).ticks(3).tickFormat(d3.format(","))).selectAll("text").attr("font-size",8).attr("fill","#9ca3af");g.selectAll(".tick line").attr("stroke","#f3f4f6");g.selectAll(".domain").remove();
  },[props,ww]);
  return<div ref={cRef} style={{width:"100%"}}><svg ref={ref} style={{width:"100%",height:"auto"}}/></div>;
}

/* ═══════════════════════════════════════════════
   ██  COMPANY DETAIL PANEL (unified pre-qual + prospect)
   ═══════════════════════════════════════════════ */

function CompanyPanel(props){
  var co=props.co,store=props.store,updateStage=props.updateStage;
  var s0=store.get(co.id);
  var[tab,setTab]=useState("overview");
  var[scores,setS]=useState(s0.scores||{});
  var[notes,setN]=useState(s0.notes||{});
  var[showQ,setSQ]=useState({});
  var[fields,setF]=useState(Object.assign({companyProfile:co.name+"\nNIP: "+co.nip+"\nSegment: "+co.segment+"\nRegion: "+co.region+"\nRevenue: "+co.revenueBnEur+"bn€"},s0.prospect||{}));
  var[ok,setOk]=useState(false);

  useEffect(function(){store.save(co.id,"scores",scores);store.save(co.id,"notes",notes)},[scores,notes]);
  useEffect(function(){store.save(co.id,"prospect",fields)},[fields]);

  var ws=useMemo(function(){return calcWS(scores)},[scores]);
  var q=getQ(ws);
  var tot=PQ.reduce(function(s,c){return s+c.items.length},0);
  var done=Object.keys(scores).filter(function(k){return scores[k]}).length;

  var TABS=[{id:"overview",l:"Overview"},{id:"qualify",l:"Qualify"},{id:"interact",l:"Interactions"},{id:"notes",l:"Notes"}];

  return<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.35)",backdropFilter:"blur(4px)"}} onClick={function(e){if(e.target===e.currentTarget)props.onClose()}}>
    <div style={{position:"absolute",top:0,right:0,bottom:0,width:"min(720px,94vw)",background:"#fafafa",boxShadow:"-12px 0 40px rgba(0,0,0,.12)",overflowY:"auto",animation:"sl .25s cubic-bezier(.4,0,.2,1)"}}>
      <style>{"@keyframes sl{from{transform:translateX(100%)}to{transform:translateX(0)}}"}</style>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,"+Dk+",#2d3748)",padding:"16px 24px",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            <h2 style={{margin:0,fontSize:17,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{co.name}</h2>
            <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{co.segment}</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>·</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{co.region}</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>·</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{co.revenueBnEur}bn€</span>
              <StageBadge stage={co.stage}/>
              {q&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:800,background:q.bg,color:q.color}}>{q.label}</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:5}}>
            <button onClick={function(){setOk(true);setTimeout(function(){setOk(false)},1200)}} style={{padding:"5px 14px",borderRadius:10,border:"none",background:ok?"#16a34a":P,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:F}}>{ok?"✓ Saved":"Save"}</button>
            <button onClick={props.onClose} style={{width:28,height:28,borderRadius:8,border:"none",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        </div>
        {/* Stage selector */}
        <div style={{display:"flex",gap:4,marginTop:10}}>{STAGES.map(function(st){return<button key={st} onClick={function(){updateStage(co.id,st)}} style={{padding:"3px 10px",borderRadius:20,border:"1.5px solid "+(co.stage===st?STAGE_C[st]:STAGE_C[st]+"40"),background:co.stage===st?STAGE_C[st]:"transparent",color:co.stage===st?"#fff":STAGE_C[st]+"90",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:F,transition:"all .15s"}}>{STAGE_IC[st]} {st}</button>})}</div>
        {/* Tabs */}
        <div style={{display:"flex",gap:3,marginTop:10,background:"rgba(255,255,255,.06)",borderRadius:8,padding:2}}>{TABS.map(function(t){return<button key={t.id} onClick={function(){setTab(t.id)}} style={{padding:"5px 14px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:F,background:tab===t.id?P:"transparent",color:tab===t.id?"#fff":"rgba(255,255,255,.5)",transition:"all .15s"}}>{t.l}</button>})}</div>
      </div>

      <div style={{padding:"16px 24px"}}>
        {/* ── OVERVIEW TAB ── */}
        {tab==="overview"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={Object.assign({},cd,{padding:14})}><div style={{fontSize:9,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em"}}>Revenue</div><div style={{fontSize:20,fontWeight:900,color:Dk}}>{co.revenueBnEur} bn€</div></div>
            <div style={Object.assign({},cd,{padding:14})}><div style={{fontSize:9,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em"}}>Profit</div><div style={{fontSize:20,fontWeight:900,color:Dk}}>{co.profitPct}%</div></div>
            <div style={Object.assign({},cd,{padding:14})}><div style={{fontSize:9,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em"}}>Pot. Spend</div><div style={{fontSize:20,fontWeight:900,color:P}}>{co.potentialSpendMEur} m€</div></div>
            <div style={Object.assign({},cd,{padding:14})}><div style={{fontSize:9,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em"}}>Qualification</div><div style={{marginTop:4}}><Gauge score={ws}/></div></div>
          </div>
          <div style={Object.assign({},cd,{padding:14})}>
            <div style={{fontSize:11,fontWeight:800,color:Dk,marginBottom:8}}>Company Details</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:11}}>
              {[["NIP",co.nip],["Segment",co.segment],["Sub-segment",co.subSegment],["Cluster",co.cluster],["Priority",co.priority],["Ownership",co.ownership],["Seg. Priority",co.segPriority],["Region",co.region]].map(function(r){return<div key={r[0]}><span style={{color:"#9ca3af"}}>{r[0]}:</span> <span style={{fontWeight:600,color:Dk}}>{r[1]}</span></div>})}
            </div>
          </div>
        </div>}

        {/* ── QUALIFY TAB (pre-qual) ── */}
        {tab==="qualify"&&<div>
          <div style={Object.assign({},cd,{padding:14,marginBottom:14,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"})}>
            <div style={{flex:1,minWidth:140}}><Gauge score={ws}/></div>
            <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:120}}>
              <div style={{fontSize:11,color:"#6b7280"}}>{done}/{tot} scored</div>
              {PQ.map(function(cat){var cs=cat.items.filter(function(c){return scores[c.id]});var avg=cs.length?cs.reduce(function(s,c){return s+scores[c.id]},0)/cs.length:0;return<div key={cat.cat}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:9,fontWeight:800,color:cat.color}}>{cat.cat}</span><span style={{fontSize:9,fontWeight:800}}>{avg.toFixed(1)}</span></div><div style={{height:3,background:"#e5e7eb",borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:(avg/5*100)+"%",background:cat.color,borderRadius:20,transition:"width .4s"}}/></div></div>})}
            </div>
          </div>
          {PQ.map(function(cat){return<div key={cat.cat} style={{marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><div style={{width:3,height:14,borderRadius:3,background:cat.color}}/><span style={{fontSize:10,fontWeight:900,textTransform:"uppercase",letterSpacing:".1em",color:cat.color}}>{cat.cat}</span></div>
            {cat.items.map(function(it){return<div key={it.id} style={Object.assign({},cd,{padding:"10px 12px",marginBottom:6,borderLeft:"3px solid "+(scores[it.id]?cat.color:"#e5e7eb")})}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}><span style={{fontSize:12,fontWeight:700,color:Dk}}>{it.name}</span><span style={{fontSize:9,fontWeight:800,color:cat.color,background:cat.color+"12",padding:"1px 6px",borderRadius:20}}>w={it.w}</span></div>
              <p style={{margin:"0 0 5px",fontSize:11,color:"#6b7280"}}>{it.desc}</p>
              <ScoreBtn value={scores[it.id]||0} onChange={function(v){var id=it.id;setS(function(p){var n=Object.assign({},p);n[id]=v;return n})}} color={cat.color}/>
              <button onClick={function(){var id=it.id;setSQ(function(p){var n=Object.assign({},p);n[id]=!p[id];return n})}} style={{marginTop:3,background:"none",border:"none",cursor:"pointer",fontSize:10,color:P,fontFamily:F,padding:0,fontWeight:700}}>{showQ[it.id]?"▾":"▸"} Questions</button>
              {showQ[it.id]&&<div style={{marginTop:3,paddingLeft:8,borderLeft:"2px solid #e5e7eb"}}>{it.q.map(function(q2,i){return<p key={i} style={{margin:"1px 0",fontSize:10,color:"#6b7280"}}>→ {q2}</p>})}</div>}
              <textarea placeholder="Notes…" value={notes[it.id]||""} onChange={function(e){var id=it.id,val=e.target.value;setN(function(p){var n=Object.assign({},p);n[id]=val;return n})}} rows={2} style={Object.assign({},inp,{marginTop:4,fontSize:12})}/>
            </div>})}</div>})}
        </div>}

        {/* ── INTERACTIONS TAB (prospect file) ── */}
        {tab==="interact"&&<div>
          {PF_SECS.map(function(sec){var secFields=PF_FIELDS.filter(function(f){return f.s===sec.id});return<div key={sec.id} style={{marginBottom:14}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><span style={{fontSize:14}}>{sec.icon}</span><span style={{fontSize:12,fontWeight:800,color:Dk}}>{sec.title}</span></div>
            <div style={Object.assign({},cd,{padding:"10px 12px",display:"flex",flexDirection:"column",gap:6})}>{secFields.map(function(f){return<div key={f.id}><label style={{display:"block",fontSize:9,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>{f.l}</label>
              {f.t==="area"?<textarea value={fields[f.id]||""} onChange={function(e){var id=f.id,val=e.target.value;setF(function(p){var n=Object.assign({},p);n[id]=val;return n})}} rows={3} style={inp}/>:<input value={fields[f.id]||""} onChange={function(e){var id=f.id,val=e.target.value;setF(function(p){var n=Object.assign({},p);n[id]=val;return n})}} style={inp}/>}</div>})}</div></div>})}
        </div>}

        {/* ── NOTES TAB ── */}
        {tab==="notes"&&<div>
          <div style={Object.assign({},cd,{padding:14})}>
            <div style={{fontSize:11,fontWeight:800,color:Dk,marginBottom:8}}>Free Notes</div>
            <textarea value={fields._freeNotes||""} onChange={function(e){var val=e.target.value;setF(function(p){return Object.assign({},p,{_freeNotes:val})})}} rows={12} placeholder="Write anything about this prospect…" style={inp}/>
          </div>
        </div>}
      </div>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════
   ██  COLUMN DEFINITIONS
   ═══════════════════════════════════════════════ */

var COLS=[
  {k:"name",l:"Company",w:200},{k:"stage",l:"Stage",w:90},{k:"prequal",l:"Qualification",w:100},{k:"segment",l:"Segment",w:150},{k:"priority",l:"Priority",w:110},{k:"ownership",l:"Pub/Priv",w:75},{k:"revenueBnEur",l:"Revenue (bn€)",w:95},{k:"profitPct",l:"Profit %",w:70},{k:"potentialSpendMEur",l:"Pot. Spend (m€)",w:100},{k:"cluster",l:"Cluster",w:110},{k:"region",l:"Region",w:100},{k:"score",l:"Prio. Score",w:80},{k:"contactName",l:"Contact",w:120},
];

/* ═══════════════════════════════════════════════
   ██  MAIN APP
   ═══════════════════════════════════════════════ */

export default function App(){
  var[companies,setCo]=useState(function(){return genCo(4300)});
  var[view,setView]=useState("home");
  var[search,setSearch]=useState("");
  var[segF,setSegF]=useState("All");var[regF,setRegF]=useState("All");var[ownF,setOwnF]=useState("All");
  var[stageF,setStageF]=useState("All");
  var[sortK,setSortK]=useState("revenueBnEur");var[sortD,setSortD]=useState("desc");
  var[page,setPage]=useState(0);
  var[panel,setPanel]=useState(null);
  var[hovRow,setHovRow]=useState(null);
  var[visibleCols,setVisibleCols]=useState(function(){return["name","stage","prequal","segment","priority","ownership","revenueBnEur","potentialSpendMEur","cluster","region"]});
  var store=useStore();var PS=30;

  var updateCo=useCallback(function(id,key,val){setCo(function(prev){return prev.map(function(c){if(c.id===id){var n=Object.assign({},c);n[key]=val;return n}return c})})},[]);
  var updateStage=useCallback(function(id,stage){setCo(function(prev){return prev.map(function(c){if(c.id===id){var n=Object.assign({},c);n.stage=stage;return n}return c})})},[]);

  // Qualification map
  var qualMap=useMemo(function(){var m={};companies.forEach(function(c){m[c.id]=store.qual(c.id)});return m},[companies,store]);

  var filtered=useMemo(function(){
    var d=companies.slice();
    if(search){var q=search.toLowerCase();d=d.filter(function(c){return c.name.toLowerCase().includes(q)||c.nip.includes(q)})}
    if(segF!=="All")d=d.filter(function(c){return c.segment===segF});
    if(regF!=="All")d=d.filter(function(c){return c.region===regF});
    if(ownF!=="All")d=d.filter(function(c){return c.ownership===ownF});
    if(stageF!=="All")d=d.filter(function(c){return c.stage===stageF});
    d.sort(function(a,b){var av=a[sortK],bv=b[sortK];if(typeof av==="string"){av=av.toLowerCase();bv=bv.toLowerCase()}return sortD==="asc"?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0)});
    return d;
  },[companies,search,segF,regF,ownF,stageF,sortK,sortD]);

  var pg=filtered.slice(page*PS,(page+1)*PS),tp=Math.ceil(filtered.length/PS)||1;
  var hs=function(k){if(sortK===k)setSortD(sortD==="asc"?"desc":"asc");else{setSortK(k);setSortD("desc")}setPage(0)};

  // Pipeline counts
  var pipeSQL=0,pipeMQL=0,pipeNR=0;
  companies.forEach(function(c){var q=qualMap[c.id];if(q){if(q.label==="SQL")pipeSQL++;else if(q.label==="MQL")pipeMQL++;else pipeNR++}});
  var stageCounts={};STAGES.forEach(function(s){stageCounts[s]=companies.filter(function(c){return c.stage===s}).length});

  // Waterfall data
  var wfD=useMemo(function(){var t=companies.length;var np=companies.filter(function(c){return c.segPriority==="Non-priority"}).length;var pr=t-np;var nm=companies.filter(function(c){return c.segPriority==="Priority"&&!c.mapped}).length;var p2c=companies.filter(function(c){return c.segPriority==="Priority"&&c.mapped&&c.priority.includes("P2")}).length;var p1c=companies.filter(function(c){return c.segPriority==="Priority"&&c.mapped&&c.priority.includes("P1")}).length;var pubc=companies.filter(function(c){return c.segPriority==="Priority"&&c.mapped&&c.priority.includes("P1")&&c.ownership==="Public"}).length;return{t:t,np:np,pr:pr,nm:nm,p2c:p2c,p1c:p1c,pubc:pubc,privc:p1c-pubc}},[companies]);

  // Home: recent SQLs and action items
  var recentSQLs=useMemo(function(){return companies.filter(function(c){var q=qualMap[c.id];return q&&q.label==="SQL"}).slice(0,8)},[companies,qualMap]);
  var contactedNoQual=useMemo(function(){return companies.filter(function(c){return c.stage==="Contacted"&&!qualMap[c.id]}).slice(0,5)},[companies,qualMap]);
  var qualifiedNoProposal=useMemo(function(){return companies.filter(function(c){return c.stage==="Qualified"}).slice(0,5)},[companies]);

  return<div style={{fontFamily:F,background:"#f3f4f6",minHeight:"100vh",color:Dk}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&display=swap" rel="stylesheet"/>
    <style>{`
      @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
      .fade-up{animation:fadeUp .35s cubic-bezier(.4,0,.2,1) both}
      .hover-lift{transition:transform .2s,box-shadow .2s}.hover-lift:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}
      .btn-pop{transition:all .15s}.btn-pop:hover{transform:scale(1.03)}.btn-pop:active{transform:scale(.97)}
      .row-hover{transition:background .12s}.row-hover:hover{background:#eef2ff !important}
      .pipe-dot{animation:pulse 2s infinite}
      .kanban-col{min-height:200px}
    `}</style>

    {panel&&<CompanyPanel co={panel} store={store} updateStage={updateStage} onClose={function(){setPanel(null)}}/>}

    {/* ══ HEADER ══ */}
    <header style={{background:"linear-gradient(135deg,"+Dk+",#2d3748)",padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,"+P+",#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:14}}>A</div>
        <div><div style={{fontSize:13,fontWeight:800,color:"#fff"}}>ATALIAN <span style={{fontWeight:400,opacity:.5}}>Poland</span></div><div style={{fontSize:9,color:"rgba(255,255,255,.3)"}}>Sales Excellence</div></div>
      </div>
      {/* Pipeline badges */}
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:10,background:"rgba(255,255,255,.06)"}}>
        <span style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>Pipeline</span>
        {[{l:"SQL",c:"#16a34a",n:pipeSQL},{l:"MQL",c:"#f59e0b",n:pipeMQL},{l:"NR",c:"#ef4444",n:pipeNR}].map(function(p){return<span key={p.l} style={{display:"flex",alignItems:"center",gap:3,cursor:"pointer"}} onClick={function(){setView("list");setStageF("All")}}><span className="pipe-dot" style={{width:7,height:7,borderRadius:20,background:p.c}}/><span style={{fontSize:12,fontWeight:800,color:p.c+"cc"}}>{p.n}</span><span style={{fontSize:8,color:"rgba(255,255,255,.3)"}}>{p.l}</span></span>})}
      </div>
      {/* Nav */}
      <div style={{display:"flex",gap:3,background:"rgba(255,255,255,.05)",borderRadius:10,padding:3}}>
        {[{id:"home",l:"🏠 Home"},{id:"list",l:"📋 Hunt List"},{id:"kanban",l:"📊 Pipeline"},{id:"dashboard",l:"📈 Analytics"}].map(function(v){return<button key={v.id} onClick={function(){setView(v.id);setPage(0)}} className="btn-pop" style={{padding:"5px 14px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:F,background:view===v.id?P:"transparent",color:view===v.id?"#fff":"rgba(255,255,255,.5)"}}>{v.l}</button>})}
      </div>
    </header>

    <main style={{padding:"18px 24px 36px",maxWidth:1400,margin:"0 auto"}}>

      {/* ═══ HOME VIEW ═══ */}
      {view==="home"&&<div>
        <h2 className="fade-up" style={{margin:"0 0 16px",fontSize:20,fontWeight:900}}>Good morning 👋</h2>
        {/* Stage overview pills */}
        <div className="fade-up" style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
          {STAGES.map(function(s){return<div key={s} className="hover-lift" onClick={function(){setView("list");setStageF(s)}} style={Object.assign({},cd,{padding:"12px 18px",cursor:"pointer",flex:"1 1 120px",minWidth:110,position:"relative",overflow:"hidden"})}>
            <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".1em",color:STAGE_C[s],fontWeight:700}}>{STAGE_IC[s]} {s}</div>
            <div style={{fontSize:24,fontWeight:900,color:Dk}}>{stageCounts[s]}</div>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:STAGE_C[s]}}/>
          </div>})}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {/* Action items */}
          <div className="fade-up" style={Object.assign({},cd,{padding:"18px 22px"})}>
            <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:800}}>🔥 Action Required</h3>
            <p style={{margin:"0 0 12px",fontSize:11,color:"#9ca3af"}}>Prospects that need your attention</p>
            {contactedNoQual.length>0&&<div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:"#2563eb",marginBottom:4}}>📞 Contacted — needs qualification ({contactedNoQual.length})</div>
              {contactedNoQual.map(function(c){return<div key={c.id} onClick={function(){setPanel(c)}} style={{padding:"6px 10px",borderRadius:8,cursor:"pointer",fontSize:11,display:"flex",justifyContent:"space-between",background:"#f8fafc",marginBottom:3,transition:"background .1s"}} onMouseEnter={function(e){e.currentTarget.style.background="#eef2ff"}} onMouseLeave={function(e){e.currentTarget.style.background="#f8fafc"}}><span style={{fontWeight:700}}>{c.name}</span><span style={{color:"#9ca3af"}}>{c.revenueBnEur}bn€</span></div>})}
            </div>}
            {qualifiedNoProposal.length>0&&<div>
              <div style={{fontSize:10,fontWeight:700,color:P,marginBottom:4}}>🎯 Qualified — move to proposal ({qualifiedNoProposal.length})</div>
              {qualifiedNoProposal.map(function(c){return<div key={c.id} onClick={function(){setPanel(c)}} style={{padding:"6px 10px",borderRadius:8,cursor:"pointer",fontSize:11,display:"flex",justifyContent:"space-between",background:"#f8fafc",marginBottom:3,transition:"background .1s"}} onMouseEnter={function(e){e.currentTarget.style.background="#eef2ff"}} onMouseLeave={function(e){e.currentTarget.style.background="#f8fafc"}}><span style={{fontWeight:700}}>{c.name}</span><span style={{color:"#9ca3af"}}>{c.segment.split(" ")[0]}</span></div>})}
            </div>}
            {contactedNoQual.length===0&&qualifiedNoProposal.length===0&&<div style={{padding:20,textAlign:"center",color:"#9ca3af",fontSize:12}}>All caught up! Start qualifying prospects from the Hunt List.</div>}
          </div>

          {/* Hot leads (SQLs) */}
          <div className="fade-up" style={Object.assign({},cd,{padding:"18px 22px"})}>
            <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:800}}>🏆 Hot Leads (SQL)</h3>
            <p style={{margin:"0 0 12px",fontSize:11,color:"#9ca3af"}}>Sales Qualified — ready for proposal</p>
            {recentSQLs.length>0?recentSQLs.map(function(c){return<div key={c.id} onClick={function(){setPanel(c)}} style={{padding:"8px 10px",borderRadius:8,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:8,background:"#f0fdf4",marginBottom:4,borderLeft:"3px solid #16a34a",transition:"background .1s"}} onMouseEnter={function(e){e.currentTarget.style.background="#dcfce7"}} onMouseLeave={function(e){e.currentTarget.style.background="#f0fdf4"}}>
              <span style={{fontWeight:700,flex:1}}>{c.name}</span>
              <span style={{fontSize:10,color:"#6b7280"}}>{c.segment.split(" ")[0]}</span>
              <span style={{fontWeight:800,color:"#16a34a"}}>{c.potentialSpendMEur}m€</span>
            </div>}):<div style={{padding:20,textAlign:"center",color:"#9ca3af",fontSize:12}}>No SQLs yet. Open a prospect and qualify them!</div>}
          </div>
        </div>

        {/* Pipeline funnel */}
        <div className="fade-up hover-lift" style={Object.assign({},cd,{padding:"18px 22px",marginTop:14})}>
          <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:800}}>Pipeline Funnel</h3>
          <p style={{margin:"0 0 8px",fontSize:11,color:"#9ca3af"}}>From all companies to your private P1 scope</p>
          <Waterfall total={wfD.t} nonPrio={wfD.np} prio={wfD.pr} notMapped={wfD.nm} p2={wfD.p2c} p1={wfD.p1c} pub={wfD.pubc} priv={wfD.privc}/>
        </div>
      </div>}

      {/* ═══ HUNT LIST VIEW ═══ */}
      {view==="list"&&<div className="fade-up">
        {/* Stage tabs */}
        <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
          <button onClick={function(){setStageF("All");setPage(0)}} className="btn-pop" style={{padding:"6px 16px",borderRadius:20,border:stageF==="All"?"2px solid "+Dk:"1.5px solid #e5e7eb",background:stageF==="All"?Dk:"#fff",color:stageF==="All"?"#fff":Dk,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F}}>All ({companies.length})</button>
          {STAGES.map(function(s){return<button key={s} onClick={function(){setStageF(s);setPage(0)}} className="btn-pop" style={{padding:"6px 16px",borderRadius:20,border:stageF===s?"2px solid "+STAGE_C[s]:"1.5px solid #e5e7eb",background:stageF===s?STAGE_C[s]+"15":"#fff",color:stageF===s?STAGE_C[s]:"#6b7280",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F}}>{STAGE_IC[s]} {s} ({stageCounts[s]})</button>})}
        </div>

        {/* Filters + search */}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10,alignItems:"center"}}>
          <input placeholder="🔍 Search…" value={search} onChange={function(e){setSearch(e.target.value);setPage(0)}} style={Object.assign({},inp,{width:180,background:"#fff"})}/>
          <select value={segF} onChange={function(e){setSegF(e.target.value);setPage(0)}} style={Object.assign({},inp,{width:"auto",background:"#fff",cursor:"pointer"})}><option value="All">Segment</option>{SEGMENTS.map(function(o){return<option key={o} value={o}>{o}</option>})}</select>
          <select value={regF} onChange={function(e){setRegF(e.target.value);setPage(0)}} style={Object.assign({},inp,{width:"auto",background:"#fff",cursor:"pointer"})}><option value="All">Region</option>{REGIONS.map(function(o){return<option key={o} value={o}>{o}</option>})}</select>
          <select value={ownF} onChange={function(e){setOwnF(e.target.value);setPage(0)}} style={Object.assign({},inp,{width:"auto",background:"#fff",cursor:"pointer"})}><option value="All">Ownership</option><option value="Public">Public</option><option value="Private">Private</option></select>
          <span style={{fontSize:10,color:"#9ca3af",marginLeft:"auto",fontWeight:600}}>{filtered.length} results</span>
        </div>

        {/* Column pills */}
        <div style={Object.assign({},cd,{padding:"8px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"})}>
          <span style={{fontSize:10,fontWeight:800,color:Dk}}>Columns</span>
          {COLS.map(function(col){var on=visibleCols.includes(col.k);return<button key={col.k} onClick={function(){setVisibleCols(function(prev){return on?prev.filter(function(k){return k!==col.k}):prev.concat([col.k])})}} style={{padding:"2px 8px",borderRadius:20,border:on?"1.5px solid "+P:"1px solid #e5e7eb",background:on?P+"12":"#fff",color:on?P:"#9ca3af",fontSize:9,fontWeight:on?700:500,cursor:"pointer",fontFamily:F}}>{col.l}</button>})}
        </div>

        {/* Table */}
        <div style={Object.assign({},cd,{overflow:"hidden"})}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"max-content",minWidth:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr>{COLS.filter(function(c){return visibleCols.includes(c.k)}).map(function(c){return<th key={c.k} onClick={function(){hs(c.k)}} style={{padding:"8px 10px",textAlign:"left",fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:sortK===c.k?P:"#9ca3af",borderBottom:"2px solid #f0f0f5",cursor:"pointer",whiteSpace:"nowrap",minWidth:c.w,background:"#fafafa",position:"sticky",top:0,zIndex:2}}>{c.l}{sortK===c.k?(sortD==="asc"?" ↑":" ↓"):""}</th>})}<th style={{position:"sticky",right:0,background:"#fafafa",borderBottom:"2px solid #f0f0f5",minWidth:60,zIndex:3,padding:"8px 10px",fontSize:9,fontWeight:800,color:"#9ca3af"}}>Open</th></tr></thead>
              <tbody>{pg.map(function(c,i){
                var q=qualMap[c.id];var isH=hovRow===c.id;
                var qualBg=q?(q.label==="SQL"?"#f0fdf4":q.label==="MQL"?"#fffbeb":"#fef2f2"):"transparent";
                var bg=isH?"#eef2ff":q?qualBg:i%2===0?"#fff":"#fafafa";
                var leftBorder=q?"3px solid "+q.color:"3px solid transparent";
                function renderCell(col){
                  var v=c[col.k];
                  if(col.k==="name")return<span style={{fontWeight:700,color:Dk,cursor:"pointer"}} onClick={function(){setPanel(c)}}>{v}</span>;
                  if(col.k==="stage")return<StageBadge stage={v}/>;
                  if(col.k==="prequal")return q?<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:800,background:q.bg,color:q.color}}>{q.label}</span>:<span style={{fontSize:10,color:"#d1d5db"}}>—</span>;
                  if(col.k==="segment")return<span style={{display:"inline-flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:3,background:SEGC[v]||"#ccc"}}/><span style={{fontSize:11}}>{v}</span></span>;
                  if(col.k==="priority"){var p1=v.includes("P1");return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:p1?P:"#f3f4f6",color:p1?"#fff":"#6b7280"}}>{p1?"P1":"P2"}</span>}
                  if(col.k==="ownership")return<span style={{fontSize:11,color:v==="Private"?"#7c3aed":"#2563eb",fontWeight:600}}>{v}</span>;
                  if(col.k==="cluster")return<span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:600,background:v==="New Prospect"?"#fef3c7":"#d1fae5",color:v==="New Prospect"?"#92400e":"#065f46"}}>{v==="New Prospect"?"New":"Client"}</span>;
                  if(col.k==="score")return<span style={{fontWeight:800,color:Number(v)>=4?"#166534":Number(v)>=3?P:"#ef4444"}}>{Number(v).toFixed(1)}</span>;
                  if(col.k==="profitPct")return<span style={{fontWeight:600}}>{Number(v).toFixed(1)}%</span>;
                  if(col.k==="potentialSpendMEur")return<span style={{fontWeight:700,color:P}}>{Number(v).toFixed(1)}</span>;
                  if(typeof v==="number")return<span>{v>1000000?(v/1000000000).toFixed(2)+"B":Number(v).toLocaleString(undefined,{maximumFractionDigits:2})}</span>;
                  return<span>{v||"—"}</span>;
                }
                return<tr key={c.id} className="row-hover" style={{background:bg,borderLeft:leftBorder}} onMouseEnter={function(){setHovRow(c.id)}} onMouseLeave={function(){setHovRow(null)}}>
                  {COLS.filter(function(col){return visibleCols.includes(col.k)}).map(function(col){return<td key={col.k} style={{padding:"7px 10px",borderBottom:"1px solid #f0f0f5",whiteSpace:"nowrap"}}>{renderCell(col)}</td>})}
                  <td style={{position:"sticky",right:0,background:bg,borderBottom:"1px solid #f0f0f5",padding:"7px 10px",zIndex:3}}>
                    <button onClick={function(){setPanel(c)}} className="btn-pop" style={{padding:"4px 10px",borderRadius:6,border:"none",background:P,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:F,opacity:isH?1:.3,transition:"opacity .15s"}}>Open</button>
                  </td>
                </tr>})}</tbody>
            </table>
          </div>
        </div>
        {/* Pagination */}
        <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:10}}>
          <button disabled={page===0} onClick={function(){setPage(page-1)}} style={{padding:"4px 12px",borderRadius:8,border:"1px solid #e5e7eb",background:"#fff",cursor:page===0?"default":"pointer",fontSize:11,fontFamily:F,color:Dk,fontWeight:700}}>←</button>
          <span style={{fontSize:11,color:"#6b7280",fontWeight:600,padding:"4px 0"}}>{page+1}/{tp}</span>
          <button disabled={page>=tp-1} onClick={function(){setPage(page+1)}} style={{padding:"4px 12px",borderRadius:8,border:"1px solid #e5e7eb",background:"#fff",cursor:page>=tp-1?"default":"pointer",fontSize:11,fontFamily:F,color:Dk,fontWeight:700}}>→</button>
        </div>
      </div>}

      {/* ═══ KANBAN VIEW ═══ */}
      {view==="kanban"&&<div className="fade-up">
        <h2 style={{margin:"0 0 14px",fontSize:18,fontWeight:900}}>Pipeline Board</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat("+STAGES.length+",1fr)",gap:10,overflowX:"auto"}}>
          {STAGES.map(function(stage){
            var stageCompanies=companies.filter(function(c){return c.stage===stage}).slice(0,20);
            var stageRev=stageCompanies.reduce(function(s,c){return s+c.potentialSpendMEur},0);
            return<div key={stage} className="kanban-col" style={{background:"#f8fafc",borderRadius:12,padding:10,minWidth:180}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div><span style={{fontSize:12,fontWeight:800,color:STAGE_C[stage]}}>{STAGE_IC[stage]} {stage}</span></div>
                <span style={{fontSize:10,fontWeight:700,color:"#9ca3af",background:"#f3f4f6",padding:"2px 8px",borderRadius:20}}>{stageCounts[stage]}</span>
              </div>
              <div style={{fontSize:9,color:"#9ca3af",marginBottom:8}}>Total pot. spend: <b style={{color:P}}>{stageRev.toFixed(0)}m€</b></div>
              {stageCompanies.map(function(c){
                var q=qualMap[c.id];
                return<div key={c.id} onClick={function(){setPanel(c)}} className="hover-lift" style={{background:"#fff",borderRadius:10,padding:"8px 10px",marginBottom:6,cursor:"pointer",border:"1px solid #f0f0f5",borderLeft:"3px solid "+(q?q.color:STAGE_C[stage])}}>
                  <div style={{fontSize:11,fontWeight:700,color:Dk,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                    <span style={{fontSize:9,color:"#6b7280"}}>{c.segment.split(" ")[0]}</span>
                    <span style={{fontSize:9,fontWeight:700,color:P}}>{c.potentialSpendMEur}m€</span>
                  </div>
                  {q&&<div style={{marginTop:3}}><span style={{padding:"1px 6px",borderRadius:20,fontSize:8,fontWeight:800,background:q.bg,color:q.color}}>{q.label}</span></div>}
                </div>
              })}
              {stageCounts[stage]>20&&<div style={{textAlign:"center",fontSize:9,color:"#9ca3af",padding:4}}>+{stageCounts[stage]-20} more</div>}
            </div>
          })}
        </div>
      </div>}

      {/* ═══ ANALYTICS VIEW ═══ */}
      {view==="dashboard"&&<div className="fade-up">
        <h2 style={{margin:"0 0 14px",fontSize:18,fontWeight:900}}>Analytics</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          <div style={Object.assign({},cd,{padding:14,textAlign:"center"})}>
            <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,textTransform:"uppercase"}}>Qualification Rate</div>
            <div style={{fontSize:28,fontWeight:900,color:Dk}}>{companies.length?Math.round((pipeSQL+pipeMQL+pipeNR)/companies.length*100):0}%</div>
            <div style={{fontSize:10,color:"#6b7280"}}>{pipeSQL+pipeMQL+pipeNR} / {companies.length}</div>
          </div>
          <div style={Object.assign({},cd,{padding:14,textAlign:"center"})}>
            <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,textTransform:"uppercase"}}>SQL Conversion</div>
            <div style={{fontSize:28,fontWeight:900,color:"#16a34a"}}>{(pipeSQL+pipeMQL+pipeNR)?Math.round(pipeSQL/(pipeSQL+pipeMQL+pipeNR)*100):0}%</div>
            <div style={{fontSize:10,color:"#6b7280"}}>{pipeSQL} SQLs of {pipeSQL+pipeMQL+pipeNR} qualified</div>
          </div>
          <div style={Object.assign({},cd,{padding:14,textAlign:"center"})}>
            <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,textTransform:"uppercase"}}>Pipeline Value</div>
            <div style={{fontSize:28,fontWeight:900,color:P}}>{Math.round(companies.filter(function(c){return c.stage!=="Lost"&&c.stage!=="New"}).reduce(function(s,c){return s+c.potentialSpendMEur},0))}m€</div>
            <div style={{fontSize:10,color:"#6b7280"}}>active prospects</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div className="hover-lift" style={Object.assign({},cd,{padding:"18px 20px"})}>
            <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:800}}>Pipeline Funnel</h3>
            <p style={{margin:"0 0 8px",fontSize:10,color:"#9ca3af"}}>From total universe to target scope</p>
            <Waterfall total={wfD.t} nonPrio={wfD.np} prio={wfD.pr} notMapped={wfD.nm} p2={wfD.p2c} p1={wfD.p1c} pub={wfD.pubc} priv={wfD.privc}/>
          </div>
          <div className="hover-lift" style={Object.assign({},cd,{padding:"18px 20px"})}>
            <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:800}}>Stage Distribution</h3>
            <p style={{margin:"0 0 12px",fontSize:10,color:"#9ca3af"}}>How prospects move through your pipeline</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {STAGES.map(function(s){var pct=companies.length?stageCounts[s]/companies.length*100:0;return<div key={s} style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:80,fontSize:10,fontWeight:600,color:STAGE_C[s],textAlign:"right"}}>{STAGE_IC[s]} {s}</span>
                <div style={{flex:1,height:18,background:"#f3f4f6",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:STAGE_C[s],borderRadius:4,transition:"width .5s"}}/></div>
                <span style={{fontSize:10,fontWeight:800,color:Dk,minWidth:40,textAlign:"right"}}>{stageCounts[s]}</span>
              </div>})}
            </div>
          </div>
        </div>
      </div>}

    </main>
    <footer style={{textAlign:"center",padding:10,fontSize:9,color:"#9ca3af"}}><b style={{color:P}}>ATALIAN</b> × <b>Simon-Kucher</b> · Sales Excellence · Poland</footer>
  </div>;
}
