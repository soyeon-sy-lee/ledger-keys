// A bounded formula parser. User formulas are data: never execute JavaScript.
const formulaTrees=new Map();
const FORMULA_REF=/^(?:(?:'((?:[^']|'')+)'|([A-Za-z_][A-Za-z0-9_.]*))!)?(\$?[A-Za-z]+\$?\d+)(?::(\$?[A-Za-z]+\$?\d+))?(?![A-Za-z0-9_])/;
function formulaError(code='#FORMULA?'){throw new Error(code)}
function parseFormula(raw){
 if(formulaTrees.has(raw))return formulaTrees.get(raw);if(raw.length>2000)formulaError();
 let text=raw.slice(1),tokens=[],pos=0;
 while(pos<text.length){const rest=text.slice(pos);let m;
  if(/^\s/.test(rest)){pos++;continue}
  if(m=/^"((?:[^"]|"")*)"/.exec(rest)){tokens.push({kind:'value',value:m[1].replaceAll('""','"')})}
  else if(m=FORMULA_REF.exec(rest)){tokens.push({kind:'ref',sheet:m[1]?.replaceAll("''","'")||m[2]||null,first:m[3].replaceAll('$','').toUpperCase(),last:(m[4]||m[3]).replaceAll('$','').toUpperCase()})}
  else if(m=/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i.exec(rest)){tokens.push({kind:'value',value:Number(m[0])})}
  else if(m=/^[A-Za-z_][A-Za-z0-9_.]*/.exec(rest)){tokens.push({kind:'name',name:m[0].toUpperCase()})}
  else if(m=/^(?:<=|>=|<>|[+\-*/^%&=<>(),;])/.exec(rest)){tokens.push({kind:m[0]===';'?',':m[0]})}
  else formulaError();pos+=m[0].length;
 }
 let index=0,peek=()=>tokens[index]?.kind,take=kind=>{if(peek()!==kind)formulaError();return tokens[index++]};
 function atom(){const t=tokens[index++];if(!t)formulaError();if(t.kind==='value'||t.kind==='ref')return t;if(t.kind==='('){let v=expression(0);take(')');return v}if(t.kind==='+'||t.kind==='-')return {kind:'unary',op:t.kind,arg:expression(6)};if(t.kind==='name'){if(t.name==='TRUE'||t.name==='FALSE')return {kind:'value',value:t.name==='TRUE'};take('(');let args=[];if(peek()!==')'){args.push(expression(0));while(peek()===','){index++;args.push(expression(0))}}take(')');return {kind:'call',name:t.name,args}}formulaError()}
 const precedence={'=':1,'<>':1,'<':1,'>':1,'<=':1,'>=':1,'&':2,'+':3,'-':3,'*':4,'/':4,'^':5};
 function expression(min){let left=atom();while(true){if(peek()==='%'){index++;left={kind:'percent',arg:left};continue}let op=peek(),power=precedence[op];if(power===undefined||power<min)break;index++;left={kind:'binary',op,left,right:expression(power+(op==='^'?0:1))}}return left}
 const tree=expression(0);if(index!==tokens.length)formulaError();if(formulaTrees.size>500)formulaTrees.clear();formulaTrees.set(raw,tree);return tree;
}
function formulaSheet(id){return book.worksheets?.find(s=>s.id===id)}
function referenceCells(ref,origin){
 const sheet=ref.sheet?book.worksheets?.find(s=>s.name.toLowerCase()===ref.sheet.toLowerCase()):origin;
 const a=coords(ref.first),b=coords(ref.last);if(!sheet||!a||!b)formulaError('#REF!');let result=[];
 for(let r=Math.min(a[1],b[1]);r<=Math.max(a[1],b[1]);r++)for(let c=Math.min(a[0],b[0]);c<=Math.max(a[0],b[0]);c++)result.push({sheetId:sheet.id,address:addr(c,r)});return result;
}
function formulaReferenceNodes(raw,origin=activeWorksheet()){
 if(!raw?.startsWith('='))return [];let refs=[];
 try{const visit=node=>{if(node.kind==='ref'){try{refs.push(...referenceCells(node,origin))}catch{}}if(node.left)visit(node.left);if(node.right)visit(node.right);if(node.arg)visit(node.arg);node.args?.forEach(visit)};visit(parseFormula(raw))}catch{}
 return [...new Map(refs.map(r=>[r.sheetId+'!'+r.address,r])).values()];
}
function evaluateCell(address,sheet,seen=[]){
 if(!coords(address)||!sheet)formulaError('#REF!');const key=sheet.id+'!'+address;
 if(seen.includes(key))formulaError('#CYCLE!');if(sheet.manualCalc&&Object.hasOwn(sheet.cachedValues||{},address))return sheet.cachedValues[address];
 const raw=sheet.cells[address]?.raw??'';if(!raw.startsWith('='))return raw!==''&&Number.isFinite(Number(raw))?Number(raw):raw;
 const number=value=>{if(Array.isArray(value)){if(value.length!==1)formulaError('#VALUE!');value=value[0]}if(value==='')return 0;if(typeof value==='boolean')return +value;if(typeof value!=='number'||!Number.isFinite(value))formulaError('#VALUE!');return value};
 function evaluate(node){
  if(node.kind==='value')return node.value;
  if(node.kind==='ref'){const values=referenceCells(node,sheet).map(r=>evaluateCell(r.address,formulaSheet(r.sheetId)||sheet,[...seen,key]));return node.first===node.last?values[0]:values}
  if(node.kind==='unary')return (node.op==='-'?-1:1)*number(evaluate(node.arg));
  if(node.kind==='percent')return number(evaluate(node.arg))/100;
  if(node.kind==='binary'){let a=evaluate(node.left),b=evaluate(node.right);if(node.op==='&')return String(a)+String(b);if(['=','<>','<','>','<=','>='].includes(node.op)){if(typeof a==='string'&&typeof b==='string'){a=a.toLowerCase();b=b.toLowerCase()}return {'=':a===b,'<>':a!==b,'<':a<b,'>':a>b,'<=':a<=b,'>=':a>=b}[node.op]}a=number(a);b=number(b);if(node.op==='/'&&!b)formulaError('#DIV/0!');return {'+':()=>a+b,'-':()=>a-b,'*':()=>a*b,'/':()=>a/b,'^':()=>a**b}[node.op]()}
  if(node.kind==='call'){
   if(node.name==='IF'){if(node.args.length<2||node.args.length>3)formulaError();return evaluate(node.args[0])?evaluate(node.args[1]):node.args[2]?evaluate(node.args[2]):false}
   const values=node.args.map(evaluate).flat(Infinity),nums=values.filter(v=>typeof v==='number');
   if(node.name==='SUM')return nums.reduce((a,b)=>a+b,0);
   if(node.name==='COUNT')return nums.length;
   if(node.name==='AVERAGE'){if(!nums.length)formulaError('#DIV/0!');return nums.reduce((a,b)=>a+b,0)/nums.length}
   if(node.name==='MIN')return nums.length?Math.min(...nums):0;
   if(node.name==='MAX')return nums.length?Math.max(...nums):0;
   if(node.name==='ABS'&&node.args.length===1)return Math.abs(number(values[0]));
   if(node.name==='ROUND'&&node.args.length===2){const n=number(values[0]),digits=Math.trunc(number(values[1]));if(Math.abs(digits)>15)formulaError('#NUM!');const factor=10**digits;return Math.sign(n)*Math.round(Math.abs(n)*factor+1e-10)/factor}
   formulaError();
  }formulaError();
 }
 const result=evaluate(parseFormula(raw));if(Array.isArray(result))formulaError('#VALUE!');if(typeof result==='number'&&!Number.isFinite(result))formulaError('#NUM!');return result;
}
function calculatedValue(address,sheet=book.worksheets?activeWorksheet():{id:1,cells:book.cells}){try{return evaluateCell(address,sheet)}catch(error){return /^#[A-Z/0-9?!]+$/.test(error.message)?error.message:'#ERROR!'}}
function qualifiedReference(sheet,address,originId){return sheet.id===originId?address:(/^[A-Za-z_][A-Za-z0-9_]*$/.test(sheet.name)?sheet.name:"'"+sheet.name.replaceAll("'","''")+"'")+'!'+address}
function renameFormulaSheet(oldName,newName){
 for(const sheet of book.worksheets)for(const value of Object.values(sheet.cells)){if(!value.raw.startsWith('='))continue;let offset=1,out='=';while(offset<value.raw.length){const rest=value.raw.slice(offset),str=/^"(?:[^"]|"")*"/.exec(rest),ref=FORMULA_REF.exec(rest);if(str){out+=str[0];offset+=str[0].length}else if(ref){const name=ref[1]?.replaceAll("''","'")||ref[2];out+=name?.toLowerCase()===oldName.toLowerCase()?qualifiedReference({id:-1,name:newName},ref[3]+(ref[4]?':'+ref[4]:''),-2):ref[0];offset+=ref[0].length}else out+=value.raw[offset++]}value.raw=out}
}

// Editing keeps its destination independent from cells clicked as references.
function beginCellEdit(initial,focus=true){
 if(!book.editor)book.editor={sheetId:activeWorksheet().id,address:book.selected,draft:initial??book.editDraft??cell(book.selected).raw,start:0,end:0,pick:null};
 if(initial!==undefined)book.editor.draft=initial;book.editor.start=book.editor.end=book.editor.draft.length;book.editing=true;book.editDraft=book.editor.draft;seq=[];held.clear();clearCtrlAssist();
 if(focus){render();focusFormulaEditor()}
}
function focusFormulaEditor(){const input=document.getElementById('formulaInput'),e=book.editor;if(!input||!e)return;input.value=e.draft;input.focus?.({preventScroll:true});input.setSelectionRange?.(e.start,e.end);updateKeyboardStatus()}
function rememberFormulaCaret(input){const e=book.editor;if(!e)return;e.start=input.selectionStart??e.draft.length;e.end=input.selectionEnd??e.start}
function formulaInputChanged(input){if(!book.editor)beginCellEdit(input.value,false);book.editor.draft=input.value;book.editDraft=input.value;book.editor.pick=null;rememberFormulaCaret(input);book.editing=true;updateFormulaEditingUI()}
function updateFormulaEditingUI(){const status=document.getElementById('formulaEditStatus');if(status)status.innerHTML=formulaEditMessage();for(const node of document.querySelectorAll?.('[data-address]')||[])node.classList?.toggle('formula-reference-cell',editorReferences().some(r=>r.sheetId===activeWorksheet().id&&r.address===node.dataset.address))}
function editorReferences(){if(!book.editor)return [];const raw=book.editor.draft,origin=formulaSheet(book.editor.sheetId),refs=formulaReferenceNodes(raw,origin);if(refs.length)return refs;for(const span of referenceSpans(raw)){const m=FORMULA_REF.exec(raw.slice(span.start));try{refs.push(...referenceCells({sheet:m[1]?.replaceAll("''","'")||m[2]||null,first:m[3].replaceAll('$','').toUpperCase(),last:(m[4]||m[3]).replaceAll('$','').toUpperCase()},origin))}catch{}}return refs}
function referenceSpans(raw){let spans=[],i=1;while(i<raw.length){let rest=raw.slice(i),str=/^"(?:[^"]|"")*"/.exec(rest),ref=FORMULA_REF.exec(rest);if(str)i+=str[0].length;else if(ref){spans.push({start:i,end:i+ref[0].length});i+=ref[0].length}else i++}return spans}
function insertFormulaReference(address,extend=false){
 const e=book.editor;if(!e||!e.draft.startsWith('='))return false;
 let input=document.getElementById('formulaInput');if(input&&typeof input.value==='string'){e.draft=input.value;rememberFormulaCaret(input)}
 let start=e.start,end=e.end,anchor=address,pick=e.pick;
 if(pick&&e.draft.slice(pick.start,pick.end)===pick.text&&start===pick.end&&end===start){start=pick.start;end=pick.end;if(extend&&pick.sheetId===activeWorksheet().id)anchor=pick.anchor}
 else if(start===end){const ref=referenceSpans(e.draft).find(r=>start>=r.start&&start<=r.end);if(ref){start=ref.start;end=ref.end}}
 const range=anchor===address?address:anchor+':'+address,text=qualifiedReference(activeWorksheet(),range,e.sheetId);
 e.draft=e.draft.slice(0,start)+text+e.draft.slice(end);e.start=e.end=start+text.length;e.pick={start,end:e.end,text,anchor,sheetId:activeWorksheet().id};book.editDraft=e.draft;
 render();focusFormulaEditor();return true;
}
function cancelCellEdit(){const e=book.editor;book.editor=null;book.editDraft=null;book.editing=false;if(e){const i=book.worksheets.findIndex(s=>s.id===e.sheetId);if(i>=0){book.sheet=i+1;book.selected=book.anchor=e.address}}render();activateSheet()}
function commitCellEdit(value){
 const e=book.editor;if(e){const i=book.worksheets.findIndex(s=>s.id===e.sheetId);if(i<0){cancelCellEdit();return}book.sheet=i+1;book.selected=book.anchor=e.address;book.axisSelection=null;book.multiSelection=null;book.restoreSheetScroll=true}
 const previous=cell(book.selected).raw;value=String(value);snapshot();book.cells[book.selected]={...cell(book.selected),raw:value};
 if(previous!==value&&(previous.startsWith('=')||value.startsWith('=')))for(const sheet of book.worksheets){sheet.traceArrows=[];sheet.traceLevels={}}
 book.editor=null;book.editDraft=null;book.editing=false;book.lastClick=null;book.notice=book.selected+' 입력 완료'+(value.startsWith('=')?' · 수식 확정됨 · 원본 추적으로 참조 관계를 확인하세요.':'');render();activateSheet();
}
function formulaEditorKey(e){
 if(book?.dialog||learnerDialogOpen||paused||e.isComposing)return false;
 if(e.target?.id==='formulaInput'){
  if(e.ctrlKey&&['PageUp','PageDown'].includes(e.key)&&book.editor){e.preventDefault();chooseWorksheet(book.sheet+(e.key==='PageUp'?-1:1));return true}
  if(e.key==='Enter'&&!e.altKey){e.preventDefault();commitCellEdit(e.target.value);return true}
  if(e.key==='Escape'){e.preventDefault();cancelCellEdit();return true}
  if(e.key==='Tab'){e.preventDefault();commitCellEdit(e.target.value);moveSelection(e.shiftKey?'Shift+Tab':'Tab');render();activateSheet();return true}
  return false;
 }
 if(!book.editor&&!textEntry(e.target)&&e.key==='='&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!seq.length&&['train','practice'].includes(currentPage)){e.preventDefault();beginCellEdit('=');return true}
 return false;
}
function replaceEditorText(value,caret){book.editor.draft=value;book.editor.start=book.editor.end=caret;book.editor.pick=null;book.editDraft=value;focusFormulaEditor();updateFormulaEditingUI()}
function cycleEditorReference(){
 const e=book.editor,input=document.getElementById('formulaInput');if(input&&typeof input.value==='string'){e.draft=input.value;rememberFormulaCaret(input)}
 const refs=[...e.draft.matchAll(/(\$?)([A-H])(\$?)(1[0-2]|[1-9])(?!\d)/gi)],match=refs.find(m=>e.start>=m.index&&e.start<=m.index+m[0].length)||refs.at(-1);if(!match)return;
 const col=match[2].toUpperCase(),row=match[4],forms=[col+row,'$'+col+'$'+row,col+'$'+row,'$'+col+row],replacement=forms[(forms.indexOf(match[0].toUpperCase())+1)%4],value=e.draft.slice(0,match.index)+replacement+e.draft.slice(match.index+match[0].length);
 replaceEditorText(value,match.index+replacement.length);
 if(session&&!effect&&session.questions[session.index]?.item.id==='absolute')commitCellEdit(value);
}
function insertEditorLineBreak(){const e=book.editor,input=document.getElementById('formulaInput');if(input&&typeof input.value==='string'){e.draft=input.value;rememberFormulaCaret(input)}const value=e.draft.slice(0,e.start)+'\n'+e.draft.slice(e.end);replaceEditorText(value,e.start+1);if(session&&!effect&&session.questions[session.index]?.item.id==='linebreak'){commitCellEdit(value);book.cells[book.selected].wrap=true;fitDimensions('row')}}
function formulaEditMessage(){const e=book.editor;if(!e)return '<b>수식 만들기</b> 셀 선택 → <kbd>=</kbd> 입력 → 참조할 셀 클릭 → Enter. Shift + 클릭으로 범위를 넣을 수 있어요.';return `<b>${esc(qualifiedReference(formulaSheet(e.sheetId),e.address,activeWorksheet().id))} 편집 중</b> ${e.draft.startsWith('=')?'셀을 클릭하면 주소가 수식에 들어갑니다. Shift + 클릭: 범위 · 시트 탭: 다른 시트 참조.':'내용을 입력하고 Enter로 저장하세요.'} <button onclick="commitCellEdit(document.getElementById('formulaInput').value)">입력 완료</button><button onclick="cancelCellEdit()">취소</button>`}
function formulaHelp(){return `<div class="formula-help"><div id="formulaEditStatus" role="status">${formulaEditMessage()}</div><details><summary>입력 가능한 수식 예시</summary><p>=D3*H2 · =SUM(D2:D6) · =AVERAGE(D2:D6) · =ROUND(D3*H2,0) · =IF(D3&gt;0,"확인","검토") · =Sheet2!D2</p><p>A1:H12와 현재 통합문서의 시트 참조, 절대참조($), 사칙연산·거듭제곱·백분율·비교, SUM·AVERAGE·MIN·MAX·COUNT·ROUND·ABS·IF를 지원합니다. 그 밖의 함수는 #FORMULA?로 표시됩니다.</p></details></div>`}
