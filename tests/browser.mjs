import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.INTERVIEW_TEST_URL || "http://127.0.0.1:3091";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const answer = "我會先盤點目標、目前數據和主要使用障礙，訪談第一線使用者與相關單位，確認優先改善的情境。接著安排小規模試辦，針對實際阻礙調整，並以執行前後的使用情形與使用者回饋追蹤結果。";
try {
  const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await context.newPage();
  await page.goto(base);
  await page.getByRole("button", { name: "能力評分" }).click();
  await page.getByRole("heading", { name: "五大能力評分" }).waitFor();
  await page.getByText("可以自行設定面試題數嗎？").click();
  await page.getByText("可以設定 3 至 10 道主要題目。").waitFor();
  await page.getByRole("link", { name: "立即開始 AI 模擬面試" }).click();
  await page.getByRole("button", { name: "填入範例 JD" }).click();
  await page.getByLabel("主要題數").fill("3");
  await page.getByRole("button", { name: "開始模擬面試" }).click();
  await page.waitForURL("**/interview/session/*", { timeout: 50_000 });

  const url = page.url();
  const id = url.split("/").at(-1);
  const post = (body, request = context.request) => request.post(base + "/api/interview", { data: { id, ...body } });
  const read = async () => (await (await post({ action: "read" })).json()).session;
  const outsider = await browser.newContext();
  await outsider.request.get(base + "/api/interview");
  assert.equal((await post({ action: "read" }, outsider.request)).status(), 404);
  await outsider.close();

  const crossOrigin = await context.request.post(base + "/api/interview", {
    headers: { Origin: "https://example.invalid" }, data: { id, action: "read" },
  });
  assert.equal(crossOrigin.status(), 403);

  const first = await read();
  await page.getByLabel("輸入回答").fill(answer);
  await page.route("**/api/interview", route => route.abort("failed"), { times: 1 });
  await page.getByRole("button", { name: "送出回答" }).click();
  await page.getByText("網路連線失敗，請重試。", { exact: true }).waitFor();
  assert.equal((await read()).revision, first.revision);
  assert.equal(await page.getByLabel("輸入回答").inputValue(), answer);

  let initial = await read();
  let turns = 0;
  while (initial.status !== "EVALUATING") {
    assert.ok(++turns <= 6);
    await page.getByLabel("輸入回答").fill(answer);
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith("/api/interview") && r.request().postDataJSON()?.action === "answer" && r.ok(), { timeout: 48_000 }),
      page.getByRole("button", { name: /^(送出回答|重新送出)$/ }).click(),
    ]);
    const updated = await read();
    assert.equal(updated.revision, initial.revision + 1);
    if (turns === 1) {
      const duplicate = await post({ action: "answer", revision: initial.revision, answer });
      assert.equal(duplicate.status(), 200);
      assert.equal((await duplicate.json()).session.revision, updated.revision);
      await page.reload();
      await page.getByText("我的回答", { exact: true }).first().waitFor();
    }
    initial = updated;
  }
  assert.equal(initial.answers.length, 3);
  await page.getByRole("button", { name: "產生評估報告" }).click();
  await page.waitForURL("**/interview/result/*", { timeout: 165_000 });
  await page.getByRole("heading", { name: "逐題分析" }).waitFor();
  const completed = await read();
  assert.equal(completed.evaluation.feedback.length, 3);
  assert.equal(completed.evaluation.total, Math.round(completed.evaluation.dimensions.reduce((sum, d, i) => sum + d.score * [30, 25, 20, 15, 10][i], 0) / 100));
  for (const [i, f] of completed.evaluation.feedback.entries()) {
    await page.locator("summary").filter({ hasText: "第 " + (i + 1) + " 題｜" }).click();
    assert.ok(f.improvedAnswer.trim().length > 0);
  }
  await page.getByText("優化示範回答", { exact: true }).first().waitFor();
  await page.locator("summary").filter({ hasText: "職務專業能力" }).click();
  await page.locator("details[open]").getByText("評分理由", { exact: true }).waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole("button", { name: "使用相同職缺重新面試" }).click();
  await page.waitForURL(next => next.pathname.startsWith("/interview/session/") && next.href !== url, { timeout: 50_000 });
  assert.notEqual(page.url(), url);
  await page.getByText("第 1 / 3 題").waitFor();
  const retryId = page.url().split("/").at(-1);
  assert.equal((await post({ id: retryId, action: "delete" })).status(), 204);
  assert.equal((await post({ action: "delete" })).status(), 204);

  await page.goto(base);
  await page.getByLabel("開啟導覽").click();
  await page.getByRole("link", { name: "免費開始模擬" }).filter({ visible: true }).click();
  await page.getByRole("heading", { name: "設定你的模擬面試" }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log("Desktop and mobile checkout: landing, setup, AI answers, duplicate protection, reload, ownership, scoring, feedback, restart and deletion passed.");
} finally {
  await browser.close();
}

