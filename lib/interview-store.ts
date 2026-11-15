import * as sqlite from "./store";
import { redisEnabled, redisStore } from "./redis-store";

export const interviewStore = redisEnabled() ? redisStore : sqlite;
