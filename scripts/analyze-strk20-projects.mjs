const source = "https://raw.githubusercontent.com/starkience/strk20-hackathon/main/projects.json";

const response = await fetch(source, { headers: { "user-agent": "Veyra-competitor-audit" } });
if (!response.ok) throw new Error(`Unable to fetch official projects dataset: ${response.status}`);

const projects = await response.json();
const score = project => {
  const requirements = project.requirements ?? {};
  const assessment = project.assessment ?? {};
  return (
    (requirements.mainnet ? 30 : 0) +
    (requirements.demo ? 10 : 0) +
    (requirements.video ? 15 : 0) +
    Math.min((project.verified_txs ?? 0) * 5, 15) +
    Math.min((project.contracts ?? []).length * 2, 8) +
    (assessment.innovative ? 8 : 0) +
    (assessment.complex ? 6 : 0) +
    Math.min((project.active_days ?? []).length, 5) +
    Math.min(project.stars ?? 0, 3)
  );
};

const ranked = projects
  .map(project => ({
    slug: project.slug,
    name: project.name,
    repo_url: project.repo_url,
    summary: project.summary,
    demo_url: project.demo_url,
    demo_video: project.demo_video,
    verified_txs: project.verified_txs ?? 0,
    contracts: (project.contracts ?? []).length,
    requirements: project.requirements ?? {},
    assessment: project.assessment ?? null,
    active_days: (project.active_days ?? []).length,
    stars: project.stars ?? 0,
    score: score(project),
  }))
  .sort((a, b) => b.score - a.score || b.verified_txs - a.verified_txs || b.contracts - a.contracts);

console.log(JSON.stringify({
  generated_at: new Date().toISOString(),
  total_projects: projects.length,
  completeness_proxy_method: "mainnet/demo/video requirements, verified STRK20 transactions, listed contracts, hub-provided innovation/complexity flags, activity, and stars; not an official leaderboard",
  top_ten: ranked.slice(0, 10),
  veyra: ranked.find(project => project.repo_url === "https://github.com/sands786/veyra"),
  all_submission_complete: ranked.filter(project => project.requirements.mainnet && project.requirements.demo && project.requirements.video),
}, null, 2));
