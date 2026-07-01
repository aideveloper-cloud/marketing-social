import express from "express";
import pg from "pg";

const app = express();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function q(sql) {
  const { rows } = await pool.query(sql);
  return rows;
}

app.get("/api/stats", async (req, res) => {
  try {
    const [summary, trend, topProducts, recentOrders, syncStatus] = await Promise.all([
      q(`SELECT platform,
           COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS orders_today,
           COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE),0) AS revenue_today,
           COUNT(*) FILTER (WHERE created_at >= date_trunc('week',NOW())) AS orders_week,
           COALESCE(SUM(total_amount) FILTER (WHERE created_at >= date_trunc('week',NOW())),0) AS revenue_week,
           COUNT(*) FILTER (WHERE created_at >= date_trunc('month',NOW())) AS orders_month,
           COALESCE(SUM(total_amount) FILTER (WHERE created_at >= date_trunc('month',NOW())),0) AS revenue_month
         FROM ecommerce.orders WHERE order_status NOT IN ('CANCELLED','cancelled') GROUP BY platform`),
      q(`SELECT DATE(created_at) AS date, platform, COUNT(*) AS orders,
           COALESCE(SUM(total_amount),0) AS revenue
         FROM ecommerce.orders
         WHERE created_at >= NOW()-INTERVAL '30 days' AND order_status NOT IN ('CANCELLED','cancelled')
         GROUP BY DATE(created_at), platform ORDER BY date`),
      q(`SELECT i.product_name, i.platform, SUM(i.quantity) AS total_qty, SUM(i.subtotal) AS total_revenue
         FROM ecommerce.order_items i
         JOIN ecommerce.orders o ON o.platform=i.platform AND o.platform_order_id=i.platform_order_id
         WHERE o.created_at >= date_trunc('month',NOW()) AND o.order_status NOT IN ('CANCELLED','cancelled')
         GROUP BY i.product_name, i.platform ORDER BY total_revenue DESC LIMIT 10`),
      q(`SELECT platform_order_id, platform, order_status, total_amount, buyer_username, created_at
         FROM ecommerce.orders ORDER BY created_at DESC LIMIT 20`),
      q(`SELECT platform, sync_type, status, records, finished_at FROM ecommerce.sync_log
         WHERE id IN (SELECT MAX(id) FROM ecommerce.sync_log GROUP BY platform, sync_type)
         ORDER BY finished_at DESC`),
    ]);
    res.json({ summary, trend, topProducts, recentOrders, syncStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.send(html()));

app.listen(3001, () => console.log("Marketing page running on http://localhost:3001"));

function html() {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Marketing Dashboard</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0d0d14;--surface:#14141f;--surface2:#1c1c2a;--border:#262636;
  --text:#e8e6f4;--muted:#7a789a;--accent:#ff2d55;--amber:#f5a623;
  --teal:#22d3c2;--violet:#9b8bff;
}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;line-height:1.5;min-height:100vh}
.header{position:sticky;top:0;z-index:10;background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;height:52px;display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:10px}
.logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#ff6b8a);display:flex;align-items:center;justify-content:center;font-size:14px}
.logo-text{font-size:14px;font-weight:600;letter-spacing:-0.01em}
.logo-sub{font-size:11px;color:var(--muted);margin-top:1px}
.period-toggle{display:flex;gap:2px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:3px}
.period-btn{padding:4px 10px;border-radius:5px;border:none;font-size:11px;font-weight:500;cursor:pointer;background:transparent;color:var(--muted)}
.period-btn.active{background:var(--surface2);color:var(--text)}
.sync-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 2px rgba(34,197,94,.2);display:inline-block;margin-right:5px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 2px rgba(34,197,94,.2)}50%{box-shadow:0 0 0 5px rgba(34,197,94,.05)}}
.main{max-width:1200px;margin:0 auto;padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px}
.section-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;position:relative;overflow:hidden}
.kpi-bar{height:2px;border-radius:2px;width:100%;margin-bottom:12px}
.kpi-label{font-size:10px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.kpi-value{font-size:26px;font-weight:700;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;margin:6px 0 2px;line-height:1}
.kpi-sub{font-size:11px;color:var(--muted)}
.platform-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.platform-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px}
.chart-card,.products-card,.orders-card,.sync-footer{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px}
.card-title{font-size:12px;font-weight:600;margin-bottom:14px}
.bottom-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:left;padding-bottom:8px;border-bottom:1px solid var(--border)}
th:last-child,td:last-child{text-align:right}
td{padding:7px 0;border-bottom:1px solid rgba(38,38,54,.5);vertical-align:middle;font-variant-numeric:tabular-nums}
tr:last-child td{border-bottom:none}
.pill{display:inline-block;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:600;letter-spacing:.04em}
.order-id{font-family:monospace;color:var(--muted);font-size:10px}
.product-track{height:4px;background:var(--border);border-radius:2px;margin-top:4px}
.product-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--violet),var(--accent))}
.sync-footer{display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:12px 16px}
.loading{display:flex;align-items:center;justify-content:center;height:200px;color:var(--muted)}
</style>
</head>
<body>
<header class="header">
  <div class="logo">
    <div class="logo-icon">📊</div>
    <div>
      <div class="logo-text">Marketing Dashboard</div>
      <div class="logo-sub">ภาพรวมยอดขาย TikTok Shop</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:12px">
    <div class="period-toggle" id="periodToggle">
      <button class="period-btn active" data-p="today">วันนี้</button>
      <button class="period-btn" data-p="week">สัปดาห์นี้</button>
      <button class="period-btn" data-p="month">เดือนนี้</button>
    </div>
    <span style="font-size:10px;color:var(--muted)"><span class="sync-dot"></span><span id="syncTime">กำลังโหลด...</span></span>
  </div>
