'use strict';
const ScenarioManager=(()=>{
  function builtIns(){return [
    {id:'conservative',name:'Консервативный',builtIn:true,assumptions:FinancialEngine.defaultAssumptions('conservative'),notes:'Значения в IDR. Консервативный сценарий для Индонезии.'},
    {id:'base',name:'Базовый',builtIn:true,assumptions:FinancialEngine.defaultAssumptions('base'),notes:'Значения в IDR. Рекомендуемый расчёт: средний чек 17 000 IDR, комиссия 12%.'},
    {id:'optimistic',name:'Оптимистичный',builtIn:true,assumptions:FinancialEngine.defaultAssumptions('optimistic'),notes:'Значения в IDR. Оптимистичный сценарий роста заказов.'}
  ]}
  function duplicate(s){return{...JSON.parse(JSON.stringify(s)),id:'custom_'+Date.now(),name:s.name+' — копия',builtIn:false}}
  return{builtIns,duplicate}
})();
