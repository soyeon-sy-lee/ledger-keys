// API/event mocks exercise lifecycle and app integration, not Chromium's key routing.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}
function boot(options={}){
 const handlers={},calls=[],classes=new Set(),elements={},storage={
  'shortcut-to-partner-v1':JSON.stringify({profiles:[{name:'개인 도구',tools:['values','save','nextsheet']}],profile:0,stats:{'number|basic':{n:3,ok:2,time:4,hints:0,last:'2026-10-01'}},xp:55,learner:{name:'학습자',firm:'EY'},learningTrack:'all'}),
  'shortcut-to-partner-keyboard':'{"model":"mxmini","os":"windows","fn":"fn"}',
  'shortcut-to-partner-ctrl-assist':'true','shortcut-to-partner-workbook':'{"name":"기존 실습본"}'
 };
 const on=(type,fn)=>(handlers[type]??=[]).push(fn),emit=type=>{for(const fn of handlers[type]||[])fn()};
 const document={hidden:false,fullscreenElement:null,fullscreenEnabled:true,body:{classList:{toggle(name,on){on?classes.add(name):classes.delete(name)}}},addEventListener:on,querySelectorAll:()=>[],getElementById:id=>['learnerBadge','learnerDialog','promotionDialog'].includes(id)?null:(elements[id]??={innerHTML:'',textContent:'',focus(){}})};
 document.documentElement={requestFullscreen(){calls.push('fullscreen');if(options.fullscreenError)return Promise.reject(Object.assign(new Error(),{name:'NotAllowedError'}));return (options.fullscreenWait?.promise||Promise.resolve()).then(()=>{document.fullscreenElement=document.documentElement;emit('fullscreenchange')})}};
 document.exitFullscreen=()=>{calls.push('exit');if(options.exitError)return Promise.reject(new Error('exit'));document.fullscreenElement=null;emit('fullscreenchange');return Promise.resolve()};
 const keyboard={lock(codes){calls.push(['lock',[...codes]]);return options.lockWait?.promise||(options.denied?Promise.reject(Object.assign(new Error(),{name:'NotAllowedError'})):Promise.resolve())},unlock(){calls.push('unlock')}};
 const context={console,Date,Math,Map,Set,JSON,Promise,isSecureContext:options.secure!==false,navigator:options.unsupported?{}:{keyboard},document,window:{addEventListener:on},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v,key:i=>Object.keys(storage)[i],get length(){return Object.keys(storage).length}},setInterval(){},alert(){},prompt:()=>null,confirm:()=>true};
 vm.createContext(context);
 // Match production script order instead of maintaining another script list.
 for(const [,file] of fs.readFileSync('docs/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('docs/'+file,'utf8'),context,{filename:file});
 const run=s=>vm.runInContext(s,context);
 function key(code,key,mods={}){let prevented=false;const e={code,key,target:{tagName:'BODY'},preventDefault(){prevented=true},stopPropagation(){},...mods};for(const f of handlers.keydown)f(e);return prevented}
 return {run,key,emit,calls,storage,document,classes,handlers,context};
}
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
async function start(b){await b.run('startKeyboardLock()');assert.equal(b.run('keyboardLockState.phase'),'active')}
async function main(){
 const pending=deferred(),b=boot({lockWait:pending});const original=JSON.stringify(b.storage);
 assert.equal(b.calls.length,0,'render never requests a lock');
 const codes=Array.from(b.run('keyboardLockCodes()'));
 for(const code of ['F1','F2','F4','F5','F9','F11','F12','PageDown','PageUp','KeyS','KeyP','Digit1','Digit9','Digit0','Minus','Equal'])assert(codes.includes(code),code);
 for(const code of ['Escape','F3','F6','F10','ControlLeft','MetaLeft','Tab','KeyW'])assert(!codes.includes(code),code);
 assert(codes.every(c=>!c.includes('+')));assert.equal(new Set(codes).size,codes.length);
 const starting=b.run('startKeyboardLock()');await settle();
 assert.equal(b.calls[0],'fullscreen');assert.equal(b.calls.filter(c=>Array.isArray(c)).length,1);assert.equal(b.run('keyboardLockState.phase'),'locking');assert(!b.run('keyboardLockPanel()').includes('활성화되었습니다'));
 await b.run('startKeyboardLock()');assert.equal(b.calls.filter(c=>Array.isArray(c)).length,1);
 pending.resolve();await starting;assert.equal(b.run('keyboardLockState.phase'),'active');assert(b.classes.has('shortcut-fullscreen'));assert(b.run('keyboardLockPanel()').includes('활성화되었습니다'));assert.equal(JSON.stringify(b.storage),original);
 b.run('installKeyboardLock();installKeyboardLock()');assert.equal(b.handlers.fullscreenchange.length,1);assert.equal(b.handlers.keydown.length,1);
 await b.run('stopKeyboardLock("종료",true)');assert.equal(b.document.fullscreenElement,null);assert(!b.classes.has('shortcut-fullscreen'));assert(b.calls.includes('unlock'));assert.equal(JSON.stringify(b.storage),original);
 console.log('PASS: explicit fullscreen → pending lock → success, limited physical codes, duplicate clicks/listeners, unlock/exit and byte-preserved storage');

 for(const options of [{unsupported:true},{secure:false},{denied:true},{fullscreenError:true}]){
  const t=boot(options),before=JSON.stringify(t.storage);await t.run('startKeyboardLock()');
  assert.notEqual(t.run('keyboardLockState.phase'),'active');assert(t.run('keyboardLockPanel()').includes('Ctrl 보조 입력'));assert(t.run('keyboardLockPanel()').includes('충돌할 수 있습니다'));assert.equal(t.document.fullscreenElement,null);assert.equal(JSON.stringify(t.storage),before);
  if(options.unsupported||options.secure===false||options.fullscreenError)assert.equal(t.calls.filter(c=>Array.isArray(c)).length,0);
 }
 // A cancelled request cannot regain a lock when its promise eventually resolves.
 for(const stage of ['fullscreen','lock']){
  const wait=deferred(),t=boot(stage==='lock'?{lockWait:wait}:{fullscreenWait:wait});const request=t.run('startKeyboardLock()');await settle();
  t.run("ctrlQueued=true;ctrlPressed=true;seq=['Alt','H'];held.add('Alt');held.add('Ctrl');book.keytips=true");
  t.emit('blur');await t.run('startKeyboardLock()');assert.equal(t.run('seq.length'),0);assert.equal(t.run('held.size'),0);assert(!t.run('ctrlQueued||ctrlPressed||book.keytips'));
  wait.resolve();await request;assert.notEqual(t.run('keyboardLockState.phase'),'active');assert.equal(t.document.fullscreenElement,null);assert.equal(t.calls.filter(c=>Array.isArray(c)).length,stage==='lock'?1:0);
 }
 for(const event of ['fullscreenchange','visibilitychange','blur','pagehide','end','navigate','complete']){
  const t=boot();await start(t);const count=t.calls.filter(c=>Array.isArray(c)).length;
  if(event==='fullscreenchange')t.document.fullscreenElement=null;
  if(event==='visibilitychange')t.document.hidden=true;
  if(event==='end')t.run('endTraining()');else if(event==='navigate')t.run("page('setup')");else if(event==='complete')t.run("startOne('save');session.done=true;render()");else t.emit(event);
  await settle();assert.notEqual(t.run('keyboardLockState.phase'),'active',event);assert(t.calls.includes('unlock'));t.document.hidden=false;t.emit('focus');t.emit('visibilitychange');assert.equal(t.calls.filter(c=>Array.isArray(c)).length,count,'no automatic relock');
 }
 const exit=boot({exitError:true});await start(exit);await exit.run('stopKeyboardLock()');assert.notEqual(exit.run('keyboardLockState.phase'),'active');assert(exit.run('keyboardLockPanel()').includes('Esc 또는'));assert(exit.calls.includes('unlock'));
 console.log('PASS: unsupported/insecure, permission/fullscreen rejection, late-promise cancellation, fullscreen/hidden/blur/pagehide/training exit, no automatic relock, exit failure escape route');

 // Real application handlers and simulator, with normal and mocked locked delivery.
 for(const locked of [false,true]){
  const t=boot();t.run('ctrlAssist=false');if(locked)await start(t);
  const cases=[['help','F1','F1',{}],['edit','F2','F2',{}],['absolute','F4','F4',{}],['gotoF5','F5','F5',{}],['calc','F9','F9',{}],['saveas','F12','F12',{}],['nextsheet','PageDown','PageDown',{ctrlKey:true}],['prevsheet','PageUp','PageUp',{ctrlKey:true}],['save','KeyS','s',{ctrlKey:true}],['print','KeyP','p',{ctrlKey:true}]];
  for(const [id,code,key,mods] of cases){
   t.run(`startOne('${id}')`);const xp=t.run('state.xp'),attempts=t.run('session.attempts');assert(t.key(code,key,mods));assert(t.run('effect'),id);assert(t.run('state.xp')>xp,id);
   const rewarded=t.run('state.xp');assert(t.key(code,key,{...mods,repeat:true}));assert.equal(t.run('state.xp'),rewarded);assert.equal(t.run('session.attempts'),attempts+1);
   if(id==='help')assert.equal(t.run('book.dialog'),'help');
   if(id==='edit')assert(t.run('!!book.editor'));
   if(id==='absolute')assert.equal(t.run("cell('D2').raw"),'=D3*$H$2');
   if(id==='gotoF5'){assert.equal(t.run('book.dialog'),'goto');t.run("book.actionDialog.query='F3'");t.key('Enter','Enter');assert.equal(t.run('book.selected'),'F3')}
   if(id==='calc'){assert.equal(t.run("valueAt('F3')"),48000);assert.equal(t.run('book.manualCalc'),false)}
   if(id==='saveas'){assert.equal(t.run('book.dialog'),'saveas');t.run("book.actionDialog.name='이름 저장 실습'");t.key('Enter','Enter');assert.equal(JSON.parse(t.storage['shortcut-to-partner-workbook']).name,'이름 저장 실습');assert.equal(t.run('session.index'),0)}
   if(id==='nextsheet'){assert.equal(t.run('book.sheet'),2);assert.equal(t.run("valueAt('D2')"),830000)}
   if(id==='prevsheet'){assert.equal(t.run('book.sheet'),1);assert.equal(t.run("valueAt('D2')"),1250000)}
   if(id==='save')assert.equal(JSON.parse(t.storage['shortcut-to-partner-workbook']).worksheets[0].cells.D2.raw,'1250000');
   if(id==='print'){assert.equal(t.run('book.dialog'),'print');assert(t.run('actionDialogHtml()').includes('인쇄 미리보기'))}
   assert.equal(t.run('state.xp'),rewarded);
  }
  t.run("startOne('gotoF5')");const xp=t.run('state.xp');for(const f of ['F3','F6','F10'])assert.equal(t.key(f,f),false);assert(!t.run('effect'));assert.equal(t.run('state.xp'),xp);assert.equal(t.key('KeyW','w',{ctrlKey:true}),false);assert.equal(t.key('KeyS','s',{metaKey:true}),false);
 }
 console.log('PASS: F1/F2/F4/F5/F9/F12, Ctrl+PageDown/PageUp/S/P through the existing simulator and single XP reward in both modes; unused F keys/unrelated chords stay unhandled');

 const t=boot();t.run('ctrlAssist=false');await start(t);
 t.run("openPractice();selectCell('F3');beginCellEdit('=D3*H2',false)");
 assert(t.key('KeyS','s',{ctrlKey:true,target:{tagName:'TEXTAREA',id:'formulaInput',value:'=D3*H2'}}));assert.equal(JSON.parse(t.storage['shortcut-to-partner-workbook']).worksheets[0].cells.F3.raw,'=D3*H2');assert(!t.run('book.editor'));
 t.key('F5','F5');const dialog=t.run('book.actionDialog');assert(t.key('KeyP','p',{ctrlKey:true,target:{tagName:'INPUT',id:'dialogQuery',value:'F2'}}));assert.equal(t.run('book.dialog'),'goto');assert.deepEqual(t.run('book.actionDialog'),dialog);
 assert.equal(t.key('KeyA','a',{target:{tagName:'INPUT',id:'dialogQuery'}}),false,'text editing remains native');t.key('Escape','Escape');
 t.run("initBook(by('values'));selectCell('F2')");t.key('KeyV','v',{ctrlKey:true,altKey:true});t.key('KeyV','v');t.key('Enter','Enter');assert.equal(t.run("cell('F2').raw"),'2510000');
 t.run("initBook();profile().tools=['nextsheet'];seq=[]");t.key('AltLeft','Alt',{altKey:true});t.key('Digit1','1');assert.equal(t.run('book.sheet'),2);
 t.run("initBook(by('precedent'))");for(const [code,key] of [['AltLeft','Alt'],['KeyM','m'],['KeyP','p']])t.key(code,key);assert.equal(t.run('book.traceArrows.length'),2);
 t.run('ctrlAssist=true');t.key('ControlLeft','Control',{ctrlKey:true});for(const fn of t.handlers.keyup)fn({code:'ControlLeft',key:'Control',target:{tagName:'BODY'}});t.key('PageDown','PageDown');assert.equal(t.run('book.sheet'),2);
 const before=t.run('book.sheet');t.key('PageDown','PageDown');assert.equal(t.run('book.sheet'),before);
 const focusTarget={tagName:'BUTTON',closest:()=>({})};assert.equal(t.key('Enter','Enter',{target:focusTarget}),false,'fullscreen controls retain native keyboard activation');
 const stored=JSON.stringify(t.storage);await t.run('stopKeyboardLock()');assert.equal(JSON.stringify(t.storage),stored);
 console.log('PASS: formula-edit commit/save, modal conflict isolation/native text, Paste Special, personal QAT, ribbon sequence, released Ctrl assist, accessible mode controls and stored records');
}
main().catch(error=>{console.error(error);process.exitCode=1});
