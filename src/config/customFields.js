const consts = require("./consts")

const makeCloudUrl = () => {
  const base = "https://cloud.questdb.com/"

  const hasPosthog =
    typeof window !== "undefined" &&
    // use nullish coalescing operator, to avoid errors,
    // because browser might have rejected posthog
    window.posthog?.get_distinct_id

  if (hasPosthog) {
    const id = window.posthog.get_distinct_id()
    return `${base}?utm_id=${id}`
  }

  return base
}

module.exports = {
  artifactHubUrl: "https://artifacthub.io/packages/helm/questdb/questdb",
  copyright: `Copyright © ${new Date().getFullYear()} QuestDB`,
  crunchbaseUrl: "https://www.crunchbase.com/organization/quest-db",
  demoUrl: `https://demo.${consts.domain}`,
  description:
    "QuestDB is an open source database designed to make time-series lightning fast and easy. It exposes a high performance REST API and is Postgres compatible.",
  dockerUrl: "https://hub.docker.com/r/questdb/questdb",
  domain: consts.domain,
  githubOrgUrl: consts.githubOrgUrl,
  githubUrl: `${consts.githubOrgUrl}/questdb`,
  websiteGithubUrl: `${consts.githubOrgUrl}/questdb.io`,
  linkedInUrl: "https://www.linkedin.com/company/questdb/",
  oneLiner: "QuestDB: the database for time series",
  slackUrl: `https://slack.${consts.domain}`,
  stackoverflowUrl: "https://stackoverflow.com/questions/tagged/questdb",
  twitterUrl: "https://twitter.com/questdb",
  videosUrl: "https://www.youtube.com/c/QuestDB",
  redditUrl: "https://www.reddit.com/r/questdb",
  linenUrl: "https://community-chat.questdb.io",
  cloudUrl: makeCloudUrl(),
}
