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
var OWnc={"Public":"#2563eb","Private":"#8b5cf6"};
var PRIOC={"P1 - High priority":"#E87722","P2 - Opportunistic":"#94a3b8","N/A":"#e5e7eb"};
var SEG_W={"Banking & Financial Services":42,"Logistics & Transport":24,"Retail & Consumer Networks":20,"Industrial Production":10,"Real Estate":4};

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
    var nRevBnEur=rf(1,20),nProfitPct=rf(1,11),nOutsrc=rf(3,5),nPotSpend=rf(1,22),nRevBnEur2=rf(1,10),nProfitPct2=rf(1,11),nOutsrc2=rf(3,5),nPotSpend2=rf(1,10);
    var isPrioritySeg=Math.random()<.79;var isMapped=Math.random()<.95;var isP1=isPrioritySeg&&isMapped?Math.random()<.52:false;
    co.push({id:i+1,nip:r(1000000000,9999999999)+"",name:nm,segment:seg,subSegment:p(SUB_SEG[seg]),segPriority:isPrioritySeg?"Priority":"Non-priority",mapped:isPrioritySeg?isMapped:true,priority:isPrioritySeg&&isMapped?(isP1?"P1 - High priority":"P2 - Opportunistic"):"N/A",ownership:isPrioritySeg&&isMapped&&isP1?(Math.random()<.12?"Public":"Private"):"N/A",revenuePLN:Math.round(revPLN),profitPLN:Math.round(profitPLN),profitBnEur:profitBnEur,revenueBnEur:revBnEur,profitPct:profitPct,outsourcingPropensity:Math.random()<.6?4.75:5,potentialSpendMEur:potSpend,cluster:Math.random()<.96?"New Prospect":"Current Client",nRevBnEur:+nRevBnEur.toFixed(2),nProfitPct:+nProfitPct.toFixed(2),nOutsrc:+nOutsrc.toFixed(2),nPotSpend:+nPotSpend.toFixed(2),nRevBnEur2:+nRevBnEur2.toFixed(2),nProfitPct2:+nProfitPct2.toFixed(2),nOutsrc2:+nOutsrc2.toFixed(2),nPotSpend2:+nPotSpend2.toFixed(2),score:rf(1.5,5),region:p(REGIONS),contactName:""});
  }return co}

var PQ=[{cat:"STRATEGIC FIT",color:"#e11d48",items:[{id:"intent",name:"Intent to outsource FM",desc:"Determine whether the client is considering outsourcing part or all of their FM services and whether there is a real trigger for change",q:["Are you currently considering outsourcing any part of your FM services?","Is this a new need or are you reviewing your current setup?","What is driving this reflection?"],w:3},{id:"scope",name:"Offer / service scope",desc:"Clarify which FM services are in scope (i.e. cleaning, tech. FM, etc.) and whether the need is for single services, bundled services, or integrated FM",q:["Which services are you looking for?","Are you looking for one provider for all services or only selected services?","Could the scope expand over time?"],w:2}]},{cat:"OPERATIONAL FIT",color:"#2563eb",items:[{id:"ability",name:"Ability of AP to respond",desc:"Check whether the opportunity fits AP capabilities in terms of services, scale, complexity, SLAs, technical needs, and compliance requirements",q:["What are the key service requirements?","Are there any technical, safety, or compliance constraints?","What service levels would you expect from a provider?"],w:3},{id:"geography",name:"Geography / site footprint",desc:"Understand where the services are needed and whether the account is local, regional, national, or multi-site",q:["Where are the sites located?","How many sites are involved?","Is this a single-site or multi-site opportunity?","Do all locations need to be covered?"],w:2}]},{cat:"LEAD QUALITY",color:"#f59e0b",items:[{id:"competitor",name:"Competitor in place / share of wallet available",desc:"Identify whether another provider is already in place and how much of the account could realistically be won",q:["Who currently provides these services?","How satisfied are you with the current provider?","Would you consider replacing or complementing them?","Which parts of the scope could be open for review?"],w:2},{id:"interest",name:"Interest shown during the call",desc:"Evaluate how engaged the client is and whether there is real openness to continue the discussion",q:["Would you be open to a follow-up discussion with our sales team?","How important is this topic for you today?","Would you like us to come back with a more detailed discussion?"],w:2},{id:"need",name:"Detailed need / pain points",desc:"Check whether the client already has a clear view of the business need behind the opportunity",q:["What challenges are you facing with your current FM setup?","What would you like to improve?","What would an ideal solution look like?","What are your top decision criteria?"],w:1}]}];
var PF_SEC=[{id:"general",title:"General Information",icon:"🏢",fields:[{id:"contactName",l:"Contact",t:"text"},{id:"contactTitle",l:"Title",t:"text"},{id:"contactEmail",l:"Email",t:"text"},{id:"contactPhone",l:"Phone",t:"text"},{id:"linkedinUrl",l:"LinkedIn",t:"text"}]},{id:"before",title:"Before Interaction",icon:"📋",fields:[{id:"companyProfile",l:"Profile",t:"area"},{id:"currentProvider",l:"Current Provider",t:"text"},{id:"contractExpiry",l:"Contract Expiry",t:"text"},{id:"totalSurface",l:"Surface (m²)",t:"text"},{id:"decisionMaker",l:"Decision Maker",t:"area"},{id:"keyPriorities",l:"Priorities",t:"area"}]},{id:"during",title:"During Interaction",icon:"💬",fields:[{id:"meetingDate",l:"Date",t:"text"},{id:"meetingType",l:"Type",t:"text"},{id:"attendees",l:"Attendees",t:"text"},{id:"expressedNeeds",l:"Needs",t:"area"},{id:"painPoints",l:"Pain Points",t:"area"},{id:"objections",l:"Objections",t:"area"},{id:"priceSensitivity",l:"Price Sensitivity",t:"text"},{id:"nextStepsAgreed",l:"Next Steps",t:"area"}]},{id:"after",title:"After Interaction",icon:"⚙️",fields:[{id:"debriefNotes",l:"Debrief",t:"area"},{id:"revisedProbability",l:"Win Prob.",t:"text"},{id:"blockingPoints",l:"Blockers",t:"area"},{id:"nextActions",l:"Actions",t:"area"},{id:"followUpDate",l:"Follow-up",t:"text"},{id:"estimatedValue",l:"Value (PLN)",t:"text"}]}];

function calcWS(sc){var tw=0,tu=0;PQ.forEach(function(c){c.items.forEach(function(it){if(sc[it.id]){tw+=sc[it.id]*it.w;tu+=it.w}})});return tu?tw/tu:0}
function getQ(ws){if(ws>=3.8)return{label:"SQL",full:"Sales Qualified Lead",color:"#16a34a",bg:"#dcfce7",bdr:"#86efac"};if(ws>=2.5)return{label:"MQL",full:"Marketing Qualified Lead",color:"#f59e0b",bg:"#fef3c7",bdr:"#fcd34d"};if(ws>0)return{label:"NR",full:"Not Relevant",color:"#ef4444",bg:"#fee2e2",bdr:"#fca5a5"};return null}
function useStore(){var[data,setData]=useState(function(){try{return JSON.parse(localStorage.getItem("at_v6")||"{}")}catch(e){return{}}});var save=function(id,key,val){setData(function(p){var next=Object.assign({},p);next[id]=Object.assign({},p[id]||{});next[id][key]=val;try{localStorage.setItem("at_v6",JSON.stringify(next))}catch(e){}return next})};var get=function(id){return data[id]||{}};var qual=function(id){var d=data[id];if(!d||!d.scores||!Object.keys(d.scores).length)return null;return getQ(calcWS(d.scores))};var hasFile=function(id){var d=data[id];return d&&d.prospect&&Object.values(d.prospect).some(function(v){return v&&typeof v==="string"&&v.trim()})};return{save:save,get:get,qual:qual,hasFile:hasFile}}

