import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { feedback, overview, question, weightedScore, type InterviewSession, type InterviewSettings } from "./schema";
import { prompts } from "./prompts";

async function generate<T extends z.ZodType>(name: keyof typeof prompts, schema: T, data: unknown, tokens: number): Promise<z.infer<T>> {
  const client = new OpenAI({ timeout: 38_000, maxRetries: 0 });
  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    instructions: prompts[name],
    input: JSON.stringify(data),
    text: { format: zodTextFormat(schema, name) },
    max_output_tokens: tokens,
    store: false,
  });
  if (!response.output_parsed) throw new Error("Incomplete model response");
  return schema.parse(response.output_parsed);
}

export async function plan(settings: InterviewSettings) {
  const result = await generate("plan", z.object({ analysis: z.string(), questions: z.array(question) }), settings, 4500);
  const unique = new Set(result.questions.map(q => q.text.replace(/[\s\p{P}]/gu, "")));
  if (result.questions.length !== settings.questionCount || unique.size !== settings.questionCount || result.questions.some(q => !q.text.trim() || !q.topic.trim())) {
    throw new Error("Invalid question plan");
  }
  return result.questions;
}

export async function follow(session: InterviewSession, answer: string) {
  const result = await generate("follow", z.object({ question: z.string().nullable() }), {
    role: session.settings.jobTitle, difficulty: session.settings.difficulty, question: session.questions[session.index], answer,
  }, 400);
  return result.question?.trim() || null;
}

export async function evaluate(session: InterviewSession) {
  const transcript = session.questions.map((question, i) => ({ question, answer: session.answers[i] }));
  const context = { settings: session.settings, transcript };
  const overviewRequest = generate("overview", overview, context, 4200);
  const feedbackRequest = async () => {
    const results = [];
    for (let i = 0; i < transcript.length; i += 3) {
      const batch = await Promise.all(transcript.slice(i, i + 3).map(async turn => {
        const result = await generate("feedback", feedback, { jobTitle: session.settings.jobTitle, difficulty: session.settings.difficulty, ...turn }, 2000);
        return { ...result, evidence: result.evidence.filter(quote => quote.trim() && [turn.answer.text, turn.answer.followUp?.answer].some(a => a?.includes(quote))) };
      }));
      results.push(...batch);
    }
    return results;
  };
  const [overall, details] = await Promise.all([overviewRequest, feedbackRequest()]);
  const answers = session.answers.flatMap(a => [a.text, a.followUp?.answer]);
  const dimensions = Object.values(overall.dimensions).map(d => ({
    ...d, evidence: d.evidence.filter(quote => quote.trim() && answers.some(a => a?.includes(quote))),
  }));
  return { summary: overall.summary, priorities: overall.priorities, feedback: details, dimensions, total: weightedScore(dimensions) };
}
