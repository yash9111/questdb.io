type Spec = {
  cpu: number
  ram: number
  storage: number
  prices: {
    [key in RegionKey]?: number
  }
}

export type RegionKey =
  | "eu-west-1"
  | "us-east-2"
  | "us-west-2"
  | "ap-south-1"
  | "eu-central-1"

export type Region = {
  label: string
  specs: Array<Omit<Spec, "prices"> & { price: number }>
}

const labels: { [key in RegionKey]: string } = {
  "us-east-2": "Ohio",
  "us-west-2": "Oregon",
  "eu-west-1": "Ireland",
  "ap-south-1": "Mumbai",
  "eu-central-1": "Frankfurt",
}

const specs: Spec[] = [
  {
    cpu: 2,
    ram: 8,
    storage: 25,
    prices: {
      "us-east-2": 0.345,
      "us-west-2": 0.345,
      "eu-west-1": 0.385,
    },
  },
  {
    cpu: 2,
    ram: 8,
    storage: 100,
    prices: {
      "us-east-2": 0.403,
      "us-west-2": 0.403,
      "eu-west-1": 0.444,
    },
  },
  {
    cpu: 4,
    ram: 16,
    storage: 50,
    prices: {
      "us-east-2": 0.687,
      "us-west-2": 0.687,
      "eu-west-1": 0.762,
    },
  },
  {
    cpu: 4,
    ram: 16,
    storage: 100,
    prices: {
      "us-east-2": 0.727,
      "us-west-2": 0.727,
      "eu-west-1": 0.803,
    },
  },
  {
    cpu: 4,
    ram: 16,
    storage: 250,
    prices: {
      "us-east-2": 0.848,
      "us-west-2": 0.848,
      "eu-west-1": 0.929,
    },
  },
  {
    cpu: 8,
    ram: 32,
    storage: 100,
    prices: {
      "us-east-2": 1.049,
      "us-west-2": 1.049,
      "eu-west-1": 1.164,
    },
  },
  {
    cpu: 8,
    ram: 32,
    storage: 250,
    prices: {
      "us-east-2": 1.17,
      "us-west-2": 1.17,
      "eu-west-1": 1.29,
    },
  },
  {
    cpu: 8,
    ram: 32,
    storage: 1000,
    prices: {
      "us-east-2": 1.748,
      "us-west-2": 1.748,
      "eu-west-1": 1.914,
    },
  },
  {
    cpu: 16,
    ram: 64,
    storage: 100,
    prices: {
      "us-east-2": 2.017,
      "us-west-2": 2.017,
      "eu-west-1": 2.244,
    },
  },
  {
    cpu: 16,
    ram: 64,
    storage: 500,
    prices: {
      "us-east-2": 2.338,
      "us-west-2": 2.338,
      "eu-west-1": 2.578,
    },
  },
  {
    cpu: 16,
    ram: 64,
    storage: 1000,
    prices: {
      "us-east-2": 2.716,
      "us-west-2": 2.716,
      "eu-west-1": 2.994,
    },
  },
  {
    cpu: 16,
    ram: 64,
    storage: 2000,
    prices: {
      "us-east-2": 3.299,
      "us-west-2": 3.299,
      "eu-west-1": 3.619,
    },
  },
  {
    cpu: 32,
    ram: 128,
    storage: 500,
    prices: {
      "us-east-2": 4.274,
      "us-west-2": 4.274,
      "eu-west-1": 4.738,
    },
  },
  {
    cpu: 32,
    ram: 128,
    storage: 1000,
    prices: {
      "us-east-2": 4.652,
      "us-west-2": 4.652,
      "eu-west-1": 5.154,
    },
  },
  {
    cpu: 32,
    ram: 128,
    storage: 2000,
    prices: {
      "us-east-2": 5.235,
      "us-west-2": 5.235,
      "eu-west-1": 5.779,
    },
  },
]

export const regions = Object.fromEntries(
  Object.entries(labels).map(([region, label]) => [
    region,
    {
      label: `${label} (${region})`,
      disabled: ["ap-south-1", "eu-central-1"].includes(region),
      specs: specs.map(({ cpu, ram, storage, prices }) => ({
        cpu,
        ram,
        storage,
        price: prices[region],
      })),
    },
  ]),
)
