import type { InterviewSession } from "./schema";

export function advance(session: InterviewSession, answer: string, followUp: string | null): InterviewSession {
  if (session.status !== "ASKING" && session.status !== "FOLLOW_UP") throw new Error("Invalid transition");
  const answers = session.answers.slice();
  const index = session.index;
  const previous = answers[index];
  if (session.status === "FOLLOW_UP" && previous?.followUp) {
    answers[index] = { ...previous, followUp: { ...previous.followUp, answer } };
  } else {
    answers[index] = { text: answer, ...(followUp ? { followUp: { text: followUp } } : {}) };
    if (followUp) return { ...session, answers, status: "FOLLOW_UP", revision: session.revision + 1 };
  }
  const next = index + 1;
  return { ...session, answers, index: next, status: next === session.settings.questionCount ? "EVALUATING" : "ASKING", revision: session.revision + 1 };
}

export function publicSession(session: InterviewSession) {
  return { ...session, questions: session.questions.slice(0, session.index + 1) };
}
