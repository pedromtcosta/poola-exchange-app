import BigNumber from "bignumber.js";
import EventEmitter from "events";
import { Contract } from "web3-eth-contract";
import { Pool } from "../models/pool";
import { Web3Provider } from "../utils/Web3Provider";
import { ContractEventEmitter } from "./contract-event-emitter";

import PoolaAbi from "../contracts/Poola.json";
import { Config } from "../utils/Config";

export class PoolaContract {
  private contract: Contract;
  private static instance: PoolaContract;

  static get(): PoolaContract {
    if (!this.instance) {
      this.instance = new PoolaContract();
    }

    return this.instance;
  }

  private constructor() {
    this.contract = new Web3Provider.instance.eth.Contract(PoolaAbi as any, Config.addresses[Config.network].poola);
  }

  get address(): string {
    return Config.addresses[Config.network].poola;
  }

  createPool(poolName: string, tokenAddress: string, pricePerWei: number): ContractEventEmitter {
    const e: EventEmitter = this.contract.methods.createPool(
      poolName,
      tokenAddress,
      pricePerWei)
      .send({
        from: Web3Provider.currentAddress
      });

    return new ContractEventEmitter(e);
  }

  deposit(poolName: string, amount: BigNumber): ContractEventEmitter {
    const e: EventEmitter = this.contract.methods.deposit(poolName, amount).send({
      from: Web3Provider.currentAddress
    });

    return new ContractEventEmitter(e);
  }

  buyFromPool(poolName: string, amount: BigNumber, weiAmount: BigNumber): ContractEventEmitter {
    const e: EventEmitter = this.contract.methods.buyFromPool(poolName, amount).send({
      from: Web3Provider.currentAddress,
      value: weiAmount
    });

    return new ContractEventEmitter(e);
  }

  withdraw(amount: BigNumber): ContractEventEmitter {
    const e: EventEmitter = this.contract.methods.withdraw(amount.toString()).send({
      from: Web3Provider.currentAddress,
    });

    return new ContractEventEmitter(e);
  }

  async getPoolsCount(): Promise<number> {
    const poolsCount: number = await this.contract.methods.getPoolsCount().call();
    return poolsCount;
  }

  async poolNames(idx: number): Promise<string> {
    const poolName: string = await this.contract.methods.poolNames(idx).call();
    return poolName;
  }

  async pools(poolName: string): Promise<Pool> {
    const pool: Pool = await this.contract.methods.pools(poolName).call();
    return pool;
  }

  async allowances(address: string): Promise<BigNumber> {
    const allowance: string = await this.contract.methods.allowances(address).call();
    return new BigNumber(allowance);
  }
}