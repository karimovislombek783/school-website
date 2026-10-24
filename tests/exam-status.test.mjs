import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

async function load(file) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const { exams } = await load("../lib/exams/data.ts");
const { sessionStatus, reviewDue, tashkentDay } = await load("../lib/exams/status.ts");
test("SAT uses the exact Eastern deadline across Tashkent midnight and late registration",()=>{
  const session=exams.find(e=>e.id==="sat").sessions[0];
  assert.equal(sessionStatus(session,new Date("2026-10-24T03:58:00Z")),"today");
  assert.equal(sessionStatus(session,new Date("2026-10-24T03:59:01Z")),"late");
  assert.equal(sessionStatus(session,new Date("2026-10-28T03:59:01Z")),"closed");
  const december=exams.find(e=>e.id==="sat").sessions[1];
  assert.equal(sessionStatus(december,new Date("2026-11-21T04:58:00Z")),"today");
  assert.equal(sessionStatus(december,new Date("2026-11-21T04:59:01Z")),"late");
});
test("date-only deadlines switch after the Tashkent calendar day without claiming an exact cutoff",()=>{
  const session=exams[0].sessions[0];
  assert.equal(session.closesAt,undefined);
  assert.equal(sessionStatus(session,new Date("2026-10-30T18:59:00Z")),"today");
  assert.equal(sessionStatus(session,new Date("2026-10-30T19:00:00Z")),"closed");
  assert.equal(tashkentDay(new Date("2026-10-24T19:00:00Z")),"2026-10-25");
});
test("future sessions and overdue reviews are distinguished from open windows",()=>{
  const session=exams.find(e=>e.id==="national-language").sessions[1];
  assert.equal(sessionStatus(session,new Date("2026-10-24T12:00:00Z")),"upcoming");
  assert.equal(reviewDue("2026-10-24",new Date("2026-10-31T00:00:00Z")),false);
  assert.equal(reviewDue("2026-10-24",new Date("2026-11-01T00:00:00Z")),true);
});
test("the newer mathematics notice and rolling IELTS booking are preserved",()=>{
  const math=exams[0].sessions.find(s=>s.id==="national-math");
  assert.equal(math.examDate,"2026-11-28");
  assert.equal(math.examEnd,"2026-11-29");
  assert.match(math.source,/235092/);
  assert.match(math.payment.en,/24 hours/);
  const ielts=exams.find(e=>e.id==="ielts");
  assert.equal(ielts.rolling,true);
  assert.equal(ielts.sessions.length,0);
});
