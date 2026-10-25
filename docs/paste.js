const PASTE_OPTIONS=[['all','모두','A'],['formulas','수식','F'],['values','값','V'],['formats','서식','T'],['comments','메모','C'],['validation','유효성 검사','N'],['theme','원본 테마 사용','H'],['exceptBorders','테두리만 제외','X'],['widths','열 너비','W'],['formulaNumber','수식 및 숫자 서식','R'],['valueNumber','값 및 숫자 서식','U'],['mergeConditional','조건부 서식 병합','G']];
const PASTE_OPS=[['none','없음','O'],['add','더하기','D'],['subtract','빼기','S'],['multiply','곱하기','M'],['divide','나누기','I']];
function pasteDialog(){let training=session&&!session.done&&!effect&&session.questions[session.index]?.item.id==='values';return `<div class="paste-backdrop" aria-hidden="true"></div><div id="sheetDialog" tabindex="-1" class="mini-dialog paste-modal" role="dialog" aria-modal="true" aria-label="선택하여 붙여넣기"><div class="panel-title"><b>선택하여 붙여넣기</b><button aria-label="붙여넣기 창 닫기" onclick="cancelDialog()">×</button></div><div class="paste-target">대상 셀 <b>${book.selected}</b> · ${book.clip?book.clip.items.length+'개 셀 복사됨':'복사된 셀 없음'}</div><fieldset><legend>붙여넣기</legend><div class="paste-options">${PASTE_OPTIONS.map(([id,label,key])=>`<label class="${book.pasteType===id?'chosen':''}"><input type="radio" name="pasteType" value="${id}" ${book.pasteType===id?'checked':''} onchange="choosePaste('${id}')"> ${label} (<u>${key}</u>)</label>`).join('')}</div></fieldset><fieldset><legend>연산</legend><div class="paste-operations">${PASTE_OPS.map(([id,label,key])=>`<label><input type="radio" name="pasteOperation" value="${id}" ${(book.pasteOperation||'none')===id?'checked':''} onchange="book.pasteOperation='${id}'"> ${label} (${key})</label>`).join('')}</div></fieldset><div class="paste-checks"><label><input type="checkbox" data-option="skipBlanks" ${book.skipBlanks?'checked':''} onchange="book.skipBlanks=this.checked"> 빈 셀 건너뛰기 (B)</label><label><input type="checkbox" data-option="transpose" ${book.transpose?'checked':''} onchange="book.transpose=this.checked"> 행/열 바꿈 (E)</label></div><p class="paste-help">문자 키로 옵션 선택 · Enter 확인 · Esc 취소${!training||mode==='learn'||showHint?'<br>예: Ctrl·Alt·V를 모두 뗀 뒤 V만 누르면 ‘값’이 선택됩니다.':''}</p><div class="paste-selection" aria-live="polite">선택: ${PASTE_OPTIONS.find(p=>p[0]===book.pasteType)?.[1]||'모두'}${book.pasteOperation&&book.pasteOperation!=='none'?' · '+PASTE_OPS.find(p=>p[0]===book.pasteOperation)[1]:''}</div><div class="paste-actions"><button class="primary" onclick="confirmPaste()">확인</button><button onclick="cancelDialog()">취소</button></div></div>`}
function choosePaste(type,keyboard=false){book.pasteType=type;let q=session?.questions[session.index];if(keyboard&&q?.item.id==='values'&&!effect&&seq[0]==='Ctrl+Alt+V'){seq=type==='values'?['Ctrl+Alt+V','V']:['Ctrl+Alt+V'];lastInput=seq.join(',')}render();activateSheet()}
function beginPaste(){book.dialog='paste';book.pasteType='all';book.pasteOperation='none';book.skipBlanks=false;book.transpose=false;render();activateSheet()}
function pasteCells(type='all'){
 if(!book.clip){book.dialog=null;book.notice='복사한 셀이 없어요. 원본 셀을 복사한 뒤 다시 실행하세요.';return false}
 snapshot();let dest=coords(book.selected),clip=clone(book.clip),dc=dest[0]-clip.start[0],dr=dest[1]-clip.start[1],op=book.pasteOperation||'none';
 if(clip.cut){let source=book.worksheets.find(s=>s.id===clip.sheetId);if(source)clip.source.forEach(a=>delete source.cells[a])}
 for(let it of clip.items){if(book.skipBlanks&&it.cell.raw==='')continue;let c=dest[0]+it.offset[book.transpose?1:0],r=dest[1]+it.offset[book.transpose?0:1];if(c>7||r>ROWS)continue;let a=addr(c,r),old=clone(cell(a)),raw=it.cell.raw.startsWith('=')?shifted(it.cell.raw,dc,dr):it.cell.raw,out;
 if(type==='values')out={...old,raw:String(it.value)};
 else if(type==='formulas')out={...old,raw};
 else if(type==='formats'){out={...old};for(let k of ['format','bold','italic','underline','align','wrap','border','fill','fontColor']){delete out[k];if(it.cell[k]!==undefined)out[k]=it.cell[k]}}
 else if(type==='comments')out={...old,comment:it.cell.comment||''};
 else if(type==='validation')out={...old,validation:it.cell.validation||''};
 else if(type==='widths'){book.columnWidths=book.columnWidths||{};book.columnWidths[COLS[c]]=clip.widths?.[COLS[coords(it.a)[0]]]||100;continue}
 else if(type==='formulaNumber'||type==='valueNumber')out={...old,raw:type==='valueNumber'?String(it.value):raw,format:it.cell.format};
 else{out={...it.cell,raw};if(type==='exceptBorders')out.border=old.border;if(type==='mergeConditional')out.conditional=[...(old.conditional||[]),...(it.cell.conditional||[])]}
 if(op!=='none'&&!['formats','comments','validation','widths'].includes(type)){let left=valueAt(a),right=it.value;left=left===''?0:Number(left);right=right===''?0:Number(right);if(Number.isFinite(left)&&Number.isFinite(right)){let n={add:()=>left+right,subtract:()=>left-right,multiply:()=>left*right,divide:()=>right===0?'#DIV/0!':left/right}[op]?.();out.raw=String(n??right)}else out.raw='#VALUE!'}
 book.cells[a]=out;
 }
 if(clip.cut)book.clip=null;
 let name=PASTE_OPTIONS.find(p=>p[0]===type)?.[1]||type;book.dialog=null;book.notice=book.selected+'에 '+name+' 붙여넣기 완료'+(book.transpose?' · 행/열 바꿈':'')+' · 수식 입력줄에서 확인하세요.';book.pasteOperation='none';book.transpose=false;book.skipBlanks=false;return true
}
function confirmPaste(){
 let q=session?.questions[session.index],training=q?.item.id==='values'&&!effect&&!session.done;
 if(training){
  if(book.selected!=='F2'||book.anchor!=='F2'||!book.clip||book.clip.items[0].value!==2510000){feedback='먼저 D2를 복사하고 대상 셀 F2를 선택하세요.';book.notice=feedback;book.dialog=null;seq=[];render();activateSheet();return}
  if(book.pasteType!=='values'||(book.pasteOperation||'none')!=='none'||book.transpose){pasteCells(book.pasteType);record(false);session.failed=true;session.attempts++;session.wrong.push(q.item.id);feedback='선택한 방식으로 붙여넣었어요. 이번 미션은 ‘값’만 붙여넣기입니다. 다시 시도해 보세요.';seq=[];render();activateSheet();return}
  // Only the keyboard route used to open this dialog earns a shortcut-training result.
  if(seq[0]==='Ctrl+Alt+V'){seq=[];success();activateSheet();return}
 }
 pasteCells(book.pasteType);seq=[];render();activateSheet()
}
function modalPasteKey(e){
 if(book?.dialog!=='paste'||!['train','practice'].includes(currentPage))return false;
 if(e.key==='Tab')return true;
 if(e.repeat)return true;
 let token=canonical(e);if(!token)return true;
 e.preventDefault();e.stopPropagation?.();recentKey=token;syncHeld(e);
 if(e.key==='Escape'){cancelDialog();activateSheet();return true}
 if(e.ctrlKey||e.metaKey||e.shiftKey){book.notice='Ctrl·Alt·V를 모두 뗀 뒤 옵션 문자 키를 누르세요.';updateKeyboardStatus();return true}
 let letter=e.code.startsWith('Key')?e.code.slice(3):e.key.toUpperCase(),option=PASTE_OPTIONS.find(p=>p[2]===letter),operation=PASTE_OPS.find(p=>p[2]===letter);
 if(e.key==='Enter'){confirmPaste();return true}
 if(option){choosePaste(option[0],true);return true}
 if(operation){book.pasteOperation=operation[0];render();activateSheet();return true}
 if(letter==='B'||letter==='E'){let prop=letter==='B'?'skipBlanks':'transpose';book[prop]=!book[prop];render();activateSheet();return true}
 if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key)){let i=PASTE_OPTIONS.findIndex(p=>p[0]===book.pasteType),delta=['ArrowDown','ArrowRight'].includes(e.key)?1:-1;choosePaste(PASTE_OPTIONS[(i+delta+PASTE_OPTIONS.length)%PASTE_OPTIONS.length][0],true);return true}
 if(e.key===' '&&e.target.type==='radio'){if(e.target.name==='pasteType')choosePaste(e.target.value,true);else if(e.target.name==='pasteOperation'){book.pasteOperation=e.target.value;render();activateSheet()}return true}
 if(e.key===' '&&e.target.type==='checkbox'){if(e.target.dataset.option){book[e.target.dataset.option]=!book[e.target.dataset.option];render();activateSheet()}return true}
 return true
}
