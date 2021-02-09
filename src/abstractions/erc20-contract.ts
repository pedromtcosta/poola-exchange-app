import BigNumber from "bignumber.js";
import EventEmitter from "events";
import { Contract } from "web3-eth-contract";
import { Web3Provider } from "../utils/Web3Provider";
import { ContractEventEmitter } from "./contract-event-emitter";

import ERC20Abi from "../contracts/ERC20.json";

export class Erc20Contract {
  private contract: Contract;
  private static instances: { [address: string]: Erc20Contract } = {};

  static get(tokenAddress: string): Erc20Contract {
    if (!this.instances[tokenAddress]) {
      this.instances[tokenAddress] = new Erc20Contract(tokenAddress);
    }

    return this.instances[tokenAddress];
  }

  private constructor(tokenAddress: string) {
    this.contract = new Web3Provider.instance.eth.Contract(ERC20Abi as any, tokenAddress);
  }

  approve(spender: string, amount: BigNumber): ContractEventEmitter {
    const e: EventEmitter = this.contract.methods.approve(spender, amount)
    .send({
      from: Web3Provider.currentAddress
    });

    return new ContractEventEmitter(e);
  }
}