import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import ReactDOM from 'react-dom/client'

// Init Telegram WebApp
const tg = window.Telegram?.WebApp
if (tg) { tg.ready(); tg.expand() }

// ── THEME ─────────────────────────────────────────────────────────────────
const ThemeCtx = createContext()
const useTheme = () => useContext(ThemeCtx)

function makeTheme(dark) {
  if (dark) return {
    bg:'#0A0A0A',bg2:'#111111',card:'#161616',card2:'#1C1C1C',
    text:'#F0F0F0',text2:'#777',muted:'#2A2A2A',
    border:'rgba(255,255,255,0.07)',
    lime:'#C8F135',limeDim:'rgba(200,241,53,0.10)',
    error:'#FF5555',success:'#4ADE80',warn:'#FBBF24',
    navBg:'#0A0A0A',navBorder:'rgba(255,255,255,0.06)',navIcon:'#444',navActive:'#C8F135',
    plusBg:'#C8F135',plusIcon:'#0A0A0A',plusShadow:'rgba(200,241,53,0.30)',
    summaryBg:'linear-gradient(140deg,#141a05 0%,#111111 100%)',
    summaryBorder:'rgba(200,241,53,0.20)',summaryAmt:'#C8F135',
    drawerBg:'#0D0D0D',chipBg:'#1A1A1A',chipBorder:'rgba(255,255,255,0.08)',chipText:'#666',
    toggleOff:'#222',toggleOn:'#C8F135',toggleThumb:'#0A0A0A',
    btnBg:'#C8F135',btnText:'#0A0A0A',cardShadow:'none',dark:true,
  }
  return {
    bg:'#F5F4EE',bg2:'#EFEDE5',card:'#FBFAF6',card2:'#F3F1E8',
    text:'#151515',text2:'#6D6D68',muted:'#C8C4BA',
    border:'rgba(0,0,0,0.055)',
    lime:'#93C01F',limeDim:'#EEF5D7',
    error:'#D95B52',success:'#76A80F',warn:'#C58B1A',
    navBg:'#F8F6EF',navBorder:'rgba(0,0,0,0.05)',navIcon:'#9A978F',navActive:'#93C01F',
    plusBg:'#93C01F',plusIcon:'#ffffff',plusShadow:'rgba(147,192,31,0.35)',
    summaryBg:'linear-gradient(140deg,#EEF3DD 0%,#F5F8E8 100%)',
    summaryBorder:'#D9E7AE',summaryAmt:'#7FAE12',
    drawerBg:'#F6F4EC',chipBg:'#F1EFE8',chipBorder:'#E4E0D4',chipText:'#67645E',
    toggleOff:'#E6E2D8',toggleOn:'#CDE57B',toggleThumb:'#FFFFFF',
    btnBg:'#93C01F',btnText:'#ffffff',cardShadow:'0 1px 8px rgba(0,0,0,0.05)',dark:false,
  }
}

// ── DATA ──────────────────────────────────────────────────────────────────
const INIT_CLIENTS = [
  {id:1,name:'Азиз',goal:'Набрать 5 кг мышц',type:'personal',plan:'16 трен.',price:1400000,total:16,used:10,remaining:6,start:'2025-04-10',end:'2025-05-10',paid:true,note:'Предпочитает утро',time:'08:00',history:[]},
  {id:2,name:'Камила',goal:'Похудеть к лету',type:'personal',plan:'16 трен.',price:1400000,total:16,used:14,remaining:2,start:'2025-04-12',end:'2025-05-12',paid:true,note:'',time:'09:00',history:[]},
  {id:3,name:'Тимур',goal:'Общая физическая форма',type:'group',plan:'16 трен.',price:400000,total:16,used:5,remaining:11,start:'2025-04-15',end:'2025-05-15',paid:true,note:'',time:'19:00',history:[]},
  {id:4,name:'Нилуфар',goal:'Выносливость',type:'group',plan:'10 трен.',price:300000,total:10,used:8,remaining:2,start:'2025-04-20',end:'2025-05-20',paid:false,note:'Напомнить об оплате',time:'19:00',history:[]},
  {id:5,name:'Дилшод',goal:'Снизить вес на 10 кг',type:'personal',plan:'16 трен.',price:1400000,total:16,used:3,remaining:13,start:'2025-05-01',end:'2025-05-31',paid:true,note:'',time:'10:00',history:[]},
  {id:6,name:'Малика',goal:'Укрепить кор',type:'group',plan:'16 трен.',price:400000,total:16,used:16,remaining:0,start:'2025-04-01',end:'2025-05-01',paid:true,note:'Предложить продление',time:'11:00',history:[]},
]
const ATTENDANCE = {Пн:12,Вт:9,Ср:0,Чт:15,Пт:0,Сб:18,Вс:0}
const fmtS = n => n.toLocaleString('ru-RU') + ' сум'
const getScreenKey = s => typeof s === 'string' ? s : (s && s.screen) ? s.screen : 'home'

function daysUntil(d) {
  if (!d) return 999
  const t = new Date(), e = new Date(d)
  t.setHours(0,0,0,0); e.setHours(0,0,0,0)
  return Math.ceil((e-t)/86400000)
}
function getStatus(c) {
  if (!c.paid) return 'unpaid'
  const dl = daysUntil(c.end)
  if (c.remaining<=0||dl<0) return 'expired'
  if (c.remaining<=3||dl<=5) return 'ending_soon'
  return 'active'
}
function calcFinance(clients) {
  const RENT=1000000,paid=clients.filter(c=>c.paid),unpaid=clients.filter(c=>!c.paid)
  const pInc=paid.filter(c=>c.type==='personal').reduce((a,c)=>a+c.price,0)
  const gInc=paid.filter(c=>c.type==='group').reduce((a,c)=>a+c.price,0)
  const gross=pInc+gInc
  return {RENT,gross,net:gross-RENT,pInc,gInc,
    unpaidAmt:unpaid.reduce((a,c)=>a+c.price,0),unpaidCount:unpaid.length,
    endingSoon:clients.filter(c=>getStatus(c)==='ending_soon').length,
    expired:clients.filter(c=>getStatus(c)==='expired').length,
    pCount:clients.filter(c=>c.type==='personal').length,
    gCount:clients.filter(c=>c.type==='group').length}
}