</header>
<main class="main" id="app"><div class="loading">⟳ กำลังโหลด...</div></main>
<script>
let DATA = null;
let PERIOD = 'today';

// Escape HTML to prevent XSS from database values
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PERIOD_KEYS = {
  today: ['revenue_today','orders_today'],
  week:  ['revenue_week', 'orders_week'],
  month: ['revenue_month','orders_month'],
};
const PERIOD_LABEL = {today:'วันนี้',week:'สัปดาห์นี้',month:'เดือนนี้'};
const PLATFORM_COLOR = {tiktok:'#ff2d55',shopee:'#f65520',lazada:'#4f7fff'};
const PLATFORM_ICON = {tiktok:'🎵',shopee:'🧡',lazada:'🛒'};
const STATUS_STYLE = {
  COMPLETED:'background:rgba(34,197,94,.12);color:#22c55e',
  SHIPPED:'background:rgba(155,139,255,.12);color:#9b8bff',
  PROCESSING:'background:rgba(234,179,8,.12);color:#eab308',
  PENDING:'background:rgba(148,163,184,.12);color:#94a3b8',
  CANCELLED:'background:rgba(239,68,68,.12);color:#ef4444',
  cancelled:'background:rgba(239,68,68,.12);color:#ef4444',
};

function fmt(n){
  n=Number(n)||0;
  if(n>=1e6)return'฿'+(n/1e6).toFixed(1)+'M';
  if(n>=1e3)return'฿'+(n/1e3).toFixed(1)+'k';
  return'฿'+n.toLocaleString();
}

