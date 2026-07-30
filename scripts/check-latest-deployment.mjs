const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;

if (!token || !repository || !sha) {
  console.log('Latest deployment check skipped outside GitHub Actions.');
  process.exit(0);
}

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28'
};

const response = await fetch(`https://api.github.com/repos/${repository}/commits/${sha}/status`, { headers });
if (!response.ok) {
  console.error(`Unable to read latest commit status: HTTP ${response.status}`);
  process.exit(1);
}

const data = await response.json();
const vercel = (data.statuses || []).filter(status => /vercel/i.test(status.context || ''));
if (!vercel.length) {
  console.log(`No Vercel status attached to latest commit ${sha.slice(0, 7)} yet; intermediate commit failures are ignored.`);
  process.exit(0);
}

const latest = vercel.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
console.log(`Latest commit ${sha.slice(0, 7)} Vercel status: ${latest.state}`);
if (latest.state === 'failure' || latest.state === 'error') {
  console.error('The authoritative latest-commit deployment failed. Earlier/intermediate failures were not considered.');
  process.exit(1);
}
