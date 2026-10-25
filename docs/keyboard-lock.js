// Fullscreen/Keyboard Lock only deliver events. app.js remains the single scorer.
const keyboardLockState={phase:'idle',message:'',attempt:null,exiting:null,ownsFullscreen:false,installed:false};
const KEYBOARD_LOCK_FALLBACK='이 브라우저에서는 일부 단축키가 브라우저 기능과 충돌할 수 있습니다. 지원되는 Chrome/Edge 환경에서 전체화면 단축키 연습을 시도하거나 기존 Ctrl 보조 입력 기능을 사용하세요.';
function keyboardLockSupported(){return typeof navigator!=='undefined'&&typeof navigator.keyboard?.lock==='function'&&typeof navigator.keyboard?.unlock==='function'&&typeof document.documentElement?.requestFullscreen==='function'&&typeof document.exitFullscreen==='function'&&document.fullscreenEnabled!==false&&typeof isSecureContext!=='undefined'&&isSecureContext}
function shortcutCode(key){return /^[A-Z]$/.test(key)?'Key'+key:/^\d$/.test(key)?'Digit'+key:key==='-'?'Minus':key}
function keyboardLockCodes(){
 // Only registered conflicts: no Esc, modifiers, OS task switching, or unused F keys.
 const conflicts=new Set(['Ctrl+S','Ctrl+P','Ctrl+F','Ctrl+H','Ctrl+G','Ctrl+R','Ctrl+D','Ctrl+B','Ctrl+I','Ctrl+U','Ctrl+Y','Ctrl+1','Ctrl+9','Ctrl+0','Ctrl+-','Ctrl+Shift+Equal','Ctrl+PageUp','Ctrl+PageDown']);
 const codes=new Set();
 for(const command of D)for(const step of command.shortcut.split(',')){
  const key=step.split('+').at(-1);
  if(/^F(?:[1-9]|1[0-2])$/.test(key)||conflicts.has(step))codes.add(shortcutCode(key));
 }
 return [...codes].sort();
}
function registeredShortcut(e){const token=canonical(e);return !!token&&D.some(command=>command.shortcut.split(',').includes(token))}
function resetKeyboardTransition(){clearCtrlAssist();seq=[];held.clear();lastInput='';recentKey='';if(book)book.keytips=false;refreshKeys()}
function keyboardLockControls(){
 const s=keyboardLockState,busy=!!s.attempt||!!s.exiting,active=s.phase==='active',supported=keyboardLockSupported();
 const message=s.message||(!supported?KEYBOARD_LOCK_FALLBACK:'F키·Ctrl+PageUp/Down·저장·인쇄가 브라우저에서 실행되나요? 전체화면에서 연습하세요.');
 return `<div class="keyboard-lock-copy"><b>${active?'● 단축키 집중 연습 중':'전체화면 단축키 연습'}</b><p role="status" aria-live="polite">${esc(message)}</p><small>Esc로 전체화면 종료 · Fn·OS가 먼저 처리하는 키는 전달되지 않을 수 있어요.</small></div><div class="keyboard-lock-actions">${active||s.ownsFullscreen||s.attempt?`<button class="keyboard-lock-exit" onclick="stopKeyboardLock('전체화면 단축키 연습을 종료했어요.',true,true)">전체화면 연습 종료</button>`:''}${!active?`<button class="primary" ${busy||!supported?'disabled':''} onclick="startKeyboardLock()">${busy?'잠금 요청 처리 중…':'전체화면 단축키 연습 시작'}</button>`:''}<button aria-pressed="${ctrlAssist}" onclick="toggleCtrlAssist()">Ctrl 보조 입력 ${ctrlAssist?'켜짐':'켜기'}</button></div>`;
}
function keyboardLockPanel(){return `<section class="keyboard-lock-panel" data-keyboard-lock-panel aria-label="전체화면 단축키 연습" data-state="${keyboardLockState.phase}">${keyboardLockControls()}</section>`}
function updateKeyboardLockUI(){
 document.body?.classList?.toggle('shortcut-fullscreen',keyboardLockState.ownsFullscreen&&document.fullscreenElement===document.documentElement);
 for(const node of document.querySelectorAll('[data-keyboard-lock-panel]')){node.dataset.state=keyboardLockState.phase;node.innerHTML=keyboardLockControls()}
}
function unlockTrainingKeyboard(){try{navigator.keyboard?.unlock()}catch{}}
function exitTrainingFullscreen(){
 const s=keyboardLockState;if(s.exiting)return s.exiting;
 if(!s.ownsFullscreen||document.fullscreenElement!==document.documentElement)return Promise.resolve();
 s.exiting=Promise.resolve().then(()=>document.exitFullscreen()).catch(()=>{
  s.message='키보드 잠금은 해제했어요. Esc 또는 브라우저의 전체화면 종료 버튼으로 나가세요.';
 }).finally(()=>{s.exiting=null;updateKeyboardLockUI()});return s.exiting;
}
function stopKeyboardLock(message='키보드 잠금을 해제했어요. 다시 시작하려면 시작 버튼을 누르세요.',exit=true,focus=false){
 const s=keyboardLockState;if(!s.attempt&&s.phase!=='active'&&!s.ownsFullscreen)return Promise.resolve();
 if(s.attempt)s.attempt.cancelled=true;
 unlockTrainingKeyboard();s.phase='stopped';s.message=message;resetKeyboardTransition();updateKeyboardLockUI();
 const end=exit?exitTrainingFullscreen():Promise.resolve();
 return end.then(()=>{if(focus&&!s.attempt)activateSheet()});
}
async function startKeyboardLock(){
 const s=keyboardLockState;if(s.attempt||s.exiting||s.phase==='active'||!['train','practice'].includes(currentPage)||session?.done||learnerDialogOpen||celebrationOpen)return;
 if(!keyboardLockSupported()){s.phase='unsupported';s.message=KEYBOARD_LOCK_FALLBACK;updateKeyboardLockUI();return}
 const attempt={cancelled:false,fullscreen:false};s.attempt=attempt;s.phase='fullscreen';s.message='전체화면으로 전환하고 있어요.';resetKeyboardTransition();updateKeyboardLockUI();
 try{
  // No asynchronous work before this call: retain the button's user activation.
  await document.documentElement.requestFullscreen();attempt.fullscreen=true;s.ownsFullscreen=document.fullscreenElement===document.documentElement;
  if(attempt.cancelled||!s.ownsFullscreen||document.hidden)return;
  s.phase='locking';s.message='단축키 잠금을 요청하고 있어요. 브라우저가 권한을 물으면 허용 여부를 선택하세요.';updateKeyboardLockUI();
  const codes=keyboardLockCodes();if(!codes.length)throw new Error('No registered lock targets');
  await navigator.keyboard.lock(codes);
  if(attempt.cancelled||document.fullscreenElement!==document.documentElement||document.hidden)return;
  s.phase='active';s.message='단축키 집중 연습 모드가 활성화되었습니다. 브라우저 예약 단축키를 엑셀 연습에 사용할 수 있습니다.';
  resetKeyboardTransition();render();activateSheet();
 }catch(error){
  if(!attempt.cancelled){s.phase='failed';s.message=(attempt.fullscreen?'키보드 잠금을 활성화하지 못했어요.':'전체화면에 진입하지 못했어요.')+(['NotAllowedError','SecurityError'].includes(error?.name)?' 브라우저 권한과 사이트 설정을 확인하세요. ':' ')+KEYBOARD_LOCK_FALLBACK}
 }finally{
  if(s.phase!=='active'||attempt.cancelled){unlockTrainingKeyboard();if(s.phase!=='failed'&&s.phase!=='stopped'){s.phase='stopped';s.message='잠금 요청이 취소되었어요. 시작 버튼을 눌러 다시 시도하세요.'}if(attempt.fullscreen)await exitTrainingFullscreen()}
  if(s.attempt===attempt)s.attempt=null;updateKeyboardLockUI();
 }
}
function checkKeyboardLockContext(){if(!['train','practice'].includes(currentPage)||session?.done)stopKeyboardLock('훈련이 끝나 키보드 잠금을 해제했어요.')}
function installKeyboardLock(){
 const s=keyboardLockState;if(s.installed)return;s.installed=true;
 document.addEventListener?.('fullscreenchange',()=>{
  if(document.fullscreenElement===document.documentElement){if(s.attempt)s.ownsFullscreen=true}
  else{s.ownsFullscreen=false;if(['active','fullscreen','locking'].includes(s.phase))stopKeyboardLock('전체화면이 종료되어 키보드 잠금을 해제했어요.',false)}
  updateKeyboardLockUI();drawTraceArrows();
 });
 document.addEventListener?.('visibilitychange',()=>{if(document.hidden)stopKeyboardLock('페이지를 벗어나 키보드 잠금을 해제했어요. 시작 버튼으로 다시 켤 수 있어요.')});
 window.addEventListener('pagehide',()=>stopKeyboardLock('페이지를 나가 키보드 잠금을 해제했어요.'));
}
// Suppress repeats/default actions only for registered shortcuts in the practice area.
function guardTrainingKey(e){
 if(e.isComposing||e.metaKey)return false;
 if(e.target?.closest?.('[data-keyboard-lock-panel]')&&['Enter',' ','Tab'].includes(e.key)&&!e.ctrlKey&&!e.altKey)return true;
 if(!['train','practice'].includes(currentPage)||paused||learnerDialogOpen||celebrationOpen)return false;
 const input=sheetInputAllowed(e)||e.target?.id==='formulaInput'||!!book?.dialog;
 if(!input)return false;
 const registered=registeredShortcut(e),reserved=registered&&keyboardLockCodes().includes(e.code);
 if(reserved)e.preventDefault();
 if(e.repeat&&(registered||book?.editor&&['Enter','Tab','Escape'].includes(e.key))){e.preventDefault();return true}
 return false;
}
function unrelatedShortcut(e){return e.metaKey||e.isComposing||((/^F\d+$/.test(e.key)||e.ctrlKey||e.altKey)&&!registeredShortcut(e)&&!seq.length&&!['Control','Shift','Alt'].includes(e.key))}
