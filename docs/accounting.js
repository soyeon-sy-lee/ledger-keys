// Editorial curriculum based on linked professional guidance, not measured usage rates.
const ACCOUNT_SOURCES={
 joa:{label:'Journal of Accountancy · 회계사를 위한 Excel 팁',url:'https://www.journalofaccountancy.com/issues/2023/mar/quick-excel-tips-accountants/'},
 joa10:{label:'Journal of Accountancy · 10가지 단축키',url:'https://www.journalofaccountancy.com/issues/2014/sep/excel-shortcuts-sep-2014/'},
 floqast:{label:'FloQast · 회계사의 일상 업무 단축키',url:'https://www.floqast.com/blog/excel-shortcuts-every-accountant-needs-to-know'},
 cfi:{label:'CFI · 재무 업무 Excel 단축키',url:'https://corporatefinanceinstitute.com/resources/excel/excel-shortcuts-pc-mac/'},
 wsp:{label:'Wall Street Prep · 재무 모델링 단축키',url:'https://www.wallstreetprep.com/knowledge/excel.shortcuts/'},
 ms:{label:'Microsoft · Windows Excel 단축키',url:'https://support.microsoft.com/en-us/accessibility/excel/keyboard-shortcuts-in-excel'},
 qat:{label:'Microsoft · 빠른 실행 도구의 키와 순서',url:'https://support.microsoft.com/en-us/accessibility/office-accessibility/use-a-keyboard-to-customize-the-quick-access-toolbar'}
};
const ACCOUNT_CURRICULUM=[
 ['values',1,'조서의 계산 결과를 값으로 확정','joa'],
 ['number',1,'원장 금액의 천 단위·소수점 표시','cfi'],
 ['filter',1,'계정·거래처별 원장 검토','floqast'],
 ['down',1,'긴 원장의 데이터 경계로 이동','cfi'],
 ['select',1,'연속된 전표 범위를 한 번에 선택','joa'],
 ['prevsheet',1,'명세에서 앞쪽 조서로 이동','floqast'],
 ['nextsheet',1,'조서에서 다음 명세로 이동','floqast'],
 ['edit',1,'금액 셀의 수식 검토·수정','wsp'],
 ['absolute',1,'세율·기준 셀 참조 고정','wsp'],
 ['referjump',1,'계산에 쓰인 원본 셀 확인','wsp'],
 ['sum',1,'금액 열 합계와 대사','floqast'],
 ['filldown',1,'계산식을 아래 행으로 확장','cfi'],
 ['copy',1,'증빙·원장 데이터 복사','joa'],
 ['paste',1,'복사한 데이터·수식 붙여넣기','joa'],
 ['find',1,'원장 내 거래처·계정 검색','wsp'],
 ['autowidth',1,'긴 계정과목·적요 확인','joa'],
 ['percent',2,'비율·증감률 표시','cfi'],
 ['format',2,'조서의 금액 표시 형식 설정','cfi'],
 ['home',2,'원장 시작 위치로 복귀','joa10'],
 ['end',2,'마지막 사용 셀 확인','joa10'],
 ['row',2,'전표 행 전체 선택','joa10'],
 ['column',2,'금액·계정 열 전체 선택','joa10'],
 ['all',2,'현재 데이터 영역 선택','joa10'],
 ['fillright',2,'기간별 열로 수식 확장','cfi'],
 ['special',2,'값·수식·서식 붙여넣기 선택','wsp'],
 ['showformula',2,'시트 전체 수식을 검토','wsp'],
 ['precedent',2,'수식 원본을 화살표로 추적','wsp'],
 ['dependent',2,'현재 금액의 영향 셀 추적','wsp'],
 ['arrows',2,'검토 후 추적 화살표 정리','wsp'],
 ['sortasc',2,'금액을 작은 순서로 정렬','floqast'],
 ['sortdesc',2,'큰 금액부터 검토','floqast'],
 ['pivot',2,'계정별 금액 요약','floqast'],
 ['dedup',2,'중복 원장 데이터 확인·정리','floqast'],
 ['replace',2,'동일한 계정 표기를 일괄 변경','wsp'],
 ['save',2,'검토 중인 조서 저장','wsp'],
 ['freeze',2,'스크롤 중 제목 행·열 유지','wsp']
].map(([id,tier,why,source])=>({id,tier,why,source}));
const ACCOUNT_PRIORITY=ACCOUNT_CURRICULUM.filter(x=>x.tier===1).map(x=>x.id);
const ACCOUNT_SUPPORT=ACCOUNT_CURRICULUM.filter(x=>x.tier===2).map(x=>x.id);
const ACCOUNT_PRESET=['values','number','filter','referjump','sum','autowidth','freeze','precedent','arrows'];
let accountingMessage='';
function accountingOn(){return state.learningTrack!=='all'}
function accountingMeta(id){return ACCOUNT_CURRICULUM.find(x=>x.id===id)}
function setLearningTrack(value){if(session&&!session.done)return;state.learningTrack=value==='all'?'all':'accounting';session=null;accountingMessage='';clearCtrlAssist();save();render()}
function accountingQatReady(){if(profile().tools.length)return true;accountingMessage='회계 실무 집중에는 빠른 실행 도구가 필수예요. 내 도구 모음에 한 개 이상 추가하거나 추천 구성을 만들어주세요.';render();return false}
function accountingQat(count){
 const ids=profile().tools;if(!ids.length)return [];
 const key=JSON.stringify(ids),positions=state.accountingQatPositions||{},stored=positions[key],start=Number.isInteger(stored)&&stored>=0?stored%ids.length:0;
 const questions=Array.from({length:count},(_,i)=>({item:by(ids[(start+i)%ids.length]),route:'qat'}));
 state.accountingQatPositions={...positions,[key]:(start+count)%ids.length};return questions;
}
function shuffledItems(ids,count){let items=[...ids];for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]]}return items.slice(0,count).map(id=>({item:by(id),route:'basic'}))}
function accountingRound(){
 const basics=[...shuffledItems(ACCOUNT_PRIORITY,4),...shuffledItems(ACCOUNT_SUPPORT,2)],quick=accountingQat(4);
 if(!quick.length)return [];
 return [basics[0],basics[1],quick[0],basics[2],quick[1],basics[3],basics[4],quick[2],basics[5],quick[3]];
}
function launchAccounting(questions,title){
 if(!questions.length)return;
 currentPage='train';accountingMessage='';session={questions,index:0,correct:0,attempts:0,started:Date.now(),elapsed:0,tick:Date.now(),wrong:[],earned:0,combo:0,done:false,title,accounting:true};
 paused=false;save();resetQuestion();render();activateSheet();
 const q=questions[0];if(['absolute','linebreak'].includes(q.item.id)&&q.route!=='qat')editSelected();
}
function startAccounting(){if(!accountingQatReady())return;launchAccounting(accountingRound(),'회계 실무 집중 · '+({learn:'배우기',recall:'기억하기',mission:'실무 미션',challenge:'60초 도전'}[mode]||'훈련'))}
function startAccountingOne(id){
 const item=by(id);if(!item)return;if(!accountingQatReady())return;
 mode='learn';const quick=qat(id)?{item,route:'qat'}:accountingQat(1)[0];
 launchAccounting([{item,route:'basic'},quick],qat(id)?'같은 기능 · 기본 + 빠른 실행':'기능별 배우기 + 내 빠른 실행');
}
function startAccountingSheets(){if(!accountingQatReady())return;mode='learn';launchAccounting([{item:by('prevsheet'),route:'basic'},{item:by('nextsheet'),route:'basic'},...accountingQat(2)],'시트 이동 + 내 빠른 실행')}
function retryAccounting(){if(!accountingQatReady())return;let questions=session.questions.filter(q=>session.wrong.includes(q.item.id));if(!questions.length)return;if(!questions.some(q=>q.route==='qat'))questions.push(...accountingQat(1));launchAccounting(questions,'회계 실무 · 오답 복습')}
function createAccountingPreset(){
 let name='회계 실무 추천',n=2;while(state.profiles.some(p=>p.name===name))name='회계 실무 추천 '+n++;
 state.profiles.push({name,tools:[...ACCOUNT_PRESET]});state.profile=state.profiles.length-1;accountingMessage='';save();render();
}
function accountSourceLink(key){const s=ACCOUNT_SOURCES[key];return `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`}
function accountingBadge(id){const meta=accountingMeta(id);return meta?`<span class="account-item-tag">${meta.tier===1?'우선 반복':'회계 핵심'}</span>`:''}
function accountingDetails(){return `<details class="account-research"><summary>선정한 36개 기능 · 기준과 출처 보기</summary><p>회계 전문 매체의 실무 추천과 재무 교육 자료를 바탕으로 선정했습니다. 우선 반복 16개와 추가 핵심 20개, 출제 비율은 학습을 위해 정한 구성입니다. 사용 빈도를 측정한 통계 순위는 아닙니다. 기능 선정과 키 조합 확인을 구분했고, Windows 키 조합은 Microsoft 문서와 대조했습니다. 자료 확인: 2026-10-25.</p><p>방향키 이동·범위 선택은 아래 방향을 대표 과제로 사용합니다. 나머지 방향은 ‘전체 단축키’에서 연습할 수 있어요.</p>${[1,2].map(tier=>`<h3>${tier===1?'우선 반복 16개 · 기본 6문제 중 4문제':'추가 핵심 20개 · 기본 6문제 중 2문제'}</h3><div class="account-list">${ACCOUNT_CURRICULUM.filter(m=>m.tier===tier).map(m=>`<div><b>${esc(by(m.id).name)}</b><small>${esc(m.why)}</small><span>${pretty(by(m.id).shortcut)}</span>${accountSourceLink(m.source)}</div>`).join('')}</div>`).join('')}<div class="account-source-note">${accountSourceLink('ms')}<br>${accountSourceLink('qat')}</div><p>빠른 실행 도구는 개인 배치를 사용합니다. 추천 36개 밖의 기능도 직접 등록했다면 빠른 실행 문제에 포함돼요. 추천 구성을 만들면 기존 구성은 보관됩니다.</p></details>`}
function coursePanel(){
 const on=accountingOn(),busy=session&&!session.done,quick=profile().tools.length;
 const counts=busy&&session.accounting?`${session.questions.filter(q=>q.route==='basic').length} 기본 + ${session.questions.filter(q=>q.route==='qat').length} 빠른 실행`:'6 기본 + 4 빠른 실행';
 return `<section class="account-course ${on?'is-on':''}" aria-label="학습 범위 선택"><div class="account-course-top"><div><div class="eyebrow">YOUR DAILY ACCOUNTING TOOLS</div><h2>${on?'회계 업무에 쓰는 키부터.':'전체 단축키를 자유롭게.'}</h2></div><div class="course-switch" role="group" aria-label="학습 목록"><button aria-pressed="${on}" ${busy?'disabled':''} onclick="setLearningTrack('accounting')">회계 실무 집중</button><button aria-pressed="${!on}" ${busy?'disabled':''} onclick="setLearningTrack('all')">전체 ${D.length}개</button></div></div>${on?`<p>선정한 <b>36개 핵심 기능</b>을 집중 반복합니다. 한 회차는 <b>기본 경로 6문제 + 내 빠른 실행 도구 4문제</b>. 배우기·기억하기·실무 미션·60초 도전 모두에 적용돼요.</p><div class="account-course-bottom"><div class="account-counts"><span>우선 반복 16개</span><span>${counts}</span><span>내 도구 ${quick}개 연결</span></div>${!busy?'<button class="primary" onclick="start()">회계 실무 10문제 시작 →</button>':''}</div><p class="account-small">빠른 실행은 현재 배치에서 차례로 4문제씩 순환합니다. 4개 미만이면 반복 출제해요. 한 기능씩 배우기는 기본 1문제 + 빠른 실행 1문제입니다.</p>${accountingMessage||!quick?`<div class="account-empty" role="status"><b>${esc(accountingMessage||'빠른 실행 도구를 한 개 이상 설정하면 시작할 수 있어요.')}</b><button onclick="page('setup')">내 도구 설정</button><button onclick="createAccountingPreset()">추천 구성 새로 만들기</button></div>`:''}${accountingDetails()}`:'<p>기존 96개 기능과 훈련 경로·영역 설정을 그대로 사용할 수 있어요. 회계 실무 집중을 켜면 추천 기능과 내 빠른 실행 도구를 함께 연습합니다.</p>'}</section>`;
}
function accountingPicker(){
 const extra=profile().tools.filter(id=>!accountingMeta(id));
 const options=ids=>ids.map(id=>`<option value="${id}">${esc(by(id).name)} — ${esc(keyLabel(by(id).shortcut).replaceAll(',',' → '))}</option>`).join('');
 return `<div class="learning-picker"><label for="learnCommand">회계 핵심 · 한 기능씩</label><select id="learnCommand" onchange="startOne(this.value)"><option value="">연습할 단축키 선택…</option><optgroup label="우선 반복 · 16개">${options(ACCOUNT_PRIORITY)}</optgroup><optgroup label="추가 핵심 · 20개">${options(ACCOUNT_SUPPORT)}</optgroup>${extra.length?`<optgroup label="내 빠른 실행 도구 · 추가 항목">${options(extra)}</optgroup>`:''}</select></div><div class="account-quick-lessons" aria-label="회계 우선 연습">${['values','number','filter','select','referjump','nextsheet'].map(id=>`<button onclick="startOne('${id}')">${esc(by(id).name)}${qat(id)?'<small>기본 + 내 빠른 실행</small>':'<small>기본 + 빠른 실행 복습</small>'}</button>`).join('')}</div>`;
}
function accountPracticeButtons(buttons){if(!accountingOn())return buttons;const ids=new Set(ACCOUNT_PRIORITY);return [...ACCOUNT_PRIORITY.map(id=>[id,buttons.find(b=>b[0]===id)?.[1]||by(id).name]),...buttons.filter(([id])=>!ids.has(id))]}
function rankAccountingCommands(items){if(!accountingOn())return items;const order=new Map(ACCOUNT_CURRICULUM.map((m,i)=>[m.id,i]));return [...items].sort((a,b)=>(order.get(a.id)??999)-(order.get(b.id)??999))}
