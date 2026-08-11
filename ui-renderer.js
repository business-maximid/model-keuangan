'use strict';
const UIRenderer=(()=>{
  let activeCurrency='IDR';
  let currentModel=null;
  let activeHelpSection='';
  let helpReturnFocus=null;
  const numberFmt=v=>FinancialEngine.formatMoney(v);
  const money=v=>FinancialEngine.formatCurrencyFull(v);
  const tableMoney=v=>FinancialEngine.formatMoney(v);
  const compactMoney=v=>FinancialEngine.formatCurrencyCompact(v);
  const currency=()=>activeCurrency;
  const labelWithCurrency=s=>String(s).replaceAll('THB', activeCurrency).replaceAll('BRL', activeCurrency).replaceAll('RUB', activeCurrency).replaceAll('₽', activeCurrency);
  const pct=v=>FinancialEngine.formatPercent(v);
  const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;');
  let tooltipSeq=0;
  function infoTooltip(text,className=''){
    const raw=String(text??'');
    const id='info-tooltip-'+(++tooltipSeq);
    const aria=esc(raw.replace(/\s+/g,' ').trim());
    const body=esc(raw).replace(/\n/g,'<br>');
    const cls=className?' '+className:'';
    return `<button class="info-tooltip${cls}" type="button" aria-label="${aria}" aria-describedby="${id}"><span class="info-tooltip-mark" aria-hidden="true">?</span><span id="${id}" class="info-tooltip-bubble" role="tooltip">${body}</span></button>`;
  }

  const ICONS={
    briefcase:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7V6a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v1"/><rect x="4" y="7" width="16" height="13" rx="3"/><path d="M4 12h16M10 12v2h4v-2"/></svg>`,
    target:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>`,
    profit:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17l5-5 4 4 7-9"/><path d="M15 7h5v5"/><path d="M5 21h14"/></svg>`,
    roi:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7"/><circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/></svg>`,
    calendar:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>`,
    growth:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16"/><path d="M6 15l4-4 3 3 5-7"/><path d="M15 7h3v3"/></svg>`,
    coin:`<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="7" rx="6" ry="3"/><path d="M6 7v7c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M6 11c0 1.7 2.7 3 6 3s6-1.3 6-3"/></svg>`,
    balance:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M5 7h14M8 7l-4 7h8L8 7zM16 7l-4 7h8l-4-7z"/></svg>`,
    pie:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none"/><path d="M12 12V3.5" stroke-linecap="round"/><path d="M12 12l7.4 4.3" stroke-linecap="round"/><path d="M12 12a8.5 8.5 0 0 1 7.4 4.3" fill="none"/></svg>`,
    calculator:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="3"/><rect x="8" y="6" width="8" height="3" rx="1"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" stroke-linecap="round" stroke-width="2.2"/></svg>`,
    city:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16"/><path d="M6 20V8.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2V20"/><path d="M9 10h.01M12 10h.01M15 10h.01M9 14h.01M12 14h.01M15 14h.01" stroke-linecap="round" stroke-width="2.2"/><path d="M10 20v-3.2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20"/></svg>`,
    settings:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7.1 4l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 0 1 0 4H21a1.7 1.7 0 0 0-1.6 1z"/></svg>`,
    info:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10.5v6"/><path d="M12 7.2h.01" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    megaphone:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h3l8-5v10l-8-5H4z"/><path d="M15 9v6"/><path d="M7 14l1.2 4.2a1.2 1.2 0 0 0 1.2.8h.9"/><path d="M18 10.5a3 3 0 0 1 0 3"/></svg>`,
    office:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16"/><path d="M7 20V6.5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 17 6.5V20"/><path d="M10 9h.01M14 9h.01M10 13h.01M14 13h.01" stroke-linecap="round" stroke-width="2"/><path d="M11 20v-3h2v3"/></svg>`,
    user:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19a6.5 6.5 0 0 1 13 0"/></svg>`,
    headset:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13a7 7 0 0 1 14 0"/><path d="M5 13v4a2 2 0 0 0 2 2h1v-6H7a2 2 0 0 0-2 2z"/><path d="M19 13v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z"/><path d="M9 19h6"/></svg>`,
    message:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H11l-4 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"/><path d="M8 11.5h8M8 14.5h5"/></svg>`
  };
  const icon=name=>ICONS[name]||'';

  function initialFeeHelp(model){
    const population=Number(model?.assumptions?.population)||0;
    const base=FinancialEngine.initialPaymentBaseForPopulation(population);
    const total=Number(model?.summary?.initialPayment)||FinancialEngine.initialPaymentForPopulation(population);
    const vat=Math.max(0,total-base);
    return Localization.t('tooltipInitialPurchase',{base:tableMoney(base),vat:tableMoney(vat),total:tableMoney(total)});
  }
  function netProfitHelp(model){
    return model?.summary?.breakEvenPeriod
      ? Localization.t('tooltipNetProfitPositive',{month:Localization.formatMonthOrdinal(model.summary.breakEvenPeriod)})
      : Localization.t('tooltipNetProfitNotPositive');
  }

  function tableRows(model){
    const fixedTooltipKeys={office_rent:'tooltipOffice',manager_salary:'tooltipManager',assistente:'tooltipAssistant'};
    const fixedExpenseRows=(model.assumptions.expenseRows||[]).filter(r=>r.showInModel!==false).map(r=>({section:'expenses',customExpense:true,expenseId:r.id,labelText:Localization.t(r.name),value:m=>m.fixedExpenses?.[r.id]||0,fmt:tableMoney,currencyLabel:true,tooltip:fixedTooltipKeys[r.id]||null,removable:r.removable!==false}));
    const expenseById=new Map(fixedExpenseRows.map(row=>[row.expenseId,row]));
    const officeRow=expenseById.get('office_rent');
    const managerRow=expenseById.get('manager_salary');
    const assistantRow=expenseById.get('assistente');
    const otherFixedExpenseRows=fixedExpenseRows.filter(r=>!['office_rent','manager_salary','assistente'].includes(r.expenseId));
    const firstExpenseRow=officeRow||managerRow||assistantRow||otherFixedExpenseRows[0];
    const decorateExpenseRow=row=>row===firstExpenseRow?{...row,icon:'calculator',title:'operatingExpenses'}:row;
    return [
      {section:'investment',icon:'briefcase',title:'investment',label:'initialPurchase',value:m=>m.initialPurchase,fmt:tableMoney,currencyLabel:true,tooltip:initialFeeHelp,detailTopic:'initial-fee'},
      {section:'investment',label:'marketingInvestment',value:m=>m.marketingInvestment,fmt:tableMoney,currencyLabel:true,tooltip:'tooltipMarketing',marketing:true},
      {section:'investment',label:'attributesInvestment',value:m=>m.uniformInvestment||0,fmt:tableMoney,currencyLabel:true,tooltip:'tooltipUniformInvestment',detailTopic:'uniform'},
      {section:'operations',icon:'growth',title:'orderIndicators',label:'uniformSales',value:m=>m.uniformSales||0,fmt:tableMoney,currencyLabel:true,financial:true,tooltip:'tooltipUniformSales'},
      {section:'operations',label:'ridesPerDay',value:m=>m.ridesPerDay,fmt:numberFmt,tooltip:'tooltipRidesPerDay'},
      {section:'operations',label:'ridesPerMonth',value:m=>m.ridesPerMonth,fmt:numberFmt,tooltip:'tooltipRidesPerMonth'},
      {section:'operations',label:'commissionFromCompletedRidesValue',value:m=>m.commissionFromRides,fmt:tableMoney,currencyLabel:true,financial:true,tooltip:'tooltipCommissionFromRides'},
      ...(officeRow?[decorateExpenseRow(officeRow)]:[]),
      ...(managerRow?[decorateExpenseRow(managerRow)]:[]),
      ...(assistantRow?[decorateExpenseRow(assistantRow)]:[]),
      {section:'expenses',label:'smsExpense',value:m=>m.smsExpense,fmt:tableMoney,currencyLabel:true,tooltip:'tooltipSms'},
      ...otherFixedExpenseRows.map(decorateExpenseRow),
      {section:'expenses',label:'royaltyCombined',value:m=>m.maximRevenue,fmt:tableMoney,currencyLabel:true,tooltip:'tooltipRoyalty'},
      {section:'expenses',label:'totalOperatingExpenses',value:m=>Math.max(0,m.opEx-m.marketingExpense-(m.uniformInvestment||0))+m.maximRevenue,fmt:tableMoney,currencyLabel:true,tooltip:'tooltipTotalOperatingExpenses',subtotal:true,total:true},
      {section:'profit',icon:'profit',title:'profitCash',label:'netProfit',value:m=>m.netProfit,fmt:tableMoney,currencyLabel:true,tooltip:netProfitHelp,subtotal:true,total:true,sign:true},
      {section:'profit',label:'accumulatedCashFlow',value:m=>m.accumulated,fmt:tableMoney,currencyLabel:true,tooltip:'tooltipAccumulatedProfit',subtotal:true,total:true,sign:true}
    ];
  }
  function rowTooltipText(row,model){
    if(!row.tooltip)return '';
    return typeof row.tooltip==='function'?row.tooltip(model):Localization.t(row.tooltip);
  }
  function rowLabelHtml(row,model){
    const label=labelWithCurrency(row.labelText||Localization.t(row.label));
    if(row.label==='marketingInvestment'){
      const aria=Localization.t('openAdvertisingGuide');
      return `<button class="marketing-metric-button" type="button" data-marketing-help aria-label="${esc(aria)}" title="${esc(aria)}"><span class="marketing-metric-label-main">${esc(label)}</span></button>`;
    }
    if(row.detailTopic){
      const aria=Localization.t(row.detailTopic==='uniform'?'openUniformGuide':'openInitialFeeGuide');
      return `<button class="marketing-metric-button" type="button" data-detail-help="${esc(row.detailTopic)}" aria-label="${esc(aria)}" title="${esc(aria)}"><span class="marketing-metric-label-main">${esc(label)}</span></button>`;
    }
    return `<span class="table-metric-label"><span>${esc(label)}</span></span>`;
  }
  function getDisplayMonths(model){
    const setup=model.months[0];
    const preparation=model.months[1];
    const combined={...preparation,key:'setupPreparation',monthNo:0,isSetup:false,isPrep:true,isCombinedPreOpening:true};
    const numericKeys=['investment','initialPurchase','marketingInvestment','netProfit','netCashFlow'];
    numericKeys.forEach(k=>{combined[k]=(setup?.[k]||0)+(preparation?.[k]||0)});
    combined.accumulated=preparation?.accumulated ?? setup?.accumulated ?? 0;
    combined.marketingPct=0;
    combined.ridesPct=0;
    return [combined,...model.months.slice(2)];
  }
  function shouldBlankCombined(row,m){return m.isCombinedPreOpening&&['operations','expenses'].includes(row.section)}
  function getTableRows(model){return tableRows(model).map(r=>({label:r.labelText||Localization.t(r.label),value:m=>r.value(m)}))}
  const sectionIconFor=(section)=>({investment:'briefcase',operations:'growth',expenses:'calculator',profit:'profit'}[section]||'briefcase');
  const rowHelpIconName=row=>{
    if(row.customExpense){
      if(row.expenseId==='office_rent')return 'office';
      if(row.expenseId==='manager_salary')return 'user';
      if(row.expenseId==='assistente')return 'headset';
    }
    if(row.label==='initialPurchase')return 'briefcase';
    if(row.label==='marketingInvestment')return 'megaphone';
    if(row.label==='attributesInvestment')return 'user';
    if(row.label==='uniformSales')return 'coin';
    if(row.label==='ridesPerDay')return 'growth';
    if(row.label==='ridesPerMonth')return 'calendar';
    if(row.label==='commissionFromCompletedRidesValue')return 'coin';
    if(row.label==='smsExpense')return 'message';
    if(row.label==='royaltyCombined')return 'pie';
    if(row.label==='totalOperatingExpenses')return 'calculator';
    if(row.label==='netProfit')return 'profit';
    if(row.label==='accumulatedCashFlow')return 'balance';
    return sectionIconFor(row.section);
  };
  const helpTextToHtml=text=>esc(String(text??'')).replace(/\n/g,'<br>');
  function buildRoyaltyTable(){
    return `<div class="section-help-table-wrap"><table class="section-help-table"><thead><tr><th>${esc(Localization.t('royaltyTableRevenueBand'))}</th><th>${esc(Localization.t('royaltyTableRate'))}</th></tr></thead><tbody><tr><td>${esc(Localization.t('royaltyBandUpTo7'))}</td><td>0%</td></tr><tr><td>${esc(Localization.t('royaltyBand7to12'))}</td><td>15%</td></tr><tr><td>${esc(Localization.t('royaltyBand12to17'))}</td><td>20%</td></tr><tr><td>${esc(Localization.t('royaltyBand17to22'))}</td><td>25%</td></tr><tr><td>${esc(Localization.t('royaltyBandAbove22'))}</td><td>30%</td></tr></tbody></table></div>`;
  }
  const sectionTitleHtml=(row)=>{
    const title=Localization.t(row.title);
    const aria=Localization.t('openSectionHelp',{section:title});
    return `<div class="section-title-wrap"><button class="section-title-button" type="button" data-section-help="${esc(row.section)}" aria-label="${esc(aria)}" title="${esc(aria)}"><span class="section-badge" aria-hidden="true">${icon(sectionIconFor(row.section))}</span><span class="section-title-copy"><span class="section-text">${esc(title)}</span><span class="section-action-text">${esc(Localization.t('sectionHelpAction'))}</span></span></button></div>`;
  };
  function sectionHelpRows(section,model){
    return tableRows(model).filter(row=>row.section===section).map(row=>{
      const label=labelWithCurrency(row.labelText||Localization.t(row.label));
      const description=rowTooltipText(row,model);
      const item={label,description,iconName:rowHelpIconName(row),note:'',table:''};
      if(row.section==='operations'&&row.currencyLabel){
        item.note=Localization.t('sectionHelpMetricCurrency');
      }
      if(row.label==='royaltyCombined'){
        item.table=buildRoyaltyTable();
      }
      return item;
    }).filter(item=>item.description);
  }
  function populateSectionHelp(section){
    const modal=document.getElementById('sectionHelpModal');
    if(!modal||!currentModel)return;
    const rows=tableRows(currentModel).filter(row=>row.section===section);
    if(!rows.length)return;
    const first=rows[0];
    const title=Localization.t(first.title);
    modal.dataset.section=section;
    const titleEl=document.getElementById('sectionHelpTitle');
    const subtitleEl=document.getElementById('sectionHelpSubtitle');
    const iconEl=document.getElementById('sectionHelpIcon');
    const listEl=document.getElementById('sectionHelpList');
    const eyebrowEl=document.getElementById('sectionHelpEyebrow');
    const currencyEl=document.getElementById('sectionHelpCurrency');
    if(eyebrowEl)eyebrowEl.textContent=Localization.t('sectionHelpEyebrow');
    if(currencyEl){
      const showCurrency=['investment','expenses','profit'].includes(section);
      currencyEl.hidden=!showCurrency;
      currencyEl.textContent=Localization.t('sectionCurrencyNote');
    }
    if(titleEl)titleEl.textContent=title;
    if(subtitleEl)subtitleEl.textContent=Localization.t('sectionHelpSubtitle');
    if(iconEl)iconEl.innerHTML=icon(sectionIconFor(section));
    if(listEl){
      listEl.innerHTML=sectionHelpRows(section,currentModel).map(item=>`<article class="section-help-item"><div class="section-help-item-icon" aria-hidden="true">${icon(item.iconName)}</div><div class="section-help-item-copy"><h3>${esc(item.label)}</h3><p>${helpTextToHtml(item.description)}</p>${item.note?`<div class="section-help-inline-note">${esc(item.note)}</div>`:''}${item.table||''}</div></article>`).join('');
    }
  }
  function openSectionHelp(section,trigger){
    const modal=document.getElementById('sectionHelpModal');
    if(!modal||!currentModel)return;
    activeHelpSection=section;
    helpReturnFocus=trigger||document.activeElement;
    populateSectionHelp(section);
    modal.hidden=false;
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('section-help-open');
    requestAnimationFrame(()=>modal.querySelector('[data-close-section-help]')?.focus());
  }
  function closeSectionHelp(){
    const modal=document.getElementById('sectionHelpModal');
    if(!modal||modal.hidden)return;
    modal.hidden=true;
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('section-help-open');
    activeHelpSection='';
    const target=helpReturnFocus;
    helpReturnFocus=null;
    if(target&&typeof target.focus==='function')requestAnimationFrame(()=>target.focus());
  }
  const advertisingMaterials=[
    {key:'adMaterialCarBranding',share:.10},
    {key:'adMaterialBaliho',share:.25},
    {key:'adMaterialPromoMerch',share:.05},
    {key:'adMaterialPrint',share:.25},
    {key:'adMaterialInternet',share:.15},
    {key:'adMaterialPromoActions',share:.20}
  ];
  let advertisingReturnFocus=null;
  function advertisingMonths(){
    if(!currentModel)return [];
    return (currentModel.months||[]).filter(m=>Number(m.monthNo)>=1&&Number(m.monthNo)<=12).sort((a,b)=>a.monthNo-b.monthNo);
  }
  function advertisingRoundUnit(total){
    const value=Math.abs(Math.round(Number(total)||0));
    if(value>=1000000&&value%50000===0)return 50000;
    if(value>=100000&&value%10000===0)return 10000;
    if(value>=10000&&value%1000===0)return 1000;
    return 1;
  }
  function allocateAdvertisingBudget(total){
    const budget=Math.max(0,Math.round(Number(total)||0));
    const unit=advertisingRoundUnit(budget);
    const values=advertisingMaterials.map(item=>Math.round((budget*item.share)/unit)*unit);
    const diff=budget-values.reduce((sum,value)=>sum+value,0);
    // Put any rounding residual into printed advertising: it is one of the largest and most flexible categories.
    values[3]+=diff;
    return values;
  }
  function advertisingOverviewHtml(){
    return `<div class="advertising-overview"><p class="advertising-intro">${esc(Localization.t('advertisingGuideIntro'))}</p><div class="advertising-choice-grid"><button class="advertising-choice-card" type="button" data-advertising-view="plan"><span class="advertising-choice-icon" aria-hidden="true">${icon('calendar')}</span><span class="advertising-choice-copy"><strong>${esc(Localization.t('advertisingPlanButton'))}</strong><small>${esc(Localization.t('advertisingPlanButtonHint'))}</small></span><span class="advertising-choice-arrow" aria-hidden="true">›</span></button><button class="advertising-choice-card" type="button" data-advertising-view="brandbook"><span class="advertising-choice-icon" aria-hidden="true">${icon('briefcase')}</span><span class="advertising-choice-copy"><strong>${esc(Localization.t('brandbookButton'))}</strong><small>${esc(Localization.t('brandbookButtonHint'))}</small></span><span class="advertising-choice-arrow" aria-hidden="true">›</span></button></div></div>`;
  }
  function advertisingPlanHtml(){
    const months=advertisingMonths();
    const monthlyAllocations=months.map(m=>allocateAdvertisingBudget(m.marketingInvestment));
    const header=months.map(m=>`<th>${esc(Localization.t('advertisingMonthShort',{n:m.monthNo}))}</th>`).join('');
    const rows=advertisingMaterials.map((item,rowIndex)=>`<tr><th>${esc(Localization.t(item.key))}</th>${monthlyAllocations.map(values=>`<td>${tableMoney(values[rowIndex])}</td>`).join('')}</tr>`).join('');
    const totals=`<tr class="advertising-plan-total"><th>${esc(Localization.t('directInvestmentTotal'))}</th>${months.map(m=>`<td>${tableMoney(m.marketingInvestment)}</td>`).join('')}</tr>`;
    return `<div class="advertising-view"><button class="advertising-back-button" type="button" data-advertising-view="overview">← ${esc(Localization.t('back'))}</button><div class="advertising-view-heading"><h3>${esc(Localization.t('advertisingPlanTitle'))}</h3><p>${esc(Localization.t('advertisingPlanIntro'))}</p><div class="advertising-currency-note">${esc(Localization.t('advertisingPlanCurrency'))}</div></div><div class="advertising-table-scroll"><table class="advertising-plan-table"><thead><tr><th>${esc(Localization.t('advertisingMaterial'))}</th>${header}</tr></thead><tbody>${rows}${totals}</tbody></table></div></div>`;
  }
  function brandbookHtml(){
    const items=[
      {titleKey:'adMaterialCarBranding', image:'assets/brandbook/branded-car.jpg', altKey:'brandbookCarAlt', captionKey:'brandbookCarCaption'},
      {titleKey:'brandbookBalihoTitle', image:'assets/brandbook/baliho-banner.jpg', altKey:'brandbookBalihoAlt', captionKey:'brandbookBalihoCaption'},
      {titleKey:'brandbookPromoMerchTitle', image:'assets/brandbook/promo-merch.jpg', altKey:'brandbookPromoMerchAlt', captionKey:'brandbookPromoMerchCaption'},
      {titleKey:'brandbookHooliganTitle', image:'assets/brandbook/hooligan-banners.jpg', altKey:'brandbookHooliganAlt', captionKey:'brandbookHooliganCaption'},
      {titleKey:'brandbookPromotersTitle', image:'assets/brandbook/promoters.jpg', altKey:'brandbookPromotersAlt', captionKey:'brandbookPromotersCaption'},
      {titleKey:'brandbookPartnerTitle', image:'assets/brandbook/partner-advertising.jpg', altKey:'brandbookPartnerAlt', captionKey:'brandbookPartnerCaption'}
    ];
    const cards=items.map(item=>`<article class="brandbook-card"><div class="brandbook-card-copy brandbook-card-copy-top"><h4>${esc(Localization.t(item.titleKey))}</h4></div><div class="brandbook-image-wrap"><img src="${item.image}" alt="${esc(Localization.t(item.altKey))}"></div><div class="brandbook-card-copy brandbook-card-copy-bottom"><p>${esc(Localization.t(item.captionKey))}</p></div></article>`).join('');
    return `<div class="advertising-view"><button class="advertising-back-button" type="button" data-advertising-view="overview">← ${esc(Localization.t('back'))}</button><div class="advertising-view-heading"><h3>${esc(Localization.t('brandbookTitle'))}</h3><p>${esc(Localization.t('brandbookIntro'))}</p></div><div class="brandbook-gallery">${cards}</div></div>`;
  }
  function populateAdvertisingModal(view='overview'){
    const body=document.getElementById('advertisingModalBody');
    if(!body)return;
    if(view==='plan')body.innerHTML=advertisingPlanHtml();
    else if(view==='brandbook')body.innerHTML=brandbookHtml();
    else body.innerHTML=advertisingOverviewHtml();
    const title=document.getElementById('advertisingTitle');
    if(title)title.textContent=view==='plan'?Localization.t('advertisingPlanTitle'):view==='brandbook'?Localization.t('brandbookTitle'):Localization.t('advertisingGuideTitle');
  }
  function openAdvertisingHelp(trigger){
    const modal=document.getElementById('advertisingModal');
    if(!modal||!currentModel)return;
    advertisingReturnFocus=trigger||document.activeElement;
    populateAdvertisingModal('overview');
    modal.hidden=false;
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('advertising-modal-open');
    requestAnimationFrame(()=>modal.querySelector('[data-close-advertising]')?.focus());
  }
  function closeAdvertisingHelp(){
    const modal=document.getElementById('advertisingModal');
    if(!modal||modal.hidden)return;
    modal.hidden=true;
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('advertising-modal-open');
    const target=advertisingReturnFocus;
    advertisingReturnFocus=null;
    if(target&&typeof target.focus==='function')requestAnimationFrame(()=>target.focus());
  }
  function renderKpis(model,state){
    const grid=document.getElementById('kpiGrid');
    if(!grid)return;
    const cities=Array.isArray(window.CityData)?window.CityData:[];
    const city=cities.find(x=>x.id===state.selectedCityId)||state.selectedCitySnapshot||null;
    const fmtNum=v=>Math.round(Number(v)||0).toLocaleString(Localization.numberLocale());
    const cityName=city?`${esc(city.city)}, ${esc(city.state)}`:'—';
    const cityPopulation=city?fmtNum(city.population):fmtNum(model.assumptions?.population||0);
    const cityInitialPayment=city?money(city.initialPayment):money(model.assumptions?.initialInvestment||0);
    const avgSub=`${Localization.t('averageMonthlyInvestment')}: ${compactMoney(model.summary.averageMonthlyInvestment||0)}`;
    const monthlyBreakEven=model.summary.breakEvenPeriod?Localization.t('monthlyBreakEvenValue',{n:Math.round(Number(model.summary.breakEvenPeriod))}):Localization.t('notAchieved12');
    const cityCard=`<article class="kpi-card city-context-card"><div class="kpi-icon">${icon('city')}</div><div class="city-context-content"><div class="kpi-label">${Localization.t('selectedCity')}</div><div class="city-context-name">${cityName}</div><div class="city-context-meta"><span><strong>${Localization.t('populationHeader')}:</strong> ${cityPopulation} · <strong>${Localization.t('initialPaymentHeader')}:</strong> ${cityInitialPayment}</span></div></div></article>`;
    const items=[
      {k:'initialInvestment',color:'yellow',icon:icon('briefcase'),val:model.summary.totalInvestment,sub:avgSub,fmt:v=>compactMoney(v)},
      {k:'breakEven',color:'green',icon:icon('target'),val:model.summary.paybackPeriod||0,sub:`${Localization.t('monthlyEquilibrium')}: ${monthlyBreakEven}`,fmt:v=>`${model.summary.paybackPeriod?Localization.formatMonthDuration(v):Localization.t('notAchieved12')}`},
      {k:'yearProfit',color:'blue',icon:icon('profit'),val:model.summary.netProfit,fmt:v=>compactMoney(v)},
      {k:'roi12',label:'kpiMargin',color:'purple',icon:icon('roi'),val:model.summary.roi,fmt:v=>`${Math.round(v)} %`}
    ];
    grid.innerHTML=cityCard+items.map(i=>`<article class="kpi-card ${i.color} kpi-${i.k}"><div class="kpi-icon">${i.icon}</div><div><div class="kpi-label">${Localization.t(i.label||i.k)}${i.tooltip?infoTooltip(i.tooltip,'kpi-title-tooltip'):''}</div><div class="kpi-value" id="kpi-${i.k}"></div>${i.sub?`<div class="kpi-sub">${i.sub}</div>`:''}</div></article>`).join('');
    items.forEach(i=>Animation.animateNumber(document.getElementById('kpi-'+i.k),i.k,i.val,i.fmt));
  }

  function buildInitialFeeTable(){
    return `<div class="section-help-table-wrap"><table class="section-help-table"><thead><tr><th>${esc(Localization.t('initialFeeTablePopulation'))}</th><th>${esc(Localization.t('initialFeeTableFee'))}</th></tr></thead><tbody><tr><td>${esc(Localization.t('initialFeeBandUpTo50k'))}</td><td>10 000 000</td></tr><tr><td>${esc(Localization.t('initialFeeBand50to100k'))}</td><td>15 000 000</td></tr><tr><td>${esc(Localization.t('initialFeeBand100to200k'))}</td><td>20 000 000</td></tr><tr><td>${esc(Localization.t('initialFeeBandAbove200k'))}</td><td>30 000 000</td></tr></tbody></table></div>`;
  }
  let detailReturnFocus=null;
  let activeDetailTopic='';
  function detailModalTitle(topic,view){
    if(topic==='uniform')return Localization.t('uniformGuideTitle');
    if(topic==='initial-fee'&&view==='package')return Localization.t('initialFeePackageTitle');
    if(topic==='initial-fee')return Localization.t('initialFeeGuideTitle');
    return '';
  }
  function uniformOverviewHtml(){
    return `<div class="advertising-overview"><p class="advertising-intro">${esc(Localization.t('uniformGuideIntro'))}</p><div class="brandbook-gallery detail-gallery-single"><article class="brandbook-card"><div class="brandbook-card-copy-top"><h4>${esc(Localization.t('uniformGuideImageTitle'))}</h4></div><div class="brandbook-image-wrap"><img src="assets/brandbook/uniform-drivers.jpg" alt="${esc(Localization.t('uniformGuideImageAlt'))}"></div><div class="brandbook-card-copy-bottom"><p>${esc(Localization.t('uniformGuideImageCaption'))}</p></div></article></div></div>`;
  }
  function initialFeeOverviewHtml(){
    return `<div class="advertising-overview"><p class="advertising-intro">${esc(Localization.t('initialFeeGuideIntro'))}</p><div class="advertising-view-heading detail-tight-heading"><h3>${esc(Localization.t('initialFeeTableTitle'))}</h3></div>${buildInitialFeeTable()}<div class="advertising-choice-grid detail-choice-single"><button class="advertising-choice-card" type="button" data-detail-view="package"><span class="advertising-choice-icon" aria-hidden="true">${icon('briefcase')}</span><span class="advertising-choice-copy"><strong>${esc(Localization.t('initialFeePackageButton'))}</strong><small>${esc(Localization.t('initialFeePackageButtonHint'))}</small></span><span class="advertising-choice-arrow" aria-hidden="true">›</span></button></div></div>`;
  }
  function initialFeePackageHtml(){
    const cards=[
      {titleKey:'initialFeePackageMockupsTitle', image:'assets/brandbook/start-package-mockups.png', altKey:'initialFeePackageMockupsAlt', captionKey:'initialFeePackageMockupsCaption'},
      {titleKey:'initialFeePackageDeliveredTitle', image:'assets/brandbook/start-package-delivered.png', altKey:'initialFeePackageDeliveredAlt', captionKey:'initialFeePackageDeliveredCaption'}
    ].map(item=>`<article class="brandbook-card"><div class="brandbook-card-copy-top"><h4>${esc(Localization.t(item.titleKey))}</h4></div><div class="brandbook-image-wrap"><img src="${item.image}" alt="${esc(Localization.t(item.altKey))}"></div><div class="brandbook-card-copy-bottom"><p>${esc(Localization.t(item.captionKey))}</p></div></article>`).join('');
    return `<div class="advertising-view"><button class="advertising-back-button" type="button" data-detail-view="overview">← ${esc(Localization.t('back'))}</button><div class="advertising-view-heading"><h3>${esc(Localization.t('initialFeePackageTitle'))}</h3><p>${esc(Localization.t('initialFeePackageIntro'))}</p></div><div class="brandbook-gallery">${cards}</div></div>`;
  }
  function populateDetailModal(topic,view='overview'){
    const body=document.getElementById('detailModalBody');
    if(!body)return;
    activeDetailTopic=topic;
    const modal=document.getElementById('detailModal');
    if(modal)modal.dataset.topic=topic;
    if(topic==='uniform')body.innerHTML=uniformOverviewHtml();
    else if(topic==='initial-fee'&&view==='package')body.innerHTML=initialFeePackageHtml();
    else if(topic==='initial-fee')body.innerHTML=initialFeeOverviewHtml();
    const title=document.getElementById('detailModalTitle');
    if(title)title.textContent=detailModalTitle(topic,view);
    const eyebrow=document.getElementById('detailModalEyebrow');
    if(eyebrow)eyebrow.textContent=topic==='uniform'?Localization.t('uniformGuideEyebrow'):Localization.t('initialFeeGuideEyebrow');
    const iconEl=document.getElementById('detailModalHeadIcon');
    if(iconEl)iconEl.textContent=topic==='uniform'?'👕':'📦';
  }
  function openDetailModal(topic,trigger){
    const modal=document.getElementById('detailModal');
    if(!modal)return;
    detailReturnFocus=trigger||document.activeElement;
    populateDetailModal(topic,'overview');
    modal.hidden=false;
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('advertising-modal-open');
    requestAnimationFrame(()=>modal.querySelector('[data-close-detail-modal]')?.focus());
  }
  function closeDetailModal(){
    const modal=document.getElementById('detailModal');
    if(!modal||modal.hidden)return;
    modal.hidden=true;
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('advertising-modal-open');
    const target=detailReturnFocus;
    detailReturnFocus=null;
    activeDetailTopic='';
    if(target&&typeof target.focus==='function')requestAnimationFrame(()=>target.focus());
  }

  function renderTable(model){const tbl=document.getElementById('modelTable');const displayMonths=getDisplayMonths(model);const heads=[Localization.t('setupPreparation'),...Array.from({length:12},(_,i)=>i+1)];const rows=tableRows(model);const colgroup='<colgroup><col class="col-section"><col class="col-metric">'+heads.map(()=>'<col class="col-period">').join('')+'</colgroup>';let html=`${colgroup}<thead><tr class="phase"><th colspan="2"></th><th colspan="1">${Localization.t('preOpening')}</th><th colspan="12">${Localization.t('growthPhase')}</th></tr><tr><th>${Localization.t('section')}</th><th>${Localization.t('month')}</th>${heads.map((h,i)=>`<th class="${model.summary.paybackKey===displayMonths[i]?.key?'breakeven':''}">${h}</th>`).join('')}</tr></thead><tbody>`;let last='';rows.forEach(row=>{const first=row.section!==last;last=row.section;const rowCls=[row.total?'table-total-row':'',row.financial?'table-financial-row':''].filter(Boolean).join(' ');html+=`<tr${rowCls?` class="${rowCls}"`:''}>${first?`<td class="row-label section-name section-title table-section-title ${row.section}" rowspan="${rows.filter(r=>r.section===row.section).length}">${sectionTitleHtml(row)}</td>`:''}<td class="row-label metric-name table-row-label ${row.section}">${rowLabelHtml(row,model)}</td>`;if(row.mergedTotal){const initialPayment=Number(model.summary.initialPayment)||0;const marketingTotal=Number(model.summary.totalMarketingInvestment)||0;const total=row.aggregateValue?row.aggregateValue(model):initialPayment+marketingTotal;html+=`<td data-recalc class="table-cell table-total-cell subtotal investment-period-total-cell" colspan="${heads.length}"><div class="investment-total-breakdown"><div class="investment-total-component"><span>${esc(Localization.t('initialPurchase'))}</span><strong>${row.fmt(initialPayment)}</strong></div><span class="investment-total-sign" aria-hidden="true">+</span><div class="investment-total-component"><span>${esc(Localization.t('marketingTotal12Months'))}</span><strong>${row.fmt(marketingTotal)}</strong></div><span class="investment-total-sign" aria-hidden="true">=</span><strong class="investment-total-value">${row.fmt(total)}</strong></div></td>`}else{displayMonths.forEach(m=>{const val=row.value(m);const blankCombined=shouldBlankCombined(row,m);const dashOnly=row.label==='initialPurchase'&&!m.isCombinedPreOpening;const empty=blankCombined||(m.isCombinedPreOpening&&row.label==='accumulatedCashFlow')||((m.isPrep||m.isSetup)&&val===0&&!['netCashFlow','accumulatedCashFlow'].includes(row.label));const editable=(row.marketingEditable||row.ridesEditable)&&!empty&&!dashOnly&&!m.isCombinedPreOpening;const cls=['table-cell',row.total?'table-total-cell':'',row.financial?'table-financial-cell':'',row.subtotal?'subtotal':'',row.sign?(val<0?'negative':val>0?'positive':''):'',model.summary.paybackKey===m.key?'breakeven':'',(empty||dashOnly)?'muted-cell':'',editable?'editable-month-cell':''].filter(Boolean).join(' ');let data='';if(row.marketingEditable&&editable)data=` data-month-edit="marketing" data-month-no="${m.monthNo}" data-current-pct="${m.marketingPct}" title="${esc(Localization.t('marketingDistributionPreset'))}"`;if(row.ridesEditable&&editable)data=` data-month-edit="rides" data-month-no="${m.monthNo}" data-current-pct="${m.ridesPct}" title="${esc(Localization.t('ridesDistributionPreset'))}"`;let content=dashOnly?'—':(empty?'':row.fmt(val,m));if(editable)content=`<div class="cell-absolute">${row.fmt(val,m)}</div>`;html+=`<td data-recalc class="${cls}"${data}>${content}</td>`})}html+='</tr>'});html+='</tbody>';tbl.innerHTML=html}
  function renderSummary(model){
    const header=document.querySelector('.summary-card h3');
    if(header){header.textContent=Localization.t('summary12');}
    const rows=[['totalInvestment',model.summary.totalInvestment,'currency'],['totalPartnerRevenue',model.summary.totalRevenue,'currency'],['summaryOperatingExpenses',model.summary.totalOperatingExpenses,'currency'],['netProfit',model.summary.netProfit,'currency'],['paybackPeriod',model.summary.paybackPeriod?Localization.formatMonthDuration(model.summary.paybackPeriod):Localization.t('notAchieved12'),'']];
    document.getElementById('summaryList').innerHTML=rows.map(r=>{
      const cls=r[0]==='summaryOperatingExpenses'?'summary-expense-row':(r[0]==='totalInvestment'?'summary-investment-row':'');
      const value=typeof r[1]==='number'?(r[2]==='%'?Math.round(r[1])+' %':money(r[1])):r[1];
      return `<div class="summary-row ${cls}"><span>${Localization.t(r[0])}</span><span>${value}</span></div>`;
    }).join('');
  }
  function getInsightRows(model){
    const a=model.assumptions||{};
    const s=model.summary||{};
    const recommendedBudget=Math.max(0,Number(s.recommendedMarketingBudget||a.recommendedMarketingBudget||0));
    const budget=Math.max(0,Number(a.marketingBudget||0));
    const budgetRatio=recommendedBudget>0?budget/recommendedBudget:0;
    const budgetPercent=Math.round(budgetRatio*100);
    const recommendedFare=Math.max(0.01,Number(a.recommendedAverageFare||FinancialEngine.recommendedAverageFareForPopulation(a.population,a.province)||1));
    const fare=Math.max(0.01,Number(a.averageFare||recommendedFare));
    const fareRatio=fare/recommendedFare;
    const recommendedCommission=Number(a.recommendedCommission??FinancialEngine.recommendedCommissionForPopulation(a.population,a.province));
    const commission=Number(a.commission||0);
    const commissionDiff=commission-recommendedCommission;
    const baseRides=Math.max(0,Number(s.baseTargetRidesDay||0));
    const targetRides=Math.max(0,Number(s.targetRidesDay||0));
    const demandRatio=baseRides>0?targetRides/baseRides:0;
    const breakEvenMonth=s.breakEvenPeriod?Localization.formatMonthOrdinal(s.breakEvenPeriod):Localization.t('notAchieved12');
    const paybackMonth=s.paybackPeriod?Localization.formatMonthOrdinal(s.paybackPeriod):Localization.t('notAchieved12');
    const rows=[];

    if(budget<=0){
      rows.push({icon:'briefcase',tone:'danger',title:'budgetZeroTitle',text:'budgetZeroInsight',vars:{}});
    }else if(budgetRatio<0.3){
      rows.push({icon:'briefcase',tone:'danger',title:'budgetCriticalTitle',text:'budgetCriticalInsight',vars:{percent:budgetPercent,recommended:compactMoney(recommendedBudget)}});
    }else if(budgetRatio<0.7){
      rows.push({icon:'briefcase',tone:'warning',title:'budgetBelowTitle',text:'budgetBelowInsight',vars:{percent:budgetPercent,recommended:compactMoney(recommendedBudget)}});
    }else if(budgetRatio<=1.3){
      rows.push({icon:'briefcase',tone:'success',title:'budgetBalancedTitle',text:'budgetBalancedInsight',vars:{percent:budgetPercent,recommended:compactMoney(recommendedBudget)}});
    }else{
      rows.push({icon:'briefcase',tone:'warning',title:'budgetExcessTitle',text:'budgetExcessInsight',vars:{percent:budgetPercent,recommended:compactMoney(recommendedBudget)}});
    }

    if(targetRides<=Math.max(1,baseRides*0.05)){
      rows.push({icon:'growth',tone:'danger',title:'noDemandGrowth',text:'noDemandGrowthText',vars:{}});
    }else{
      const constraints=[];
      if(fareRatio>1.1)constraints.push(Localization.t('fareAboveRecommendation',{percent:Math.round((fareRatio-1)*100)}));
      if(commissionDiff>3)constraints.push(Localization.t('commissionAboveRecommendation',{points:Math.round(commissionDiff*10)/10}));
      const supports=[];
      if(fareRatio<0.9)supports.push(Localization.t('fareBelowRecommendation',{percent:Math.round((1-fareRatio)*100)}));
      if(commissionDiff<-3)supports.push(Localization.t('commissionBelowRecommendation',{points:Math.round(Math.abs(commissionDiff)*10)/10}));
      const joiner=Localization.t('insightJoiner');
      if(constraints.length){
        rows.push({icon:'growth',tone:'warning',title:'parameterConstraintsTitle',text:'parameterConstraintsText',vars:{details:constraints.join(joiner),rides:Math.round(targetRides)}});
      }else if(supports.length){
        rows.push({icon:'growth',tone:'info',title:'demandSupportTitle',text:'demandSupportText',vars:{details:supports.join(joiner),rides:Math.round(targetRides)}});
      }else if(demandRatio>1.1){
        rows.push({icon:'growth',tone:'info',title:'marketCapacityTitle',text:'marketCapacityText',vars:{rides:Math.round(targetRides),base:Math.round(baseRides)}});
      }else if(demandRatio>=0.85){
        rows.push({icon:'growth',tone:'success',title:'balancedDemandTitle',text:'balancedDemandText',vars:{rides:Math.round(targetRides)}});
      }else{
        rows.push({icon:'growth',tone:'warning',title:'limitedDemandTitle',text:'limitedDemandText',vars:{rides:Math.round(targetRides),base:Math.round(baseRides)}});
      }
    }

    if(s.netProfit<0){
      rows.push({icon:'coin',tone:'danger',title:'negativeResult',text:'negativeResultText',vars:{profit:compactMoney(s.netProfit)}});
    }else if(s.roi<20){
      rows.push({icon:'coin',tone:'warning',title:'lowProfitability',text:'lowProfitabilityText',vars:{profit:compactMoney(s.netProfit),roi:Math.round(s.roi)+' %'}});
    }else if(s.roi<60){
      rows.push({icon:'coin',tone:'info',title:'moderateProfitability',text:'moderateProfitabilityText',vars:{profit:compactMoney(s.netProfit),roi:Math.round(s.roi)+' %'}});
    }else{
      rows.push({icon:'coin',tone:'success',title:'highProfitability',text:'profitText',vars:{profit:compactMoney(s.netProfit),roi:Math.round(s.roi)+' %'}});
    }

    if(s.paybackPeriod&&s.paybackPeriod<=6){
      rows.push({icon:'balance',tone:'success',title:'rapidPayback',text:'rapidPaybackText',vars:{month:paybackMonth}});
    }else if(s.paybackPeriod){
      rows.push({icon:'balance',tone:'success',title:'paybackWithinYear',text:'cashText',vars:{month:paybackMonth}});
    }else if(s.breakEvenPeriod){
      rows.push({icon:'balance',tone:'warning',title:'operatingPositiveNoPayback',text:'operatingPositiveNoPaybackText',vars:{month:breakEvenMonth}});
    }else{
      rows.push({icon:'balance',tone:'danger',title:'noPayback',text:'noPaybackText',vars:{}});
    }
    return rows;
  }
  function renderInsights(model){
    const rows=getInsightRows(model);
    const list=document.getElementById('insightsList');
    if(!list)return;
    const renderedRows=rows.map(row=>({
      ...row,
      renderedTitle:Localization.t(row.title),
      renderedText:Localization.t(row.text,row.vars||{})
    }));
    const totalLength=renderedRows.reduce((sum,row)=>sum+row.renderedTitle.length+row.renderedText.length,0);
    const longestText=renderedRows.reduce((max,row)=>Math.max(max,row.renderedText.length),0);
    list.dataset.density=(totalLength>760||longestText>250)?'very-dense':((totalLength>570||longestText>190)?'dense':'normal');
    list.innerHTML=renderedRows.map(row=>`<div class="insight" data-tone="${row.tone||'neutral'}"><div class="insight-badge">${icon(row.icon)}</div><div><div class="insight-title">${row.renderedTitle}</div><div class="insight-text">${row.renderedText}</div></div></div>`).join('');
  }
  const basic=['marketingBudget'];
  function inputLabel(k){if(k==='averageFare')return Localization.t('averageRidePrice');if(k==='commission')return Localization.t('commissionFromCompletedRidesPct');if(k==='initialInvestment')return Localization.t('initialInvestmentInput');return Localization.t(k)}
  function renderInputs(state,errors){
    const gridEl=document.getElementById('inputsGrid');
    const panel=document.getElementById('validationPanel');
    if(!gridEl){return}
    const normalized=FinancialEngine.normalizeAssumptions(state.activeScenario.assumptions);state.activeScenario.assumptions=normalized;
    const currencyHtml=`<div class="input-row fixed-currency-row"><label>${Localization.t('currency')}</label><strong>IDR</strong></div>`;
    const formHtml=basic.map(k=>`<div class="input-row ${errors[k]?'invalid':''}"><label for="input-${k}">${labelWithCurrency(inputLabel(k))}</label><input id="input-${k}" data-input="${k}" type="number" step="${['commission','percentagePopulationUsingService'].includes(k)?'0.01':'1'}" value="${normalized[k]}"></div>`).join('');
    const presetManager=`<div class="preset-manager"><div class="preset-row"><label>${Localization.t('marketingDistributionPreset')}</label><select data-preset="marketing"><option value="balanced" ${normalized.marketingDistributionPreset==='balanced'?'selected':''}>${Localization.t('balancedPreset')}</option><option value="launchHeavy" ${normalized.marketingDistributionPreset==='launchHeavy'?'selected':''}>${Localization.t('launchHeavyPreset')}</option><option value="growth" ${normalized.marketingDistributionPreset==='growth'?'selected':''}>${Localization.t('growthPreset')}</option><option value="manual" ${normalized.marketingDistributionPreset==='manual'?'selected':''}>${Localization.t('manualPreset')}</option></select></div><div class="preset-row"><label>${Localization.t('ridesDistributionPreset')}</label><select data-preset="rides"><option value="balanced" ${normalized.ridesDistributionPreset==='balanced'?'selected':''}>${Localization.t('balancedPreset')}</option><option value="slow" ${normalized.ridesDistributionPreset==='slow'?'selected':''}>${Localization.t('slowGrowthPreset')}</option><option value="aggressive" ${normalized.ridesDistributionPreset==='aggressive'?'selected':''}>${Localization.t('fastGrowthPreset')}</option><option value="manual" ${normalized.ridesDistributionPreset==='manual'?'selected':''}>${Localization.t('manualPreset')}</option></select></div><div class="preset-hint">${Localization.t('presetHint')}</div></div>`;
    const expenseRows=(normalized.expenseRows||[]).filter(r=>!r.hidden&&r.id!=='other_costs').map(r=>{
      const assistant=r.fixedType==='assistant'||r.id==='assistente';
      const fixed=assistant||r.removable===false||r.fixedType==='fixed';
      const displayName=fixed?Localization.t(r.name):r.name;
      const displayAmount=assistant
        ? '555 000 / 1 110 000 / 2 220 000'
        : (fixed?Math.round(Number(r.amount)||0).toLocaleString(Localization.numberLocale()):r.amount);
      return `<div class="expense-edit-row"><label class="expense-visible-toggle"><input type="checkbox" data-expense-visible="${r.id}" ${r.showInModel!==false?'checked':''} ${fixed?'disabled':''}> ${Localization.t('show')}</label><input class="expense-name" data-expense-name="${r.id}" value="${esc(displayName)}" aria-label="Expense name" ${fixed?'disabled':''}><input class="expense-amount" type="${fixed?'text':'number'}" data-expense-amount="${r.id}" value="${esc(displayAmount)}" aria-label="Expense amount" ${fixed?'disabled':''}><button class="btn danger expense-delete" data-expense-delete="${r.id}" ${r.removable===false?'disabled':''}>×</button></div>`
    }).join('');
    const expenseManager=`<div class="expense-manager"><div class="expense-manager-head"><strong>${Localization.t('operatingExpenses')}</strong><button class="btn secondary" id="addExpenseRow" type="button">${Localization.t('addRow')}</button></div>${expenseRows}</div>`;
    const revenueRules=(normalized.revenueRules||[]).map(r=>`<div class="revenue-rule-row"><span>${Localization.t('feeFrom')}</span><input type="number" data-rule-threshold="${r.id}" value="${r.threshold}"><span>${activeCurrency}</span><span>=</span><input type="number" data-rule-share="${r.id}" value="${r.maximShare}" min="0" max="100"><span>%</span><button class="btn danger revenue-rule-delete" data-rule-delete="${r.id}" ${r.removable===false?'disabled':''}>×</button></div>`).join('');
    const ruleManager=`<div class="revenue-rule-manager"><div class="expense-manager-head"><strong>${Localization.t('revenueDistributionRules')}</strong><button class="btn secondary" id="addRevenueRule" type="button">${Localization.t('addRule')}</button></div>${revenueRules}<div class="preset-hint">${Localization.t('revenueRulesHint')}</div></div>`;
    gridEl.innerHTML=formHtml+(state.advanced?'<div class="advanced-title">'+Localization.t('advancedSettings')+'</div>'+currencyHtml+presetManager+expenseManager:'');
    const list=Object.values(errors);if(panel){panel.hidden=!list.length;panel.innerHTML=list.join('<br>')}
  }
  function renderLegend(){const legendEl=document.getElementById('legendList');if(!legendEl)return;legendEl.innerHTML=`<div class="legend-list"><div class="legend-item"><span class="swatch investment"></span>${Localization.t('investmentLegend')}</div><div class="legend-item"><span class="swatch operations"></span>${Localization.t('operationsLegend')}</div><div class="legend-item"><span class="swatch expenses"></span>${Localization.t('expensesLegend')}</div><div class="legend-item"><span class="swatch profit"></span>${Localization.t('profitLegend')}</div></div>`}
  function renderScenarioSelect(state){const sel=document.getElementById('scenarioSelect');if(!sel)return;sel.innerHTML=`<option value="base">${Localization.t('scenario')}</option>`;sel.value='base';}
  function renderAll(state,model,errors={}){
    activeCurrency='IDR';
    currentModel=model;
    Localization.setLanguage(state.language);
    const languageSelect=document.getElementById('languageSelect');
    if(languageSelect)languageSelect.value=state.language;
    const modeToggle=document.getElementById('modeToggle');
    if(modeToggle)modeToggle.textContent=Localization.t(state.advanced?'basicSettings':'advancedSettings');
    renderKpis(model,state);
    renderTable(model);
    renderSummary(model);
    renderInsights(model);
    renderLegend();
    const notesArea=document.getElementById('notesArea');
    if(notesArea)notesArea.value=state.activeScenario.notes||'';
    Charts.render(model);
    if(activeHelpSection)populateSectionHelp(activeHelpSection);
    setTimeout(Animation.flashCells,10);
  }
  return{renderAll,getTableRows,getDisplayMonths,getInsightRows,openSectionHelp,closeSectionHelp,openAdvertisingHelp,closeAdvertisingHelp,populateAdvertisingModal,openDetailModal,closeDetailModal,populateDetailModal}
})();

