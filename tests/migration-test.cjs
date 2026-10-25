const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('docs/keyboard.js','utf8');
const record={profiles:[{name:'업무용',tools:['values','filter']}],profile:0,stats:{'number|basic':{n:3,ok:2}},xp:230,learner:{name:'학습자',firm:'EY 한영'}};
function boot(entries){const data=new Map(Object.entries(entries));const storage={get length(){return data.size},key:i=>[...data.keys()][i],getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v))};vm.runInNewContext(code,{localStorage:storage,Set,Map,JSON,Math});return data}
const old='previous-training',next='shortcut-to-partner';
const original={ [old+'-v1']:JSON.stringify(record),[old+'-keyboard']:'{"model":"mxmini","os":"mac","fn":"fn"}',[old+'-ctrl-assist']:'true',[old+'-workbook']:'{"worksheets":[{"id":1,"cells":{"D2":{"raw":"=D3*H2"}}}]}' };
let data=boot(original);assert.deepEqual(JSON.parse(data.get(next+'-v1')),record);
for(const suffix of ['-v1','-keyboard','-ctrl-assist','-workbook']){assert.equal(data.get(next+suffix),original[old+suffix]);assert.equal(data.get(old+suffix),original[old+suffix]);}
const saved={...record,xp:999};data=boot({...original,[next+'-v1']:JSON.stringify(saved)});assert.equal(JSON.parse(data.get(next+'-v1')).xp,999);
data=boot({...original,'another-training-v1':JSON.stringify(record)});assert(!data.has(next+'-v1'));
data=boot({'unrelated-v1':'{"profiles":[],"profile":0,"stats":{}}','invalid-v1':'bad json'});assert(!data.has(next+'-v1'));
data=boot({...original,[next+'-keyboard']:'{"model":"k580"}'});assert.equal(data.get(next+'-keyboard'),'{"model":"k580"}');
console.log('PASS: compatible progress/settings/workbook copied, original preserved, existing data protected, ambiguous/malformed records ignored');