// ── ICONS ─────────────────────────────────────────────────────────────────
function Icon({name,size=22,color}){
  const {T}=useTheme();const c=color||T.text2
  const s={stroke:c,strokeWidth:'1.6',strokeLinecap:'round',strokeLinejoin:'round',fill:'none'}
  const p={
    home:<><path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z"{...s}/><path d="M9 22V13h6v9"{...s}/></>,
    clients:<><circle cx="9"cy="7"r="3.5"{...s}/><path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6"{...s}/><circle cx="18"cy="8"r="2.5"strokeWidth="1.4"{...s}/><path d="M22 20c0-2.761-1.79-5-4-5"strokeWidth="1.4"{...s}/></>,
    calendar:<><rect x="3"y="5"width="18"height="17"rx="3"{...s}/><path d="M3 10h18M8 3v4M16 3v4"{...s}/><circle cx="8.5"cy="15"r="1.2"fill={c}/><circle cx="12"cy="15"r="1.2"fill={c}/><circle cx="15.5"cy="15"r="1.2"fill={c}/></>,
    analytics:<><path d="M4 20V14M8 20V9M12 20V12M16 20V6M20 20V4M3 20h18"{...s}/></>,
    settings:<><circle cx="12"cy="12"r="3"{...s}/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"strokeWidth="1.4"{...s}/></>,
    bell:<><path d="M6 10a6 6 0 1112 0c0 3.5 1.5 5.5 2.5 7H3.5C4.5 15.5 6 13.5 6 10z"{...s}/><path d="M10 19a2 2 0 004 0"{...s}/></>,
    menu:<><path d="M4 7h16M4 12h10M4 17h7"{...s}/></>,
    back:<><path d="M19 12H5M5 12l6-6M5 12l6 6"{...s}/></>,
    check:<path d="M5 13l4 4L19 7"stroke={c}strokeWidth="2.1"strokeLinecap="round"strokeLinejoin="round"fill="none"/>,
    clock:<><circle cx="12"cy="12"r="9"{...s}/><path d="M12 7v5l3 3"{...s}/></>,
    plus:<path d="M12 4v16M4 12h16"stroke={c}strokeWidth="2.2"strokeLinecap="round"fill="none"/>,
    arrow:<path d="M5 12h14M13 6l6 6-6 6"stroke={c}strokeWidth="1.8"strokeLinecap="round"strokeLinejoin="round"fill="none"/>,
    close:<path d="M18 6L6 18M6 6l12 12"stroke={c}strokeWidth="1.6"strokeLinecap="round"fill="none"/>,
    star:<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"{...s}/>,
    wallet:<><rect x="2"y="7"width="20"height="14"rx="3"{...s}/><path d="M16 14h.01M2 11h20M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2"{...s}/></>,
    person:<><circle cx="12"cy="8"r="4"{...s}/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"{...s}/></>,
    renew:<><path d="M4 12a8 8 0 018-8 8 8 0 017.4 5M20 12a8 8 0 01-8 8 8 8 0 01-7.4-5"{...s}/><path d="M16 7h4V3M8 17H4v4"{...s}/></>,
    logout:<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"{...s}/></>,
    sun:<><circle cx="12"cy="12"r="4"{...s}/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"strokeWidth="1.4"{...s}/></>,
    moon:<path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"{...s}/>,
    edit:<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"{...s}/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"{...s}/></>,
  }
  return <svg width={size}height={size}viewBox="0 0 24 24">{p[name]||null}</svg>
}

