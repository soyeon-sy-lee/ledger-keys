// Worksheet-local state is exposed through the existing book API; clipboard and XP remain workbook-wide.
const SHEET_FIELDS=['cells','selected','anchor','axisSelection','multiSelection','rowHeights','columnWidths','filter','filterText','showFormula','traceArrows','traceLevels','traceDemo','dimensionDemo','goBack','target','scrollX','scrollY','hiddenRows','hiddenCols','groups','merges','freeze','filterColumn','filterRange','manualCalc','cachedValues','pivot'];
function blankWorksheet(id,name,subtitle='빈 워크시트'){return {id,name,subtitle,hiddenRows:[],hiddenCols:[],groups:[],merges:[],freeze:{rows:0,cols:0},filterColumn:null,filterRange:null,manualCalc:false,cachedValues:{},pivot:null,cells:{},selected:'A1',anchor:'A1',axisSelection:null,multiSelection:null,rowHeights:{},columnWidths:{},filter:false,filterText:'',showFormula:false,traceArrows:[],traceLevels:{},traceDemo:false,dimensionDemo:false,goBack:null,target:null,scrollX:0,scrollY:0}}
function activeWorksheet(){return book.worksheets[book.sheet-1]}
function setupWorksheets(q){
 const first=blankWorksheet(1,'Sheet1','전표 원장');for(let key of SHEET_FIELDS)if(book[key]!==undefined)first[key]=book[key];
 const second=blankWorksheet(2,'Sheet2','매출채권 명세'),third=blankWorksheet(3,'Sheet3','비용 검토');
 function seed(sheet,rows){rows.forEach((row,r)=>row.forEach((raw,c)=>sheet.cells[addr(c,r+1)]={raw:String(raw),...(r===0?{bold:true}:{} )}));sheet.selected=sheet.anchor='D2'}
 seed(second,[['기준일','거래처','채권구분','미수금액'],['2026-10-31','한빛상사','외상매출금',830000],['2026-10-31','정우산업','외상매출금',420000],['2026-10-31','가온기업','미수금',270000],['','','합계','=SUM(D2:D4)']]);
 seed(third,[['귀속월','비용항목','검토상태','비용금액'],['2026-10','회계감사 보수','증빙 확인',350000],['2026-10','임차료','검토 완료',800000],['2026-10','소모품비','검토 필요',65000],['','','합계','=SUM(D2:D4)']]);
 book.worksheets=[first,second,third];book.sheet=1;book.restoreSheetScroll=true;book.nextSheetId=4;book.sheetDemo=['prevsheet','nextsheet','newsheet'].includes(q?.id);book.sheetLesson=null;
 for(let key of SHEET_FIELDS){delete book[key];Object.defineProperty(book,key,{enumerable:true,configurable:true,get(){return activeWorksheet()[key]},set(value){activeWorksheet()[key]=value}})}
 delete book.sheets;Object.defineProperty(book,'sheets',{enumerable:true,configurable:true,get(){return book.worksheets.length}});
 if(book.clip)book.clip.sheetId=first.id;
 if(q?.id==='prevsheet'){book.sheet=2;book.sheetLesson={from:2,to:1}}
 if(q?.id==='nextsheet')book.sheetLesson={from:1,to:2};
 if(book.sheetDemo)book.notice=activeWorksheet().name+' · '+activeWorksheet().subtitle+' 선택됨 · 아래 시트 탭을 확인하세요.';
}
function sheetScrollSnapshot(){let grid=document.querySelector?.('.grid-scroll');if(grid&&book?.worksheets){book.scrollX=grid.scrollLeft;book.scrollY=grid.scrollTop}}
function switchWorksheet(index){
 if(book.dialog)return false;
 if(index<1||index>book.sheets){book.notice=index<1?'첫 번째 시트입니다. 더 이전 시트는 없어요.':'마지막 시트입니다. 더 다음 시트는 없어요.';return false}
 if(index===book.sheet)return false;
 sheetScrollSnapshot();let previous=activeWorksheet().name;book.sheet=index;book.restoreSheetScroll=true;book.lastClick=null;sheetDrag=null;
 book.notice=previous+' → '+activeWorksheet().name+' · '+activeWorksheet().subtitle+' 표시';return true
}
function chooseWorksheet(index){if(paused||book.dialog)return;if(book.editor&&!book.editor.draft.startsWith('='))commitCellEdit(book.editor.draft);seq=[];held.clear();switchWorksheet(index);render();activateSheet()}
function addWorksheet(before=true){
 if(book.dialog)return false;sheetScrollSnapshot();snapshot();let id=book.nextSheetId++,sheet=blankWorksheet(id,'Sheet'+id),index=before?book.sheet-1:book.sheets;
 book.worksheets.splice(index,0,sheet);book.sheet=index+1;book.restoreSheetScroll=true;book.notice=sheet.name+' 새 워크시트 추가 · A1 선택';return true
}
function addWorksheetFromTab(){if(paused)return;addWorksheet(false);render();activateSheet()}
function worksheetAction(id){if(id==='prevsheet'){switchWorksheet(book.sheet-1);return true}if(id==='nextsheet'){switchWorksheet(book.sheet+1);return true}if(id==='newsheet'){addWorksheet(true);return true}return false}
function sheetMissionReady(id){if(id==='unhiderow'&&!book.hiddenRows.some(r=>selectedAxes('row').includes(r))){feedback='선택 범위에 숨겨진 행이 없어요. 숨겨진 행의 위아래까지 선택한 뒤 다시 누르세요. 아직 정답 처리하지 않았어요.';render();return false;}if(!['prevsheet','nextsheet'].includes(id)||!book.sheetLesson)return true;let {from,to}=book.sheetLesson,source=book.worksheets.find(s=>s.id===from),target=book.worksheets.find(s=>s.id===to);let next=book.worksheets[book.sheet-1+(id==='prevsheet'?-1:1)];if(activeWorksheet().id===from&&next?.id===to)return true;feedback='먼저 '+source.name+' 탭을 선택한 뒤 단축키로 '+target.name+'로 이동하세요. 아직 정답 처리하지 않았어요.';render();return false}
function sheetTabKey(e){let tab=e.target?.closest?.('[data-sheet-index]');if(!tab||e.ctrlKey||e.altKey||e.shiftKey||e.metaKey)return false;let index=Number(tab.dataset.sheetIndex),target=e.key==='ArrowLeft'?Math.max(1,index-1):e.key==='ArrowRight'?Math.min(book.sheets,index+1):e.key==='Home'?1:e.key==='End'?book.sheets:['Enter',' '].includes(e.key)?index:null;if(target===null)return false;e.preventDefault();e.stopPropagation?.();chooseWorksheet(target);document.querySelector?.('[data-sheet-index="'+target+'"]')?.focus?.({preventScroll:true});return true}
function sheetTabs(){return `<div class="worksheet-bar"><div class="worksheet-tabs" role="tablist" aria-label="워크시트 탭">${book.worksheets.map((s,i)=>`<button id="worksheet-tab-${s.id}" role="tab" data-sheet-index="${i+1}" aria-selected="${i+1===book.sheet}" aria-controls="worksheet-panel" tabindex="${i+1===book.sheet?'0':'-1'}" class="worksheet-tab ${i+1===book.sheet?'is-active':''} ${book.sheetLesson?.to===s.id?'sheet-target':''}" onclick="chooseWorksheet(${i+1})" title="${esc(s.subtitle)}">${esc(s.name)}<small>${esc(s.subtitle)}</small></button>`).join('')}</div><button class="new-worksheet" onclick="addWorksheetFromTab()" aria-label="새 워크시트 추가" title="새 시트 추가">＋</button></div><div class="worksheet-position" aria-live="polite">현재 <b>${esc(activeWorksheet().name)}</b> · ${esc(activeWorksheet().subtitle)} <span>${book.sheet} / ${book.sheets} 시트</span></div>`}
function worksheetGuide(){if(!book.sheetDemo)return '';let lesson=book.sheetLesson,from=lesson&&book.worksheets.find(s=>s.id===lesson.from),to=lesson&&book.worksheets.find(s=>s.id===lesson.to);return `<div class="worksheet-guide"><b>워크시트 이동 실습</b><p>${lesson?'미션: '+esc(from.name)+' → '+esc(to.name)+' · 목표 탭에 노란 테두리가 표시됩니다.':'아래 탭을 오가며 각 시트의 다른 내용을 확인하세요.'}</p><span><kbd>Ctrl + PageUp</kbd> 왼쪽 이전 시트 · <kbd>Ctrl + PageDown</kbd> 오른쪽 다음 시트</span></div>`}
function openSheetPractice(){if(!requireLearner(openSheetPractice))return;session=null;currentPage='practice';paused=false;initBook(by('prevsheet'));book.sheetLesson=null;seq=[];held.clear();render();activateSheet()}
function startSheetTraining(){if(!requireLearner(startSheetTraining))return;if(accountingOn()){startAccountingSheets();return;}mode='learn';route='basic';currentPage='train';session={questions:['prevsheet','nextsheet','newsheet'].map(id=>({item:by(id),route:'basic'})),index:0,correct:0,attempts:0,started:Date.now(),elapsed:0,tick:Date.now(),wrong:[],earned:0,combo:0,done:false,title:'시트 이동 집중 훈련'};paused=false;resetQuestion();render();activateSheet()}