document.addEventListener('click',event=>{
  const marketingTrigger=event.target.closest('[data-marketing-help]');
  if(marketingTrigger){
    event.preventDefault();
    event.stopPropagation();
    UIRenderer.openAdvertisingHelp(marketingTrigger);
    return;
  }
  const detailTrigger=event.target.closest('[data-detail-help]');
  if(detailTrigger){
    event.preventDefault();
    event.stopPropagation();
    UIRenderer.openDetailModal(detailTrigger.dataset.detailHelp,detailTrigger);
    return;
  }
  const advertisingView=event.target.closest('[data-advertising-view]');
  if(advertisingView){
    event.preventDefault();
    UIRenderer.populateAdvertisingModal(advertisingView.dataset.advertisingView);
    return;
  }
  if(event.target.closest('[data-close-advertising]')){
    event.preventDefault();
    UIRenderer.closeAdvertisingHelp();
    return;
  }
  const detailView=event.target.closest('[data-detail-view]');
  if(detailView){
    event.preventDefault();
    UIRenderer.populateDetailModal(document.getElementById('detailModal')?.dataset.topic||document.querySelector('[data-detail-help]')?.dataset.detailHelp||'initial-fee',detailView.dataset.detailView);
    return;
  }
  if(event.target.closest('[data-close-detail-modal]')){
    event.preventDefault();
    UIRenderer.closeDetailModal();
    return;
  }
  const trigger=event.target.closest('[data-section-help]');
  if(trigger){
    event.preventDefault();
    event.stopPropagation();
    UIRenderer.openSectionHelp(trigger.dataset.sectionHelp,trigger);
    return;
  }
  if(event.target.closest('[data-close-section-help]')){
    event.preventDefault();
    UIRenderer.closeSectionHelp();
  }
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){UIRenderer.closeAdvertisingHelp();UIRenderer.closeDetailModal();UIRenderer.closeSectionHelp();}});
