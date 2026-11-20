/* Stokfeed — accessible stock research client; all external data passes through Zeos. */
(() => {
  'use strict';
  const endpoint='https://zeos.stokfeed.us/v1/research/stock';
  const form=document.getElementById('sf-stock-form');
  const result=document.getElementById('sf-stock-result');
  if(!form||!result)return;
  const create=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=String(text);return el;};
  const number=(value,digits=1)=>typeof value==='number'&&Number.isFinite(value)?new Intl.NumberFormat('en-US',{maximumFractionDigits:digits}).format(value):'Not available';
  const percent=(value)=>typeof value==='number'&&Number.isFinite(value)?`${value>0?'+':''}${number(value,1)}%`:'Not available';
  let controller;
  function paint(payload){
    const header=create('div','sf-result-header');header.append(create('span','sf-eyebrow','STOKFEED RESEARCH'),create('h2',null,`${payload.name||payload.symbol} (${payload.symbol})`),create('p',null,`Financial comparisons: ${payload.period==='quarterly'?'quarterly':'annual'} · ${payload.asOf||'latest available filing'}`));
    const body=create('div');body.append(header);
    const metrics=payload.metrics||{};
    const items=[['Latest close',metrics.price?.value==null?'Not available':`$${number(metrics.price.value,2)}`],['Daily price change',percent(metrics.price?.dailyChangePct)],['Revenue',metrics.revenue?.value==null?'Not available':`$${number(metrics.revenue.value/1e9,2)}B`],['Revenue change',percent(metrics.revenue?.changePct)],['Net margin',percent(metrics.netMarginPct)],['Net income',metrics.netIncome?.value==null?'Not available':`$${number(metrics.netIncome.value/1e9,2)}B`],['1-year return',percent(metrics.priceHistory?.return1yPct)],['52-week high',metrics.priceHistory?.high52w==null?'Not available':`$${number(metrics.priceHistory.high52w,2)}`],['Historical volatility',percent(metrics.priceHistory?.realizedVolatilityPct)],['Trailing P/E',metrics.priceHistory?.trailingPE==null?'Not available':number(metrics.priceHistory.trailingPE,2)]];
    const cards=create('div','sf-stats');for(const [label,value] of items){const card=create('div','sf-stat');card.append(create('small',null,label),create('strong',null,value));cards.append(card);}body.append(cards);
    for(const fragment of payload.fragments||[]){if(!fragment||typeof fragment.title!=='string'||typeof fragment.body!=='string')continue;body.append(create('h3',null,fragment.title),create('p',null,fragment.body));}
    if(Array.isArray(payload.warnings)&&payload.warnings.length){body.append(create('h3',null,'Data coverage'));for(const w of payload.warnings)body.append(create('p','sf-unknown',w));}
    const sources=create('div','sf-data-source');sources.textContent=`Sources: ${(payload.sources||[]).map(s=>s.name||'Public data').join(' · ')}. Figures reflect available filings and observations, not a live trading quote.`;body.append(sources);
    result.replaceChildren(body);
  }
  function getSelected(){const list=[...form.querySelectorAll('input[name="section"]:checked')].map(n=>n.value);return list.length?list:[];}
  async function request(){
    const symbol=form.elements.symbol.value.trim().toUpperCase();const period=form.elements.period.value;const sections=getSelected();
    if(!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(symbol)){result.replaceChildren(create('p','sf-error','Enter a valid U.S. stock symbol.'));return;}
    if(!sections.length){result.replaceChildren(create('p','sf-error','Select at least one report section.'));return;}
    if(controller)controller.abort();controller=new AbortController();
    const button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Generating…';
    result.replaceChildren(create('h2',null,`Researching ${symbol}`),create('p',null,'Retrieving dated market and financial disclosures…'));
    const uri=new URL(endpoint);uri.searchParams.set('symbol',symbol);uri.searchParams.set('period',period);uri.searchParams.set('sections',sections.join(','));
    try{
      const response=await fetch(uri.toString(),{headers:{Accept:'application/json'},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});
      const data=await response.json();if(!response.ok)throw Error(typeof data.message==='string'?data.message:'Research is temporarily unavailable.');
      if(data.symbol!==symbol||!Array.isArray(data.fragments))throw Error('Unexpected report response');
      paint(data);const address=new URL(location.href);address.searchParams.set('symbol',symbol);history.replaceState(null,'',address);
    }catch(error){if(error.name==='AbortError')return;const message=error.name==='TimeoutError'?'The request timed out. Please try again.':String(error.message||error);result.replaceChildren(create('h2',null,'Report unavailable'),create('p','sf-error',message));}
    finally{button.disabled=false;button.textContent='Generate summary';}
  }
  form.addEventListener('submit',event=>{event.preventDefault();void request();});
  const initial=new URL(location.href).searchParams.get('symbol');if(initial&&/^[A-Za-z][A-Za-z0-9.\-]{0,9}$/.test(initial)){form.elements.symbol.value=initial.toUpperCase();void request();}
})();
