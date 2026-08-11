'use strict';
const FinancialEngine=(()=>{
  const monthKeys=['setup','preparation',...Array.from({length:12},(_,i)=>`m${i+1}`)];
  const marketingPresets={
    balanced:[14,13,12,10,9,8,7,6,6,5,5,5],
    launchHeavy:[16,14,12,10,8,8,7,6,5,5,5,4],
    growth:[2,3,4,5,6,7,8,10,12,13,14,16],
    manual:null
  };
  const ridesPresets={
    balanced:[5,9,13,16,20,31,42,56,65,70,90,100],
    smallCityFast:[5,10,15,50,70,82,90,95,97,98,99,100],
    smallCityModerate:[5,10,15,28,40,54,66,77,86,92,96,100],
    slow:[3,6,10,14,18,25,34,45,57,70,84,100],
    aggressive:[8,14,21,29,38,49,61,73,83,90,96,100],
    manual:null
  };
  function n(v){return Number(v)||0}
  function uid(){return 'ex_'+Math.random().toString(36).slice(2,9)}
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function roundTo(value, step){return Math.round(n(value)/step)*step}
  const VAT_RATE=0.11;
  const UNIFORM_PURCHASE_AMOUNT=6400000;
  const UNIFORM_SALES_AMOUNT=7000000;
  const UNIFORM_MONTHS=new Set([1,4,7,10]);
  function advertisingPackageForPopulation(_population){return 0}
  function initialPaymentBaseForPopulation(population){
    const p=n(population);
    if(p<=50000)return 10000000;
    if(p<=100000)return 15000000;
    if(p<=200000)return 20000000;
    return 30000000;
  }
  function initialPaymentForPopulation(population){
    return Math.round(initialPaymentBaseForPopulation(population)*(1+VAT_RATE));
  }
  // Рекомендованный ежемесячный рекламный бюджет задаётся ступенями по населению.
  // Границы относятся к нижнему диапазону, кроме 350 000: с 350 000 действует 50 млн.
  function monthlyMarketingBudgetForPopulation(population){
    const p=Math.max(0,n(population));
    if(p<=40000)return 4000000;
    if(p<=50000)return 5000000;
    if(p<=60000)return 6000000;
    if(p<=70000)return 7000000;
    if(p<=80000)return 8000000;
    if(p<=90000)return 9000000;
    if(p<=110000)return 10000000;
    if(p<=120000)return 11000000;
    if(p<=140000)return 12000000;
    if(p<=160000)return 14000000;
    if(p<=180000)return 16000000;
    if(p<=200000)return 18000000;
    if(p<=220000)return 20000000;
    if(p<=250000)return 25000000;
    if(p<=300000)return 30000000;
    if(p<350000)return 40000000;
    return 50000000;
  }
  function annualMarketingBudgetForPopulation(population){return monthlyMarketingBudgetForPopulation(population)*12}

  const ZONE_1_PROVINCES=new Set([
    'Aceh','Bali','Bangka Belitung Islands','Banten','Bengkulu','Central Java',
    'East Java','Jambi','Lampung','North Sumatra','Riau','Riau Islands',
    'South Sumatra','Special Region of Yogyakarta','West Java','West Sumatra'
  ]);
  const ZONE_2_PROVINCES=new Set(['DKI Jakarta','Jakarta','Jabodetabek']);
  function transportZoneForProvince(province){
    const value=String(province||'').trim();
    if(ZONE_2_PROVINCES.has(value))return 2;
    if(ZONE_1_PROVINCES.has(value))return 1;
    return 3;
  }
  function minimumAverageFareForProvince(province){
    const zone=transportZoneForProvince(province);
    return zone===1?8000:(zone===2?8900:9200);
  }
  function maximumCommissionForProvince(_province){return 15}
  function recommendedAverageFareForPopulation(_population,_province){return 17000}
  function recommendedCommissionForPopulation(_population,_province){return 12}
  function royaltyRateForGrossRevenue(value){
    const revenue=Math.max(0,n(value));
    if(revenue<7000000)return 0;
    if(revenue<12000000)return 15;
    if(revenue<17000000)return 20;
    if(revenue<22000000)return 25;
    return 30;
  }
  function assistantFeeForGrossRevenue(value){
    const revenue=Math.max(0,n(value));
    if(revenue<7000000)return 555000;
    if(revenue<=22000000)return 1110000;
    return 2220000;
  }
  function smsRateForGrossRevenue(value){return Math.max(0,n(value))>22000000?555:0}

  // Reference demand potential is independent from profitability and payback.
  // Smaller cities can reach a higher daily penetration rate; kecamatans with up to
  // 10,000 residents use 2.75%, while larger cities use progressively lower rates.
  function recommendedDailyDemandRateForPopulation(population){
    const p=Math.max(0,n(population));
    if(p<=10000)return 2.75;
    if(p<=20000)return 2.0;
    if(p<=30000)return 1.9;
    if(p<=40000)return 1.8;
    return 1.7;
  }

  // The final market potential is still reached only in month 12. Smaller
  // kecamatans use a faster ramp in the middle of the year so the model does
  // not underestimate first-year demand and revenue.
  function recommendedRidesDistributionForPopulation(population){
    const p=Math.max(0,n(population));
    if(p<=20000)return clone(ridesPresets.smallCityFast);
    if(p<=30000)return clone(ridesPresets.smallCityModerate);
    return clone(ridesPresets.balanced);
  }

  // Below the recommended budget, underinvestment has a stronger-than-linear
  // impact. Above the recommendation, additional spend has diminishing returns.
  function investmentDemandFactor(annualBudget,population){
    const recommended=annualMarketingBudgetForPopulation(population);
    const budget=Math.max(0,n(annualBudget));
    if(recommended<=0)return budget>0?1:0;
    const ratio=budget/recommended;
    if(ratio<=0)return 0;
    if(ratio<=1)return Math.pow(ratio,1.35);
    return Math.min(1.25,1+Math.sqrt(ratio-1)*0.18);
  }

  // A higher fare increases revenue per ride but reduces demand. A lower fare can
  // improve demand only modestly because price alone cannot create the market.
  function fareDemandFactor(averageFare,population,province){
    const recommended=recommendedAverageFareForPopulation(population,province);
    const fare=Math.max(minimumAverageFareForProvince(province),n(averageFare));
    if(recommended<=0)return 1;
    const ratio=fare/recommended;
    // В Индонезии спрос высокоэластичен по цене: превышение рекомендации
    // снижает заказы по степенной кривой, без искусственного верхнего лимита чека.
    if(ratio>=1)return Math.max(0.10,Math.pow(ratio,-1.8));
    return Math.min(1.15,1+0.25*(1-ratio));
  }

  // Driver commission affects supply and therefore the share of demand that can
  // actually be fulfilled. High commission is penalised more strongly.
  function commissionFulfillmentFactor(commission,population,province){
    const recommended=recommendedCommissionForPopulation(population,province);
    const value=Math.max(0,n(commission));
    const diff=value-recommended;
    if(diff>0)return Math.max(0.25,1-0.03*diff);
    return Math.min(1.1,1+0.01*Math.abs(diff));
  }
  function recommendedMarketingPatternForPopulation(population){
    const monthly=monthlyMarketingBudgetForPopulation(population);
    return Array.from({length:12},()=>monthly);
  }
  function marketingSharesForPopulation(population){
    const pattern=recommendedMarketingPatternForPopulation(population);const total=pattern.reduce((a,b)=>a+b,0)||1;
    return pattern.map(v=>v/total*100);
  }
  function monthlyMarketingBudgets(annualBudget,_population){
    const annual=Math.max(0,n(annualBudget));
    const monthly=roundTo(annual/12,1000);
    const budgets=Array.from({length:12},()=>monthly);
    budgets[11]+=annual-budgets.reduce((sum,value)=>sum+value,0);
    return budgets;
  }
  function operatingExpenseRatesForPopulation(population){
    const p=Math.max(0,n(population));
    if(p<=20000)return{officeRent:500000,managerSalary:1500000};
    if(p<=50000)return{officeRent:1000000,managerSalary:1500000};
    if(p<=100000)return{officeRent:1500000,managerSalary:2000000};
    if(p<=200000)return{officeRent:2000000,managerSalary:3000000};
    return{officeRent:2500000,managerSalary:3500000};
  }
  function fixedExpenseDefinitionsForPopulation(population,options={}){
    const rates=operatingExpenseRatesForPopulation(population);
    const selfManaged=options.selfManaged===true;
    const useOwnPremises=options.useOwnPremises===true;
    return[
      {id:'office_rent',name:'officeRent',amount:rates.officeRent,removable:false,showInModel:!useOwnPremises,fixedType:'population-office'},
      {id:'manager_salary',name:'managerSalary',amount:rates.managerSalary,removable:false,showInModel:!selfManaged,fixedType:'population-manager'},
      {id:'assistente',name:'assistente',amount:0,removable:false,showInModel:true,fixedType:'assistant'}
    ];
  }
  function defaultExpenseRows(population=100000,options={}){return[
    ...fixedExpenseDefinitionsForPopulation(population,options).map(row=>({...row})),
    {id:'other_costs',name:'otherCosts',amount:0,removable:false,showInModel:false,hidden:true}
  ]}
  function normPctArray(arr,fallback){
    const src=Array.isArray(arr)&&arr.length===12?arr:fallback;
    return src.map(v=>Math.max(0,n(v)));
  }
  function normalizeAssumptions(input={}){
    const a={...defaultAssumptions(),...input};
    delete a.adminCost;
    delete a.activeUsers;
    a.selfManaged=a.selfManaged===true;
    a.useOwnPremises=a.useOwnPremises===true;
    const sourceExpenseRows=Array.isArray(a.expenseRows)&&a.expenseRows.length
      ? a.expenseRows
      : defaultExpenseRows(a.population,a);
    const fixedDefinitions=fixedExpenseDefinitionsForPopulation(a.population,a);
    const fixedIds=new Set(fixedDefinitions.map(row=>row.id));
    const customExpenseRows=sourceExpenseRows.filter(row=>row&&row.id&&!fixedIds.has(row.id)&&row.id!=='other_costs').map((r,i)=>({
      id:r.id||uid(),
      name:String(r.name||`Expense ${i+1}`),
      amount:n(r.amount),
      showInModel:r.showInModel!==false,
      removable:r.removable!==false,
      hidden:!!r.hidden,
      fixedType:r.fixedType||null
    }));
    a.expenseRows=[
      ...fixedDefinitions.map(row=>({...row})),
      ...customExpenseRows,
      {id:'other_costs',name:'otherCosts',amount:0,removable:false,showInModel:false,hidden:true,fixedType:null}
    ];
    a.province=String(a.province||'').trim();
    a.transportZone=transportZoneForProvince(a.province);
    a.minimumAverageFare=minimumAverageFareForProvince(a.province);
    a.maximumCommission=maximumCommissionForProvince(a.province);
    const recommendedBudget=annualMarketingBudgetForPopulation(a.population);
    const recommendedFare=recommendedAverageFareForPopulation(a.population,a.province);
    const recommendedCommission=recommendedCommissionForPopulation(a.population,a.province);
    a.useRecommendedValues=a.useRecommendedValues!==false;
    if(a.useRecommendedValues){
      a.marketingBudget=recommendedBudget;
      a.averageFare=recommendedFare;
      a.commission=recommendedCommission;
    }else{
      a.marketingBudget=Math.max(0,n(a.marketingBudget));
      a.averageFare=Math.max(a.minimumAverageFare,n(a.averageFare)||recommendedFare);
      a.commission=Math.min(a.maximumCommission,Math.max(0,n(a.commission)));
    }
    a.recommendedMarketingBudget=recommendedBudget;
    a.recommendedAverageFare=recommendedFare;
    a.recommendedCommission=recommendedCommission;
    a.advertisingPackage=advertisingPackageForPopulation(a.population);
    a.marketingDistributionPreset='auto';
    a.marketingDistribution=marketingSharesForPopulation(a.population);
    a.ridesDistributionPreset=a.ridesDistributionPreset||'balanced';
    // The balanced/recommended curve is population-aware. Manual and explicitly
    // selected alternative presets are preserved.
    if(a.ridesDistributionPreset==='balanced'){
      a.ridesDistribution=recommendedRidesDistributionForPopulation(a.population);
    }else{
      a.ridesDistribution=normPctArray(a.ridesDistribution,ridesPresets[a.ridesDistributionPreset]||ridesPresets.balanced);
    }
    a.percentagePopulationUsingService=recommendedDailyDemandRateForPopulation(a.population);
    a.autoPopulationUsingService=false;
    // В Индонезии работа с контакт-центром и расходы на звонки в модели не используются.
    delete a.callCenterEnabled;
    if(!Array.isArray(a.revenueRules)||!a.revenueRules.length){a.revenueRules=defaultRevenueRules()}
    a.revenueRules=a.revenueRules.map((r,i)=>({id:r.id||uid(),threshold:Math.max(0,n(r.threshold)),maximShare:Math.min(100,Math.max(0,n(r.maximShare))),removable:r.removable!==false})).sort((x,y)=>x.threshold-y.threshold);
    return a;
  }
  function defaultRevenueRules(){return[
    {id:'rr_0',threshold:0,maximShare:0,removable:false},
    {id:'rr_7000000',threshold:7000000,maximShare:15,removable:false},
    {id:'rr_12000000',threshold:12000000,maximShare:20,removable:false},
    {id:'rr_17000000',threshold:17000000,maximShare:25,removable:false},
    {id:'rr_22000000',threshold:22000000,maximShare:30,removable:false}
  ]}
  function defaultAssumptions(type='base'){
    const presets={
      conservative:{population:100000,province:'Bali',averageFare:17000,commission:12,rideGrowth:10,marketingBudget:96000000,initialInvestment:16650000,operatingExpenses:0,percentagePopulationUsingService:1.7,useRecommendedValues:true,selfManaged:false,useOwnPremises:false,expenseRows:defaultExpenseRows(100000),marketingDistributionPreset:'balanced',marketingDistribution:clone(marketingPresets.balanced),ridesDistributionPreset:'slow',ridesDistribution:clone(ridesPresets.slow)},
      base:{population:100000,province:'Bali',averageFare:17000,commission:12,rideGrowth:18,marketingBudget:96000000,initialInvestment:16650000,operatingExpenses:0,percentagePopulationUsingService:1.7,useRecommendedValues:true,selfManaged:false,useOwnPremises:false,expenseRows:defaultExpenseRows(100000),marketingDistributionPreset:'balanced',marketingDistribution:clone(marketingPresets.balanced),ridesDistributionPreset:'balanced',ridesDistribution:clone(ridesPresets.balanced)},
      optimistic:{population:100000,province:'Bali',averageFare:17000,commission:12,rideGrowth:25,marketingBudget:96000000,initialInvestment:16650000,operatingExpenses:0,percentagePopulationUsingService:1.7,useRecommendedValues:true,selfManaged:false,useOwnPremises:false,expenseRows:defaultExpenseRows(100000),marketingDistributionPreset:'growth',marketingDistribution:clone(marketingPresets.growth),ridesDistributionPreset:'aggressive',ridesDistribution:clone(ridesPresets.aggressive)}
    };
    return clone(presets[type]||presets.base)
  }
  function calculateCore(assumptions){
    const a=normalizeAssumptions(assumptions);
    const months=[];let accumulated=0;
    const baseDemandRate=recommendedDailyDemandRateForPopulation(a.population);
    const baseTargetRidesDay=Math.round(n(a.population)*baseDemandRate/100);
    const budgetDemandFactor=investmentDemandFactor(a.marketingBudget,a.population);
    const fareFactor=fareDemandFactor(a.averageFare,a.population,a.province);
    const commissionFactor=commissionFulfillmentFactor(a.commission,a.population,a.province);
    const combinedDemandFactor=budgetDemandFactor*fareFactor*commissionFactor;
    const targetRidesDay=Math.max(0,Math.round(baseTargetRidesDay*combinedDemandFactor));
    const autoMarketingBudgets=monthlyMarketingBudgets(a.marketingBudget,a.population);
    for(let i=0;i<14;i++){
      const isSetup=i===0,isPrep=i===1,monthNo=i-1;
      const mIndex=i-2;
      const marketingInvestment=i>1?autoMarketingBudgets[mIndex]:0;
      const uniformInvestment=i>1&&UNIFORM_MONTHS.has(monthNo)?UNIFORM_PURCHASE_AMOUNT:0;
      const uniformSales=i>1&&UNIFORM_MONTHS.has(monthNo)?UNIFORM_SALES_AMOUNT:0;
      const investment=isSetup?n(a.initialInvestment):(marketingInvestment+uniformInvestment);
      const ridesPerDay=i>1?Math.round(targetRidesDay*n(a.ridesDistribution[mIndex])/100):0;
      const ridesPerMonth=i>1?Math.round(ridesPerDay*30):0;
      const gross=ridesPerMonth*n(a.averageFare);
      const commissionFromRides=gross*n(a.commission)/100;
      // Валовая выручка для финансовых условий Индонезии — комиссия по выполненным заказам.
      const totalOperatingIncome=commissionFromRides+uniformSales;
      // Для тарифов и сервисных условий валовая выручка — только комиссия по выполненным заказам.
      // Продажа униформы является отдельным товарным доходом партнёра.
      const grossRevenue=commissionFromRides;
      // СМС оплачиваются только при валовой выручке свыше 22 000 000 IDR.
      // Количество СМС равно 20% выполненных заказов.
      const smsCount=i>1?ridesPerMonth*0.20:0;
      const smsRate=smsRateForGrossRevenue(grossRevenue);
      const smsExpense=smsCount*smsRate;
      const communicationExpenses=smsExpense;
      const grossProfit=grossRevenue-communicationExpenses;
      // Продажа униформы является отдельным доходом партнёра и не участвует в расчёте роялти.
      const royaltyBase=Math.max(0,commissionFromRides);
      // Роялти рассчитывается только от комиссии по выполненным заказам: 0% / 15% / 20% / 25% / 30%.
      const maximShare=royaltyRateForGrossRevenue(royaltyBase);
      const maximRevenue=royaltyBase*maximShare/100;
      const partner=totalOperatingIncome-maximRevenue;
      const fixedExpenses={};
      let fixedExpenseTotal=0;
      if(i>1){
        a.expenseRows.filter(r=>r.showInModel!==false).forEach(r=>{
          // Тариф «Ассистент» зависит от валовой выручки за месяц.
          const assistantBase=r.fixedType==='assistant'
            ? assistantFeeForGrossRevenue(grossRevenue)
            : 0;
          const val=r.fixedType==='assistant'
            ? assistantBase
            : Math.round(n(r.amount));
          fixedExpenses[r.id]=val;fixedExpenseTotal+=val;
        });
      }
      const assistantExpense=fixedExpenses.assistente||0;
      const opEx=i>1?marketingInvestment+uniformInvestment+fixedExpenseTotal+communicationExpenses:0;
      const initialFeeInMonth=i===2?n(a.initialInvestment):0;
      const netProfit=i>1?(partner-opEx-initialFeeInMonth):0;
      const netCashFlow=i>1?netProfit:0;
      accumulated+=netCashFlow;
      const margin=partner?netProfit/partner*100:0;
      months.push({key:monthKeys[i],index:i,monthNo,isSetup,isPrep,marketingPct:i>1?n(a.marketingDistribution[mIndex]):0,ridesPct:i>1?n(a.ridesDistribution[mIndex]):0,targetRidesDay,investment,initialPurchase:isSetup?investment:0,marketingInvestment,uniformInvestment,ridesPerDay,ridesPerMonth,averageFare:n(a.averageFare),gross,commission:n(a.commission),uniformSales,commissionFromRides,grossRevenue,smsCount,smsRate,totalOperatingIncome,grossProfit,royaltyBase,maximShare,revenue:maximRevenue,maximRevenue,partnerShare:100-maximShare,partner,marketingExpense:marketingInvestment,assistantExpense,smsExpense,communicationExpenses,royaltyExpense:maximRevenue,fixedExpenses,opEx,netProfit,margin,netCashFlow,accumulated})
    }
    const yearMonths=months.slice(2);
    const initialPayment=n(a.initialInvestment);
    const totalMarketingInvestment=yearMonths.reduce((s,x)=>s+x.marketingInvestment,0);
    const totalUniformInvestment=yearMonths.reduce((s,x)=>s+(x.uniformInvestment||0),0);
    const totalAssistantExpense=yearMonths.reduce((s,x)=>s+(x.fixedExpenses?.assistente||0),0);
    const totalOfficeRentExpense=yearMonths.reduce((s,x)=>s+(x.fixedExpenses?.office_rent||0),0);
    const totalManagerSalaryExpense=yearMonths.reduce((s,x)=>s+(x.fixedExpenses?.manager_salary||0),0);
    const totalCommunicationExpenses=yearMonths.reduce((s,x)=>s+x.communicationExpenses,0);
    const totalRoyaltyExpense=yearMonths.reduce((s,x)=>s+x.royaltyExpense,0);
    const totalExpenses=yearMonths.reduce((s,x)=>s+x.opEx,0);
    // Общие операционные расходы соответствуют строке «Итого» в разделе
    // «ОПЕРАЦИОННЫЕ РАСХОДЫ»: фиксированные расходы, связь и роялти.
    // Реклама относится к разделу «ИНВЕСТИЦИИ» и здесь не дублируется.
    const totalOperatingExpenses=Math.max(0,totalExpenses-totalMarketingInvestment-totalUniformInvestment)+totalRoyaltyExpense;
    // Инвестиции включают только паушальный взнос и рекламу за 12 месяцев.
    const totalInvestment=initialPayment+totalMarketingInvestment+totalUniformInvestment;
    const totalCommissionFromRides=yearMonths.reduce((s,x)=>s+x.commissionFromRides,0);
    const totalUniformSales=yearMonths.reduce((s,x)=>s+(x.uniformSales||0),0);
    // Выручка — комиссия по выполненным заказам.
    const totalRevenue=totalCommissionFromRides+totalUniformSales;
    // Оставляем совместимое поле для интерфейса; по новой методике оно равно выручке.
    const totalPartnerRevenue=totalRevenue;
    // Средние ежемесячные расходы в KPI — инвестиции, распределённые на 12 месяцев.
    const averageMonthlyInvestment=totalInvestment/12;
    // Чистая прибыль рассчитывается по согласованной формуле:
    // Выручка − Инвестиции − Операционные расходы.
    const netProfit=totalRevenue-totalInvestment-totalOperatingExpenses;
    const roi=totalInvestment?netProfit/totalInvestment*100:0;
    const breakEven=months.find(x=>x.index>1&&x.netProfit>=0);
    const payback=months.find(x=>x.index>1&&x.accumulated>=0);
    return{assumptions:a,months,summary:{initialPayment,totalMarketingInvestment,totalUniformInvestment,totalAssistantExpense,totalOfficeRentExpense,totalManagerSalaryExpense,totalCommunicationExpenses,totalRoyaltyExpense,totalOperatingExpenses,totalInvestment,totalRevenue,totalPartnerRevenue,totalCommissionFromRides,totalUniformSales,totalExpenses,averageMonthlyInvestment,netProfit,roi,breakEvenPeriod:breakEven?breakEven.monthNo:null,breakEvenKey:breakEven?breakEven.key:null,paybackPeriod:payback?payback.monthNo:null,paybackKey:payback?payback.key:null,targetRidesDay,baseTargetRidesDay,baseDemandRate,budgetDemandFactor,fareDemandFactor:fareFactor,commissionFulfillmentFactor:commissionFactor,combinedDemandFactor,recommendedMarketingBudget:a.recommendedMarketingBudget}}
  }
  function calculate(assumptions){
    return calculateCore(normalizeAssumptions(assumptions));
  }
  function formatMoney(v,compact=false){
    const value=n(v);
    const abs=Math.abs(value);
    const sign=value<0?'-':'';
    const locale=(typeof Localization!=='undefined'&&Localization.numberLocale)?Localization.numberLocale():'id-ID';
    if(compact&&abs>=1000000){
      const scaled=abs/1000000;
      const digits=scaled>=10||Number.isInteger(scaled)?0:1;
      const unit=(typeof Localization!=='undefined')?Localization.t('millionShort'):'млн';
      return sign+scaled.toLocaleString(locale,{minimumFractionDigits:0,maximumFractionDigits:digits})+' '+unit;
    }
    if(compact&&abs>=1000){
      const scaled=abs/1000;
      const digits=scaled>=100||Number.isInteger(scaled)?0:1;
      const unit=(typeof Localization!=='undefined')?Localization.t('thousandShort'):'тыс.';
      return sign+scaled.toLocaleString(locale,{minimumFractionDigits:0,maximumFractionDigits:digits})+' '+unit;
    }
    return sign+Math.round(abs).toLocaleString(locale);
  }
  function formatCurrencyFull(v){return `${n(v)<0?'-':''}${formatMoney(Math.abs(n(v)),false)} IDR`}
  function formatCurrencyCompact(v){return `${n(v)<0?'-':''}${formatMoney(Math.abs(n(v)),true)} IDR`}
  function formatPercent(v){return `${Math.round(v)} %`}
  function createExpenseRow(name='New Expense',amount=0){return{id:uid(),name,amount,removable:true,showInModel:true}}
  function createRevenueRule(threshold=0,maximShare=100){return{id:uid(),threshold, maximShare, removable:true}}
  function applyPreset(assumptions,type,preset){
    const a=normalizeAssumptions(assumptions);
    if(type==='marketing'&&marketingPresets[preset]){a.marketingDistributionPreset=preset;a.marketingDistribution=clone(marketingPresets[preset])}
    if(type==='rides'&&ridesPresets[preset]){a.ridesDistributionPreset=preset;a.ridesDistribution=clone(ridesPresets[preset])}
    return a;
  }
  return{calculate,defaultAssumptions,normalizeAssumptions,createExpenseRow,createRevenueRule,formatMoney,formatCurrencyFull,formatCurrencyCompact,formatPercent,monthKeys,marketingPresets,ridesPresets,applyPreset,advertisingPackageForPopulation,initialPaymentBaseForPopulation,initialPaymentForPopulation,monthlyMarketingBudgetForPopulation,annualMarketingBudgetForPopulation,transportZoneForProvince,minimumAverageFareForProvince,maximumCommissionForProvince,recommendedAverageFareForPopulation,recommendedCommissionForPopulation,royaltyRateForGrossRevenue,assistantFeeForGrossRevenue,smsRateForGrossRevenue,recommendedDailyDemandRateForPopulation,recommendedRidesDistributionForPopulation,operatingExpenseRatesForPopulation,investmentDemandFactor,fareDemandFactor,commissionFulfillmentFactor,marketingSharesForPopulation,monthlyMarketingBudgets}
})();