// ── BASE UI ───────────────────────────────────────────────────────────────
function Card({children,style={},onClick}){
  const {T}=useTheme();const[pr,setPr]=useState(false)
  return <div onClick={onClick} onPointerDown={()=>setPr(true)} onPointerUp={()=>setPr(false)} onPointerLeave={()=>setPr(false)}
    style={{background:T.card,borderRadius:20,padding:'15px 17px',border:`1px solid ${T.border}`,boxShadow:T.cardShadow,...style,
      cursor:onClick?'pointer':'default',transform:pr&&onClick?'scale(0.974)':'scale(1)',
      transition:'transform 0.17s cubic-bezier(0.34,1.56,0.64,1),background 0.35s'}}>{children}</div>
}
function Avatar({name,size=42,lime}){
  const {T}=useTheme()
  return <div style={{width:size,height:size,borderRadius:'50%',background:lime?T.limeDim:'rgba(128,128,128,0.09)',
    border:`1.5px solid ${lime?T.lime+'44':T.border}`,display:'flex',alignItems:'center',justifyContent:'center',
    fontSize:size*.38,fontWeight:700,color:lime?T.lime:T.text2,flexShrink:0}}>{name.charAt(0)}</div>
}
function Badge({status}){
  const {T}=useTheme()
  const cfg={active:{l:'Активен',c:T.success,b:T.success+'18'},ending_soon:{l:'Скоро конец',c:T.warn,b:T.warn+'1A'},expired:{l:'Истёк',c:T.error,b:T.error+'18'},unpaid:{l:'Не оплачено',c:T.error,b:T.error+'18'}}
  const s=cfg[status]||cfg.active
  return <span style={{fontSize:11,fontWeight:600,color:s.c,background:s.b,padding:'3px 9px',borderRadius:20,whiteSpace:'nowrap'}}>{s.l}</span>
}
function Bar({used,total,color}){
  const {T}=useTheme()
  return <div style={{height:3,background:T.muted+'55',borderRadius:2,overflow:'hidden',marginTop:8}}>
    <div style={{width:`${Math.min(100,(used/total)*100)}%`,height:'100%',background:color||T.lime,borderRadius:2,transition:'width 0.6s cubic-bezier(0.34,1.56,0.64,1)'}}/>
  </div>
}
function Toggle({on,onToggle}){
  const {T}=useTheme()
  return <div onClick={onToggle} style={{width:46,height:26,borderRadius:13,background:on?T.toggleOn:T.toggleOff,position:'relative',cursor:'pointer',transition:'background 0.3s',flexShrink:0,border:`1px solid ${T.border}`}}>
    <div style={{position:'absolute',top:3,left:on?21:3,width:20,height:20,borderRadius:'50%',background:T.toggleThumb,transition:'left 0.28s cubic-bezier(0.34,1.56,0.64,1)'}}/>
  </div>
}
function TopBar({title,onMenu,onBell,badge,back=false,onBack}){
  const {T}=useTheme()
  const handleLeft=()=>{if(back&&onBack){onBack();return}if(!back&&onMenu)onMenu()}
  return <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px 0',flexShrink:0}}>
    <button onClick={handleLeft} style={{width:40,height:40,borderRadius:'50%',background:T.card2,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <Icon name={back?'back':'menu'} size={20}/>
    </button>
    <span style={{fontSize:15,fontWeight:700,color:T.text}}>{title}</span>
    <button onClick={()=>onBell&&onBell()} style={{width:40,height:40,borderRadius:'50%',background:T.card2,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
      <Icon name="bell" size={20}/>
      {badge>0&&<span style={{position:'absolute',top:7,right:7,width:8,height:8,borderRadius:'50%',background:T.error,border:`1.5px solid ${T.bg}`}}/>}
    </button>
  </div>
}
function BackButton({onBack}){
  const {T}=useTheme()
  return <button onClick={onBack} style={{width:40,height:40,borderRadius:'50%',background:T.card2,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
    <Icon name="back" size={20}/>
  </button>
}
function FinanceCard({finance}){
  const {T}=useTheme();const{gross,net,RENT,pInc,gInc,unpaidAmt,unpaidCount}=finance
  return <Card style={{background:T.summaryBg,borderColor:T.summaryBorder,marginBottom:10}}>
    <div style={{fontSize:10,color:T.text2,letterSpacing:'0.16em',marginBottom:4}}>ЧИСТЫМИ / МЕСЯЦ</div>
    <div style={{fontSize:32,fontWeight:800,color:T.summaryAmt,letterSpacing:'-0.02em',marginBottom:12}}>{fmtS(net)}</div>
    <div style={{height:1,background:T.border,marginBottom:12}}/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
      {[{l:'ДОХОД',v:fmtS(gross),c:T.text},{l:'АРЕНДА',v:'-'+fmtS(RENT),c:T.error},{l:'НЕ ОПЛАЧЕНО',v:unpaidCount>0?fmtS(unpaidAmt):'-',c:unpaidCount>0?T.warn:T.text2}].map((r,i)=>(
        <div key={i}><div style={{fontSize:9,color:T.text2,letterSpacing:'0.1em',marginBottom:3}}>{r.l}</div><div style={{fontSize:12,fontWeight:700,color:r.c,lineHeight:1.2}}>{r.v}</div></div>
      ))}
    </div>
    <div style={{height:1,background:T.border,marginBottom:10}}/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
      {[{l:'ПЕРСОНАЛЬНЫЕ',v:fmtS(pInc),c:T.lime},{l:'ГРУППА',v:fmtS(gInc),c:'#6B94D6'}].map((r,i)=>(
        <div key={i}><div style={{fontSize:9,color:T.text2,letterSpacing:'0.1em',marginBottom:3}}>{r.l}</div><div style={{fontSize:13,fontWeight:700,color:r.c}}>{r.v}</div></div>
      ))}
    </div>
  </Card>
}

// ── SCREENS ───────────────────────────────────────────────────────────────
function Dashboard({clients,go,onMenu,onBell,badge}){
  const {T}=useTheme();const finance=calcFinance(clients)
  const maxA=Math.max(...Object.values(ATTENDANCE))
  const alerts=clients.filter(c=>!c.paid||c.remaining<=2||c.remaining===0)
  const today=clients.filter(c=>c.type==='personal'&&c.remaining>0).slice(0,2)
    .map(c=>({time:c.time,type:'PERSONAL',name:c.name}))
    .concat([{time:'19:00',type:'GROUP',name:'CROSSFIT BURN'}])
    .sort((a,b)=>a.time.localeCompare(b.time))
  return <div style={{flex:1,overflowY:'auto',padding:'0 18px 20px'}}>
    <TopBar title="burn•60" onMenu={onMenu} onBell={onBell} badge={badge}/>
    <div style={{margin:'22px 0 18px'}}>
      <div style={{fontSize:11,color:T.text2,letterSpacing:'0.18em',marginBottom:5}}>МОЯ СИСТЕМА</div>
      <div style={{fontSize:34,fontWeight:800,color:T.text,lineHeight:1.1,letterSpacing:'-0.02em'}}>Тренер<br/>на аренде</div>
    </div>
    <FinanceCard finance={finance}/>
    <div style={{display:'flex',gap:7,marginBottom:16,overflowX:'auto',paddingBottom:2}}>
      {[{l:`${clients.length} клиентов`,c:T.chipText,bg:T.chipBg,bdr:T.chipBorder},{l:`${finance.unpaidCount} не оплатили`,c:T.warn,bg:T.dark?'rgba(197,139,26,0.12)':'#F8ECD2',bdr:'transparent'},{l:`${finance.endingSoon} скоро конец`,c:T.warn,bg:T.dark?'rgba(197,139,26,0.10)':'#F8ECD2',bdr:'transparent'},{l:`${finance.expired} истёк`,c:T.error,bg:T.dark?'rgba(217,91,82,0.12)':'#F7DDD8',bdr:'transparent'}].map((p,i)=>(
        <div key={i} style={{flexShrink:0,padding:'5px 12px',borderRadius:20,background:p.bg,border:`1px solid ${p.bdr}`}}>
          <span style={{fontSize:12,fontWeight:600,color:p.c}}>{p.l}</span>
        </div>
      ))}
    </div>
    {alerts.length>0&&<>
      <div style={{fontSize:11,fontWeight:700,color:T.text2,letterSpacing:'0.1em',marginBottom:8}}>УВЕДОМЛЕНИЯ</div>
      {alerts.slice(0,3).map((c,i)=>(
        <div key={i} onClick={()=>go({screen:'detail',client:c},'forward')} style={{display:'flex',alignItems:'center',gap:10,background:T.card,borderRadius:14,padding:'11px 14px',marginBottom:6,border:`1px solid ${T.border}`,cursor:'pointer'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:!c.paid?T.error:T.warn,flexShrink:0}}/>
          <span style={{fontSize:13,color:T.text,flex:1}}>{!c.paid?`${c.name}: не оплачен`:c.remaining===0?`${c.name}: абонемент истёк`:`${c.name}: осталось ${c.remaining} трен.`}</span>
          <Icon name="arrow" size={16}/>
        </div>
      ))}
    </>}
    <div style={{margin:'14px 0 8px'}}>
      <div style={{fontSize:11,fontWeight:700,color:T.text2,letterSpacing:'0.1em',marginBottom:8}}>СЕГОДНЯ</div>
      {today.map((s,i)=>(
        <Card key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',marginBottom:8}}>
          <div style={{width:3,height:38,borderRadius:2,background:s.type==='GROUP'?'#6B94D6':T.lime,flexShrink:0}}/>
          <div style={{flex:1}}><div style={{fontSize:10,color:T.text2,letterSpacing:'0.12em',marginBottom:2}}>{s.type} · 60 МИН</div><div style={{fontSize:15,fontWeight:700,color:T.text}}>{s.name}</div></div>
          <div style={{fontSize:20,fontWeight:800,color:T.text2}}>{s.time}</div>
        </Card>
      ))}
    </div>
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:T.text2,letterSpacing:'0.1em',marginBottom:8}}>ПОСЕЩАЕМОСТЬ</div>
      <Card><div style={{display:'flex',alignItems:'flex-end',gap:5,height:60}}>
        {Object.entries(ATTENDANCE).map(([d,v])=>(
          <div key={d} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
            {v>0&&<div style={{fontSize:9,color:v===maxA?T.lime:T.text2}}>{v}</div>}
            <div style={{width:'100%',borderRadius:'3px 3px 0 0',background:v===maxA?T.lime:v>0?T.lime+'44':T.muted+'44',height:v>0?`${(v/maxA)*42}px`:'4px'}}/>
            <div style={{fontSize:9,color:v>0?T.text2:T.muted}}>{d}</div>
          </div>
        ))}
      </div></Card>
    </div>
    <div style={{fontSize:11,fontWeight:700,color:T.text2,letterSpacing:'0.1em',marginBottom:8}}>КЛИЕНТЫ</div>
    {clients.slice(0,4).map(c=>(
      <Card key={c.id} onClick={()=>go({screen:'detail',client:c},'forward')} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',marginBottom:8}}>
        <Avatar name={c.name} lime={c.type==='personal'}/>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:600,color:T.text}}>{c.name}</div><div style={{fontSize:12,color:T.text2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.goal}</div></div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}><Badge status={getStatus(c)}/><span style={{fontSize:11,color:T.text2}}>{c.time}</span></div>
      </Card>
    ))}
  </div>
}

function ClientsScreen({clients,go,onMenu}){
  const {T}=useTheme();const[filter,setFilter]=useState('all');const[search,setSearch]=useState('')
  const FILTERS=[{id:'all',l:'Все'},{id:'personal',l:'Персональные'},{id:'group',l:'Группа'},{id:'ending_soon',l:'Скоро конец'},{id:'unpaid',l:'Не оплачено'},{id:'expired',l:'Истёк'}]
  const list=clients.filter(c=>{const st=getStatus(c);return(filter==='all'||filter===c.type||filter===st)&&(c.name+c.goal).toLowerCase().includes(search.toLowerCase())})
  return <div style={{flex:1,overflowY:'auto',padding:'0 18px 20px'}}>
    <TopBar title="Клиенты" onMenu={onMenu} onBell={()=>{}}/>
    <div style={{margin:'14px 0 10px',display:'flex',alignItems:'center',gap:10,background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:'10px 14px'}}>
      <Icon name="clients" size={18}/>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск..." style={{background:'none',border:'none',outline:'none',color:T.text,fontSize:14,flex:1,fontFamily:'inherit'}}/>
    </div>
    <div style={{display:'flex',gap:7,overflowX:'auto',paddingBottom:4,marginBottom:14}}>
      {FILTERS.map(f=><button key={f.id} onClick={()=>setFilter(f.id)} style={{flexShrink:0,padding:'6px 13px',borderRadius:20,border:'none',background:filter===f.id?T.lime:T.card2,color:filter===f.id?T.btnText:T.text2,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'}}>{f.l}</button>)}
    </div>
    {list.map(c=>(
      <Card key={c.id} onClick={()=>go({screen:'detail',client:c},'forward')} style={{padding:'15px 17px',marginBottom:9}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:10}}>
          <Avatar name={c.name} size={44} lime={c.type==='personal'}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}><span style={{fontSize:16,fontWeight:700,color:T.text}}>{c.name}</span><Badge status={getStatus(c)}/></div>
            <div style={{fontSize:12,color:T.text2,marginBottom:5}}>{c.goal}</div>
            <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:4}}><Icon name="clock" size={12}/><span style={{fontSize:12,color:T.text2,fontWeight:600}}>{c.time}</span></div>
              <span style={{fontSize:11,color:T.text2}}>{c.plan}</span>
              <span style={{fontSize:11,color:T.lime,fontWeight:600}}>{fmtS(c.price)}</span>
            </div>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:12,color:T.text2}}>Осталось: <span style={{color:c.remaining<=3?T.error:T.text,fontWeight:600}}>{c.remaining}</span> трен.</span><span style={{fontSize:11,color:T.text2}}>до {c.end}</span></div>
        <Bar used={c.used} total={c.total} color={c.remaining<=3?T.error:T.lime}/>
      </Card>
    ))}
  </div>
}

