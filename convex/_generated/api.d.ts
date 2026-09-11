/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiCoach from "../aiCoach.js";
import type * as challengeData from "../challengeData.js";
import type * as coachLimits from "../coachLimits.js";
import type * as http from "../http.js";
import type * as lib_coach from "../lib/coach.js";
import type * as lib_gemini from "../lib/gemini.js";
import type * as payments from "../payments.js";
import type * as paymentsDb from "../paymentsDb.js";
import type * as stripeWebhook from "../stripeWebhook.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiCoach: typeof aiCoach;
  challengeData: typeof challengeData;
  coachLimits: typeof coachLimits;
  http: typeof http;
  "lib/coach": typeof lib_coach;
  "lib/gemini": typeof lib_gemini;
  payments: typeof payments;
  paymentsDb: typeof paymentsDb;
  stripeWebhook: typeof stripeWebhook;
  tasks: typeof tasks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
