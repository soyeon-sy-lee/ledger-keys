// Import an existing compatible training record once; never delete the original.
function migrateTrainingStorage(){
 try{
  const target='shortcut-to-partner-v1';if(localStorage.getItem(target)!==null)return;
  const matches=[];
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);if(!key||key===target||!key.endsWith('-v1'))continue;
   let value;try{value=JSON.parse(localStorage.getItem(key))}catch{continue}
   if(!value||!Array.isArray(value.profiles)||!value.profiles.length||!Number.isInteger(value.profile)||value.profile<0||value.profile>=value.profiles.length||!value.stats||typeof value.stats!=='object'||Array.isArray(value.stats))continue;
   if(!value.profiles.every(p=>p&&typeof p.name==='string'&&Array.isArray(p.tools)&&p.tools.every(t=>typeof t==='string')))continue;
   if(!Object.entries(value.stats).every(([k,v])=>k.includes('|')&&v&&typeof v.n==='number'&&typeof v.ok==='number'))continue;
   if(value.xp!==undefined&&(!Number.isFinite(value.xp)||value.xp<0))continue;
   matches.push({key,value});
  }
  if(matches.length!==1)return;
  const {key,value}=matches[0],prefix=key.slice(0,-3),next='shortcut-to-partner';
  for(const suffix of ['-keyboard','-ctrl-assist','-workbook']){
   const data=localStorage.getItem(prefix+suffix);if(data!==null&&localStorage.getItem(next+suffix)===null)localStorage.setItem(next+suffix,data);
  }
  localStorage.setItem(target,JSON.stringify(value));
 }catch{}
}
migrateTrainingStorage();

