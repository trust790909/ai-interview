import assert from "node:assert/strict";
import { test } from "node:test";
import { advance, publicSession } from "../lib/state.ts";
import { settingsSchema, weightedScore } from "../lib/schema.ts";

for (const size of [3, 5, 10]) {
  test(size + " main questions, with and without follow-up", () => {
    let session = { id: "test", settings: { questionCount: size }, questions: Array.from({ length: size }, (_, i) => ({ text: String(i), topic: "能力" })), answers: [], index: 0, revision: 0, status: "ASKING" };
    for (let i = 0; i < size; i++) {
      assert.equal(publicSession(session).questions.length, i + 1);
      assert.equal(session.index, i);
      const followUp = i % 2 === 0;
      session = advance(session, "主要回答", followUp ? "追問" : null);
      if (followUp) {
        assert.equal(session.status, "FOLLOW_UP");
        assert.equal(session.index, i);
        session = advance(session, "追問回答", "不應新增第二次追問");
        assert.deepEqual(session.answers[i].followUp, { text: "追問", answer: "追問回答" });
      }
    }
    assert.equal(session.status, "EVALUATING");
    assert.equal(session.answers.length, size);
    assert.throws(() => advance(session, "太晚送出的回答", null));
  });
}
test("validates integer question counts and custom industry", () => {
  const settings = { industry: "其他產業", customIndustry: "教育", jobTitle: "企劃", jobDescription: "依需求規劃線上課程並追蹤使用者學習成效及回饋。", difficulty: "中階", questionCount: 5 };
  assert.ok(settingsSchema.safeParse(settings).success);
  for (const questionCount of [2, 10.5, 11]) assert.equal(settingsSchema.safeParse({ ...settings, questionCount }).success, false);
  assert.equal(settingsSchema.safeParse({ ...settings, customIndustry: "" }).success, false);
});
test("calculates weighted total in server order", () => {
  assert.equal(weightedScore([100, 80, 60, 40, 20].map(score => ({ score }))), 70);
});
