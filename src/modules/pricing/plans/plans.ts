import type { PricingPlan } from "../plan"
import { regions } from "../pricing-table/specs"

const regionsCosts = regions["us-east-2"]

const getPrice = ({ cpu, ram, storage }) =>
  regionsCosts?.specs?.find(
    ({ cpu: c, ram: r, storage: s }) => c === cpu && r === ram && s === storage,
  )?.price

export const plans: PricingPlan[] = [
  {
    type: "entry",
    title: "Entry Level",
    description: "Perfect to get started quickly",
    price: getPrice({ cpu: 2, ram: 8, storage: 25 }),
    specs: [
      { label: "CPU", value: "2 Cores" },
      { label: "RAM", value: "8 GB" },
    ],
    subtext: "Indicative pricing with 25 GB storage",
  },
  {
    type: "performant",
    title: "Performant",
    description: "Offers better performance for demanding applications",
    price: getPrice({ cpu: 4, ram: 16, storage: 50 }),
    specs: [
      { label: "CPU", value: "4 Cores" },
      { label: "RAM", value: "16 GB" },
    ],
    subtext: "Indicative pricing with 50 GB storage",
    highlighted: true,
  },
  {
    type: "high-performance",
    title: "High Performance",
    description: "Handle heavy duty writes and reads",
    price: getPrice({ cpu: 16, ram: 64, storage: 100 }),
    specs: [
      { label: "CPU", value: "16 Cores" },
      { label: "RAM", value: "64 GB" },
    ],
    subtext: "Indicative pricing with 100 GB storage",
  },
]