// Optional Ctrl assistance avoids sending simultaneous Ctrl chords to the host OS.
let ctrlAssist=false,ctrlQueued=false,ctrlPressed=false,ctrlUsed=false;
try{ctrlAssist=localStorage.getItem('shortcut-to-partner-ctrl-assist')==='true'}catch{}
function isMacKeyboard(){return typeof navigator!=='undefined'&&/Mac/i.test(navigator.userAgentData?.platform||navigator.platform||navigator.userAgent||'')}
function clearCtrlAssist(){ctrlQueued=false;ctrlPressed=false;ctrlUsed=false;held.delete('Ctrl');updateCtrlAssistStatus()}
function toggleCtrlAssist(){ctrlAssist=!ctrlAssist;clearCtrlAssist();seq=[];held.clear();try{localStorage.setItem('shortcut-to-partner-ctrl-assist',String(ctrlAssist))}catch{}render();activateSheet()}
function queueCtrl(){if(!ctrlAssist||paused||book?.dialog)return;ctrlQueued=!ctrlQueued;ctrlPressed=false;ctrlUsed=false;if(ctrlQueued)held.add('Ctrl');else held.delete('Ctrl');activateSheet();refreshKeys()}
function updateCtrlAssistStatus(){let status=document.getElementById('ctrlAssistStatus'),button=document.getElementById('queueCtrl');if(status)status.textContent=ctrlQueued?'Ctrl 대기 중 · 손을 뗀 상태로 나머지 키를 누르세요.':ctrlPressed?'Ctrl을 떼면 다음 키에 한 번 적용됩니다.':'Ctrl을 눌렀다 떼기 → 나머지 키 입력';if(button){button.textContent=ctrlQueued?'Ctrl 대기 취소':'Ctrl 먼저 선택';button.setAttribute?.('aria-pressed',String(ctrlQueued))}}
function ctrlAssistAllowed(e){return ['train','practice'].includes(currentPage)&&!paused&&!session?.done&&!book?.dialog&&!textEntry(e.target)&&!e.metaKey&&!e.isComposing}
function ctrlEvent(e){return {code:e.code,key:e.key,target:e.target,repeat:e.repeat,isComposing:e.isComposing,ctrlKey:true,shiftKey:!!e.shiftKey,altKey:!!e.altKey,metaKey:!!e.metaKey,preventDefault:()=>e.preventDefault(),stopPropagation:()=>e.stopPropagation?.()}}
function assistKeyDown(e){
 if(!ctrlAssist)return e;
 if(!ctrlAssistAllowed(e)){clearCtrlAssist();return e}
 if(e.key==='Escape'){clearCtrlAssist();return e}
 if(e.key==='Control'){e.preventDefault();if(!e.repeat){ctrlPressed=true;ctrlUsed=false;held.add('Ctrl')}refreshKeys();return null}
 if(['Shift','Alt','Meta'].includes(e.key))return ctrlQueued?ctrlEvent(e):e;
 if(ctrlPressed)ctrlUsed=true;
 if(!ctrlQueued)return e;
 if(e.repeat)return null;
 ctrlQueued=false;held.delete('Ctrl');updateCtrlAssistStatus();return ctrlEvent(e);
}
function assistKeyUp(e){
 if(!ctrlAssist||e.key!=='Control')return false;
 if(ctrlPressed&&!ctrlUsed&&ctrlAssistAllowed(e)){ctrlQueued=!ctrlQueued;if(ctrlQueued)held.add('Ctrl');else held.delete('Ctrl')}
 ctrlPressed=false;ctrlUsed=false;refreshKeys();return true;
}
let keyboardHelpOpen=false;
function keyboardHelp(){return `${keyboardLockPanel()}${keyboardProfile()}<details class="keyboard-help keyboard-help-collapsible" aria-label="단축키 충돌 도움말" ${keyboardHelpOpen?'open':''} ontoggle="keyboardHelpOpen=this.open"><summary>Mac · Windows 단축키 입력 도움말 <span>필요할 때 펼치기</span></summary><div class="keyboard-help-content">${keyboardModelHelp()}<div class="keyboard-help-top"><div><b>${isMacKeyboard()?'Mac에서 Windows 단축키 연습':'PC 단축키가 먼저 실행되나요?'}</b><p>이 실습은 Windows Excel 기준입니다. OS가 먼저 가져가는 키는 웹사이트에서 막을 수 없어요.</p></div><button id="ctrlAssistToggle" aria-pressed="${ctrlAssist}" onclick="toggleCtrlAssist()">Ctrl 나눠 누르기 ${ctrlAssist?'켜짐':'켜기'}</button></div>${ctrlAssist?`<div class="ctrl-assist"><b>보조 입력 모드</b><span id="ctrlAssistStatus" role="status">Ctrl을 눌렀다 떼기 → 나머지 키 입력</span><button id="queueCtrl" aria-pressed="${ctrlQueued}" onclick="queueCtrl()">Ctrl 먼저 선택</button><small>예: Ctrl 떼기 → ↓ = Ctrl + ↓ / Ctrl 떼기 → Shift + ↓ = Ctrl + Shift + ↓. 다음 키에 한 번만 적용 · Esc 취소. 실제 Windows Excel에서는 동시에 누르세요.</small></div>`:''}<details${isMacKeyboard()&&!ctrlAssist?' open':''}><summary>Mac 설정 · 키 입력 도움말</summary><p><b>원래 조합으로 연습:</b> 시스템 설정 → 키보드 → 키보드 단축키 → Mission Control에서 충돌하는 Ctrl + 방향키 항목을 해제하세요. Ctrl + ↓는 ‘응용 프로그램 윈도우’에 연결될 수 있습니다.</p><p>Ctrl + Space는 ‘입력 소스’ 설정도 확인하세요. Mac의 Control(⌃)을 사용하고 Command(⌘)로 바꾸지 마세요. Alt는 Option(⌥), F1~F12는 필요하면 Fn과 함께 누르세요.</p><p>설정을 바꾸지 않으려면 위 보조 입력을 켠 뒤 Ctrl을 먼저 눌렀다 떼세요. 실습 셀 또는 ‘키보드 켜기’를 클릭해야 입력할 수 있어요. 전체화면만으로 OS 단축키가 모두 차단되지는 않습니다.</p><a href="https://support.apple.com/guide/mac-help/keyboard-shortcuts-mchlp2262/mac" target="_blank" rel="noopener noreferrer">Apple 단축키 설정 안내 ↗</a></details></div></details>`}

