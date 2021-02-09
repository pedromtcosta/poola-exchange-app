import Web3 from "web3";

export class Web3Provider {
  private static web3: Web3
  static get instance(): Web3 {
    if (!this.web3) {
      const ethereum = (window as any).ethereum;
      this.web3 = new Web3(ethereum);
      ethereum.enable();
    }

    return this.web3;
  }

  static get currentAddress(): string {
    return (this.web3.currentProvider as any).selectedAddress;
  }
}