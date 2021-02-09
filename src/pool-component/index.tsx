import { PlusOutlined, ShopOutlined } from "@ant-design/icons";
import { Button, Card, Col, Descriptions, Row, Spin, Statistic, Form, InputNumber, FormInstance, notification } from "antd";
import Modal from "antd/lib/modal/Modal";
import React from "react";
import {Pool} from "../models/pool";
import { Token } from "../models/token";
import BigNumber from "bignumber.js";
import { Web3Provider } from "../utils/Web3Provider";
import { PoolaContract } from "../abstractions/poola-contract";
import { Config } from "../utils/Config";
import { Erc20Contract } from "../abstractions/erc20-contract";

export interface Props {
  poolIndex: number;
}

export interface PoolComponentState {
  pool: Pool | undefined
  token: Token | undefined
  modalVisible: boolean
  amount: number | undefined
  poolSize: number | undefined
  modalTitle: string | undefined
  mode: "deposit" | "buy" | undefined
  loading: boolean
}

class PoolComponent extends React.Component<Props, PoolComponentState> {
  formRef = React.createRef<FormInstance>();

  constructor(args: any) {
    super(args);
    this.handleValueChange = this.handleValueChange.bind(this);
    this.openDepositModal = this.openDepositModal.bind(this);
    this.openBuyModal = this.openBuyModal.bind(this);
    this.handleModalCancel = this.handleModalCancel.bind(this);
    this.handleModalOk = this.handleModalOk.bind(this);
    this.handleFormOnFinish = this.handleFormOnFinish.bind(this);

    this.deposit = this.deposit.bind(this);
    this.buy = this.buy.bind(this);

    this.load = this.load.bind(this);

    this.state = {
      pool: undefined,
      token: undefined,
      modalVisible: false,
      amount: undefined,
      poolSize: undefined,
      modalTitle: undefined,
      mode: undefined,
      loading: false
    };
  }

  async componentDidMount() {
    await this.load();
  }

  async load() {
    const poola = PoolaContract.get();

    this.setState({
      loading: true
    });

    const poolName = await poola.poolNames(this.props.poolIndex);
    const pool = await poola.pools(poolName);

    let token = Config.addresses[Config.network].whitelistedTokens.find(t => t.address === pool.erc20Address);
    if (!token) throw "Token not found!";

    let poolSize: number = 0;
    if (token) {
      if (token) {
        const divisor = BigInt(10 ** token.decimals);
        const size = BigInt(pool.size);
        poolSize = Number(size / divisor);
      }
    }

    this.setState({
      pool: pool,
      token: token,
      poolSize: poolSize,
      amount: 0.001 * pool.pricePerWei,
      loading: false
    });
  }

  async handleFormOnFinish(values: {ethAmount: number}) {
    if(this.state.mode === "deposit") {
      this.deposit(values.ethAmount);
    } else {
      this.buy(values.ethAmount);
    }

    this.setState({
      modalVisible: false
    });
  }

  deposit(ethAmount: number) {
    if (this.state.token && this.state.pool) {
      const poola = PoolaContract.get();
      const tokenContract = Erc20Contract.get(this.state.token.address);
      
      const tokenMultiplier = new BigNumber(10).pow(this.state.token?.decimals);
      const tokenDecimalAmount = new BigNumber(ethAmount)
                                  .times(this.state.pool.pricePerWei)
                                  .times(tokenMultiplier);

      tokenContract.approve(poola.address, tokenDecimalAmount)
        .onTransactionHash(() => {
          notification.open({
            message: `Approval request sent`,
            description: `The transaction for approving transfer of funds of the ${this.state.token?.symbol} token to the contract's address was sent to the network. The deposit will continue once it has been confirmed (don't close this page)`
          });
        })
        .onConfirmation(() => {
          notification.open({
            message: `Approval request confirmed`,
            description: `The transaction for approving transfer of funds of the ${this.state.token?.symbol} token to the contract's address has been confirmed`
          });

          if (this.state.pool) {
            poola.deposit(this.state.pool.name, tokenDecimalAmount)
              .onTransactionHash(() => {
                notification.open({
                  message: `Deposit transaction sent`,
                  description: `The transaction for depositing your funds was sent. You will receive a notification once it has been confirmed`
                });
              })
              .onConfirmation(async () => {
                notification.open({
                  message: `Deposit transaction confirmed`,
                  description: `Your funds have been successfully deposited`
                });

                await this.load();
              })
              .onError((err) => {
                console.log(err);
              });
          }
      });
    }
  }