function ClientDetail({client:initC,clients,onBack,onUpdate}){
  const {T}=useTheme()
  const client=(initC&&clients.find(c=>c.id===initC.id))||initC
  if(!client)return null
  const st=getStatus(client)
  function mark(){if(client.remaining<=0)return;onUpdate({...client,used:client.used+1,remaining:client.remaining-1})}
  function pay(){onUpdate({...client,paid:true})}
  function renew(){const t=new Date().toISOString().slice(0,10),e=new Date(Date.now()+30*86400000).toISOString().slice(0,10);onUpdate({...client,used:0,remaining:client.total,paid:false,start:t,end:e,history:[...client.history,{date:client.start,plan:client.plan,price:client.price}]})}
  return <div style={{flex:1,overflowY:'auto',padding:'16px 18px 32px'}}>
    <BackButton onBack={onBack}/>
    <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
      <Avatar name={client.name} size={58} lime={client.type==='personal'}/>
      <div><div style={{fontSize:26,fontWeight:800,color:T.text,letterSpacing:'-0.02em'}}>{client.name}</div><div style={{fontSize:13,color:T.text2,marginTop:3}}>{client.goal}</div></div>
    </div>
    <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:16}}>
      <Badge status={st}/>
      <span style={{fontSize:11,fontWeight:600,color:T.text2,background:T.card2,padding:'3px 9px',borderRadius:20}}>{client.type==='personal'?'Персональная':'Группа'}</span>
      {!client.paid&&<span style={{fontSize:11,fontWeight:600,color:T.error,background:T.error+'18',padding:'3px 9px',borderRadius:20}}>Не оплачено</span>}
    </div>
    <Card style={{background:T.summaryBg,borderColor:T.summaryBorder,marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
        <div><div style={{fontSize:10,color:T.text2,letterSpacing:'0.12em',marginBottom:3}}>ИСПОЛЬЗОВАНО</div><div style={{fontSize:32,fontWeight:800,color:T.text}}>{client.used}<span style={{fontSize:14,color:T.text2}}>/{client.total}</span></div></div>
        <div style={{textAlign:'right'}}><div style={{fontSize:10,color:T.text2,letterSpacing:'0.12em',marginBottom:3}}>ОСТАЛОСЬ</div><div style={{fontSize:32,fontWeight:800,color:client.remaining<=3?T.error:T.lime}}>{client.remaining}</div></div>
      </div>
      <Bar used={client.used} total={client.total} color={client.remaining<=3?T.error:T.lime}/>
    </Card>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:10}}>
      {[{l:'ПЛАН',v:client.plan},{l:'ЦЕНА',v:fmtS(client.price)},{l:'НАЧАЛО',v:client.start},{l:'КОНЕЦ',v:client.end}].map((x,i)=>(
        <Card key={i} style={{padding:'12px 14px'}}><div style={{fontSize:9,color:T.text2,letterSpacing:'0.12em',marginBottom:4}}>{x.l}</div><div style={{fontSize:13,fontWeight:600,color:T.text}}>{x.v}</div></Card>
      ))}
    </div>
    {client.history.length>0&&<Card style={{marginBottom:12}}>
      <div style={{fontSize:10,color:T.text2,letterSpacing:'0.12em',marginBottom:10}}>ИСТОРИЯ</div>
      {client.history.map((h,i)=>(
        <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<client.history.length-1?`1px solid ${T.border}`:'none'}}>
          <span style={{fontSize:13,color:T.text}}>{h.plan}</span><span style={{fontSize:12,color:T.text2}}>{h.date} · {fmtS(h.price)}</span>
        </div>
      ))}
    </Card>}
    {client.note&&<Card style={{marginBottom:14}}><div style={{fontSize:10,color:T.text2,letterSpacing:'0.12em',marginBottom:5}}>ЗАМЕТКА</div><div style={{fontSize:14,color:T.text,lineHeight:1.5}}>{client.note}</div></Card>}
    <button onClick={mark} disabled={client.remaining<=0} style={{width:'100%',padding:'15px',background:client.remaining>0?T.btnBg:T.card2,color:client.remaining>0?T.btnText:T.text2,borderRadius:16,fontSize:15,fontWeight:700,border:'none',cursor:client.remaining>0?'pointer':'default',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:9}}>
      <Icon name="check" size={18} color={client.remaining>0?T.btnText:T.text2}/> Отметить тренировку
    </button>
    <div style={{display:'flex',gap:9}}>
      {!client.paid&&<button onClick={pay} style={{flex:1,padding:'13px',background:T.success+'15',color:T.success,borderRadius:14,fontSize:14,fontWeight:600,border:`1px solid ${T.success}33`,cursor:'pointer',fontFamily:'inherit'}}>Оплата</button>}
      <button onClick={renew} style={{flex:1,padding:'13px',background:T.card2,color:T.text2,borderRadius:14,fontSize:14,fontWeight:600,border:`1px solid ${T.border}`,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
        <Icon name="renew" size={15}/> Продлить
      </button>
    </div>
  </div>
}

function CalendarScreen({onMenu}){
  const {T}=useTheme();const[sel,setSel]=useState('Чт')
  const DAYS=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],WORK=['Пн','Вт','Чт','Сб']
  const SCHED={Пн:[{t:'08:00',type:'PERSONAL',n:'Азиз'},{t:'09:00',type:'PERSONAL',n:'Дилшод'},{t:'19:00',type:'GROUP',n:'CROSSFIT BURN'}],Вт:[{t:'08:00',type:'PERSONAL',n:'Камила'},{t:'19:00',type:'GROUP',n:'CROSSFIT BURN'}],Ср:[],Чт:[{t:'08:00',type:'PERSONAL',n:'Азиз'},{t:'09:00',type:'PERSONAL',n:'Камила'},{t:'19:00',type:'GROUP',n:'CROSSFIT BURN'}],Пт:[],Сб:[{t:'10:00',type:'PERSONAL',n:'Дилшод'},{t:'18:00',type:'GROUP',n:'CROSSFIT BURN'}],Вс:[]}
  return <div style={{flex:1,overflowY:'auto',padding:'0 18px 20px'}}>
    <TopBar title="Расписание" onMenu={onMenu} onBell={()=>{}}/>
    <div style={{margin:'14px 0',display:'flex',gap:6}}>
      {DAYS.map(d=>{const a=WORK.includes(d),s=d===sel;return(
        <div key={d} onClick={()=>setSel(d)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,cursor:'pointer'}}>
          <div style={{fontSize:10,color:s?T.lime:a?T.text2:T.muted}}>{d}</div>
          <div style={{width:'100%',aspectRatio:'1',borderRadius:12,background:s?T.limeDim:a?T.card:T.bg,border:`1.5px solid ${s?T.lime:a?T.border:'transparent'}`,display:'flex',alignItems:'center',justifyContent:'center',transform:s?'scale(1.06)':'scale(1)',transition:'all 0.2s'}}>
            {a&&<div style={{width:5,height:5,borderRadius:'50%',background:s?T.lime:T.text2}}/>}
          </div>
        </div>
      )})}
    </div>
    <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:14}}>{SCHED[sel].length===0?'Выходной':`${SCHED[sel].length} тренировки`}</div>
    {SCHED[sel].length===0?<Card style={{padding:32,textAlign:'center'}}><div style={{fontSize:14,color:T.text2}}>Нет тренировок</div></Card>
    :SCHED[sel].map((s,i)=>(
      <Card key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 17px',marginBottom:9}}>
        <div style={{width:3,height:42,borderRadius:2,background:s.type==='GROUP'?'#6B94D6':T.lime,flexShrink:0}}/>
        <div style={{flex:1}}><div style={{fontSize:10,color:T.text2,letterSpacing:'0.12em',marginBottom:3}}>{s.type} · 60 МИН</div><div style={{fontSize:17,fontWeight:700,color:T.text}}>{s.n}</div></div>
        <div style={{fontSize:22,fontWeight:800,color:T.text2}}>{s.t}</div>
      </Card>
    ))}
  </div>
}

