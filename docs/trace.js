function referenceNodes(address,sheet=activeWorksheet()){return formulaReferenceNodes(sheet.cells[address]?.raw||'',sheet)}
function dependentNodes(address,sheet=activeWorksheet()){let result=[];for(const candidate of book.worksheets)for(const a of Object.keys(candidate.cells))if(referenceNodes(a,candidate).some(r=>r.sheetId===sheet.id&&r.address===address))result.push({sheetId:candidate.id,address:a});return result}
function directRefs(address){return referenceNodes(address).map(r=>r.sheetId===activeWorksheet().id?r.address:formulaSheet(r.sheetId).name+'!'+r.address)}
function directDependents(address){return dependentNodes(address).map(r=>r.sheetId===activeWorksheet().id?r.address:formulaSheet(r.sheetId).name+'!'+r.address)}
function setupTrace(q){book.traceArrows=[];book.traceLevels={};book.multiSelection=null;book.goBack=null;book.traceDemo=false;book.traceLesson=null;if(!['precedent','dependent','arrows','referjump','referback'].includes(q?.id))return;book.traceDemo=true;book.cells.F1={raw:'계산 결과'};book.cells.F3={raw:'=D3*H2'};book.cells.F5={raw:'=F3+D4'};book.selected=book.anchor=q.id==='dependent'?'D3':'F3';book.traceLesson={id:q.id,sheetId:1,address:book.selected};book.notice='F3 = D3 × H2, F5 = F3 + D4 · 수식 입력줄에서 직접 수정할 수 있어요.';if(q.id==='referback'){book.selected=book.anchor='D3';book.goBack={selected:'F3',anchor:'F3',multi:null,sheetId:1}}}
function finishTraceSetup(q){if(q?.id==='arrows')traceRelations('precedent');if(book.traceDemo)book.revealTrace=true}
function traceEdges(kind,root,level){let front=[root],visited=new Set(),edges=[];for(let i=0;i<level&&front.length;i++){let next=[];for(let a of front){const key=a.sheetId+'!'+a.address;if(visited.has(key))continue;visited.add(key);const sheet=formulaSheet(a.sheetId);if(!sheet)continue;const refs=kind==='precedent'?referenceNodes(a.address,sheet):dependentNodes(a.address,sheet);for(let b of refs){const from=kind==='precedent'?b:a,to=kind==='precedent'?a:b;edges.push({from:from.address,to:to.address,fromSheet:from.sheetId,toSheet:to.sheetId});next.push(b)}}front=next}return edges}
function traceKey(e){return (e.fromSheet||activeWorksheet().id)+'!'+e.from+'>'+(e.toSheet||activeWorksheet().id)+'!'+e.to}
function traceRelations(kind){
 const root=book.selected,key=kind+':'+root,level=(book.traceLevels[key]||0)+1,edges=traceEdges(kind,{sheetId:activeWorksheet().id,address:root},level),existing=new Set(book.traceArrows.map(traceKey));let added=0;
 for(const edge of edges)if(!existing.has(traceKey(edge))){book.traceArrows.push(edge);existing.add(traceKey(edge));added++}
 book.traceLevels[key]=level;book.revealTrace=true;book.notice=added?`${root} 선택 유지 · ${added}개 추적 화살표 표시 (원본 → 수식 셀)`:'더 이상 추적할 참조 관계가 없어요. 수식 셀 또는 참조되는 원본 셀을 선택하세요.';return added;
}
function traceMissionReady(id){
 if(!['precedent','dependent','arrows','referjump','referback'].includes(id))return true;
 const ready=id==='precedent'||id==='referjump'?referenceNodes(book.selected).length>0:id==='dependent'?dependentNodes(book.selected).length>0:id==='arrows'?book.traceArrows.length>0:!!book.goBack;
 if(ready&&!book.editor)return true;
 feedback=book.editor?'먼저 Enter로 수식을 확정해주세요. 아직 정답 처리하지 않았어요.':id==='arrows'?'표시된 화살표가 없어요. 먼저 원본 추적으로 화살표를 표시한 뒤 제거하세요.':id==='dependent'?`${book.selected}을 참조하는 수식이 없어요. 예제의 D3을 선택하거나 다른 셀에 =${book.selected} 같은 수식을 입력하세요. 아직 정답 처리하지 않았어요.`:`${book.selected}에는 참조 수식이 없어요. 예제의 F3을 선택하거나 =D3*H2 같은 수식을 입력하세요. 아직 정답 처리하지 않았어요.`;
 book.revealTrace=true;render();return false;
}
function jumpReference(kind='precedent'){
 const refs=kind==='precedent'?referenceNodes(book.selected):dependentNodes(book.selected);if(!refs.length){book.notice='이 셀에서 선택할 직접 참조 셀이 없어요.';return false}
 const previous={selected:book.selected,anchor:book.anchor,multi:book.multiSelection?book.multiSelection.slice():null,sheetId:activeWorksheet().id},first=refs[0];
 book.sheet=book.worksheets.findIndex(s=>s.id===first.sheetId)+1;book.axisSelection=null;book.selected=book.anchor=first.address;book.multiSelection=refs.filter(r=>r.sheetId===first.sheetId).map(r=>r.address);book.goBack=previous;book.restoreSheetScroll=true;book.revealTrace=true;
 book.notice='직접 참조 셀 선택: '+refs.map(r=>formulaSheet(r.sheetId).name+'!'+r.address).join(', ')+' · F5 → Enter로 이전 위치 복귀';return true;
}
function returnReference(){if(!book.goBack){book.notice='이전 참조 이동 위치가 없어요.';book.dialog=null;return}const previous=book.goBack,current={selected:book.selected,anchor:book.anchor,multi:book.multiSelection,sheetId:activeWorksheet().id},i=book.worksheets.findIndex(s=>s.id===(previous.sheetId||activeWorksheet().id));if(i<0)return;book.sheet=i+1;book.axisSelection=null;book.selected=previous.selected;book.anchor=previous.anchor;book.multiSelection=previous.multi;book.goBack=current;book.dialog=null;book.restoreSheetScroll=true;book.notice=book.selected+'로 돌아왔어요.'}
function traceAction(id){if(id==='precedent'||id==='dependent'){traceRelations(id);return true}if(id==='arrows'){book.traceArrows=[];book.traceLevels={};book.notice='모든 추적 화살표를 제거했어요. 셀 선택과 수식은 유지됩니다.';return true}if(id==='referjump'){jumpReference();return true}if(id==='referback'){returnReference();return true}return false}
function openTracePractice(){if(!requireLearner(openTracePractice))return;session=null;currentPage='practice';paused=false;initBook(by('precedent'));seq=[];held.clear();render();activateSheet()}
function traceNodeLabel(sheetId,address){return sheetId&&sheetId!==activeWorksheet().id?(formulaSheet(sheetId)?.name||'삭제된 시트')+'!'+address:address}
function traceEdgeLabel(e){return traceNodeLabel(e.fromSheet,e.from)+' → '+traceNodeLabel(e.toSheet,e.to)}
function traceContext(q){if(!['precedent','dependent','arrows','referjump','referback'].includes(q?.id)||!book)return '';const raw=cell(book.selected).raw,refs=q.id==='dependent'?directDependents(book.selected):directRefs(book.selected);return `현재 ${activeWorksheet().name}!${book.selected} · ${raw.startsWith('=')?'수식 '+raw:'값 '+raw} · ${q.id==='dependent'?'연결 수식':'원본'} ${refs.join(', ')||'없음'}`}
function selectTraceTarget(){const lesson=book.traceLesson;if(!lesson)return;const i=book.worksheets.findIndex(s=>s.id===lesson.sheetId);if(i<0)return;if(book.editor)cancelCellEdit();book.sheet=i+1;selectCell(lesson.address);book.revealTrace=true;render();activateSheet()}
function traceCellLink(sheetId,address){return `<button onclick="goToTraceCell(${sheetId},'${address}')">${esc(traceNodeLabel(sheetId,address))}</button>`}
function goToTraceCell(sheetId,address){const i=book.worksheets.findIndex(s=>s.id===sheetId);if(i<0)return;if(book.editor)cancelCellEdit();book.sheet=i+1;book.restoreSheetScroll=true;selectCell(address);book.revealTrace=true;render();activateSheet()}
function traceGuide(){
 const raw=cell(book.selected).raw,refs=referenceNodes(book.selected),dependents=dependentNodes(book.selected);
 if(!book.traceDemo&&!book.traceArrows.length&&!book.multiSelection&&!raw.startsWith('='))return '';
 return `<div class="trace-guide"><div class="trace-guide-title"><b>현재 ${esc(activeWorksheet().name)}!${book.selected}${raw.startsWith('=')?' · '+esc(raw):' · 값 '+esc(raw)}</b>${book.traceLesson?`<button onclick="selectTraceTarget()">학습 셀 ${book.traceLesson.address} 선택</button>`:''}</div><p>원본: ${refs.length?refs.map(r=>traceCellLink(r.sheetId,r.address)).join(' '):'참조 수식 없음'}<br>이 셀을 참조하는 수식: ${dependents.length?dependents.map(r=>traceCellLink(r.sheetId,r.address)).join(' '):'없음'}</p><small>Alt → M → P: 원본 추적 · Alt → M → D: 참조 수식 추적 · Ctrl + [: 원본 셀 이동. 화살표는 원본 → 수식 셀 방향입니다.</small>${book.traceArrows.length?`<div class="trace-links">${book.traceArrows.map(e=>`<span>${esc(traceEdgeLabel(e))}</span>`).join('')}</div>`:''}${book.traceArrows.some(e=>e.fromSheet!==e.toSheet)?'<small>다른 시트 관계는 점선으로 표시합니다. 위 셀 주소를 눌러 해당 시트로 이동할 수 있어요.</small>':''}${book.multiSelection?.length?`<p>현재 다중 선택: <b>${book.multiSelection.join(', ')}</b></p>`:''}</div>`;
}
function drawTraceArrows(){
 const svg=document.getElementById('traceOverlay'),canvas=document.getElementById('traceCanvas');if(!svg||!canvas?.getBoundingClientRect)return;
 const base=canvas.getBoundingClientRect(),sheetId=activeWorksheet().id;svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
 const point=a=>{let el=canvas.querySelector(`[data-address="${a}"]`);if(!el)return null;let rect=el.getBoundingClientRect();return {x:rect.left-base.left+rect.width*.5,y:rect.top-base.top+rect.height*.8}};
 svg.innerHTML='<defs><marker id="traceArrowHead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#206bc4"/></marker><marker id="crossSheetHead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#3e4a46"/></marker><marker id="traceErrorHead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#c23b35"/></marker></defs>'+book.traceArrows.map(e=>{
  const fromLocal=(e.fromSheet||sheetId)===sheetId,toLocal=(e.toSheet||sheetId)===sheetId;if(!fromLocal&&!toLocal)return '';
  let a=fromLocal?point(e.from):null,b=toLocal?point(e.to):null,cross=!fromLocal||!toLocal;if(fromLocal&&!a||toLocal&&!b)return '';
  if(!a)a={x:Math.max(40,b.x-65),y:Math.max(25,b.y-35)};if(!b)b={x:Math.max(40,a.x-65),y:Math.max(25,a.y-35)};
  const error=[calculatedValue(e.from,formulaSheet(e.fromSheet||sheetId)),calculatedValue(e.to,formulaSheet(e.toSheet||sheetId))].some(v=>typeof v==='string'&&v.startsWith('#')),color=cross?'#3e4a46':error?'#c23b35':'#206bc4',jump=e.to===book.selected?{sheetId:e.fromSheet||sheetId,address:e.from}:{sheetId:e.toSheet||sheetId,address:e.to};
  return `<g><title>${esc(traceEdgeLabel(e))}</title><circle cx="${a.x}" cy="${a.y}" r="3.5" fill="${color}"/><line class="trace-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="2.2" ${cross?'stroke-dasharray="5 4"':''} marker-end="url(#${cross?'crossSheetHead':error?'traceErrorHead':'traceArrowHead'})" ondblclick="goToTraceCell(${jump.sheetId},'${jump.address}')"/>${cross?`<text x="${fromLocal?b.x:a.x}" y="${(fromLocal?b.y:a.y)-7}" fill="${color}" font-size="12">▦</text>`:''}</g>`;
 }).join('');
}
function revealTraceView(){
 if(!book?.revealTrace)return;book.revealTrace=false;const grid=document.querySelector?.('.grid-scroll'),canvas=document.getElementById('traceCanvas');if(!grid?.getBoundingClientRect||!canvas?.getBoundingClientRect)return;
 const base=canvas.getBoundingClientRect(),ids=new Set([book.selected]);for(const e of book.traceArrows){if((e.fromSheet||activeWorksheet().id)===activeWorksheet().id)ids.add(e.from);if((e.toSheet||activeWorksheet().id)===activeWorksheet().id)ids.add(e.to)}
 const rects=[...ids].map(a=>canvas.querySelector(`[data-address="${a}"]`)?.getBoundingClientRect()).filter(Boolean);if(rects.length){const left=Math.min(...rects.map(r=>r.left))-base.left,right=Math.max(...rects.map(r=>r.right))-base.left,top=Math.min(...rects.map(r=>r.top))-base.top;grid.scrollLeft=right-left<grid.clientWidth?Math.max(0,right-grid.clientWidth+15):Math.max(0,left-35);grid.scrollTop=Math.max(0,top-50)}
 grid.scrollIntoView?.({block:'center',behavior:'auto'});drawTraceArrows();
}
