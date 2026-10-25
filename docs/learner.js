// Learner identity belongs to the existing browser-local progress record.
let learnerDialogOpen=false,learnerPending=null,learnerRestorePaused=false;
function learnerInfo(){let value=state.learner||{};return {name:typeof value.name==='string'?value.name.trim().slice(0,24):'',firm:typeof value.firm==='string'?value.firm.trim().slice(0,40):''}}
function renderLearner(){
 const badge=document.getElementById('learnerBadge');if(!badge)return;
 const person=learnerInfo(),rank=level();
 badge.setAttribute?.('data-firm-theme',/ey|한영/i.test(person.firm.normalize('NFKC').replace(/\s/g,''))?'ey':'default');
 badge.innerHTML=`<span class="learner-avatar" aria-hidden="true">${person.name?esc(Array.from(person.name)[0]):'＋'}</span><span class="learner-identity"><span class="learner-name">${esc(person.name||'학습자 이름 등록')}</span><span class="learner-firm">${esc(person.name?(person.firm||'소속 미설정'):'첫 훈련 전에 나를 소개해주세요')}</span></span><span class="learner-rank"><span>LV.${rank+1}</span><strong>${RANKS[rank]}</strong></span><span class="learner-pencil" aria-hidden="true">✎</span>`;
 badge.setAttribute?.('aria-label',person.name?`${person.name} · ${person.firm||'소속 미설정'} · ${RANKS[rank]} · 레벨 ${rank+1}, 학습자 정보 수정`:'학습자 이름과 소속 등록');
}
function requireLearner(proceed){if(learnerInfo().name)return true;openLearner(proceed);return false}
function openLearner(proceed=null){
 if(learnerDialogOpen)return;
 const person=learnerInfo(),dialog=document.getElementById('learnerDialog');
 learnerPending=proceed;learnerRestorePaused=paused;paused=true;learnerDialogOpen=true;
 clearCtrlAssist();seq=[];held.clear();
 document.getElementById('learnerTitle').textContent=person.name?'나의 학습자 정보':'첫 출근, 이름부터 알려주세요.';
 document.getElementById('learnerName').value=person.name;
 document.getElementById('learnerFirm').value=person.firm;
 document.getElementById('learnerError').textContent='';
 document.getElementById('learnerLevel').textContent=`LV.${level()+1} · ${RANKS[level()]}`;
 document.getElementById('learnerSubmit').textContent=proceed?'저장하고 학습 시작 →':'저장하기';
 document.getElementById('learnerCancel').textContent=person.name?'취소':'먼저 둘러보기';
 dialog.showModal();document.getElementById('learnerName').focus();
}
function closeLearner(continueLearning=false){
 const proceed=continueLearning?learnerPending:null;learnerPending=null;learnerDialogOpen=false;
 document.getElementById('learnerDialog').close();paused=learnerRestorePaused;if(session)session.tick=Date.now();
 render();if(proceed)proceed();else document.getElementById('learnerBadge')?.focus?.({preventScroll:true});
}
function saveLearner(event){
 event?.preventDefault();
 const name=document.getElementById('learnerName').value.trim(),firm=document.getElementById('learnerFirm').value.trim(),error=document.getElementById('learnerError');
 if(!name){error.textContent='이름 또는 닉네임을 입력해주세요.';document.getElementById('learnerName').focus();return false}
 if(name.length>24||firm.length>40){error.textContent='이름은 24자, 소속 법인은 40자 이내로 입력해주세요.';return false}
 const nextState={...state,learner:{name,firm}};
 try{localStorage.setItem('shortcut-to-partner-v1',JSON.stringify(nextState))}catch{error.textContent='정보를 저장하지 못했어요. 브라우저의 저장 공간 설정을 확인해주세요.';return false}
 state=nextState;closeLearner(true);return true;
}

let celebrationOpen=false;
function showPromotion(preview=false){
 const dialog=document.getElementById('promotionDialog');if(!dialog?.showModal||celebrationOpen||(!promotion&&!preview))return;
 const rank=preview?Math.min(level()+1,RANKS.length-1):level();
 celebrationOpen=true;clearCtrlAssist();seq=[];held.clear();
 const pieces=Array.from({length:70},(_,i)=>`<i style="--x:${(i*37)%100}%;--dx:${(i%2?1:-1)*(60+i%9*24)}px;--delay:${i%10*.08}s;--color:${['#e7ba5b','#61c795','#86b9ed','#ee8c9f','#f1df9a'][i%5]};--spin:${i%2?720:-720}deg"></i>`).join('');
 dialog.innerHTML=`<div class="promotion-confetti" aria-hidden="true">${pieces}</div><div class="promotion-content"><div class="promotion-medal" aria-hidden="true">✦</div><div class="eyebrow">${preview?'CELEBRATION PREVIEW':'LEVEL UP!'}</div><h2 id="promotionTitle">승진을 축하합니다!</h2><p>${esc(learnerInfo().name||'학습자')}님, 꾸준한 연습이 빛났어요.</p><div class="promotion-new-rank"><small>LEVEL ${rank+1}</small><strong>${esc(RANKS[rank])}</strong></div><p>${preview?'미리보기예요. 실제 XP와 직급은 바뀌지 않아요.':'한 단계 더 성장했어요. 다음 직급도 함께 도전해요!'}</p><button class="primary" onclick="closePromotion()">${preview?'미리보기 닫기':'좋아요! 계속 연습하기 →'}</button></div>`;
 dialog.showModal();dialog.querySelector?.('button')?.focus();
}
function closePromotion(){document.getElementById('promotionDialog')?.close?.();celebrationOpen=false;promotion='';if(session)session.tick=Date.now();render();activateSheet()}
