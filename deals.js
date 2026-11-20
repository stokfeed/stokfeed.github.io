/* SEC-backed event research. Every source link points to its original filing. */
(() => {
  'use strict';
  const form = document.getElementById('deal-search');
  const area = document.getElementById('deal-results');
  if (!form || !area) return;
  const api = 'https://zeos.stokfeed.us/v1/research/filings';
  const node = (tag, text, cls) => {
    const el=document.createElement(tag);
    if (cls) el.className=cls;
    if (text != null) el.textContent=text;
    return el;
  };
  const sourceLink = (url, label='Original filing') => {
    const anchor=node('a',label);
    if (typeof url === 'string' && url.startsWith('https://www.sec.gov/Archives/')) {
      anchor.href=url;
      anchor.target='_blank';
      anchor.rel='noopener noreferrer';
    } else anchor.removeAttribute('href');
    return anchor;
  };
  let requestId=0;
  async function lookup(symbol) {
    const thisRequest=++requestId;
    area.replaceChildren(node('p',`Reading ${symbol} filings…`,'deals-status'));
    try {
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),18000);
      let response;
      try { response=await fetch(`${api}?symbol=${encodeURIComponent(symbol)}`, {signal:controller.signal,headers:{Accept:'application/json'}}); }
      finally {clearTimeout(timer);}
      const data=await response.json();
      if(thisRequest!==requestId)return;
      if(!response.ok)throw Error(data?.error==='ticker_not_found'?'Ticker not found in SEC company filings.':'Unable to retrieve SEC filings for this ticker right now.');
      area.replaceChildren();
      const intro=node('div',null,'deal-result-head');
      intro.append(node('span',data.symbol,'deal-ticker'),node('h2',data.company));
      intro.append(node('p','Source: SEC EDGAR. Filing dates and company accounts are historical; classifications are not deal-value estimates.'));
      area.append(intro);
      if(!data.events?.length){area.append(node('p','No relevant transaction or offering forms were found in the most recent SEC submissions returned for this company.'));return;}
      const list=node('div',null,'deal-card-list');
      for(const [i,event] of data.events.slice(0,12).entries()){
        const card=node('article',null,'deal-card');
        card.append(node('span',`${event.form} · ${event.filed}`,'deal-kicker'));
        card.append(node('h3',event.headline));
        card.append(node('p',event.interpretation));
        const fragment=data.articleFragments?.find(x=>x.sourceUrl===event.sourceUrl);
        if(fragment&&i<4){
          const more=node('details',null,'deal-interpretation');
          more.append(node('summary','Read the rule-based analysis'));
          for(const paragraph of fragment.paragraphs||[])more.append(node('p',paragraph));
          card.append(more);
        }
        card.append(sourceLink(event.sourceUrl));
        list.append(card);
      }
      area.append(list);
      const balance=data.balanceSheet||{};
      if(balance.assets?.date===balance.liabilities?.date){
        const val=balance.assets.value-balance.liabilities.value;
        area.append(node('p',`Accounting assets less liabilities: ${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:2}).format(val)} as of ${balance.assets.date}. This is book equity, not a valuation of publicly traded holdings.`,'deal-balance'));
      }
    }catch(error){if(thisRequest===requestId)area.replaceChildren(node('p',error?.name==='AbortError'?'The filing lookup timed out. Please try again.':String(error?.message||'Unable to load this report.'),'deal-error'));}
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const sym=String(new FormData(form).get('symbol')||'').trim().toUpperCase();
    if(!/^(?:[A-Z][A-Z0-9.\-]{0,9}|(?:CIK)?[0-9]{1,10})$/.test(sym)){area.replaceChildren(node('p','Enter a valid U.S. stock ticker.','deal-error'));return;}
    const url=new URL(location.href);url.searchParams.set('symbol',sym);history.replaceState(null,'',url);
    lookup(sym);
  });
  const initial=new URL(location.href).searchParams.get('symbol');
  if(initial&&/^(?:[a-z][a-z0-9.\-]{0,9}|(?:CIK)?[0-9]{1,10})$/i.test(initial)){form.querySelector('[name=symbol]').value=initial.toUpperCase();lookup(initial.toUpperCase());}
})();
