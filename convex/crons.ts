import { cronJobs } from "convex/server";

const crons = cronJobs();

// Production deployments can enable household fan-out here after connecting live source credentials.
export default crons;
