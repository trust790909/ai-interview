import { z } from "zod";

export const industries = ["保險業", "銀行金融業", "科技資訊業", "製造業", "零售服務業", "其他產業"] as const;
export const levels = ["初階", "中階", "進階"] as const;
export const dimensions = ["職務專業能力", "問題分析與解決能力", "表達與邏輯能力", "團隊合作與溝通能力", "回答完整性與具體程度"] as const;
export const weights = [30, 25, 20, 15, 10];
export const settingsSchema = z.object({
  industry: z.enum(industries),
  customIndustry: z.string().trim().max(60),
  jobTitle: z.string().trim().min(1).max(100),
  jobDescription: z.string().trim().min(20).max(5000),
  difficulty: z.enum(levels),
  questionCount: z.number().int().min(3).max(10),
}).refine(s => s.industry !== "其他產業" || s.customIndustry.length > 0);
export type InterviewSettings = z.infer<typeof settingsSchema>;
export const question = z.object({ topic: z.string(), text: z.string() });
export type InterviewQuestion = z.infer<typeof question>;
export type FollowUp = { text: string; answer?: string };
export type InterviewAnswer = { text: string; followUp?: FollowUp };
const score = z.number().int().min(0).max(100);
const assessment = { score, reason: z.string(), evidence: z.array(z.string()), strengths: z.string(), gaps: z.string() };
export const dimension = z.object({ ...assessment, advice: z.string() });
export const feedback = z.object({ ...assessment, strategy: z.string(), improvedAnswer: z.string() });
export const overview = z.object({
  summary: z.string(),
  dimensions: z.object({ professional: dimension, analysis: dimension, expression: dimension, teamwork: dimension, completeness: dimension }),
  priorities: z.object({ first: z.object({ title: z.string(), problem: z.string(), action: z.string(), practice: z.string() }),
    second: z.object({ title: z.string(), problem: z.string(), action: z.string(), practice: z.string() }),
    third: z.object({ title: z.string(), problem: z.string(), action: z.string(), practice: z.string() }) }),
});
export type DimensionScore = z.infer<typeof dimension>;
export type QuestionFeedback = z.infer<typeof feedback>;
export type ImprovedAnswer = QuestionFeedback["improvedAnswer"];
export type Evaluation = { summary: string; dimensions: DimensionScore[]; priorities: z.infer<typeof overview>["priorities"]; feedback: QuestionFeedback[]; total: number };
export type Status = "NOT_STARTED" | "ASKING" | "FOLLOW_UP" | "EVALUATING" | "COMPLETED";
export type InterviewSession = {
  id: string;
  settings: InterviewSettings;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  index: number;
  revision: number;
  status: Status;
  evaluation?: Evaluation;
};
export const weightedScore = (scores: DimensionScore[]) => Math.round(scores.reduce((sum, d, i) => sum + d.score * weights[i], 0) / 100);
const id = z.uuid();
export const command = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), id, settings: settingsSchema }),
  z.object({ action: z.literal("read"), id }),
  z.object({ action: z.literal("delete"), id }),
  z.object({ action: z.literal("answer"), id, revision: z.number().int().nonnegative(), answer: z.string().trim().min(1).max(1200) }),
  z.object({ action: z.literal("evaluate"), id }),
]);
