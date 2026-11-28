import { serve } from "inngest/next";
import { buildProfileFn } from "@/inngest/build-profile";
import { inngest } from "@/inngest/client";

export const maxDuration = 300;

export const { GET, POST, PUT } = serve({ client: inngest, functions: [buildProfileFn] });
