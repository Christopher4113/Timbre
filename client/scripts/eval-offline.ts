// Run the profile pipeline on a local fixture.
//   pnpm eval:offline                      -> fixtures/founder.json
//   pnpm eval:offline path/to/input.json
// Input format: tests/fixtures/example-input.json. Writes results to fixtures/out/.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { buildProfile } from "@/lib/extract/pipeline";
import { renderCustomInstructions } from "@/lib/export/custom-instructions";
import { renderSkillMd } from "@/lib/export/skill-md";

try {
  process.loadEnvFile(".env.local");
} catch {}

async function main() {
  const path = process.argv[2] ?? "fixtures/founder.json";
  if (!existsSync(path)) {
    console.error(`No fixture at ${path}. Create it in the format of tests/fixtures/example-input.json, or pass a path.`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(path, "utf8"));

  const started = Date.now();
  const { profile, promptVersion, model } = await buildProfile(raw);
  const secs = ((Date.now() - started) / 1000).toFixed(1);

  const out = join(
    "fixtures/out",
    `${basename(path, ".json")}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
  mkdirSync(out, { recursive: true });
  writeFileSync(
    join(out, "profile.json"),
    JSON.stringify({ promptVersion, model, profile }, null, 2),
  );
  writeFileSync(
    join(out, "SKILL.md"),
    renderSkillMd(profile, raw.name ?? "the user"),
  );
  writeFileSync(
    join(out, "custom-instructions.txt"),
    renderCustomInstructions(profile),
  );

  const bySource = Object.groupBy(profile.rules, (r) => r.source);
  console.log(`Valid profile in ${secs}s (${model}, ${promptVersion})`);
  console.log(
    `Rules: ${profile.rules.length} (speech ${bySource.speech?.length ?? 0}, writing ${bySource.writing?.length ?? 0}, both ${bySource.both?.length ?? 0}), examples: ${profile.examples.length}`,
  );
  console.log(`\n${profile.summary}\n`);
  for (const r of profile.rules)
    console.log(
      `- [${r.context}/${r.category}, ${r.source}, ${r.confidence}] ${r.rule}`,
    );
  console.log(`\nWrote ${out}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
