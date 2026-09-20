/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as households from "../households.js";
import type * as http from "../http.js";
import type * as integrations from "../integrations.js";
import type * as lib_agentmail from "../lib/agentmail.js";
import type * as lib_auth from "../lib/auth.js";
import type * as mail from "../mail.js";
import type * as products from "../products.js";
import type * as recalls from "../recalls.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  dashboard: typeof dashboard;
  households: typeof households;
  http: typeof http;
  integrations: typeof integrations;
  "lib/agentmail": typeof lib_agentmail;
  "lib/auth": typeof lib_auth;
  mail: typeof mail;
  products: typeof products;
  recalls: typeof recalls;
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

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
