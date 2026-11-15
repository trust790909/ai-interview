"use client";

import { useCallback, useEffect, useState } from "react";
import type { InterviewSession } from "@/lib/schema";
import { message, request } from "@/lib/client";

export function useInterview(id: string) {
  const [session, setSession] = useState<InterviewSession>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async (signal?: AbortSignal) => {
    if (!signal) setLoading(true);
    if (!signal) setError("");
    try {
      const next = await request({ action: "read", id });
      if (!signal?.aborted) setSession(next);
    } catch (e) {
      if (!signal?.aborted) setError(message(e));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) void reload(controller.signal); });
    return () => controller.abort();
  }, [reload]);
  return { session, setSession, loading, error, setError, reload };
}