  buy(ethAmount: number) {
    if (this.state.token && this.state.pool) {
      const poola = PoolaContract.get();

      const weiMultiplier = new BigNumber(10).pow(18);
      const weiAmount = new BigNumber(ethAmount).times(weiMultiplier);

      const tokenMultiplier = new BigNumber(10).pow(this.state.token.decimals);
      const tokenDecimalAmount = new BigNumber(ethAmount)
                                  .times(this.state.pool.pricePerWei)
                                  .times(tokenMultiplier);

      poola.buyFromPool(this.state.pool.name, tokenDecimalAmount, weiAmount)
        .onTransactionHash(() => {
          notification.open({
            message: `Buy transaction sent`,
            description: `Your transaction for buying ${this.state.token?.symbol} was sent to the network. You will receive a notification once it has been confirmed`
          });
        })
        .onConfirmation(async () => {
          notification.open({
            message: `Buy transaction confirmed`,
            description: `Your transaction has been confirmed and the tokens have been transfered to your address`
          });

          await this.load();
        });
    }
  }

  handleModalOk() {
    this.formRef.current?.submit();
  }

  handleModalCancel() {
    this.setState({
      modalVisible: false
    });
  }

  openDepositModal() {
    this.setState({
      modalVisible: true,
      modalTitle: `Deposit to pool '${this.state.pool?.name}'`,
      mode: "deposit"
    });
  }

  openBuyModal() {
    this.setState({
      modalVisible: true,
      modalTitle: `Buy ${this.state.token?.symbol} from pool '${this.state.pool?.name}'`,
      mode: "buy"
    });
  }

  handleValueChange(value: number | string | null | undefined) {
    if (value && this.state.pool) {
      const ethValue = new BigNumber(value);
      const pricePerWei = new BigNumber(this.state.pool.pricePerWei);

      const tokenAmount = ethValue.times(pricePerWei);

      this.setState({
        amount: Number(tokenAmount)
      });
    }
  }

  render() {
    const pool = this.state.pool;
    return (
      <div>
        <Card title={pool ? pool.name : "loading"}>
          {
            this.state.loading
            ? <Spin size="large" />
            : <div>
              <Row gutter={24}>
                <Col span={12}>
                  <Statistic suffix={<span style={{fontSize: 12}}>{this.state.token?.symbol}</span>} title="1 ETH =" value={`${pool?.pricePerWei}`} />
                </Col>
                <Col span={12}>
                  <Statistic suffix={<span style={{fontSize: 12}}>{this.state.token?.symbol}</span>} title="Pool size" value={`${this.state.poolSize}`} />
                </Col>
              </Row>
              <Row gutter={16}>
                {
                  Web3Provider.currentAddress.toLowerCase() === pool?.owner.toLowerCase()
                  ? <Col>
                    <Button style={{padding: 0}} type="link" onClick={this.openDepositModal}>
                      <PlusOutlined />
                      Deposit
                    </Button>
                  </Col>
                  : <span></span>
                }
                <Col>
                  <Button style={{padding: 0}} danger type="link" onClick={this.openBuyModal}>
                    <ShopOutlined />
                    Buy
                  </Button>
                </Col>
              </Row>
            </div>
          }
        </Card>

        <Modal
          title={this.state?.modalTitle}
          visible={this.state?.modalVisible}
          onOk={this.handleModalOk}
          onCancel={this.handleModalCancel}>
          <Form ref={this.formRef} onFinish={this.handleFormOnFinish}>
            <Form.Item extra={`${this.state?.amount} ${this.state.token?.symbol}`} tooltip="The equivalent in ETH" label="Units" name="ethAmount" initialValue={0.001}>
              <InputNumber defaultValue={0.001} step={0.001} min={0.001} onChange={this.handleValueChange} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default PoolComponent;