var cd={background:"#fff",borderRadius:16,boxShadow:"0 1px 3px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.03)",border:"1px solid #f0f0f5"};
var inp={padding:"8px 11px",borderRadius:10,border:"1px solid #e5e7eb",fontSize:13,fontFamily:F,outline:"none",color:Dk,boxSizing:"border-box",background:"#fafafa",width:"100%"};
var selStyle={padding:"5px 8px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:11,fontFamily:F,color:Dk,background:"#fff",cursor:"pointer",fontWeight:600};

/* ── Chart Components ── */

function HBar(props){var items=props.items,colorMap=props.colorMap,fmt=props.fmt||function(v){return typeof v==="number"&&v>999?(v/1000).toFixed(1)+"k":v};var sorted=items.slice().sort(function(a,b){return b.v-a.v});var max=Math.max.apply(null,sorted.map(function(d){return d.v}))||1;return<div style={{display:"flex",flexDirection:"column",gap:6}}>{sorted.map(function(d,i){return<div key={d.k} className="fade-up" style={{display:"flex",alignItems:"center",gap:10,animationDelay:i*40+"ms"}}><div style={{width:120,fontSize:10,fontWeight:600,color:"#6b7280",textAlign:"right",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={d.k}>{d.k}</div><div style={{flex:1,height:24,background:"#f3f4f6",borderRadius:6,overflow:"hidden",position:"relative"}}><div style={{height:"100%",width:Math.max(d.v/max*100,1)+"%",background:colorMap[d.k]||P,borderRadius:6,transition:"width .6s cubic-bezier(.4,0,.2,1)"}}/><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:10,fontWeight:800,color:d.v/max>.2?"#fff":"#374151"}}>{fmt(d.v)}</span></div></div>})}<div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:6,paddingLeft:130}}>{sorted.map(function(d){return<div key={d.k} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:colorMap[d.k]||P}}/><span style={{fontSize:9,color:"#9ca3af"}}>{d.k}</span></div>})}</div></div>}

function MiniDonut(props){var items=props.items,colorMap=props.colorMap,size=props.size||140;var total=items.reduce(function(s,d){return s+d.v},0);if(!total)return null;var cum=0;var arcs=items.filter(function(d){return d.v>0}).map(function(d){var start=cum/total*360;cum+=d.v;return{k:d.k,v:d.v,start:start,end:cum/total*360}});function ap(cx,cy,r2,s,e){var sr=(s-90)*Math.PI/180,er=(e-90)*Math.PI/180,lg=e-s>180?1:0;return"M "+(cx+r2*Math.cos(sr))+" "+(cy+r2*Math.sin(sr))+" A "+r2+" "+r2+" 0 "+lg+" 1 "+(cx+r2*Math.cos(er))+" "+(cy+r2*Math.sin(er))}var r=size/2,inn=r*.55;return<div style={{display:"flex",alignItems:"center",gap:16}}><svg viewBox={"0 0 "+size+" "+size} width={size} height={size}>{arcs.map(function(a,i){var endClamped=Math.min(a.end,a.start+359.5);return<path key={i} d={ap(r,r,r-2,a.start,endClamped)+" L "+(r+inn*Math.cos((endClamped-90)*Math.PI/180))+" "+(r+inn*Math.sin((endClamped-90)*Math.PI/180))+" A "+inn+" "+inn+" 0 "+(endClamped-a.start>180?1:0)+" 0 "+(r+inn*Math.cos((a.start-90)*Math.PI/180))+" "+(r+inn*Math.sin((a.start-90)*Math.PI/180))+" Z"} fill={colorMap[a.k]||"#ccc"} style={{transition:"opacity .3s"}}/>})}<text x={r} y={r} textAnchor="middle" dy=".35em" fontSize={14} fontWeight={900} fill={Dk}>{total.toLocaleString()}</text></svg><div style={{display:"flex",flexDirection:"column",gap:4}}>{items.filter(function(d){return d.v>0}).map(function(d){return<div key={d.k} style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,borderRadius:3,background:colorMap[d.k]||"#ccc"}}/><span style={{fontSize:11,color:"#6b7280"}}>{d.k}</span><span style={{fontSize:11,fontWeight:800,color:Dk,marginLeft:4}}>{d.v}</span><span style={{fontSize:9,color:"#9ca3af"}}>({(d.v/total*100).toFixed(0)}%)</span></div>})}</div></div>}

function Waterfall(props){
  var ref=useRef(),cRef=useRef();var[ww,setWW]=useState(500);
  useEffect(function(){var ro=new ResizeObserver(function(e){var w=e[0]&&e[0].contentRect.width;if(w>50)setWW(w)});if(cRef.current)ro.observe(cRef.current);return function(){ro.disconnect()}},[]);
  useEffect(function(){
    if(!ref.current||!props.total)return;var svg=d3.select(ref.current);svg.selectAll("*").remove();
    var steps=[
      {l:"Active NIP\ncodes",v:props.total,t:"total"},
      {l:"Non-priority",v:-props.nonPrio,t:"dec"},
      {l:"Priority\nsegments",v:props.prio,t:"sub"},
      {l:"Not\nmapped",v:-props.notMapped,t:"dec"},
      {l:"P2 Opp.",v:-props.p2,t:"dec"},
      {l:"P1 High\npriority",v:props.p1,t:"sub"},
      {l:"Public",v:-props.pub,t:"dec"},
      {l:"Private\n(scope)",v:props.priv,t:"fin"}
    ];
    var h=250,m={top:25,right:10,bottom:55,left:45},iw=ww-m.left-m.right,ih=h-m.top-m.bottom;
    var g=svg.attr("viewBox","0 0 "+ww+" "+h).append("g").attr("transform","translate("+m.left+","+m.top+")");
    var x=d3.scaleBand().domain(steps.map(function(d){return d.l})).range([0,iw]).padding(.18);
    var mx=props.total*1.15;
    var y=d3.scaleLinear().domain([0,mx]).range([ih,0]);
    var run=0;var bars=steps.map(function(s){var y0,y1;if(s.t==="total"||s.t==="sub"||s.t==="fin"){y0=0;y1=Math.abs(s.v);run=Math.abs(s.v)}else if(s.t==="dec"){y1=run;y0=run+s.v;run=y0}return{l:s.l,v:s.v,t:s.t,y0:y0,y1:y1}});
    for(var i=0;i<bars.length-1;i++){var c=bars[i],n=bars[i+1];var fy;if(c.t==="dec"){fy=y(c.y0)}else{fy=y(c.y1)}g.append("line").attr("x1",x(c.l)+x.bandwidth()).attr("x2",x(n.l)).attr("y1",fy).attr("y2",fy).attr("stroke","#94a3b8").attr("stroke-width",1).attr("stroke-dasharray","4,3")}
    var bg=g.selectAll(".b").data(bars).join("g");
    bg.append("rect").attr("x",function(d){return x(d.l)}).attr("width",x.bandwidth()).attr("y",function(d){return y(Math.max(d.y0,d.y1))}).attr("height",0).attr("rx",5).attr("fill",function(d){return d.t==="total"?Dk:d.t==="sub"?"#475569":d.t==="fin"?"#be123c":"#fda4af"}).transition().duration(600).delay(function(_,i){return i*100}).ease(d3.easeCubicOut).attr("height",function(d){return Math.abs(y(d.y0)-y(d.y1))});
    bg.append("text").attr("x",function(d){return x(d.l)+x.bandwidth()/2}).attr("y",function(d){return y(Math.max(d.y0,d.y1))-5}).attr("text-anchor","middle").attr("font-size",11).attr("font-weight",800).attr("fill",Dk).attr("opacity",0).text(function(d){return Math.abs(d.v).toLocaleString()}).transition().duration(300).delay(function(_,i){return i*100+500}).attr("opacity",1);
    g.append("g").attr("transform","translate(0,"+ih+")").call(d3.axisBottom(x).tickSize(0)).selectAll("text").attr("font-size",9).attr("fill","#9ca3af");g.selectAll(".domain").remove();
    g.append("g").call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(","))).selectAll("text").attr("font-size",9).attr("fill","#9ca3af");g.selectAll(".tick line").attr("stroke","#f3f4f6");g.selectAll(".domain").remove();
    // Legend
    var leg=[{l:"Total / Subtotal",c:Dk},{l:"Decrease",c:"#fda4af"},{l:"Final scope",c:"#be123c"}];
    var lg=g.append("g").attr("transform","translate("+(iw-200)+","+(ih+38)+")");
    leg.forEach(function(item,i){lg.append("rect").attr("x",i*75).attr("y",0).attr("width",8).attr("height",8).attr("rx",2).attr("fill",item.c);lg.append("text").attr("x",i*75+12).attr("y",7).attr("font-size",8).attr("fill","#9ca3af").text(item.l)});
  },[props.total,props.nonPrio,props.prio,props.notMapped,props.p2,props.p1,props.pub,props.priv,ww]);
  return<div ref={cRef} style={{width:"100%"}}><svg ref={ref} style={{width:"100%",height:"auto"}}/></div>;
}

