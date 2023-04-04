import React from "react"
import clsx from "clsx"
import Layout from "../theme/Layout"
import Subscribe from "../components/Subscribe"
import seCss from "../css/section.module.css"
import paCss from "../css/community/page.module.css"
import customFields from "../config/customFields"

const Community = () => {
  const title = "QuestDB developer community"
  const description =
    "Get involved with the developer community that's building the fastest open-source time series database."

  return (
    <Layout canonical="/community" description={description} title={title}>
      <section className={clsx(seCss.section)}>
        <h1
          className={clsx(
            seCss.section__title,
            seCss["section__title--jumbotron"],
            seCss["section__title--accent"],
            paCss.hero__title,
          )}
        >
          An open-source project that{" "}
          <span className={paCss.pink__color}>thrives</span> on collaboration
          and quality
        </h1>
        <div
          className={clsx(seCss["section--inner"], paCss.flex__reverse_section)}
        >
          <div className={`${paCss.half__section} ${paCss.padding_60}`}>
            <h2 className={paCss.section__title}>
              We’re super proud of the QuestDB community and everything our
              contributors do
            </h2>
            <p
              className={clsx(seCss.section__subtitle, paCss.section__subtitle)}
            >
              As a way of saying &quot;thank you&quot; for being part of the
              journey, we want to offer contributors some of our stickers, pins,
              t-shirts, and awesome virtual swag.
            </p>
            <div className={paCss.border} />
            <div>
              <p className={paCss.default_text}>
                Stay up to date with all things QuestDB
              </p>

              <Subscribe submitButtonVariant="primary" provider="newsletter" />
            </div>
            <div className={paCss.join_slack}>
              <p
                className={`${paCss.default_text} ${paCss.join_slack_description}`}
              >
                Join our growing community on &nbsp;
                <a className={paCss.link_item} href={customFields.slackUrl}>
                  QuestDB’s Slack
                </a>
              </p>
              <a className={paCss.link_item} href={customFields.slackUrl}>
                <img
                  src="/img/pages/community/slack-logo.svg"
                  alt="slack logo"
                  className={paCss.slack_logo}
                  width={50}
                  height={50}
                />
              </a>
            </div>
          </div>
          <div className={`${paCss.half__section} ${paCss.section_center}`}>
            <img
              src="/img/pages/community/slack.png"
              alt="A collage showing conversation from the QuestDB community Slack workspace with QuestDB stickers that participants receive"
              className={paCss.section_image}
              width={500}
              height={500}
            />
          </div>
        </div>
      </section>
      <section className={clsx(seCss.section, seCss["section--odd"])}>
        <div className={paCss.section__inner}>
          <h2 className={`${paCss.section__title} ${paCss.text_center_header}`}>
            We regret to let you know that our swag program is temporarily
            suspended. All the previous requests will be processed.
          </h2>
        </div>
      </section>
    </Layout>
  )
}

export default Community
