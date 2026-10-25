const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const storage={};let seed=71;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
function boot(){const elements={},handlers={};const context={console,Math:math,Date,Set,Map,JSON,localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},document:{getElementById:id=>elements[id]||={innerHTML:'',textContent:''},querySelectorAll:()=>[]},window:{addEventListener:(k,f)=>handlers[k]=f},setInterval(){},alert(){},confirm:()=>true,prompt:()=>null};vm.createContext(context);for(const f of ['extra','sim','formulas','trace','paste','dimensions','worksheets','actions','dialogs','grid','exercises','keyboard','keyboard-lock','accounting','learner','app'])vm.runInContext(fs.readFileSync('docs/'+f+'.js','utf8'),context);return {run:s=>vm.runInContext(s,context),elements,handlers}}
let app=boot(),run=s=>app.run(s);run("state.learner={name:'회계 실습',firm:'테스트 법인'}");
assert(run('accountingOn()'));assert.equal(run('ACCOUNT_CURRICULUM.length'),36);assert.equal(run('ACCOUNT_PRIORITY.length'),16);assert.equal(run('ACCOUNT_SUPPORT.length'),20);assert.equal(run('new Set(ACCOUNT_CURRICULUM.map(m=>m.id)).size'),36);assert(run('ACCOUNT_CURRICULUM.every(m=>by(m.id)&&ACCOUNT_SOURCES[m.source])'));
const seen=new Set();for(let i=0;i<120;i++){
 const qs=JSON.parse(run('JSON.stringify(accountingRound())'));assert.equal(qs.length,10);
 const basics=qs.filter(q=>q.route==='basic'),quick=qs.filter(q=>q.route==='qat');assert.equal(basics.length,6);assert.equal(quick.length,4);assert.equal(new Set(basics.map(q=>q.item.id)).size,6);
 assert.equal(basics.filter(q=>run(`accountingMeta('${q.item.id}').tier`)===1).length,4);
 for(const q of basics){assert(run(`!!accountingMeta('${q.item.id}')`));seen.add(q.item.id)}
 for(const q of quick)assert(run(`profile().tools.includes('${q.item.id}')`));
}assert.equal(seen.size,36);
// Every personal QAT entry is visited, including non-core commands and slots above nine.
for(const count of [1,3,4,7,19]){
 run(`profile().tools=D.slice(-${count}).map(d=>d.id);state.accountingQatPositions={}`);const layout=JSON.parse(run('JSON.stringify(profile().tools)')),covered=new Set();
 for(let round=0;round<Math.ceil(count/4);round++){const qs=JSON.parse(run('JSON.stringify(accountingRound())')).filter(q=>q.route==='qat');qs.forEach((q,i)=>{assert.equal(q.item.id,layout[(round*4+i)%count]);covered.add(q.item.id);assert(run(`qpath('${q.item.id}').startsWith('Alt,')`))})}
 assert.equal(covered.size,count);
}
run("profile().tools=['help','values','number'];state.accountingQatPositions={}");assert.equal(run('accountingQat(1)[0].item.id'),'help');run('save()');app=boot();assert.equal(run('accountingQat(1)[0].item.id'),'values');run('move(2,0)');assert.equal(run('accountingQat(1)[0].item.id'),'number');assert.equal(run("qpath('number')"),'Alt,1');
run("profile().tools=['number','values','filter'];route='qat';category='weak'");
function chord(s){let parts=s.split('+'),base=parts.pop(),code=base==='Alt'?'AltLeft':base==='-'?'Minus':/^[A-Z]$/.test(base)?'Key'+base:/^\d$/.test(base)?'Digit'+base:base;app.handlers.keydown({key:base,code,target:{tagName:'BODY'},ctrlKey:parts.includes('Ctrl'),shiftKey:parts.includes('Shift'),altKey:parts.includes('Alt'),preventDefault(){},stopPropagation(){}})}
for(const mode of ['learn','recall','mission','challenge']){
 run(`mode='${mode}';start()`);assert(run('session.accounting'));assert.equal(run('session.questions.length'),10);assert.equal(run("session.questions.filter(q=>q.route==='qat').length"),4);
 for(let i=0;i<10;i++){run('if(book.target)selectCell(book.target)');const path=run('expected(session.questions[session.index])');const xp=run('state.xp');path.split(',').forEach(chord);assert(run('effect'),mode+' '+path);assert(run('state.xp')>xp);run('next()')}
 assert(run('session.done'));
}
run("startOne('values')");assert.equal(run('session.questions.length'),2);assert.equal(run("session.questions.map(q=>q.route).join(',')"),'basic,qat');assert(run("session.questions.every(q=>q.item.id==='values')"));
run("startOne('edit')");assert.equal(run('session.questions[0].item.id'),'edit');assert.equal(run('session.questions[1].route'),'qat');
run('startSheetTraining()');assert(run('session.accounting'));assert.equal(run("session.questions.filter(q=>q.route==='qat').length"),2);assert.equal(run("session.questions.filter(q=>q.route==='basic').map(q=>q.item.id).join(',')"),'prevsheet,nextsheet');
run("start();session.wrong=[session.questions[0].item.id];retry()");assert(run('session.accounting'));assert(run("session.questions.some(q=>q.route==='qat')"));assert.equal(run('session.earned'),0);
// An empty toolbar cannot silently omit mandatory QAT exercises or overwrite settings.
run('session=null;profile().tools=[]');const xpBefore=run('state.xp'),profilesBefore=run('state.profiles.length');run('start()');assert.equal(run('session'),null);assert(run('accountingMessage.includes("필수")'));run('startOne("number")');assert.equal(run('session'),null);assert.equal(run('state.xp'),xpBefore);run('createAccountingPreset()');assert.equal(run('state.profiles.length'),profilesBefore+1);assert.equal(run('state.profiles[0].tools.length'),0);assert.equal(run('profile().tools.length'),9);assert.equal(run('state.xp'),xpBefore);
run("profile().tools=['help','unhiderow','values'];render()");const picker=run('accountingPicker()');assert(picker.includes('내 빠른 실행 도구 · 추가 항목'));assert(picker.includes('value="help"'));assert(picker.includes('value="unhiderow"'));assert(!picker.includes('value="italic"'));assert.equal((picker.match(/<option value="[^\"]+"/g)||[]).length,38);assert(run('accountingDetails().includes("통계 순위는 아닙니다")'));
assert.equal(run("accountPracticeButtons([['unhiderow','행 숨기기 취소']])[0][0]"),'values');assert(run("accountPracticeButtons([['unhiderow','행 숨기기 취소']]).some(b=>b[0]==='unhiderow')"));
run("session=null;setLearningTrack('all')");assert(!run('accountingOn()'));assert.equal((run('learningPicker()').match(/<option value="[^\"]+"/g)||[]).length,96);app=boot();assert(!run('accountingOn()'));run("route='qat';category='all';start()");assert(!run('session.accounting'));assert(run("session.questions.every(q=>q.route==='qat')"));
const title=run('session.title');run("setLearningTrack('accounting')");assert(!run('accountingOn()'),'cannot switch a live session');assert.equal(run('session.title'),title);
run("session=null;setLearningTrack('accounting');save()");app=boot();assert(run('accountingOn()'));assert.equal(run('state.learner.name'),'회계 실습');
console.log('PASS: 36 sourced commands, 4 priority + 2 support + 4 QAT in every round, full personal QAT rotation/slots/reorder/persistence, all four modes execute, paired learning/retry/sheet lessons, empty-QAT guard, non-destructive preset, curated UI and full-catalog opt-out');