/* ── Custom Chart Builder for Dashboard ── */

function ChartBuilder(props){
  var companies=props.companies;
  var[metric,setMetric]=useState("count");
  var[dim,setDim]=useState("segment");
  var[chartType,setChartType]=useState("bar");

  var DIMS={segment:{label:"Segment",vals:SEGMENTS,colors:SEGC,key:"segment"},cluster:{label:"Cluster",vals:CLUSTERS,colors:CLUC,key:"cluster"},region:{label:"Region",vals:REGIONS,colors:REGC,key:"region"},ownership:{label:"Ownership",vals:["Public","Private"],colors:OWnc,key:"ownership"},priority:{label:"Priority",vals:["P1 - High priority","P2 - Opportunistic","N/A"],colors:PRIOC,key:"priority"}};
  var METRICS={count:{label:"# Companies",fn:function(arr){return arr.length},fmt:function(v){return v>999?(v/1000).toFixed(1)+"k":v}},revenue:{label:"Revenue (bn€)",fn:function(arr){return Math.round(arr.reduce(function(s,c){return s+c.revenueBnEur},0)*100)/100},fmt:function(v){return v.toFixed(1)}},profit:{label:"Avg Profit %",fn:function(arr){return arr.length?Math.round(arr.reduce(function(s,c){return s+c.profitPct},0)/arr.length*10)/10:0},fmt:function(v){return v.toFixed(1)+"%"}},potSpend:{label:"Pot. Spend (m€)",fn:function(arr){return Math.round(arr.reduce(function(s,c){return s+c.potentialSpendMEur},0)*100)/100},fmt:function(v){return v.toFixed(1)}}};

  var dimCfg=DIMS[dim];var metCfg=METRICS[metric];
  var items=dimCfg.vals.map(function(val){var arr=companies.filter(function(c){return c[dimCfg.key]===val});return{k:val.length>25?val.substring(0,22)+"…":val,fullK:val,v:metCfg.fn(arr)}}).filter(function(d){return d.v>0});
  var colorMap={};dimCfg.vals.forEach(function(val){var short=val.length>25?val.substring(0,22)+"…":val;colorMap[short]=dimCfg.colors[val]||P});

  return<div style={Object.assign({},cd,{padding:"20px 24px"})}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <h3 style={{margin:0,fontSize:14,fontWeight:800,color:Dk}}>📊 Custom Analysis</h3>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <select value={metric} onChange={function(e){setMetric(e.target.value)}} style={selStyle}>{Object.keys(METRICS).map(function(k){return<option key={k} value={k}>{METRICS[k].label}</option>})}</select>
        <select value={dim} onChange={function(e){setDim(e.target.value)}} style={selStyle}>{Object.keys(DIMS).map(function(k){return<option key={k} value={k}>By {DIMS[k].label}</option>})}</select>
        <select value={chartType} onChange={function(e){setChartType(e.target.value)}} style={selStyle}><option value="bar">Bar Chart</option><option value="donut">Donut</option></select>
      </div>
    </div>
    <div style={{fontSize:11,color:"#9ca3af",marginBottom:10}}>{metCfg.label} by {dimCfg.label} — {companies.length} companies</div>
    {chartType==="bar"?<HBar items={items} colorMap={colorMap} fmt={metCfg.fmt}/>:<MiniDonut items={items} colorMap={colorMap}/>}
  </div>;
}

/* ── UI Primitives ── */