function AnalyticsScreen({clients,onMenu}){
  const {T}=useTheme();const finance=calcFinance(clients)
  const maxA=Math.max(...Object.values(ATTENDANCE))
  const bestDay=Object.entries(ATTENDANCE).find(([,v])=>v===maxA)?.[0]
  return <div style={{flex:1,overflowY:'auto',padding:'0 18px 20px'}}>
    <TopBar title="Аналитика" onMenu={onMenu} onBell={()=>{}}/>
    <div style={{margin:'14px 0'}}>
      <FinanceCard finance={finance}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:10}}>
        {[{l:'КЛИЕНТОВ',v:clients.length,c:T.text},{l:'ПЕРСОНАЛЬНЫХ',v:finance.pCount,c:T.lime},{l:'В ГРУППЕ',v:finance.gCount,c:'#6B94D6'},{l:'НЕ ОПЛАТИЛИ',v:finance.unpaidCount,c:T.error},{l:'СКОРО КОНЕЦ',v:finance.endingSoon,c:T.warn},{l:'ИСТЁК',v:finance.expired,c:T.error}].map((s,i)=>(
          <Card key={i} style={{padding:'13px 15px'}}><div style={{fontSize:9,color:T.text2,letterSpacing:'0.12em',marginBottom:4}}>{s.l}</div><div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div></Card>
        ))}
      </div>
      <Card>
        <div style={{fontSize:12,fontWeight:700,color:T.text2,marginBottom:4}}>ПОСЕЩАЕМОСТЬ</div>
        <div style={{fontSize:11,color:T.text2,marginBottom:14}}>Лучший: <span style={{color:T.lime,fontWeight:600}}>{bestDay} ({maxA} чел)</span></div>
        <div style={{display:'flex',alignItems:'flex-end',gap:7,height:90}}>
          {Object.entries(ATTENDANCE).map(([d,v])=>(
            <div key={d} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
              <div style={{fontSize:10,color:v===maxA?T.lime:T.text2}}>{v||''}</div>
              <div style={{width:'100%',borderRadius:'5px 5px 0 0',background:v===maxA?T.lime:v>0?T.lime+'44':T.muted+'44',height:v>0?`${(v/maxA)*60}px`:'5px'}}/>
              <div style={{fontSize:10,color:v>0?T.text2:T.muted}}>{d}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
}

function SettingsScreen({darkMode,setDarkMode,onMenu}){
  const {T}=useTheme()
  return <div style={{flex:1,overflowY:'auto',padding:'0 18px 20px'}}>
    <TopBar title="Настройки" onMenu={onMenu} onBell={()=>{}}/>
    <div style={{margin:'14px 0'}}>
      <Card style={{marginBottom:10}}>
        <div style={{fontSize:11,color:T.text2,letterSpacing:'0.14em',marginBottom:14}}>ОТОБРАЖЕНИЕ</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}><Icon name={darkMode?'moon':'sun'} size={20} color={T.lime}/><span style={{fontSize:15,fontWeight:600,color:T.text}}>{darkMode?'Тёмный режим':'Светлый режим'}</span></div>
          <Toggle on={darkMode} onToggle={()=>setDarkMode(!darkMode)}/>
        </div>
      </Card>
      <Card>
        <div style={{fontSize:11,color:T.text2,letterSpacing:'0.14em',marginBottom:14}}>СИСТЕМА ЦЕН</div>
        {[{l:'Аренда клуба',v:'1 000 000 сум / мес'},{l:'Персоналка разовая',v:'100 000 сум'},{l:'Абонемент 16 трен.',v:'1 400 000 сум'},{l:'Группа 10 трен.',v:'300 000 сум'},{l:'Группа 16 трен.',v:'400 000 сум'},{l:'Срок абонемента',v:'30 дней'},{l:'Рабочие дни',v:'Пн / Вт / Чт / Сб'}].map((r,i,a)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'11px 0',borderBottom:i<a.length-1?`1px solid ${T.border}`:'none'}}>
            <span style={{fontSize:14,color:T.text2}}>{r.l}</span><span style={{fontSize:14,fontWeight:600,color:T.text}}>{r.v}</span>
          </div>
        ))}
      </Card>
    </div>
  </div>
}

