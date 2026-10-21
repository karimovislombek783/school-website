import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createRequire} from 'node:module';
const nativeRequire=createRequire(import.meta.url);
function load(rpc=async()=>({data:true,error:null})){
 const js=ts.transpileModule(readFileSync('lib/abuse-budget.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(js,{module,exports:module.exports,Uint8Array,TextDecoder,Error,require:name=>name==='server-only'?{}:name==='@/lib/newsletter/server'?{newsletterDatabase:()=>({rpc})}:nativeRequire(name)});
 return module.exports;
}
test('body limits reject streamed oversized JSON even without Content-Length',async()=>{
 const {readBoundedJson}=load();let cancelled=false;
 const request={headers:new Headers(),body:new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('x'.repeat(17000)));},cancel(){cancelled=true;}})};
 await assert.rejects(()=>readBoundedJson(request),/payload-too-large/);assert.equal(cancelled,true);
});
test('body limit counts UTF-8 bytes and accepts bounded valid JSON',async()=>{
 const {readBoundedJson}=load();const text=JSON.stringify({text:'🙂'.repeat(100)});
 await assert.rejects(()=>readBoundedJson(new Request('https://school.test',{method:'POST',body:text}),300),/payload-too-large/);
 const parsed=await readBoundedJson(new Request('https://school.test',{method:'POST',body:'{"lang":"uz"}'}));assert.equal(parsed.lang,'uz');
});
test('quota RPC receives hashed identities and whole-batch reservation amounts',async()=>{
 let args;const gate=load(async(name,p)=>{assert.equal(name,'school_consume_budget');args=p;return{data:true,error:null}});
 assert.equal(await gate.consumeBudget('emails','site',90,86400,20),true);assert.match(args.p_identity,/^[a-f0-9]{64}$/);assert.equal(args.p_amount,20);
});
test('quota failure and unexpected responses cannot allow downstream email work',async()=>{
 for(const result of [{data:null,error:{message:'offline'}},{data:null,error:null},{data:false,error:null}]){
  let work=0;const gate=load(async()=>result);
  try{if(await gate.consumeBudget('emails','site',90,86400))work++;}catch{}
  assert.equal(work,0);
 }
});
test('changing a user-agent cannot change the per-IP identity',()=>{
 const gate=load();const make=agent=>new Request('https://school.test',{headers:{'x-vercel-forwarded-for':'203.0.113.7','user-agent':agent}});
 assert.equal(gate.requestAddress(make('a')),gate.requestAddress(make('b')));
});
