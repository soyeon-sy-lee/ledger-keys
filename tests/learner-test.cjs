const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const storage={'shortcut-to-partner-v1':JSON.stringify({profiles:[{name:'기존 업무용',tools:['values','number','filter']}],profile:0,stats:{'number|basic':{n:2,ok:1,time:3,hints:0}},xp:195})};
function boot(){
 const elements={},handlers={},timers=[];let failStorage=false;
 const document={activeElement:null,querySelectorAll:()=>[],getElementById(id){return elements[id]||=( {id,tagName:'INPUT',innerHTML:'',textContent:'',value:'',attrs:{},setAttribute(k,v){this.attrs[k]=v},showModal(){this.open=true},close(){this.open=false},focus(){document.activeElement=this}})}};
 const context={console,Date,Math,Set,Map,JSON,document,localStorage:{getItem:k=>storage[k],setItem(k,v){if(failStorage)throw Error('Storage unavailable');storage[k]=v}},window:{addEventListener:(k,f)=>handlers[k]=f},setInterval:f=>timers.push(f),alert(){},confirm:()=>true,prompt:()=>null};
 vm.createContext(context);for(const file of ['extra','sim','formulas','trace','paste','dimensions','worksheets','actions','dialogs','grid','exercises','keyboard','keyboard-lock','accounting','learner','app'])vm.runInContext(fs.readFileSync(`docs/${file}.js`,'utf8'),context);
 return {run:s=>vm.runInContext(s,context),elements,handlers,timers,fail:v=>failStorage=v};
}
let app=boot(),run=s=>app.run(s),form=(name,firm='')=>{app.elements.learnerName.value=name;app.elements.learnerFirm.value=firm},key=(code,key,mods={})=>app.handlers.keydown({code,key,target:{tagName:'BODY'},preventDefault(){throw Error('Profile typing must not be captured')},...mods});
const oldQat=run('JSON.stringify(state.profiles)'),oldStats=run('JSON.stringify(state.stats)');
assert(app.elements.learnerBadge.innerHTML.includes('학습자 이름 등록'));
run("startOne('number')");assert(run('learnerDialogOpen'));assert.equal(run('session'),null);assert(app.elements.learnerDialog.open);
const selected=run('book.selected');key('ArrowDown','ArrowDown',{ctrlKey:true});assert.equal(run('book.selected'),selected);assert.equal(run('state.xp'),195);
form('   ');assert.equal(run('saveLearner()'),false);assert(app.elements.learnerError.textContent.includes('이름'));
form('a'.repeat(25));assert.equal(run('saveLearner()'),false);
form('민지','한빛회계법인');app.fail(true);assert.equal(run('saveLearner()'),false);assert.equal(run('state.learner'),undefined);assert(run('learnerDialogOpen'));app.fail(false);
form('  민지  ',' 한빛회계법인 ');assert(run('saveLearner()'));assert.equal(run('state.learner.name'),'민지');assert.equal(run('state.learner.firm'),'한빛회계법인');assert(!run('learnerDialogOpen'));assert(!run('paused'));assert.equal(run('session.questions[0].item.id'),'number');assert.equal(run('JSON.stringify(state.profiles)'),oldQat);assert.equal(run('JSON.stringify(state.stats)'),oldStats);
app.handlers.keydown({code:'Digit1',key:'!',ctrlKey:true,shiftKey:true,target:{tagName:'BODY'},preventDefault(){}});assert.equal(run('state.xp'),205);assert(app.elements.learnerBadge.innerHTML.includes('Staff 2'));assert(app.elements.learnerBadge.innerHTML.includes('LV.2'));
run("mode='challenge';start()");run('openLearner()');assert(run('paused'));const elapsed=run('session.elapsed');app.timers.forEach(f=>f());assert.equal(run('session.elapsed'),elapsed);form('다른 이름');run('closeLearner()');assert.equal(run('state.learner.name'),'민지');assert(!run('paused'));
run('paused=true;openLearner();closeLearner()');assert(run('paused'),'editing preserves an already paused session');
run('openLearner()');form('<img src=x>','R&D <회계법인>');assert(run('saveLearner()'));assert(app.elements.learnerBadge.innerHTML.includes('&lt;img src=x&gt;'));assert(app.elements.learnerBadge.innerHTML.includes('R&amp;D &lt;회계법인&gt;'));assert(!app.elements.learnerBadge.innerHTML.includes('<img'));
app=boot();assert.equal(run('state.xp'),205);assert.equal(run('state.learner.name'),'<img src=x>');assert.equal(run('JSON.stringify(state.profiles)'),oldQat);run("startOne('down')");assert(!run('learnerDialogOpen'));assert.equal(run('session.questions[0].item.id'),'down');
run('openLearner()');form('민지','');assert(run('saveLearner()'));assert(app.elements.learnerBadge.innerHTML.includes('소속 미설정'));
for(const entry of ['start()',"startOne('down')",'startSheetTraining()','openPractice()','openTracePractice()','openDimensionPractice()','openSheetPractice()']){
 run('delete state.learner;session=null;paused=false');run(entry);assert(run('learnerDialogOpen'),entry);assert.equal(run('session'),null);run('closeLearner()');assert(!run('learnerDialogOpen'));assert.equal(run('learnerPending'),null);
 run(entry);form('최초 학습자');assert(run('saveLearner()'));assert(!run('learnerDialogOpen'));assert(run("session!==null||currentPage==='practice'"),entry+' continues after registration');
}
console.log('PASS: first-start gates, validation/storage failure, modal key isolation, existing progress/QAT preservation, XP-derived rank, pause/cancel/edit, escaped identity, reload persistence and optional firm');