function AddClient({onSave,onClose}){
  const {T}=useTheme()
  const[form,setForm]=useState({name:'',goal:'',type:'personal',planId:'16',paid:false,note:'',time:'08:00'})
  const PLANS={personal:[{id:'single',l:'Разовая',price:100000,n:1},{id:'16',l:'16 трен. (14+2)',price:1400000,n:16}],group:[{id:'10',l:'10 трен.',price:300000,n:10},{id:'16',l:'16 трен.',price:400000,n:16}]}
  const sp=PLANS[form.type].find(p=>p.id===form.planId)||PLANS[form.type][1]
  const INP={width:'100%',background:T.card2,border:`1px solid ${T.border}`,borderRadius:14,padding:'12px 14px',color:T.text,fontSize:15,outline:'none',fontFamily:'inherit'}
  function save(){if(!form.name.trim())return;const t=new Date().toISOString().slice(0,10),e=new Date(Date.now()+30*86400000).toISOString().slice(0,10);onSave({id:Date.now(),name:form.name,goal:form.goal,type:form.type,plan:sp.l,price:sp.price,total:sp.n,used:0,remaining:sp.n,start:t,end:e,paid:form.paid,note:form.note,time:form.time,history:[]})}
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',alignItems:'flex-end',backdropFilter:'blur(8px)'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div style={{width:'100%',background:T.bg2,borderRadius:'24px 24px 0 0',padding:'22px 18px 40px',maxHeight:'92vh',overflowY:'auto',animation:'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}>
      <div style={{width:34,height:4,borderRadius:2,background:T.border,margin:'0 auto 20px'}}/>
      <div style={{fontSize:22,fontWeight:800,color:T.text,marginBottom:18}}>Новый клиент</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <input placeholder="Имя клиента" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={INP}/>
        <input placeholder="Цель клиента..." value={form.goal} onChange={e=>setForm(p=>({...p,goal:e.target.value}))} style={INP}/>
        <div style={{display:'flex',alignItems:'center',gap:10,background:T.card2,border:`1px solid ${T.border}`,borderRadius:14,padding:'12px 14px'}}>
          <Icon name="clock" size={18}/><span style={{fontSize:13,color:T.text2,minWidth:90}}>Время</span>
          <input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={{background:'none',border:'none',outline:'none',flex:1,color:T.lime,fontWeight:700,fontSize:15,fontFamily:'inherit'}}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          {['personal','group'].map(t=><button key={t} onClick={()=>setForm(p=>({...p,type:t,planId:'16'}))} style={{flex:1,padding:'12px',borderRadius:14,border:`1px solid ${form.type===t?T.lime:T.border}`,background:form.type===t?T.limeDim:T.card2,color:form.type===t?T.lime:T.text2,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{t==='personal'?'Персональная':'Группа'}</button>)}
        </div>
        {PLANS[form.type].map(p=><button key={p.id} onClick={()=>setForm(prev=>({...prev,planId:p.id}))} style={{padding:'12px 14px',borderRadius:14,border:`1px solid ${form.planId===p.id?T.lime:T.border}`,background:form.planId===p.id?T.limeDim:T.card2,color:T.text,fontSize:14,textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'flex',justifyContent:'space-between'}}>
          <span style={{fontWeight:600}}>{p.l}</span><span style={{color:form.planId===p.id?T.lime:T.text2,fontWeight:700}}>{fmtS(p.price)}</span>
        </button>)}
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'4px 0'}}>
          <Toggle on={form.paid} onToggle={()=>setForm(p=>({...p,paid:!p.paid}))}/>
          <span style={{fontSize:14,color:form.paid?T.lime:T.text2}}>{form.paid?'Оплачено':'Не оплачено'}</span>
        </div>
        <input placeholder="Комментарий..." value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} style={INP}/>
        <button onClick={save} style={{width:'100%',padding:'14px',background:T.btnBg,color:T.btnText,borderRadius:16,fontSize:15,fontWeight:800,border:'none',cursor:'pointer',fontFamily:'inherit',marginTop:4}}>Сохранить</button>
      </div>
    </div>
  </div>
}

function QuickSheet({onClose,onAdd,showToast}){
  const {T}=useTheme()
  const ACTIONS=[{icon:'person',l:'Добавить клиента',cb:()=>{onClose();onAdd()}},{icon:'check',l:'Отметить тренировку',cb:()=>{onClose();showToast('Функция в демо-режиме')}},{icon:'clients',l:'Групповое посещение',cb:()=>{onClose();showToast('Функция в демо-режиме')}},{icon:'renew',l:'Продлить абонемент',cb:()=>{onClose();showToast('Функция в демо-режиме')}},{icon:'wallet',l:'Добавить оплату',cb:()=>{onClose();showToast('Функция в демо-режиме')}}]
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:150,display:'flex',alignItems:'flex-end',backdropFilter:'blur(10px)'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div style={{width:'100%',background:T.bg2,borderRadius:'28px 28px 0 0',padding:'22px 18px 40px',animation:'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}>
      <div style={{width:34,height:4,borderRadius:2,background:T.border,margin:'0 auto 20px'}}/>
      <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:16}}>Быстрое действие</div>
      {ACTIONS.map((a,i)=><button key={i} onClick={a.cb} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:T.card,borderRadius:16,border:`1px solid ${T.border}`,cursor:'pointer',fontFamily:'inherit',width:'100%',marginBottom:9}}>
        <div style={{width:38,height:38,borderRadius:12,background:T.card2,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name={a.icon} size={20} color={T.lime}/></div>
        <span style={{fontSize:15,fontWeight:600,color:T.text}}>{a.l}</span>
      </button>)}
    </div>
  </div>
}

function LogoutModal({onCancel,onConfirm}){
  const {T}=useTheme()
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',padding:'0 20px'}}>
    <div style={{width:'100%',background:T.bg2,borderRadius:24,padding:'28px 24px',maxWidth:360,animation:'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'}}>
      <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:8}}>Выйти?</div>
      <div style={{fontSize:14,color:T.text2,marginBottom:24}}>Вы уверены?</div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={onCancel} style={{flex:1,padding:'13px',background:T.card2,color:T.text,borderRadius:14,fontSize:14,fontWeight:600,border:`1px solid ${T.border}`,cursor:'pointer',fontFamily:'inherit'}}>Отмена</button>
        <button onClick={onConfirm} style={{flex:1,padding:'13px',background:T.error+'15',color:T.error,borderRadius:14,fontSize:14,fontWeight:600,border:`1px solid ${T.error}33`,cursor:'pointer',fontFamily:'inherit'}}>Выйти</button>
      </div>
    </div>
  </div>
}