const keyboardModels={generic:'일반 키보드',thinkpad:'Lenovo ThinkPad X1',k580:'Logitech K580',mxmini:'Logitech MX Keys Mini',apple:'MacBook / Apple 키보드'};
let keyboardPrefs={model:'generic',os:'auto',fn:'unknown'};
try{const p=JSON.parse(localStorage.getItem('shortcut-to-partner-keyboard')||'null');if(p){if(keyboardModels[p.model])keyboardPrefs.model=p.model;if(['auto','windows','mac'].includes(p.os))keyboardPrefs.os=p.os;if(['unknown','direct','fn'].includes(p.fn))keyboardPrefs.fn=p.fn}}catch{}
function keyboardMac(){return keyboardPrefs.os==='mac'||keyboardPrefs.os==='auto'&&isMacKeyboard()}
function setKeyboardPref(key,value){const valid={model:Object.keys(keyboardModels),os:['auto','windows','mac'],fn:['unknown','direct','fn']};if(!valid[key]?.includes(value))return;keyboardPrefs[key]=value;try{localStorage.setItem('shortcut-to-partner-keyboard',JSON.stringify(keyboardPrefs))}catch{}clearCtrlAssist();seq=[];held.clear();render()}
function keyboardSelect(key,label,options){return `<label>${label}<select aria-label="${label}" onchange="setKeyboardPref('${key}',this.value)">${Object.entries(options).map(([v,n])=>`<option value="${v}" ${keyboardPrefs[key]===v?'selected':''}>${n}</option>`).join('')}</select></label>`}
function keyboardProfile(){return `<div class="keyboard-profile">${keyboardSelect('model','내 키보드',keyboardModels)}${keyboardSelect('os','사용 OS',{auto:'자동 감지',windows:'Windows',mac:'macOS'})}${keyboardSelect('fn','F1~F12 입력 방식',{unknown:'아직 모름',direct:'F1~F12만 누르기',fn:'Fn + F1~F12 누르기'})}</div>`}
function keyboardModelHelp(){const model=keyboardPrefs.model;const info={generic:['음량·밝기가 바뀌면 Fn과 함께 눌러보세요. Fn Lock 방식은 키보드 설명서를 확인하세요.','https://www.logitech.com/en-us/discover/a/fn-key-shortcuts'],thinkpad:['Fn + Esc로 Fn Lock을 전환할 수 있습니다. X1 세대와 BIOS 설정에 따라 다르므로 F2를 눌러 확인한 뒤 입력 방식을 선택하세요. Fn과 Ctrl 위치가 바뀌어 설정된 경우 실제 Ctrl로 인식되는 키를 사용하세요.','https://support.lenovo.com/us/en/solutions/ht103044-how-to-use-the-function-keys-without-pressing-fn-in-windows-8110'],k580:['K580은 일반판과 Chrome OS판의 배열이 다를 수 있습니다. 키캡의 F2와 Fn 조합을 확인하고, 기능 키 설정은 Logi Options+와 해당 제품 설명서를 확인하세요. 이 선택은 일반판 기준 안내입니다.','https://support.logi.com/hc/en-in/articles/360037457173-Getting-Started-K580-Slim-Multi-Device-Wireless-Keyboard'],mxmini:['기본은 미디어 키 우선입니다. Fn + Esc로 미디어 키와 F1~F12 우선을 전환할 수 있습니다. 일반판과 Mac 전용판의 키 표기가 다를 수 있습니다.','https://support.logi.com/hc/en-us/articles/4409084730775-Getting-Started-MX-Keys-Mini'],apple:['기능 키가 밝기·음량으로 동작하면 Fn(🌐)과 함께 누르세요. macOS 키보드 설정에서 표준 기능 키 사용을 켜면 F2만으로 입력할 수 있습니다.','https://support.apple.com/guide/mac-help/keyboard-shortcuts-mchlp2262/mac']}[model];return `<div class="keyboard-model-help"><b>${keyboardModels[model]}</b><p>${info[0]}</p><p>${keyboardMac()?'Windows Excel 훈련이므로 Ctrl은 Control(⌃), Alt는 Option(⌥)입니다. Command(⌘)로 바꾸지 마세요.':'Windows Excel의 Ctrl·Alt 키를 사용하세요.'} Fn 잠금과 키 재배치는 웹사이트가 변경하지 않습니다.</p><a href="${info[1]}" target="_blank" rel="noopener noreferrer">제조사 안내 ↗</a><p>입력이 맞는지 확인: 아래 칸을 클릭하고 F2 또는 Fn + F2를 눌러보세요. 음량만 바뀌면 웹사이트에 키가 전달되지 않은 상태입니다.</p><input readonly aria-label="기능 키 입력 확인" placeholder="여기를 클릭하고 F2를 누르세요" onkeydown="event.stopPropagation();event.preventDefault();this.value=event.key==='F2'?'✓ F2 입력 확인됨':'감지된 키: '+event.key"></div>`}
function keyboardPhysicalHint(q){if(!(mode==='learn'||showHint||effect))return '';const path=expected(q),mac=keyboardMac(),hasF=/(^|[,+])F(?:[1-9]|1[0-2])(?=$|[,+])/.test(path);let physical=path;if(hasF&&keyboardPrefs.fn==='fn')physical=physical.replace(/(^|,)([^,]*\bF(?:[1-9]|1[0-2])\b)/g,'$1Fn+$2');if(mac)physical=physical.replaceAll('Ctrl','Control(⌃)').replaceAll('Alt','Option(⌥)');let note=hasF&&keyboardPrefs.fn==='unknown'?' · 음량이 바뀌면 Fn을 함께 누르세요.':hasF&&keyboardPrefs.fn==='fn'?' · Fn은 하드웨어에서 처리됩니다.':'';if(!hasF&&!mac)return '';return `<div class="keyboard-physical-hint">${esc(keyboardModels[keyboardPrefs.model])} · 누르는 키: <b>${esc(keyLabel(physical).replaceAll(',',' → ').replaceAll('+',' + '))}</b>${note}</div>`}