function KPI(props){return<div className="hover-lift fade-up" style={Object.assign({},cd,{padding:"16px 20px",flex:"1 1 160px",minWidth:145,position:"relative",overflow:"hidden",animationDelay:(props.delay||0)+"ms"})}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".12em",color:"#9ca3af",marginBottom:3,fontWeight:700}}>{props.label}</div><div style={{fontSize:26,fontWeight:900,color:Dk,lineHeight:1.1}}>{props.value}</div>{props.sub&&<div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{props.sub}</div>}<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:props.accent}}/></div>}
function ClBadge(props){var s=props.s;var m={"New Prospect":{bg:"#fef3c7",t:"#92400e"},"Current Client":{bg:"#d1fae5",t:"#065f46"}}[s]||{bg:"#f3f4f6",t:"#374151"};return<span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:m.bg,color:m.t}}>{s}</span>}
function ScoreBtn(props){return<div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(function(n){return<button key={n} onClick={function(){props.onChange(n)}} style={{width:36,height:36,borderRadius:10,border:props.value===n?"2.5px solid "+props.color:"2px solid #e5e7eb",background:props.value===n?props.color:"#fff",color:props.value===n?"#fff":"#9ca3af",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{n}</button>})}</div>}
function Gauge(props){var score=props.score;var q=getQ(score),pct=Math.min(score/5,1)*100;return<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><div style={{fontSize:32,fontWeight:900,color:Dk,lineHeight:1}}>{score>0?score.toFixed(1):"—"}<span style={{fontSize:13,fontWeight:500,color:"#9ca3af"}}>/5</span></div><div style={{width:"100%",position:"relative",marginTop:2}}><div style={{display:"flex",height:10,borderRadius:20,overflow:"hidden"}}><div style={{flex:50,background:"#fca5a5"}}/><div style={{flex:26,background:"#fcd34d"}}/><div style={{flex:24,background:"#86efac"}}/></div>{score>0&&<div style={{position:"absolute",top:-3,left:pct+"%",transform:"translateX(-50%)",transition:"left .5s"}}><div style={{width:4,height:16,background:Dk,borderRadius:2}}/></div>}<div style={{display:"flex",justifyContent:"space-between",marginTop:3}}><span style={{fontSize:8,fontWeight:800,color:"#ef4444"}}>NR</span><span style={{fontSize:8,fontWeight:800,color:"#f59e0b"}}>MQL</span><span style={{fontSize:8,fontWeight:800,color:"#16a34a"}}>SQL</span></div></div>{q&&<div style={{padding:"4px 16px",borderRadius:20,background:q.bg,color:q.color,fontWeight:800,fontSize:12}}>{q.full}</div>}</div>}

/* ── Side Panels ── */

function Side(props){return<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.35)",backdropFilter:"blur(4px)"}} onClick={function(e){if(e.target===e.currentTarget)props.onClose()}}><div style={{position:"absolute",top:0,right:0,bottom:0,width:"min(660px,92vw)",background:"#fafafa",boxShadow:"-12px 0 40px rgba(0,0,0,.12)",overflowY:"auto",animation:"sl .25s cubic-bezier(.4,0,.2,1)"}}><style>{"@keyframes sl{from{transform:translateX(100%);opacity:.8}to{transform:translateX(0);opacity:1}}"}</style>{props.children}</div></div>}
function PHead(props){return<div style={{background:"linear-gradient(135deg,"+Dk+",#2d3748)",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}><div style={{flex:1,minWidth:0}}><h2 style={{margin:0,fontSize:15,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{props.title}</h2>{props.sub&&<p style={{margin:"2px 0 0",fontSize:10,color:"rgba(255,255,255,.5)"}}>{props.sub}</p>}</div><div style={{display:"flex",gap:5}}><button onClick={props.onSave} style={{padding:"5px 14px",borderRadius:10,border:"none",background:props.saved?"#16a34a":P,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:F,transition:"background .2s"}}>{props.saved?"✓ Saved":"Save"}</button><button onClick={props.onClose} style={{width:28,height:28,borderRadius:8,border:"none",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div></div>}

function PrequalPanel(props){var co=props.co,store=props.store;var s0=store.get(co.id);var[scores,setS]=useState(s0.scores||{});var[notes,setN]=useState(s0.notes||{});var[showQ,setSQ]=useState({});var[ok,setOk]=useState(false);
  useEffect(function(){store.save(co.id,"scores",scores);store.save(co.id,"notes",notes)},[scores,notes]);
  var ws=useMemo(function(){return calcWS(scores)},[scores]);var tot=PQ.reduce(function(s,c){return s+c.items.length},0);var done=Object.keys(scores).filter(function(k){return scores[k]}).length;
  return<Side onClose={props.onClose}><PHead title={"🎯 "+co.name} sub={co.segment+" · "+co.region+" · "+co.revenueBnEur+"bn€"} onSave={function(){setOk(true);setTimeout(function(){setOk(false)},1200)}} saved={ok} onClose={props.onClose}/>
    <div style={{padding:"16px 20px"}}><div style={Object.assign({},cd,{padding:16,marginBottom:16,display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"})}><div style={{flex:1,minWidth:160}}><Gauge score={ws}/></div><div style={{display:"flex",flexDirection:"column",gap:4,minWidth:130}}><div style={{fontSize:11,color:"#6b7280"}}>{done}/{tot} criteria scored</div>
      {PQ.map(function(cat){var cs=cat.items.filter(function(c){return scores[c.id]});var avg=cs.length?cs.reduce(function(s,c){return s+scores[c.id]},0)/cs.length:0;return<div key={cat.cat}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:9,fontWeight:800,color:cat.color}}>{cat.cat}</span><span style={{fontSize:9,fontWeight:800}}>{avg.toFixed(1)}</span></div><div style={{height:3,background:"#e5e7eb",borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:(avg/5*100)+"%",background:cat.color,borderRadius:20,transition:"width .4s"}}/></div></div>})}</div></div>
    {PQ.map(function(cat){return<div key={cat.cat} style={{marginBottom:14}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}><div style={{width:3,height:14,borderRadius:3,background:cat.color}}/><span style={{fontSize:10,fontWeight:900,textTransform:"uppercase",letterSpacing:".1em",color:cat.color}}>{cat.cat}</span></div>
      {cat.items.map(function(it){return<div key={it.id} className="fade-up" style={Object.assign({},cd,{padding:"12px 14px",marginBottom:7,borderLeft:"3px solid "+(scores[it.id]?cat.color:"#e5e7eb"),transition:"border-color .3s"})}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}><span style={{fontSize:12,fontWeight:700,color:Dk}}>{it.name}</span><span style={{fontSize:9,fontWeight:800,color:cat.color,background:cat.color+"12",padding:"1px 7px",borderRadius:20}}>w={it.w}</span></div><p style={{margin:"0 0 6px",fontSize:11,color:"#6b7280"}}>{it.desc}</p>
        <ScoreBtn value={scores[it.id]||0} onChange={function(v){var id=it.id;setS(function(p){var n=Object.assign({},p);n[id]=v;return n})}} color={cat.color}/>
        <button onClick={function(){var id=it.id;setSQ(function(p){var n=Object.assign({},p);n[id]=!p[id];return n})}} style={{marginTop:4,background:"none",border:"none",cursor:"pointer",fontSize:10,color:P,fontFamily:F,padding:0,fontWeight:700}}>{showQ[it.id]?"▾":"▸"} Questions</button>
        {showQ[it.id]&&<div style={{marginTop:3,paddingLeft:8,borderLeft:"2px solid #e5e7eb"}}>{it.q.map(function(q,i){return<p key={i} style={{margin:"1px 0",fontSize:10,color:"#6b7280"}}>→ {q}</p>})}</div>}
        <textarea placeholder="Notes…" value={notes[it.id]||""} onChange={function(e){var id=it.id,val=e.target.value;setN(function(p){var n=Object.assign({},p);n[id]=val;return n})}} rows={2} style={Object.assign({},inp,{marginTop:5,fontSize:12})}/>
      </div>})}</div>})}</div></Side>;
}

function ProspectPanel(props){var co=props.co,store=props.store;var s0=store.get(co.id);var defs={companyProfile:co.name+"\nNIP: "+co.nip+"\nSegment: "+co.segment+"\nSub-segment: "+co.subSegment+"\nRegion: "+co.region+"\nRevenue: "+co.revenueBnEur+"bn€\nProfit: "+co.profitPct+"%\nOutsourcing: "+co.outsourcingPropensity+"\nPot. Spend: "+co.potentialSpendMEur+"m€\nCluster: "+co.cluster+"\nScore: "+co.score};
  var[fields,setF]=useState(Object.assign({},defs,s0.prospect||{}));var[ok,setOk]=useState(false);
  useEffect(function(){store.save(co.id,"prospect",fields)},[fields]);
  var filled=Object.values(fields).filter(function(v){return v&&typeof v==="string"&&v.trim()}).length;var total=PF_SEC.reduce(function(s,sec){return s+sec.fields.length},0);
  return<Side onClose={props.onClose}><PHead title={"📋 "+co.name} sub={co.segment+" · "+co.region+" · "+co.revenueBnEur+"bn€"} onSave={function(){setOk(true);setTimeout(function(){setOk(false)},1200)}} saved={ok} onClose={props.onClose}/>
    <div style={{padding:"16px 20px"}}><div style={Object.assign({},cd,{padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10})}><span style={{fontSize:10,fontWeight:700,color:"#6b7280"}}>{filled}/{total}</span><div style={{flex:1,height:5,background:"#e5e7eb",borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:(filled/total*100)+"%",background:P,borderRadius:20,transition:"width .4s"}}/></div></div>
    {PF_SEC.map(function(sec){return<div key={sec.id} style={{marginBottom:16}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}><span style={{fontSize:14}}>{sec.icon}</span><span style={{fontSize:12,fontWeight:800,color:Dk}}>{sec.title}</span></div>
      <div style={Object.assign({},cd,{padding:"12px 14px",display:"flex",flexDirection:"column",gap:8})}>{sec.fields.map(function(f){return<div key={f.id}><label style={{display:"block",fontSize:9,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>{f.l}</label>
        {f.t==="area"?<textarea value={fields[f.id]||""} onChange={function(e){var id=f.id,val=e.target.value;setF(function(p){var n=Object.assign({},p);n[id]=val;return n})}} rows={3} style={inp}/>:<input value={fields[f.id]||""} onChange={function(e){var id=f.id,val=e.target.value;setF(function(p){var n=Object.assign({},p);n[id]=val;return n})}} style={inp}/>}</div>})}</div></div>})}</div></Side>;
}

/* ── EditCell ── */

function EditCell(props){var value=props.value,onSave=props.onSave,type=props.type,options=props.options,render=props.render;
  var[editing,setEditing]=useState(false);var[val,setVal]=useState(value);var ref=useRef();
  useEffect(function(){if(editing&&ref.current){ref.current.focus();if(ref.current.select)ref.current.select()}},[editing]);
  useEffect(function(){setVal(value)},[value]);
  if(!editing)return<span onDoubleClick={function(){setEditing(true)}} style={{cursor:"default"}} title="Double-click to edit">{render?render(value):(typeof value==="number"?value.toLocaleString():value)}</span>;
  var done=function(){setEditing(false);if(val!==value)onSave(type==="number"?Number(val):val)};
  if(options)return<select ref={ref} value={val} onChange={function(e){setVal(e.target.value);onSave(e.target.value);setEditing(false)}} onBlur={function(){setEditing(false)}} style={Object.assign({},inp,{width:"auto",fontSize:12,padding:"2px 6px"})}>{options.map(function(o){return<option key={o} value={o}>{o}</option>})}</select>;
  return<input ref={ref} type={type==="number"?"number":"text"} value={val} onChange={function(e){setVal(e.target.value)}} onBlur={done} onKeyDown={function(e){if(e.key==="Enter")done()}} style={Object.assign({},inp,{width:type==="number"?80:140,fontSize:12,padding:"2px 6px"})}/>;
}

/* ── Column Definitions — score moved to end before contactName ── */

var COLS=[
  {k:"nip",l:"NIP Code",w:110},
  {k:"name",l:"Company",w:200},
  {k:"prequal",l:"Pre-qualification",w:110},
  {k:"segment",l:"Segment",w:160},
  {k:"subSegment",l:"Sub-segment",w:180},
  {k:"segPriority",l:"Seg. Priority",w:100},
  {k:"mapped",l:"Mapped",w:70},
  {k:"priority",l:"Priority",w:120},
  {k:"ownership",l:"Pub/Priv",w:75},
  {k:"revenuePLN",l:"Revenue (PLN)",w:120},
  {k:"profitPLN",l:"Profit (PLN)",w:120},
  {k:"profitBnEur",l:"Profit (bn€)",w:90},
  {k:"revenueBnEur",l:"Revenue (bn€)",w:95},
  {k:"profitPct",l:"Profit %",w:70},
  {k:"outsourcingPropensity",l:"Outsrc. Propensity",w:110},
  {k:"potentialSpendMEur",l:"Pot. Spend (m€)",w:110},
  {k:"cluster",l:"Cluster",w:115},
  {k:"region",l:"Region",w:110},
  {k:"nRevBnEur",l:"N.Rev (bn€)",w:90},
  {k:"nProfitPct",l:"N.Profit %",w:80},
  {k:"nOutsrc",l:"N.Outsrc",w:75},
  {k:"nPotSpend",l:"N.Pot.Spend",w:85},
  {k:"nRevBnEur2",l:"N.Rev2 (bn€)",w:90},
  {k:"nProfitPct2",l:"N.Profit2 %",w:85},
  {k:"nOutsrc2",l:"N.Outsrc2",w:80},
  {k:"nPotSpend2",l:"N.Pot.Spend2",w:90},
  {k:"score",l:"Prio. Score",w:80},
  {k:"contactName",l:"Key Contact",w:130},
];

/* ══════════════════════════════════════════════
   ██  MAIN APP
   ══════════════════════════════════════════════ */

export default function App(){
  var[companies,setCo]=useState(function(){return genCo(4300)});
  var[view,setView]=useState("dashboard");var[search,setSearch]=useState("");
  var[segF,setSegF]=useState("All");var[cluF,setCluF]=useState("All");var[regF,setRegF]=useState("All");var[ownF,setOwnF]=useState("All");
  var[sortK,setSortK]=useState("revenueBnEur");var[sortD,setSortD]=useState("desc");
  var[page,setPage]=useState(0);var[panel,setPanel]=useState(null);var[hovRow,setHovRow]=useState(null);
  var[visibleCols,setVisibleCols]=useState(function(){return["nip","name","prequal","segment","segPriority","priority","ownership","revenueBnEur","profitPct","outsourcingPropensity","potentialSpendMEur","cluster","region"]});
  var store=useStore();var PS=30;

  var[wfFilter,setWfFilter]=useState(null);
  // pipeFilter: "SQL" | "MQL" | "NR" | null — filters table on qualification status
  var[pipeFilter,setPipeFilter]=useState(null);

  var updateCo=useCallback(function(id,key,val){setCo(function(prev){return prev.map(function(c){if(c.id===id){var n=Object.assign({},c);n[key]=val;return n}return c})})},[]);

  // Build a set of IDs per qualification label for fast lookup
  var qualMap=useMemo(function(){
    var m={SQL:new Set(),MQL:new Set(),NR:new Set()};
    companies.forEach(function(c){var q=store.qual(c.id);if(q&&m[q.label])m[q.label].add(c.id)});
    return m;
  },[companies,store]);

  var filtered=useMemo(function(){
    var d=companies.slice();
    if(search){var q=search.toLowerCase();d=d.filter(function(c){return c.name.toLowerCase().includes(q)||c.nip.includes(q)})}
    if(segF!=="All")d=d.filter(function(c){return c.segment===segF});
    if(cluF!=="All")d=d.filter(function(c){return c.cluster===cluF});
    if(regF!=="All")d=d.filter(function(c){return c.region===regF});
    if(ownF!=="All")d=d.filter(function(c){return c.ownership===ownF});
    if(wfFilter){
      if(wfFilter.segPriority)d=d.filter(function(c){return c.segPriority===wfFilter.segPriority});
      if(wfFilter.mapped!==undefined)d=d.filter(function(c){return c.mapped===wfFilter.mapped});
      if(wfFilter.priority)d=d.filter(function(c){return c.priority.includes(wfFilter.priority)});
      if(wfFilter.ownership)d=d.filter(function(c){return c.ownership===wfFilter.ownership});
    }
    // Pipeline qualification filter
    if(pipeFilter){d=d.filter(function(c){return qualMap[pipeFilter]&&qualMap[pipeFilter].has(c.id)})}
    d.sort(function(a,b){var av=a[sortK],bv=b[sortK];if(typeof av==="string"){av=av.toLowerCase();bv=bv.toLowerCase()}return sortD==="asc"?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0)});
    return d;
  },[companies,search,segF,cluF,regF,ownF,wfFilter,pipeFilter,qualMap,sortK,sortD]);

  var pg=filtered.slice(page*PS,(page+1)*PS),tp=Math.ceil(filtered.length/PS)||1;
  var hs=function(k){if(sortK===k)setSortD(sortD==="asc"?"desc":"asc");else{setSortK(k);setSortD("desc")}setPage(0)};
  var avgRev=(filtered.reduce(function(s,c){return s+c.revenueBnEur},0)/(filtered.length||1)).toFixed(2);
  var avgScore=(filtered.reduce(function(s,c){return s+c.score},0)/(filtered.length||1)).toFixed(1);
  var npc=filtered.filter(function(c){return c.cluster==="New Prospect"}).length;

  var segItems=SEGMENTS.map(function(s){return{k:s.replace(/ & /g," "),v:filtered.filter(function(c){return c.segment===s}).length}});
  var cluItems=CLUSTERS.map(function(s){return{k:s,v:filtered.filter(function(c){return c.cluster===s}).length}});
  var regItems=REGIONS.map(function(r){return{k:r,v:filtered.filter(function(c){return c.region===r}).length}});
  var segCM={};SEGMENTS.forEach(function(s){segCM[s.replace(/ & /g," ")]=SEGC[s]});

  // Pipeline stats (live)
  var pipeSQL=qualMap.SQL.size,pipeMQL=qualMap.MQL.size,pipeNR=qualMap.NR.size;
  var pipeTotal=pipeSQL+pipeMQL+pipeNR;
  var pipeQualPct=companies.length?Math.round(pipeTotal/companies.length*100):0;

  // Waterfall data
  var wfData=useMemo(function(){
    var t=companies.length;
    var np=companies.filter(function(c){return c.segPriority==="Non-priority"}).length;
    var pr=t-np;
    var nm=companies.filter(function(c){return c.segPriority==="Priority"&&!c.mapped}).length;
    var p2c=companies.filter(function(c){return c.segPriority==="Priority"&&c.mapped&&c.priority.includes("P2")}).length;
    var p1c=companies.filter(function(c){return c.segPriority==="Priority"&&c.mapped&&c.priority.includes("P1")}).length;
    var pubc=companies.filter(function(c){return c.segPriority==="Priority"&&c.mapped&&c.priority.includes("P1")&&c.ownership==="Public"}).length;
    var privc=p1c-pubc;
    return{t:t,np:np,pr:pr,nm:nm,p2c:p2c,p1c:p1c,pubc:pubc,privc:privc};
  },[companies]);

  var wfSteps=useMemo(function(){
    var d=wfData;
    return[
      {l:"All",v:d.t,c:Dk,f:null},
      {l:"Non-prio",v:d.np,c:"#fda4af",f:{segPriority:"Non-priority"}},
      {l:"Priority",v:d.pr,c:"#475569",f:{segPriority:"Priority"}},
      {l:"Not mapped",v:d.nm,c:"#e5e7eb",f:{mapped:false}},
      {l:"P2",v:d.p2c,c:"#fda4af",f:{priority:"P2"}},
      {l:"P1",v:d.p1c,c:"#475569",f:{priority:"P1"}},
      {l:"Public",v:d.pubc,c:"#e5e7eb",f:{ownership:"Public"}},
      {l:"Private",v:d.privc,c:"#be123c",f:{ownership:"Private"}}
    ];
  },[wfData]);

  // Navigate to hunt list with pipe filter
  var goToPipe=function(label){
    setView("table");setPipeFilter(pipeFilter===label?null:label);setWfFilter(null);setPage(0);
  };

  return<div style={{fontFamily:F,background:"#f3f4f6",minHeight:"100vh",color:Dk}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&display=swap" rel="stylesheet"/>
    <style>{`
      @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
      .fade-up{animation:fadeUp .4s cubic-bezier(.4,0,.2,1) both}
      .hover-lift{transition:transform .2s cubic-bezier(.4,0,.2,1),box-shadow .2s}
      .hover-lift:hover{transform:translateY(-3px);box-shadow:0 8px 25px rgba(0,0,0,.1)}
      .row-hover{transition:background .15s}
      .row-hover:hover{background:#eef2ff !important}
      .btn-pop{transition:all .15s cubic-bezier(.4,0,.2,1)}
      .btn-pop:hover{transform:scale(1.04);box-shadow:0 4px 12px rgba(232,119,34,.25)}
      .btn-pop:active{transform:scale(.97)}
      .pill-toggle{transition:all .2s}
      .pill-toggle:hover{transform:translateY(-1px)}
      .wf-bar{transition:height .5s cubic-bezier(.4,0,.2,1),background .2s,opacity .2s}
      .wf-bar:hover{filter:brightness(1.1)}
      .pipe-btn{transition:all .15s;cursor:pointer;border:none;font-family:inherit}
      .pipe-btn:hover{transform:scale(1.06)}
      .pipe-dot{animation:pulse 2s infinite}
    `}</style>
    {panel&&panel.type==="prequal"&&<PrequalPanel co={panel.co} store={store} onClose={function(){setPanel(null)}}/>}
    {panel&&panel.type==="prospect"&&<ProspectPanel co={panel.co} store={store} onClose={function(){setPanel(null)}}/>}

    {/* ══ HEADER ══ */}
    <header style={{background:"linear-gradient(135deg,"+Dk+" 0%,#2d3748 100%)",padding:"10px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap",boxShadow:"0 2px 12px rgba(0,0,0,.15)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,"+P+",#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:15,boxShadow:"0 2px 8px rgba(232,119,34,.4)"}}>A</div>
        <div><div style={{fontSize:14,fontWeight:800,color:"#fff"}}>ATALIAN <span style={{fontWeight:400,opacity:.5}}>Poland</span></div><div style={{fontSize:9,color:"rgba(255,255,255,.3)"}}>Sales Excellence · Pipeline Management</div></div>
      </div>

      {/* ── Live Pipeline Stats — CLICKABLE ── */}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:12,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)"}}>
          <span style={{fontSize:10,color:"rgba(255,255,255,.4)",fontWeight:600}}>Pipeline</span>
          {[{label:"SQL",count:pipeSQL,color:"#16a34a",glow:"rgba(22,163,106,.5)",text:"#86efac"},{label:"MQL",count:pipeMQL,color:"#f59e0b",glow:"rgba(245,158,11,.5)",text:"#fcd34d"},{label:"NR",count:pipeNR,color:"#ef4444",glow:"rgba(239,68,68,.5)",text:"#fca5a5"}].map(function(p,i){
            var isActive=pipeFilter===p.label;
            return<span key={p.label} style={{display:"contents"}}>{i>0&&<div style={{width:1,height:14,background:"rgba(255,255,255,.1)"}}/>}
              <button className="pipe-btn" onClick={function(){goToPipe(p.label)}} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:8,background:isActive?p.color+"30":"transparent"}}>
                <span className="pipe-dot" style={{width:8,height:8,borderRadius:20,background:p.color,boxShadow:"0 0 6px "+p.glow,animationDelay:i*.3+"s"}}/>
                <span style={{fontSize:13,fontWeight:800,color:p.text}}>{p.count}</span>
                <span style={{fontSize:8,color:isActive?"#fff":"rgba(255,255,255,.3)",fontWeight:isActive?700:400}}>{p.label}</span>
              </button>
            </span>
          })}
          {pipeFilter&&<button onClick={function(){setPipeFilter(null)}} style={{marginLeft:4,padding:"1px 6px",borderRadius:6,border:"none",background:"rgba(255,255,255,.15)",color:"rgba(255,255,255,.6)",fontSize:9,cursor:"pointer",fontFamily:F}}>✕</button>}
          <div style={{width:1,height:14,background:"rgba(255,255,255,.1)"}}/>
          <span style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{pipeQualPct}%</span>
        </div>
        <div style={{width:80,height:6,borderRadius:20,background:"rgba(255,255,255,.08)",overflow:"hidden",display:"flex"}}>
          {pipeSQL>0&&<div style={{flex:pipeSQL,background:"#16a34a",transition:"flex .6s"}}/>}
          {pipeMQL>0&&<div style={{flex:pipeMQL,background:"#f59e0b",transition:"flex .6s"}}/>}
          {pipeNR>0&&<div style={{flex:pipeNR,background:"#ef4444",transition:"flex .6s"}}/>}
          <div style={{flex:Math.max(companies.length-pipeTotal,1),background:"transparent"}}/>
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",gap:3,background:"rgba(255,255,255,.05)",borderRadius:10,padding:3}}>
        {[{id:"dashboard",lb:"📊 Dashboard"},{id:"table",lb:"📋 Hunt List"},{id:"guide",lb:"📖 Guide"}].map(function(v){return<button key={v.id} onClick={function(){setView(v.id);setPage(0);if(v.id==="dashboard"){setPipeFilter(null);setWfFilter(null)}}} className="btn-pop" style={{padding:"6px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:F,background:view===v.id?P:"transparent",color:view===v.id?"#fff":"rgba(255,255,255,.5)"}}>{v.lb}</button>})}
      </div>
    </header>

    <main style={{padding:"18px 24px 36px",maxWidth:1400,margin:"0 auto"}}>
      {/* KPI bar */}
      {view!=="guide"&&<div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:18}}>
        <KPI label="Companies" value={filtered.length} sub={pipeFilter?"filtered by "+pipeFilter:"in scope"} accent={Dk} delay={0}/>
        <KPI label="New Prospects" value={npc} sub={(npc/(filtered.length||1)*100).toFixed(0)+"%"} accent={P} delay={50}/>
        <KPI label="Avg Revenue" value={avgRev+"bn€"} sub="per company" accent="#16a34a" delay={100}/>
        <KPI label="Avg Score" value={avgScore+"/5"} sub="prioritization" accent="#2563eb" delay={150}/>
      </div>}

      {/* ══ DASHBOARD ══ */}
      {view==="dashboard"?<div className="fade-up">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div className="hover-lift" style={Object.assign({},cd,{padding:"18px 20px"})}>
            <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:800}}>Pipeline Funnel</h3>
            <p style={{margin:"0 0 8px",fontSize:10,color:"#9ca3af"}}>How the total universe narrows to your target scope — from all active NIP codes down to private P1 companies</p>
            <Waterfall total={wfData.t} nonPrio={wfData.np} prio={wfData.pr} notMapped={wfData.nm} p2={wfData.p2c} p1={wfData.p1c} pub={wfData.pubc} priv={wfData.privc}/>
          </div>
          <div className="hover-lift" style={Object.assign({},cd,{padding:"18px 20px"})}>
            <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:800}}>By Segment</h3>
            <p style={{margin:"0 0 8px",fontSize:10,color:"#9ca3af"}}>Number of companies per industry vertical</p>
            <HBar items={segItems} colorMap={segCM}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div className="hover-lift" style={Object.assign({},cd,{padding:"18px 20px"})}>
            <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:800}}>By Cluster</h3>
            <p style={{margin:"0 0 8px",fontSize:10,color:"#9ca3af"}}>Split between new prospects and existing clients</p>
            <MiniDonut items={cluItems} colorMap={CLUC}/>
          </div>
          <div className="hover-lift" style={Object.assign({},cd,{padding:"18px 20px"})}>
            <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:800}}>By Region</h3>
            <p style={{margin:"0 0 8px",fontSize:10,color:"#9ca3af"}}>Geographic distribution across Poland</p>
            <HBar items={regItems} colorMap={REGC}/>
          </div>
        </div>
        {/* Custom Chart Builder */}
        <div className="fade-up hover-lift" style={{animationDelay:"100ms"}}>
          <ChartBuilder companies={companies}/>
        </div>
      </div>:

      /* ══ GUIDE ══ */
      view==="guide"?<div className="fade-up" style={{maxWidth:800,margin:"0 auto"}}>
        <div style={Object.assign({},cd,{padding:"32px 36px",marginBottom:16})}>
          <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:900,color:Dk}}>📖 How to Use This Tool</h2>
          <p style={{margin:0,fontSize:13,color:"#6b7280"}}>A step-by-step guide to the Atalian Poland Sales Excellence platform</p>
        </div>
        {[
          {n:1,bg:Dk,t:"Dashboard — Monitor Your Pipeline",p:"The Dashboard is your starting point with visual overview charts.",items:["Pipeline Funnel waterfall shows how companies narrow to your scope","Custom Analysis lets you pick any metric, dimension and chart type","All charts are dynamic and reflect current data"]},
          {n:2,bg:P,t:"Hunt List — Your Target Companies",p:"Central database of all target companies in Poland.",items:["Filter by Segment, Cluster, Region, Ownership","Click Pipeline badges (SQL/MQL/NR) in header to filter by qualification","Pipeline Filter waterfall above table for scope filtering","Sort any column, show/hide columns with pill toggles","Double-click any cell to edit"]},
          {n:3,bg:"#e11d48",t:"Pre-qualification — Score Your Prospects",p:"Hover any row and click 🎯 Pre-qual to score the prospect.",items:["7 criteria across Strategic Fit, Operational Fit, Lead Quality","Weighted score → SQL (≥3.8) / MQL (≥2.5) / NR (<2.5)","Pipeline stats in header update in real time","Expand suggested questions to guide your call"]},
          {n:4,bg:"#2563eb",t:"Prospect File — Track Interactions",p:"Click 📋 Prospect to open the structured interaction tracker.",items:["4 sections: General, Before/During/After Interaction","Pre-filled with hunt list data","All saved automatically in browser"]}
        ].map(function(sec,i){return<div key={i} className="fade-up" style={Object.assign({},cd,{padding:"24px 28px",marginBottom:14,animationDelay:i*50+"ms"})}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{width:32,height:32,borderRadius:20,background:sec.bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14}}>{sec.n}</div><h3 style={{margin:0,fontSize:16,fontWeight:800,color:Dk}}>{sec.t}</h3></div>
          <p style={{margin:"0 0 8px",fontSize:13,color:"#374151",lineHeight:1.7}}>{sec.p}</p>
          <ul style={{margin:"8px 0",paddingLeft:20,fontSize:13,color:"#374151",lineHeight:2}}>{sec.items.map(function(it,j){return<li key={j}>{it}</li>})}</ul>
        </div>})}
      </div>:

      /* ══ HUNT LIST ══ */
      <div className="fade-up">
        {/* Active filter indicator */}
        {pipeFilter&&<div className="fade-up" style={Object.assign({},cd,{padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:8,borderLeft:"3px solid "+(pipeFilter==="SQL"?"#16a34a":pipeFilter==="MQL"?"#f59e0b":"#ef4444")})}>
          <span style={{fontSize:11,fontWeight:700,color:Dk}}>Showing {pipeFilter} prospects only</span>
          <span style={{fontSize:11,color:"#9ca3af"}}>({filtered.length} companies)</span>
          <button onClick={function(){setPipeFilter(null)}} className="btn-pop" style={{marginLeft:"auto",padding:"3px 12px",borderRadius:20,border:"1px solid #e5e7eb",background:"#fff",color:"#6b7280",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:F}}>✕ Show all</button>
        </div>}

        {/* Mini Pipeline Waterfall */}
        <div className="fade-up" style={Object.assign({},cd,{padding:"14px 20px",marginBottom:10})}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <h3 style={{margin:0,fontSize:13,fontWeight:800,color:Dk}}>🔻 Pipeline Filter</h3>
            <span style={{fontSize:10,color:"#9ca3af"}}>Click a bar to filter</span>
            {wfFilter&&<button onClick={function(){setWfFilter(null)}} className="btn-pop" style={{marginLeft:"auto",padding:"3px 12px",borderRadius:20,border:"1px solid "+P,background:P+"10",color:P,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:F}}>✕ Clear</button>}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"flex-end",height:65}}>
            {wfSteps.map(function(s,i){
              var isActive=wfFilter&&JSON.stringify(wfFilter)===JSON.stringify(s.f);
              var max=Math.max.apply(null,wfSteps.map(function(x){return x.v}))||1;
              return<div key={i} onClick={function(){if(s.f===null&&wfFilter===null)return;setWfFilter(JSON.stringify(wfFilter)===JSON.stringify(s.f)?null:s.f);setPage(0)}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:s.f!==null||wfFilter!==null?"pointer":"default",opacity:wfFilter&&!isActive?.35:1,transition:"opacity .25s"}}>
                <span style={{fontSize:10,fontWeight:800,color:isActive?P:Dk}}>{s.v.toLocaleString()}</span>
                <div className="wf-bar" style={{width:"100%",height:Math.max(s.v/max*44,4),background:isActive?P:s.c,borderRadius:5,boxShadow:isActive?"0 2px 8px rgba(232,119,34,.3)":"none"}}/>
                <span style={{fontSize:8,fontWeight:isActive?800:500,color:isActive?P:"#9ca3af",textAlign:"center",lineHeight:1.1}}>{s.l}</span>
              </div>
            })}
          </div>
        </div>

        {/* Column chooser */}
        <div style={Object.assign({},cd,{padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"})}>
          <span style={{fontSize:11,fontWeight:800,color:Dk}}>📊 Columns</span>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{COLS.map(function(col){var on=visibleCols.includes(col.k);return<button key={col.k} onClick={function(){setVisibleCols(function(prev){return on?prev.filter(function(k){return k!==col.k}):prev.concat([col.k])})}} className="pill-toggle" style={{padding:"3px 10px",borderRadius:20,border:on?"2px solid "+P:"1.5px solid #e5e7eb",background:on?P+"15":"#fff",color:on?P:"#9ca3af",fontSize:10,fontWeight:on?700:500,cursor:"pointer",fontFamily:F}}>{col.l}</button>})}</div>
          <div style={{marginLeft:"auto",display:"flex",gap:4}}>
            <button onClick={function(){setVisibleCols(COLS.map(function(c){return c.k}))}} className="btn-pop" style={{padding:"3px 10px",borderRadius:20,border:"1.5px solid #e5e7eb",background:"#fff",color:"#6b7280",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:F}}>All</button>
            <button onClick={function(){setVisibleCols(["name","segment","prequal","ownership","revenueBnEur","cluster","score","contactName"])}} className="btn-pop" style={{padding:"3px 10px",borderRadius:20,border:"1.5px solid #e5e7eb",background:"#fff",color:"#6b7280",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:F}}>Minimal</button>
          </div>
        </div>

        {/* Search + filters */}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12,alignItems:"center"}}>
          <input placeholder="🔍 Search company or NIP…" value={search} onChange={function(e){setSearch(e.target.value);setPage(0)}} style={Object.assign({},inp,{width:200,background:"#fff",borderColor:search?P:"#e5e7eb",boxShadow:search?"0 0 0 3px rgba(232,119,34,.1)":"none",transition:"all .2s"})}/>
          <select value={segF} onChange={function(e){setSegF(e.target.value);setPage(0)}} style={Object.assign({},inp,{width:"auto",background:"#fff",cursor:"pointer"})}><option value="All">Segment</option>{SEGMENTS.map(function(o){return<option key={o} value={o}>{o}</option>})}</select>
          <select value={cluF} onChange={function(e){setCluF(e.target.value);setPage(0)}} style={Object.assign({},inp,{width:"auto",background:"#fff",cursor:"pointer"})}><option value="All">Cluster</option>{CLUSTERS.map(function(o){return<option key={o} value={o}>{o}</option>})}</select>
          <select value={regF} onChange={function(e){setRegF(e.target.value);setPage(0)}} style={Object.assign({},inp,{width:"auto",background:"#fff",cursor:"pointer"})}><option value="All">Region</option>{REGIONS.map(function(o){return<option key={o} value={o}>{o}</option>})}</select>
          <select value={ownF} onChange={function(e){setOwnF(e.target.value);setPage(0)}} style={Object.assign({},inp,{width:"auto",background:"#fff",cursor:"pointer"})}><option value="All">Ownership</option><option value="Public">Public</option><option value="Private">Private</option></select>
          <span style={{fontSize:10,color:"#9ca3af",marginLeft:"auto",fontWeight:600}}>{filtered.length} results · double-click to edit</span>
        </div>

        {/* Table */}
        <div style={{position:"relative"}}>
          <style>{`
            .hunt-scroll::-webkit-scrollbar{height:10px}
            .hunt-scroll::-webkit-scrollbar-track{background:#f3f4f6;border-radius:10px}
            .hunt-scroll::-webkit-scrollbar-thumb{background:${P};border-radius:10px;border:2px solid #f3f4f6}
            .hunt-scroll::-webkit-scrollbar-thumb:hover{background:#c65a10}
            .hunt-scroll{scrollbar-width:thin;scrollbar-color:${P} #f3f4f6}
            .hunt-top-scroll::-webkit-scrollbar{height:10px}
            .hunt-top-scroll::-webkit-scrollbar-track{background:#f3f4f6;border-radius:10px}
            .hunt-top-scroll::-webkit-scrollbar-thumb{background:${P};border-radius:10px;border:2px solid #f3f4f6}
            .hunt-top-scroll{scrollbar-width:thin;scrollbar-color:${P} #f3f4f6}
          `}</style>
          <div className="hunt-top-scroll" onScroll={function(e){var bot=e.target.parentElement.querySelector('.hunt-scroll');if(bot&&!e.target._lock){bot._lock=true;bot.scrollLeft=e.target.scrollLeft;setTimeout(function(){bot._lock=false},20)}}} style={{overflowX:"scroll",overflowY:"hidden",marginBottom:4}}><div style={{height:1,width:3200}}/></div>
          <div style={Object.assign({},cd,{overflow:"hidden"})}>
            <div className="hunt-scroll" onScroll={function(e){var top=e.target.parentElement.parentElement.querySelector('.hunt-top-scroll');if(top&&!e.target._lock){top._lock=true;top.scrollLeft=e.target.scrollLeft;setTimeout(function(){top._lock=false},20)}}} style={{overflowX:"scroll",overflowY:"visible",paddingBottom:2}}>
              <table style={{width:"max-content",minWidth:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>{COLS.filter(function(c){return visibleCols.includes(c.k)}).map(function(c){return<th key={c.k} onClick={function(){hs(c.k)}} style={{padding:"9px 12px",textAlign:"left",fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:sortK===c.k?P:"#9ca3af",borderBottom:"2px solid "+(sortK===c.k?P+"30":"#f0f0f5"),cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",minWidth:c.w,background:"#fafafa",position:"sticky",top:0,zIndex:2,transition:"color .15s"}}>{c.l}{sortK===c.k?(sortD==="asc"?" ↑":" ↓"):""}</th>})}<th style={{position:"sticky",right:0,background:"#fafafa",borderBottom:"2px solid #f0f0f5",minWidth:180,zIndex:3,padding:"9px 12px",fontSize:9,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".08em"}}>Actions</th></tr></thead>
                <tbody>{pg.map(function(c,i){var q=store.qual(c.id);var hf=store.hasFile(c.id);var isH=hovRow===c.id;
                  var qualBg=q?(q.label==="SQL"?"#f0fdf4":q.label==="MQL"?"#fffbeb":"#fef2f2"):"transparent";
                  var baseBg=i%2===0?"#fff":"#fafafa";
                  var bg=isH?"#eef2ff":q?qualBg:baseBg;
                  var leftBorder=q?(q.label==="SQL"?"3px solid #16a34a":q.label==="MQL"?"3px solid #f59e0b":"3px solid #ef4444"):"3px solid transparent";
                  function renderCell(col){
                    var v=c[col.k];
                    if(col.k==="name")return<div style={{display:"flex",alignItems:"center"}}><EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} render={function(x){return<span style={{fontWeight:700,color:Dk}}>{x}</span>}}/>{hf&&<span style={{marginLeft:3,fontSize:9,color:P}}>📋</span>}</div>;
                    if(col.k==="prequal")return q?<span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,background:q.bg,color:q.color}}>{q.label}</span>:<span style={{fontSize:10,color:"#d1d5db"}}>—</span>;
                    if(col.k==="cluster")return<EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} options={CLUSTERS} render={function(x){return<ClBadge s={x}/>}}/>;
                    if(col.k==="segment")return<EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} options={SEGMENTS} render={function(x){return<span style={{display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:3,background:SEGC[x]||"#ccc",flexShrink:0}}/>{x}</span>}}/>;
                    if(col.k==="segPriority")return<EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} options={["Priority","Non-priority"]} render={function(x){return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:x==="Priority"?"#dcfce7":"#f3f4f6",color:x==="Priority"?"#166534":"#9ca3af"}}>{x}</span>}}/>;
                    if(col.k==="mapped")return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:v?"#dbeafe":"#fee2e2",color:v?"#1e40af":"#991b1b"}}>{v?"Yes":"No"}</span>;
                    if(col.k==="priority")return<EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} options={["P1 - High priority","P2 - Opportunistic"]} render={function(x){var p1=x.includes("P1");return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:p1?P:"#f3f4f6",color:p1?"#fff":"#6b7280"}}>{p1?"P1 — High":"P2 — Opp."}</span>}}/>;
                    if(col.k==="region")return<EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} options={REGIONS}/>;
                    if(col.k==="ownership")return<EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} options={["Public","Private"]} render={function(x){return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:x==="Public"?"#dbeafe":"#f3e8ff",color:x==="Public"?"#1e40af":"#7c3aed"}}>{x}</span>}}/>;
                    if(col.k==="outsourcingPropensity")return<EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} options={[4.75,5]} render={function(x){return<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:Number(x)>=5?"#dcfce7":"#fef3c7",color:Number(x)>=5?"#166534":"#92400e"}}>{x}</span>}}/>;
                    if(col.k==="score")return<EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} type="number" render={function(x){var sc=Number(x);return<span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:800,background:sc>=4?"#dcfce7":sc>=3?"#fef3c7":"#fee2e2",color:sc>=4?"#166534":sc>=3?"#92400e":"#991b1b"}}>{sc.toFixed(1)}</span>}}/>;
                    if(col.k==="profitPct")return<EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} type="number" render={function(x){var pv=Number(x);return<span style={{fontWeight:600,fontVariantNumeric:"tabular-nums",color:pv>=30?"#166534":pv>=15?P:"#6b7280"}}>{pv.toFixed(1)}%</span>}}/>;
                    if(col.k==="potentialSpendMEur")return<EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} type="number" render={function(x){return<span style={{fontWeight:700,color:P,fontVariantNumeric:"tabular-nums"}}>{Number(x).toFixed(2)}</span>}}/>;
                    if(typeof v==="number")return<EditCell value={v} onSave={function(x){updateCo(c.id,col.k,x)}} type="number" render={function(x){return<span style={{fontVariantNumeric:"tabular-nums",color:"#374151"}}>{typeof x==="number"&&x>1000000?(Number(x)/1000000000).toFixed(2)+"B":Number(x).toLocaleString(undefined,{maximumFractionDigits:2})}</span>}}/>;
                    return<EditCell value={v||""} onSave={function(x){updateCo(c.id,col.k,x)}}/>;
                  }
                  return<tr key={c.id} className="row-hover" style={{background:bg,borderLeft:leftBorder,transition:"background .15s"}} onMouseEnter={function(){setHovRow(c.id)}} onMouseLeave={function(){setHovRow(null)}}>
                    {COLS.filter(function(col){return visibleCols.includes(col.k)}).map(function(col){return<td key={col.k} style={{padding:"8px 12px",borderBottom:"1px solid #f0f0f5",whiteSpace:"nowrap",color:"#374151"}}>{renderCell(col)}</td>})}
                    <td style={{position:"sticky",right:0,background:bg,borderBottom:"1px solid #f0f0f5",padding:"8px 10px",zIndex:3,boxShadow:"-4px 0 8px rgba(0,0,0,.04)",transition:"background .15s"}}>
                      <div style={{display:"flex",gap:4,opacity:isH?1:0,transition:"opacity .2s,transform .15s",transform:isH?"translateX(0)":"translateX(8px)"}}>
                        <button onClick={function(){setPanel({type:"prequal",co:c})}} className="btn-pop" style={{padding:"5px 12px",borderRadius:8,border:"none",background:P,color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:F}}>🎯 Pre-qual</button>
                        <button onClick={function(){setPanel({type:"prospect",co:c})}} className="btn-pop" style={{padding:"5px 12px",borderRadius:8,border:"none",background:Dk,color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:F}}>📋 Prospect</button>
                      </div>
                    </td>
                  </tr>})}</tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Pagination */}
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:6,marginTop:12}}>
          <button disabled={page===0} onClick={function(){setPage(page-1)}} className="btn-pop" style={{padding:"5px 14px",borderRadius:8,border:"1px solid #e5e7eb",background:page===0?"#f3f4f6":"#fff",cursor:page===0?"default":"pointer",fontSize:11,fontFamily:F,color:page===0?"#d1d5db":Dk,fontWeight:700}}>←</button>
          <span style={{fontSize:11,color:"#6b7280",fontWeight:700}}>{page+1} / {tp}</span>
          <button disabled={page>=tp-1} onClick={function(){setPage(page+1)}} className="btn-pop" style={{padding:"5px 14px",borderRadius:8,border:"1px solid #e5e7eb",background:page>=tp-1?"#f3f4f6":"#fff",cursor:page>=tp-1?"default":"pointer",fontSize:11,fontFamily:F,color:page>=tp-1?"#d1d5db":Dk,fontWeight:700}}>→</button>
        </div>
      </div>}
    </main>
    <footer style={{textAlign:"center",padding:12,fontSize:10,color:"#9ca3af"}}><b style={{color:P}}>ATALIAN</b> × <b>Simon-Kucher</b> · Sales Excellence · Poland</footer>
  </div>;
}