function SideMenu({open,onClose,darkMode,setDarkMode,finance,activeScreen,onNav,onLogout}){
  const {T}=useTheme()
  const MENU=[{id:'accounting',icon:'wallet',title:'Бухгалтерия',sub:'Доходы и расходы',accent:false},{id:'settings',icon:'settings',title:'Настройки',sub:'Правила системы',accent:false}]
  return <>
    <div onClick={onClose} style={{position:'fixed',inset:0,background:`rgba(0,0,0,${open?0.6:0})`,zIndex:300,pointerEvents:open?'all':'none',backdropFilter:open?'blur(4px)':'none',transition:'background 0.35s'}}/>
    <div style={{position:'fixed',top:0,left:0,bottom:0,width:304,background:T.drawerBg,zIndex:301,transform:open?'translateX(0)':'translateX(-100%)',transition:'transform 0.36s cubic-bezier(0.32,0.72,0,1)',display:'flex',flexDirection:'column',padding:'0 0 40px',boxShadow:open?`6px 0 40px rgba(0,0,0,${T.dark?0.6:0.12})`:'none'}}>
      <div style={{padding:'52px 20px 20px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{fontSize:22,fontWeight:800,color:T.lime}}>burn•60</div>
          <button onClick={onClose} style={{width:36,height:36,borderRadius:'50%',background:T.card,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="close" size={16}/></button>
        </div>
        <div style={{fontSize:14,color:T.text2}}>functional training · Demo</div>
      </div>
      <div style={{margin:'0 14px 16px',padding:'14px 16px',background:T.card,borderRadius:16,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:9,color:T.text2,letterSpacing:'0.14em',marginBottom:5}}>ЧИСТЫМИ / МЕС</div>
        <div style={{fontSize:22,fontWeight:800,color:T.lime,marginBottom:10}}>{fmtS(finance.net)}</div>
        <div style={{display:'flex',gap:16}}>
          <div><div style={{fontSize:9,color:T.text2,marginBottom:2}}>КЛИЕНТОВ</div><div style={{fontSize:15,fontWeight:700,color:T.text}}>{finance.pCount+finance.gCount}</div></div>
          <div><div style={{fontSize:9,color:T.text2,marginBottom:2}}>НЕ ОПЛАТИЛИ</div><div style={{fontSize:15,fontWeight:700,color:finance.unpaidCount>0?T.error:T.text2}}>{finance.unpaidCount}</div></div>
        </div>
      </div>
      <div style={{flex:1,padding:'0 14px',overflowY:'auto'}}>
        {MENU.map(item=>{const isActive=activeScreen===item.id;return(
          <div key={item.id} onClick={()=>onNav(item.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:14,marginBottom:6,background:isActive?T.limeDim:T.dark?'rgba(255,255,255,0.04)':'#F3F0E8',border:`1px solid ${isActive?T.lime:T.border}`,cursor:'pointer'}}>
            <div style={{width:36,height:36,borderRadius:10,background:T.card,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Icon name={item.icon} size={18} color={isActive?T.lime:T.text2}/></div>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:isActive?T.lime:T.text}}>{item.title}</div><div style={{fontSize:11,color:T.text2}}>{item.sub}</div></div>
            <Icon name="arrow" size={14}/>
          </div>
        )})}
      </div>
      <div style={{padding:'14px 14px 0'}}>
        <div style={{height:1,background:T.border,marginBottom:14}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 6px',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}><Icon name={darkMode?'moon':'sun'} size={18} color={T.lime}/><span style={{fontSize:14,color:T.text}}>{darkMode?'Тёмный':'Светлый'}</span></div>
          <Toggle on={darkMode} onToggle={()=>setDarkMode(!darkMode)}/>
        </div>
        <button onClick={onLogout} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',width:'100%',borderRadius:14,background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
          <Icon name="logout" size={18} color={T.error}/><span style={{fontSize:14,fontWeight:600,color:T.error}}>Выйти</span>
        </button>
      </div>
    </div>
  </>
}

function BottomNav({active,onChange}){
  const {T}=useTheme()
  const TABS=[{id:'home',icon:'home',l:'Главная'},{id:'clients',icon:'clients',l:'Клиенты'},{id:'quick',icon:'plus',l:''},{id:'calendar',icon:'calendar',l:'Календарь'},{id:'analytics',icon:'analytics',l:'Аналитика'}]
  return <div style={{background:T.navBg,borderTop:`1px solid ${T.navBorder}`,paddingBottom:'env(safe-area-inset-bottom,10px)',flexShrink:0,transition:'background 0.35s'}}>
    <div style={{display:'flex',alignItems:'center',height:60}}>
      {TABS.map(t=>{
        if(t.id==='quick')return <button key="quick" onClick={()=>onChange('quick')} style={{flex:1,display:'flex',justifyContent:'center',alignItems:'center',border:'none',background:'none'}}>
          <div style={{width:50,height:50,borderRadius:'50%',background:T.plusBg,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 20px ${T.plusShadow}`}}><Icon name="plus" size={22} color={T.plusIcon}/></div>
        </button>
        const isActive=active===t.id
        return <button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,border:'none',background:'none',height:'100%'}}>
          <div style={{transition:'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',transform:isActive?'scale(1.14)':'scale(1)'}}><Icon name={t.icon} size={22} color={isActive?T.navActive:T.navIcon}/></div>
          <span style={{fontSize:9,fontWeight:600,letterSpacing:'0.08em',color:isActive?T.navActive:T.navIcon,fontFamily:'inherit'}}>{t.l.toUpperCase()}</span>
        </button>
      })}
    </div>
  </div>
}

function LiquidLayer({phase,dir,enterReady,children}){
  function buildStyle(){
    if(phase==='idle')return{opacity:1,transform:'scale(1) translate(0,0)',filter:'blur(0px)',transition:'opacity 0.32s cubic-bezier(0.22,1,0.36,1),transform 0.38s cubic-bezier(0.34,1.56,0.64,1),filter 0.3s ease'}
    if(phase==='exit')return{opacity:0,transform:dir==='back'?'scale(0.96) translateX(14px)':'scale(0.96) translateX(-14px)',filter:'blur(5px)',transition:'opacity 0.19s ease,transform 0.19s ease,filter 0.19s ease'}
    if(phase==='enter')return{opacity:enterReady?1:0,transform:enterReady?'scale(1) translate(0,0)':dir==='back'?'scale(0.97) translateX(-18px)':'scale(0.97) translateX(18px)',filter:enterReady?'blur(0px)':'blur(6px)',transition:'opacity 0.34s cubic-bezier(0.22,1,0.36,1),transform 0.42s cubic-bezier(0.34,1.56,0.64,1),filter 0.34s ease'}
    return{}
  }
  return <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',willChange:'transform,opacity,filter',...buildStyle()}}>{children}</div>
}

// ── ROOT APP ──────────────────────────────────────────────────────────────
function App(){
  const[darkMode,setDarkMode]=useState(()=>{try{const s=localStorage.getItem('tc-theme');return s?s==='dark':true}catch{return true}})
  const T=makeTheme(darkMode)
  useEffect(()=>{try{localStorage.setItem('tc-theme',darkMode?'dark':'light')}catch{}},[darkMode])
  const[clients,setClients]=useState(INIT_CLIENTS)
  const[activeTab,setActiveTab]=useState('home')
  const[drawerOpen,setDrawer]=useState(false)
  const[showAdd,setShowAdd]=useState(false)
  const[showQuick,setShowQuick]=useState(false)
  const[showLogout,setShowLogout]=useState(false)
  const[loggedIn,setLoggedIn]=useState(true)
  const[notificationsRead,setNotificationsRead]=useState(false)
  const[toast,setToast]=useState('')
  const[screenState,setScreenState]=useState('home')
  const[transPhase,setTransPhase]=useState('idle')
  const[transDir,setTransDir]=useState('forward')
  const[returnScreen,setReturnScreen]=useState('home')
  const[enterReady,setEnterReady]=useState(false)
  const timerRef=useRef()
  const finance=calcFinance(clients)
  const rawBadge=clients.filter(c=>{const st=getStatus(c);return!c.paid||st==='ending_soon'||st==='expired'}).length
  const badge=notificationsRead?0:rawBadge
  useEffect(()=>{setNotificationsRead(false)},[clients])
  useEffect(()=>()=>clearTimeout(timerRef.current),[])
  function showToastFn(msg){setToast(msg);setTimeout(()=>setToast(''),2000)}
  function navigate(next,dir='forward'){
    const nk=getScreenKey(next),ck=getScreenKey(screenState)
    if(nk===ck&&typeof next==='string')return
    if(typeof next==='object'&&next.screen==='detail')setReturnScreen(ck)
    clearTimeout(timerRef.current);setTransDir(dir);setTransPhase('exit')
    timerRef.current=setTimeout(()=>{
      setScreenState(next);setEnterReady(false);setTransPhase('enter')
      requestAnimationFrame(()=>requestAnimationFrame(()=>setEnterReady(true)))
      timerRef.current=setTimeout(()=>{setTransPhase('idle');setEnterReady(false)},420)
    },190)
  }
  function navTab(tab){if(tab==='quick'){setShowQuick(true);return}setActiveTab(tab);navigate(tab,'forward')}
  function navFromMenu(id){setDrawer(false);setTimeout(()=>navigate(id,'forward'),80)}
  function updateClient(upd){setClients(prev=>prev.map(c=>c.id===upd.id?upd:c))}
  function addClient(c){setClients(prev=>[...prev,c]);setShowAdd(false)}
  function goBack(){navigate(returnScreen||activeTab||'home','back')}
  const screenKey=getScreenKey(screenState)
  const showNav=!['detail','notif','accounting','profile','pro'].includes(screenKey)
  function renderContent(state){
    const key=getScreenKey(state)
    const props={go:(next,dir)=>navigate(next,dir),clients,onBack:goBack}
    if(key==='home')return <Dashboard {...props} onMenu={()=>setDrawer(true)} onBell={()=>{setNotificationsRead(true);navigate('notif','forward')}} badge={badge}/>
    if(key==='clients')return <ClientsScreen {...props} onMenu={()=>setDrawer(true)}/>
    if(key==='calendar')return <CalendarScreen onMenu={()=>setDrawer(true)}/>
    if(key==='analytics')return <AnalyticsScreen clients={clients} onMenu={()=>setDrawer(true)}/>
    if(key==='settings')return <SettingsScreen darkMode={darkMode} setDarkMode={setDarkMode} onMenu={()=>setDrawer(true)}/>
    if(key==='detail'){const c=typeof state==='object'?state.client:null;return <ClientDetail client={c} clients={clients} onBack={goBack} onUpdate={updateClient}/>}
    return null
  }
  const CSS=`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}body{background:#0A0A0A;}::-webkit-scrollbar{display:none;}input::placeholder{color:#666;}button{cursor:pointer;}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes scaleIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}input[type=time]::-webkit-calendar-picker-indicator{filter:${darkMode?'invert(1)':'none'};opacity:0.4;}`
  if(!loggedIn)return <ThemeCtx.Provider value={{T,darkMode}}><div style={{maxWidth:430,margin:'0 auto',height:'100vh',background:T.bg,display:'flex',flexDirection:'column',overflow:'hidden',fontFamily:"'Outfit',sans-serif"}}><style>{CSS}</style><div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}><div style={{fontSize:28,fontWeight:800,color:T.lime,marginBottom:8}}>burn•60</div><div style={{fontSize:14,color:T.text2,marginBottom:32}}>Вы вышли из демо-аккаунта</div><button onClick={()=>setLoggedIn(true)} style={{padding:'15px 40px',background:T.btnBg,color:T.btnText,borderRadius:16,fontSize:16,fontWeight:800,border:'none',cursor:'pointer',fontFamily:'inherit'}}>Войти обратно</button></div></div></ThemeCtx.Provider>
  return <ThemeCtx.Provider value={{T,darkMode}}>
    <div style={{maxWidth:430,margin:'0 auto',height:'100vh',background:T.bg,display:'flex',flexDirection:'column',overflow:'hidden',fontFamily:"'Outfit',sans-serif",transition:'background 0.35s'}}>
      <style>{CSS}</style>
      <LiquidLayer phase={transPhase} dir={transDir} enterReady={enterReady}>{renderContent(screenState)}</LiquidLayer>
      {showNav&&<BottomNav active={activeTab} onChange={navTab}/>}
      <SideMenu open={drawerOpen} onClose={()=>setDrawer(false)} darkMode={darkMode} setDarkMode={setDarkMode} finance={finance} activeScreen={screenKey} onNav={navFromMenu} onLogout={()=>{setDrawer(false);setTimeout(()=>setShowLogout(true),300)}}/>
      {showAdd&&<AddClient onSave={addClient} onClose={()=>setShowAdd(false)}/>}
      {showQuick&&<QuickSheet onClose={()=>setShowQuick(false)} onAdd={()=>setShowAdd(true)} showToast={showToastFn}/>}
      {showLogout&&<LogoutModal onCancel={()=>setShowLogout(false)} onConfirm={()=>{setShowLogout(false);setLoggedIn(false)}}/>}
      {toast!==''&&<div style={{position:'fixed',bottom:showNav?86:28,left:'50%',transform:'translateX(-50%)',zIndex:999,background:T.card2,color:T.text,padding:'12px 18px',borderRadius:14,fontSize:13,fontWeight:600,border:`1px solid ${T.border}`,boxShadow:'0 8px 30px rgba(0,0,0,0.25)',whiteSpace:'nowrap',animation:'scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)'}}>{toast}</div>}
    </div>
  </ThemeCtx.Provider>
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>)
