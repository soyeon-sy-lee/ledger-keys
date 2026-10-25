function setupExercise(q){
 book.fileName='회계 실습';book.views=[{id:1,sheetId:activeWorksheet().id}];book.activeView=1;book.actionDialog=null;book.paintSource=null;book.keytips=false;book.editDraft=null;book.editing=false;book.exerciseContext='';let id=q?.id;
 const put=(a,raw,style={})=>book.cells[a]={raw:String(raw),...style},choose=(a,b=a)=>{book.anchor=a;book.selected=b};
 if(['bold','italic','underline','alignleft','aligncenter','alignright','aligntop','alignbottom','border','fillcolor','fontcolor','clear','deletecontent'].includes(id)){put('B2','검토 대상',{fill:'#fff2cc'});choose('B2');if(['aligntop','alignbottom'].includes(id))book.rowHeights[2]=60;book.exerciseContext='B2 검토 대상 선택 · 서식을 적용해 화면 변화를 확인하세요.'}
 if(id==='paste')book.exerciseContext='D2 = SUM(D3:D6) 복사됨 · F2 클릭 후 붙여넣기 · 상대참조로 =SUM(F3:F6)이 붙으며 현재 결과는 0입니다.';
 if(id==='paint'){put('D2',1250000,{format:'number',bold:true,fill:'#fff2cc'});put('F2',380000);book.exerciseContext='서식 원본 D2 선택 → 명령 실행 후 F2 클릭'}
 if(id==='edit'||id==='absolute'){put('D2','=D3*H2');book.exerciseContext='D2 수식 =D3*H2 · 편집 중 F4로 마지막 H2 참조 형식 전환'}
 if(id==='linebreak'){put('B2','매출 검토 완료');choose('B2');book.editorCaret=3;book.exerciseContext='B2의 “매출” 뒤에서 셀 안 줄 바꿈을 삽입하세요.'}
 if(id==='wrap'){put('B2','매출 거래 증빙과 세금계산서 금액을 확인하고 차이 내역을 검토합니다.');choose('B2');book.exerciseContext='B2의 긴 적요 · 자동 줄 바꿈 후 행 높이도 함께 확인하세요.'}
 if(id==='merge'){put('B2','월별 검토 보고서');put('C2','');put('D2','');choose('B2','D2');book.exerciseContext='B2:D2 선택 · 왼쪽 위 셀의 제목을 병합해 가운데 표시'}
 if(['showformula','calc'].includes(id)){put('F3','=D3*H2');choose('F3');if(id==='calc'){book.manualCalc=true;book.cachedValues={F3:24000};book.exerciseContext='F3에 이전 계산값 24,000 표시 · F9로 현재 원본의 48,000으로 재계산'}else book.exerciseContext='F3의 계산 결과 48,000 → 수식 =D3*H2 표시'}
 if(['filterlist','clearfilter'].includes(id)){book.filter=true;book.filterRange={c1:0,c2:3,r1:1,r2:6};book.filterColumn='C';choose('C1');if(id==='clearfilter')book.filterText='매출';book.exerciseContext=id==='clearfilter'?'매출로 필터링된 상태 · 조건을 지워 전체 전표 표시':'C1 계정과목 선택 · 목록에서 “매출”을 입력하고 Enter'}
 if(['pivot','dedup','sortasc','sortdesc'].includes(id)){choose('D2');if(id==='dedup'){for(let c of 'ABCD')book.cells[c+'5']=clone(cell(c+'2'));book.exerciseContext='A1:D6 원본 · 2행과 5행 중복 → 창에서 확인하면 중복 행 제거'}if(id==='pivot')book.exerciseContext='A1:D6 원본 → 계정과목(C)별 금액(D) 합계 피벗테이블 생성'}
 if(['hiderow','unhiderow','group','ungroup'].includes(id)){choose('B2','B4');selectWhole('row');book.exerciseContext='2~4행 전체 선택';if(id==='unhiderow'){book.hiddenRows=[3];book.exerciseContext='2~4행 선택 · 숨겨진 3행을 다시 표시'}if(id==='ungroup')book.groups=[{id:1,axis:'row',indices:[2,3,4],collapsed:false}]}
 if(id==='hidecol'){choose('C2');selectWhole('column');book.exerciseContext='C열 전체 선택 · 숨기면 B 다음 D열 표시'}
 if(id==='freeze'){choose('C3');book.exerciseContext='C3 선택 · 틀 고정하면 위쪽 2행과 왼쪽 A:B열이 스크롤 중 유지'}
 if(id==='undo'||id==='redo'){snapshot();put('D2',999999);if(id==='redo')undoBook();book.exerciseContext=id==='undo'?'D2가 1,250,000 → 999,999로 수정됨 · 실행 취소로 복구':'D2 수정 작업을 실행 취소한 상태 · 다시 실행하면 999,999'}
 if(['insert','deletecells'].includes(id)){choose('D3');book.exerciseContext='D3 선택 · 창에서 셀 이동 방향 또는 행·열 전체 선택'}
 if(['home','end'].includes(id))choose('D4');
 if(id==='all'){choose('C3');book.exerciseContext='C3 선택 · Ctrl+A로 A1:D6 현재 데이터 영역 선택, 다시 누르면 전체 실습판'}
 if(id?.includes('ArrowUp'))choose('D6');if(id?.includes('ArrowLeft'))choose('D3');if(id?.includes('ArrowRight'))choose('B3');
 if(id==='fillright'){put('B2',150000);choose('B2','D2')}
}
function startOne(id){if(!requireLearner(()=>startOne(id)))return;if(accountingOn()){startAccountingOne(id);return;}mode='learn';currentPage='train';let item=by(id);session={questions:[{item,route:route==='qat'&&qat(id)?'qat':'basic'}],index:0,correct:0,attempts:0,started:Date.now(),elapsed:0,tick:Date.now(),wrong:[],earned:0,combo:0,done:false,title:'한 기능씩 배우기'};paused=false;resetQuestion();render();activateSheet();if(['absolute','linebreak'].includes(id)&&session.questions[0].route!=='qat')editSelected()}
function learningPicker(){if(accountingOn())return accountingPicker();return `<div class="learning-picker"><label for="learnCommand">한 기능씩 배우기 · ${D.length}개</label><select id="learnCommand" onchange="startOne(this.value)"><option value="">연습할 단축키 선택…</option>${D.map(d=>`<option value="${d.id}">${esc(d.name)} — ${esc(keyLabel(d.shortcut).replaceAll(',',' → '))}</option>`).join('')}</select></div><div class="learning-shortcuts" aria-label="행 숨김 연습"><span>행 숨김 연습</span><button onclick="startOne('hiderow')">행 숨기기 <kbd>Ctrl + 9</kbd></button><button onclick="startOne('unhiderow')">행 숨기기 취소 배우기 <kbd>Ctrl + Shift + 9</kbd></button></div>`}
function editorShortcutKey(e){if(e.target.id!=='formulaInput')return false;let token=canonical(e);if(!['F4','Alt+Enter'].includes(token))return false;let q=session?.questions[session.index];if(session&&!session.done&&!effect&&q&&(q.item.shortcut===token||qat(q.item.id)&&qpath(q.item.id)===token))return false;e.preventDefault();runTool(token==='F4'?'absolute':'linebreak');editSelected(false);return true}
