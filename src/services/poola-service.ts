import Web3 from "web3";
import PoolaAbi from "../contracts/Poola.json";
import ERC20Abi from "../contracts/ERC20.json";
import { Pool } from "../models/pool";
import { Token } from "../models/token";
import BigNumber from "bignumber.js";

export class PoolaService {
  contractAddress = "0xC8bB03eA621fBaaaEeCBAFa75628A52fB711A8c8"
  private static that: PoolaService;
  private web3: Web3;

  private constructor(window: any) {
    const ethereum = (window as any).ethereum;
    this.web3 = new Web3(ethereum);
    ethereum.enable();
  }

  static instance(window: any): PoolaService {
    if (!this.that) {
      this.that = new PoolaService(window);
    }
    return this.that;
  }

  async createPool(poolName: string, tokenAddress: string, pricePerWei: number) {
    const contract = new this.web3.eth.Contract((PoolaAbi as any), this.contractAddress);
    await contract.methods.createPool(
      poolName,
      tokenAddress,
      pricePerWei)
      .send({
        from: (this.web3.currentProvider as any).selectedAddress
      });
  }

  async approve(tokenAddress: string, amount: BigNumber): Promise<boolean> {
    const tokenContract = new this.web3.eth.Contract((ERC20Abi as any), tokenAddress);
    const approved = await tokenContract.methods.approve(this.contractAddress, amount)
    .send({
      from: (this.web3.currentProvider as any).selectedAddress
    });

    return approved;
  }

  async deposit(poolName: string, amount: BigNumber) {
    const contract = new this.web3.eth.Contract((PoolaAbi as any), this.contractAddress);    
    await contract.methods.deposit(poolName, amount).send({
      from: (this.web3.currentProvider as any).selectedAddress
    });
  }

  async buyFromPool(poolName: string, amount: BigNumber, weiAmount: BigNumber) {
    const contract = new this.web3.eth.Contract((PoolaAbi as any), this.contractAddress);    
    await contract.methods.buyFromPool(poolName, amount).send({
      from: (this.web3.currentProvider as any).selectedAddress,
      value: weiAmount
    });
  }

  async withdraw(amount: BigNumber) {
    const contract = new this.web3.eth.Contract((PoolaAbi as any), this.contractAddress);
    await contract.methods.withdraw(amount.toString()).send({
      from: (this.web3.currentProvider as any).selectedAddress,
    });
  }

  async getPoolsCount(): Promise<number> {
    const contract = new this.web3.eth.Contract((PoolaAbi as any), this.contractAddress);    
    const poolsCount: number = await contract.methods.getPoolsCount().call();
    return poolsCount;
  }

  async getPool(idx: number): Promise<Pool> {
    const contract = new this.web3.eth.Contract((PoolaAbi as any), this.contractAddress);
    const poolName: string = await contract.methods.poolNames(idx).call();
    const pool: Pool = await contract.methods.pools(poolName).call();
    return pool;
  }

  async getCurrentAddressAllowance(): Promise<BigNumber> {
    const contract = new this.web3.eth.Contract((PoolaAbi as any), this.contractAddress);
    const allowance: string = await contract.methods.allowances(this.currentAccountAddress()).call();
    return new BigNumber(allowance);
  }

  currentAccountAddress(): string {
    return (this.web3.currentProvider as any).selectedAddress
  }

  static get whitelistedTokens(): Token[] {
    return [
      {
        address: "0xbB34a7E2A070eC193cDdA2df52c2a912f54Ee087",
        name: "PerfectCoin",
        symbol: "PFC",
        img: "",
        decimals: 18
      },
      {
        address: "0x5782033F831C661D49cc288e9DFFf02452c93c6F",
        name: "WorthlessCoin",
        symbol: "WTL",
        img: "",
        decimals: 18
      },
      {
        address: "0x281b1FE6C3f29c729bA7D7a6fcee7a9A043Fe118",
        name: "StupidCoin",
        symbol: "STP",
        img: "",
        decimals: 18
      }
    ]
  }
}