import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const code = stripTypeScriptTypes(readFileSync('lib/achievement-details.ts','utf8'));
const h = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test('grade, level and bilingual labels survive repeated edits without losing legacy content',()=>{
 const body = h.writeAchievementDetails('Existing description', {grade:10,level:'district',typeUz:'Kimyo olimpiadasi'});
 const second = h.readAchievementDetails(h.writeAchievementDetails(body,{grade:11,level:'regional',resultEn:'2nd place'}));
 assert.equal(second.grade,11); assert.equal(second.level,'regional'); assert.equal(second.typeUz,'Kimyo olimpiadasi'); assert.equal(second.previousBody,'Existing description');
 assert.equal(h.readAchievementDetails('not json').grade,undefined);
});
test('unknown grades and levels are not invented and invalid inputs are discarded',()=>{
 const blank=h.readAchievementDetails(h.writeAchievementDetails(null,{})); assert.equal(blank.grade,undefined); assert.equal(blank.level,undefined);
 const invalid=h.readAchievementDetails(h.writeAchievementDetails(null,{grade:12,level:'made-up'})); assert.equal(invalid.grade,undefined);assert.equal(invalid.level,undefined);
});
test('legacy names and results render in the selected language without changing award meaning',()=>{
 assert.equal(h.localizeCredential('Milliy sertifikat','en'),'National certificate');
 assert.equal(h.localizeCredential('Chemistry Olympiad','uz'),'Kimyo olimpiadasi');
 assert.equal(h.localizeResult('Second Place','uz'),'2-o‘rin');
 assert.equal(h.localizeResult('Second Place','en'),'2nd place');
 assert.equal(h.localizeResult('Silver medal','en'),'silver medal');
 assert.equal(h.localizeResult('B2 (53/75)','en'),'B2 (53/75)');
 assert.equal(h.localizeCredential('Custom contest','uz'),'Custom contest');
 assert.equal(h.canonicalStudentName('Karimov Islombek'),'Islombek Karimov');
 assert.equal(h.canonicalStudentName('Other Student'),'Other Student');
});