function render(){
  if(!DATA)return;
  const {summary,trend,topProducts,recentOrders,syncStatus}=DATA;
  const [revKey,ordKey]=PERIOD_KEYS[PERIOD];
  const totalRev=summary.reduce((s,r)=>s+Number(r[revKey]),0);
  const totalOrd=summary.reduce((s,r)=>s+Number(r[ordKey]),0);
  const aov=totalOrd>0?totalRev/totalOrd:0;

  document.getElementById('app').innerHTML=\`
    <div>
      <div class="section-label">ยอดรวม\${PERIOD_LABEL[PERIOD]}</div>
      <div class="kpi-grid">
        \${kpiCard('ยอดขาย',fmt(totalRev),'#f5a623')}
        \${kpiCard('Orders',totalOrd.toLocaleString(),'#ff2d55')}
        \${kpiCard('Avg Order Value',totalOrd>0?fmt(aov):'—','#9b8bff')}
        \${kpiCard('Platforms active',summary.filter(r=>Number(r[revKey])>0).length+' / '+summary.length,'#22d3c2')}
      </div>
    </div>
    <div>
      <div class="section-label">แยก Platform</div>
      <div class="platform-row">
        \${['tiktok','shopee','lazada'].map(p=>{
          const r=summary.find(x=>x.platform===p);
          const rev=r?Number(r[revKey]):null;
          const ord=r?Number(r[ordKey]):null;
          const share=totalRev>0&&rev?((rev/totalRev)*100).toFixed(0):0;
          const active=rev!==null&&rev>0;
          return \`<div class="platform-card" style="opacity:\${active?1:0.45}">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
              <span style="font-size:16px">\${PLATFORM_ICON[p]||'🛍️'}</span>
              <span style="font-size:12px;font-weight:600;text-transform:capitalize">\${esc(p)}</span>
              <span style="margin-left:auto;font-size:10px;color:var(--muted)">\${active?share+'%':'เร็วๆ นี้'}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div><div style="font-size:10px;color:var(--muted)">ยอดขาย</div>
                <div style="font-size:15px;font-weight:700;font-variant-numeric:tabular-nums">\${active?fmt(rev):'—'}</div></div>
              <div><div style="font-size:10px;color:var(--muted)">Orders</div>
                <div style="font-size:15px;font-weight:700;font-variant-numeric:tabular-nums">\${active?ord.toLocaleString():'—'}</div></div>
            </div>
            <div style="height:3px;background:var(--border);border-radius:2px;margin-top:14px">
              <div style="height:100%;width:\${share}%;background:\${PLATFORM_COLOR[p]||'#888'};border-radius:2px"></div>
            </div>
          </div>\`;
        }).join('')}
      </div>
    </div>
    <div class="chart-card">
      <div class="card-title">ยอดขาย 30 วัน</div>
      \${trendChart(trend)}
    </div>
    <div class="bottom-grid">
      \${productsCard(topProducts)}
      \${ordersCard(recentOrders)}
    </div>
    \${syncStatus.length?syncBar(syncStatus):''}
  \`;
}

function kpiCard(label,value,color){
  return \`<div class="kpi-card">
    <div class="kpi-bar" style="background:\${color}"></div>
    <div class="kpi-label">\${label}</div>
    <div class="kpi-value" style="color:\${color}">\${value}</div>
  </div>\`;
}

function trendChart(rows){
  if(!rows.length)return'<div class="loading">ยังไม่มีข้อมูล</div>';
  const dates=[...new Set(rows.map(r=>r.date))].sort();
  const platforms=[...new Set(rows.map(r=>r.platform))];
  const map=new Map(rows.map(r=>[r.date+'|'+r.platform,Number(r.revenue)]));
  const maxRev=Math.max(...rows.map(r=>Number(r.revenue)),1);
  const W=860,H=160,PT=12,PR=8,PB=28,PL=8;
  const xp=i=>PL+(i/(dates.length-1||1))*(W-PL-PR);
  const yp=v=>PT+(1-v/maxRev)*(H-PT-PB);
  const grads=platforms.map(p=>\`<linearGradient id="g\${p}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="\${PLATFORM_COLOR[p]||'#888'}" stop-opacity=".2"/>
    <stop offset="100%" stop-color="\${PLATFORM_COLOR[p]||'#888'}" stop-opacity="0"/>
  </linearGradient>\`).join('');
  const paths=platforms.map(p=>{
    const pts=dates.map((d,i)=>({x:xp(i),y:yp(map.get(d+'|'+p)||0)}));
    const line=pts.map((pt,i)=>\`\${i?'L':'M'}\${pt.x.toFixed(1)},\${pt.y.toFixed(1)}\`).join(' ');
    const area=line+\` L\${xp(dates.length-1).toFixed(1)},\${H-PB} L\${xp(0).toFixed(1)},\${H-PB} Z\`;
    return \`<path d="\${area}" fill="url(#g\${p})"/>
    <path d="\${line}" fill="none" stroke="\${PLATFORM_COLOR[p]||'#888'}" stroke-width="2" stroke-linejoin="round"/>\`;
  }).join('');
  const xlabels=dates.filter((_,i)=>i%Math.ceil(dates.length/6)===0).map(d=>{
    const i=dates.indexOf(d);
    return \`<text x="\${xp(i).toFixed(1)}" y="\${H-4}" text-anchor="middle" font-size="9" fill="var(--muted)">\${d.slice(5)}</text>\`;
  }).join('');
  const legend=platforms.map(p=>\`<span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;color:var(--muted);margin-right:12px">
    <span style="width:8px;height:8px;border-radius:50%;background:\${PLATFORM_COLOR[p]||'#888'};display:inline-block"></span>\${p}
  </span>\`).join('');
  return \`<div style="overflow-x:auto">
    <svg viewBox="0 0 \${W} \${H}" style="width:100%;height:\${H}px">
      <defs>\${grads}</defs>
      \${[.25,.5,.75,1].map(f=>\`<line x1="\${PL}" y1="\${yp(maxRev*f).toFixed(1)}" x2="\${W-PR}" y2="\${yp(maxRev*f).toFixed(1)}" stroke="var(--border)" stroke-width="1"/>\`).join('')}
      \${paths}\${xlabels}
    </svg>
    <div style="margin-top:6px">\${legend}</div>
  </div>\`;
}

function productsCard(rows){
  const max=rows[0]?Number(rows[0].total_revenue):1;
  return \`<div class="products-card">
    <div class="card-title">สินค้าขายดีเดือนนี้</div>
    \${rows.length?rows.map((r,i)=>\`
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="display:flex;align-items:center;gap:6px;min-width:0;flex:1">
            <span style="font-size:10px;color:var(--muted);width:14px;flex-shrink:0">\${i+1}</span>
            <span style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\${esc(r.product_name||'—')}</span>
          </span>
          <span style="font-size:11px;font-weight:600;color:var(--amber);flex-shrink:0;margin-left:8px;font-variant-numeric:tabular-nums">฿\${Number(r.total_revenue).toLocaleString()}</span>
        </div>
        <div class="product-track"><div class="product-fill" style="width:\${(Number(r.total_revenue)/max*100).toFixed(1)}%"></div></div>
      </div>\`).join('')
    :'<div style="color:var(--muted);font-size:11px;text-align:center;padding:24px 0">ยังไม่มีข้อมูล</div>'}
  </div>\`;
}

function ordersCard(orders){
  return \`<div class="orders-card">
    <div class="card-title">คำสั่งซื้อล่าสุด</div>
    <div style="overflow-x:auto">
    <table>
      <thead><tr><th>Order ID</th><th>Platform</th><th>ลูกค้า</th><th>สถานะ</th><th>ยอด</th></tr></thead>
      <tbody>\${orders.length?orders.map(o=>\`<tr>
        <td><span class="order-id">\${esc(String(o.platform_order_id).slice(0,12))}</span></td>
        <td>\${PLATFORM_ICON[esc(o.platform)]||'🛍️'} \${esc(o.platform)}</td>
        <td>\${esc(o.buyer_username||'—')}</td>
        <td><span class="pill" style="\${STATUS_STYLE[o.order_status]||STATUS_STYLE.PENDING}">\${esc(o.order_status)}</span></td>
        <td>฿\${Number(o.total_amount).toLocaleString()}</td>
      </tr>\`).join(''):'<tr><td colspan="5" style="text-align:center;padding:24px 0;color:var(--muted)">ยังไม่มีข้อมูล</td></tr>'}
      </tbody>
    </table>
    </div>
  </div>\`;
}

function syncBar(rows){
  return \`<div class="sync-footer">
    <span style="font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">Sync Log</span>
    \${rows.map(r=>\`<span style="font-size:10px;color:var(--muted);display:flex;align-items:center;gap:5px">
      <span style="width:6px;height:6px;border-radius:50%;background:\${['success'].includes(r.status)?'#22c55e':'#ef4444'};display:inline-block"></span>
      \${esc(r.platform)} · \${esc(r.sync_type)} · \${esc(String(r.records))} records
    </span>\`).join('')}
  </div>\`;
}

async function load(){
  try{
    const res=await fetch('/api/stats');
    DATA=await res.json();
    document.getElementById('syncTime').textContent=new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
    render();
  }catch(e){
    document.getElementById('app').innerHTML='<div class="loading" style="color:#ef4444">⚠️ เชื่อมต่อ database ไม่ได้: '+e.message+'</div>';
  }
}

document.getElementById('periodToggle').addEventListener('click',e=>{
  const btn=e.target.closest('.period-btn');
  if(!btn)return;
  document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  PERIOD=btn.dataset.p;
  render();
});

load();
setInterval(load,5*60*1000);
</script>
</body>
</html>`;
}


