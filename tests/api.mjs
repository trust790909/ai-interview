import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

const base = process.env.INTERVIEW_TEST_URL || "http://127.0.0.1:3091";
const cases = [
  { questionCount: 5, industry: "保險業", jobTitle: "理賠流程企劃", jobDescription: "改善壽險理賠申請流程，分析補件率和處理時間，與客服、理賠、法遵及資訊處合作，兼顧個資及服務品質。" },
  { questionCount: 10, industry: "科技資訊業", jobTitle: "軟體產品經理", jobDescription: "負責 SaaS 產品規劃、使用者研究、需求優先級、A/B 測試及留存分析，與工程、設計及營運團隊協作。" },
];

for (const settings of cases) {
  test("OpenAI integrated: " + settings.questionCount + " main questions", { timeout: 320_000 }, async () => {
    const init = await fetch(base + "/api/interview");
    const cookie = init.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    const id = randomUUID();
    const post = async (data, expected = 200) => {
      const response = await fetch(base + "/api/interview", { method: "POST", headers: { cookie, "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
      assert.equal(response.status, expected, "Unexpected HTTP status on " + data.action);
      if (expected === 200) return (await response.json()).session;
    };
    let session = await post({ action: "start", settings: { ...settings, difficulty: "中階", customIndustry: "" } });
    try {
      const count = settings.questionCount;
      while (session.status !== "EVALUATING") {
        assert.ok(session.revision < count * 2);
        const old = session;
        assert.equal(old.questions.length, old.index + 1);
        session = await post({ action: "answer", revision: old.revision, answer: "我沒有直接處理過這個問題。若遇到這個情境，我會先釐清目標和限制，請相關人員共同確認現況，提出小規模改善並追蹤結果。" });
        assert.ok(session.index === old.index || session.index === old.index + 1);
        if (old.status === "FOLLOW_UP") assert.equal(session.index, old.index + 1);
      }
      assert.equal(session.index, count);
      assert.equal(session.answers.length, count);
      assert.equal(session.questions.length, count);
      assert.equal(new Set(session.questions.map(q => q.text)).size, count);
      if (settings.industry === "科技資訊業") assert.ok(!session.questions.some(q => /保戶|核保|業務員通路/.test(q.text)));
      const completed = await post({ action: "evaluate" });
      assert.equal(completed.status, "COMPLETED");
      assert.equal(completed.evaluation.feedback.length, count);
      assert.ok(completed.evaluation.feedback.every(f => f.reason.trim() && f.strategy.trim() && f.improvedAnswer.trim()));
    } finally {
      await post({ action: "delete" }, 204);
    }
  });
}
