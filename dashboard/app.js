(function(){
const D=window.__RADAR__;if(!D)return;
document.getElementById('mv').textContent=D.model_version;
document.getElementById('sd').textContent=D.snapshot_date;
const rows=D.rows;const tbody=document.getElementById('rows');
const catSel=document.getElementById('catFilter');
const chainSel=document.getElementById('chainFilter');
const searchEl=document.getElementById('search');
const countEl=document.getElementById('count');
// Populate filters
const cats=[...new Set(rows.map(r=>r.category).filter(Boolean))].sort();
cats.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;catSel.appendChild(o)});
const chains=[...new Set(rows.flatMap(r=>r.chains))].sort();
chains.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;chainSel.appendChild(o)});
function fmt(n){if(n>=1e9)return'$'+(n/1e9).toFixed(2)+'B';if(n>=1e6)return'$'+(n/1e6).toFixed(1)+'M';if(n>=1e3)return'$'+(n/1e3).toFixed(0)+'K';return'$'+n}
function render(filter){
let list=rows;
const cat=catSel.value,chain=chainSel.value,q=searchEl.value.toLowerCase();
if(cat)list=list.filter(r=>r.category===cat);
if(chain)list=list.filter(r=>r.chains.includes(chain));
if(q)list=list.filter(r=>r.name.toLowerCase().includes(q)||r.slug.includes(q));
countEl.textContent=list.length+' protocols';
tbody.innerHTML=list.slice(0,150).map(r=>{
const chg=r.change_7d!=null?`<span class="${r.change_7d>=0?'pos':'neg'}">${r.change_7d>=0?'+':''}${r.change_7d.toFixed(1)}%</span>`:'—';
const chips=r.chains.slice(0,3).map(c=>`<span class="chip">${c}</span>`).join('');
return `<tr onclick="showDetail('${r.slug}')"><td>${r.rank}</td><td><strong>${r.name}</strong><br><small style="color:var(--dim)">${r.slug}</small></td><td>${r.category||'—'}</td><td>${chips}</td><td>${fmt(r.tvl_usd)}</td><td>${chg}</td><td class="val">${fmt(r.implied_value_usd)}</td><td><button class="farm-btn" onclick="event.stopPropagation();showDetail('${r.slug}')">View</button></td></tr>`;
}).join('');
}
window.showDetail=function(slug){
const r=rows.find(x=>x.slug===slug);if(!r)return;
const det=document.getElementById('detail');det.classList.remove('hidden');
const live=D.live_rows&&D.live_rows.length?`<h4>Live Market Reference</h4><p>${D.live_rows.slice(0,5).map(l=>`${l.name}: $${(l.mcap_usd/1e6).toFixed(0)}M`).join(' · ')}</p>`:'';
document.getElementById('detailContent').innerHTML=`<h3>${r.name}</h3><p><strong>Rank #${r.rank}</strong> · Implied: ${fmt(r.implied_value_usd)}</p><p>TVL: ${fmt(r.tvl_usd)} · Category: ${r.category||'N/A'} · Chains: ${r.chains.join(', ')}</p><p>Age: ${r.age_days||'?'} days · Listed: ${r.listed_at||'Unknown'}</p><hr style="margin:1rem 0;border-color:#334155"><h4>Farm Plan</h4><ol>${['Visit the dApp and connect wallet on '+r.chains[0],'Deposit $100-500 in primary pool','Use core features regularly over 4-8 weeks','Interact on all supported chains: '+r.chains.join(', '),'Join Discord and governance forum','Monitor announcements for TGE signals','Maintain positions above dust until token launch'].map(s=>`<li>${s}</li>`).join('')}</ol>${live}`;
};
document.getElementById('closeDetail').onclick=()=>document.getElementById('detail').classList.add('hidden');
[catSel,chainSel].forEach(el=>el.onchange=()=>render());
searchEl.oninput=()=>render();
render();
})();
