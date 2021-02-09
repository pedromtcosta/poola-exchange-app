import EventEmitter from "events";
import { TransactionReceipt } from "web3-eth";

export class ContractEventEmitter {
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  onTransactionHash(callback: (hash: string) => void): ContractEventEmitter {
    this.eventEmitter.once('transactionHash', callback);
    return this;
  }

  onConfirmation(callback: (confirmationNumber: number, receipt: TransactionReceipt) => void): ContractEventEmitter {
    this.eventEmitter.once('confirmation', callback);
    return this;
  }

  onReceipt(callback: (receipt: TransactionReceipt) => void): ContractEventEmitter {
    this.eventEmitter.once('receipt', callback);
    return this;
  }

  onError(callback: (error: any, receipt: TransactionReceipt) => void): ContractEventEmitter {
    this.eventEmitter.once('error', callback);
    return this;
  }
}