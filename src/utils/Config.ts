import { Token } from "../models/token"

export class Config {
  static network = 'ropsten'
  static addresses: { [network: string]: {poola: string, whitelistedTokens: Token[]} } = {
    "ropsten": {
      poola: "0x22137554767684F24004579D89ACB8c2E6528A32",
      whitelistedTokens: [
        {
          address: "0xbB34a7E2A070eC193cDdA2df52c2a912f54Ee087",
          name: "PerfectCoin",
          symbol: "PFC",
          decimals: 18,
          img: ""
        },
        {
          address: "0x5782033F831C661D49cc288e9DFFf02452c93c6F",
          name: "WorthlessCoin",
          symbol: "WTL",
          decimals: 18,
          img: ""
        },
        {
          address: "0x281b1FE6C3f29c729bA7D7a6fcee7a9A043Fe118",
          name: "DummyCoin",
          symbol: "DMM",
          decimals: 18,
          img: ""
        }
      ]
    },
    "localhost": {
      poola: "0x19782Db8E6a923aDD597CD4f9bA719d48a018F42",
      whitelistedTokens: [
        {
          address: "0x7bf0FfAA412c3871c3545C3C3d174b594c221eAc",
          name: "PerfectCoin",
          symbol: "PFC",
          decimals: 18,
          img: ""
        },
        {
          address: "0x47B1d1bD5fbdE99aeA3b5d8Fb5a77BD143CBe5c5",
          name: "WorthlessCoin",
          symbol: "WTL",
          decimals: 18,
          img: ""
        },
        {
          address: "0x72cD4CEad49b26984bA7CA135D4c43F18dFCF373",
          name: "DummyCoin",
          symbol: "DMM",
          decimals: 18,
          img: ""
        }
      ]
    }
  }
}