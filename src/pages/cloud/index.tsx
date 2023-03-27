import React from "react"
import Layout from "../../theme/Layout"

import { Section } from "../../components/Section"
import { ActionFooter } from "../../components/ActionFooter"
import { CompareFeatures } from "../../modules/cloud/CompareFeatures"
import { Top } from "../../modules/cloud/Top"
import Button from "@theme/Button"
import customFields from "../../config/customFields"

const CloudPage = () => (
  <Layout
    canonical="/cloud"
    description="The fastest open source time-series database fully managed on the cloud, now available on AWS"
    title="Cloud"
    image="/img/pages/cloud/screens-thumb.png"
  >
    <Top />
    <CompareFeatures />
    <Section fullWidth>
      <Section.Title center>Ready to get started?</Section.Title>

      <Section noGap center>
        <Button variant="primary" to={customFields.cloudUrl} newTab={false}>
          Start building now
        </Button>
      </Section>
    </Section>
    <Section>
      <ActionFooter />
    </Section>
  </Layout>
)

export default CloudPage
