import { PlusOutlined, ShopOutlined } from "@ant-design/icons";
import { Button, Card, Col, Descriptions, Row, Spin, Statistic, Form, InputNumber, FormInstance } from "antd";
import Modal from "antd/lib/modal/Modal";
import React from "react";
import {Pool} from "../models/pool";
import { Token } from "../models/token";
import { PoolaService } from "../services/poola-service";
import BigNumber from "bignumber.js";

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
    this.setState({
      loading: true
    });

    const poolaService = PoolaService.instance(window);

    const pool = await poolaService.getPool(this.props.poolIndex);

    let token = PoolaService.whitelistedTokens.find(t => t.address === pool.erc20Address);
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

  async deposit(ethAmount: number) {
    if (this.state.token && this.state.pool) {
      const poolaService = PoolaService.instance(window);
      
      const tokenMultiplier = new BigNumber(10).pow(this.state.token?.decimals);
      const tokenDecimalAmount = new BigNumber(ethAmount)
                                  .times(this.state.pool.pricePerWei)
                                  .times(tokenMultiplier);

      const approved = poolaService.approve(this.state.pool.erc20Address, tokenDecimalAmount);
      if (approved) {
        await poolaService.deposit(this.state.pool.name, tokenDecimalAmount);
        await this.load();
      }
    }
  }

  async buy(ethAmount: number) {
    if (this.state.token && this.state.pool) {
      const poolaService = PoolaService.instance(window);

      const weiMultiplier = new BigNumber(10).pow(18);
      const weiAmount = new BigNumber(ethAmount).times(weiMultiplier);

      const tokenMultiplier = new BigNumber(10).pow(this.state.token.decimals);
      const tokenDecimalAmount = new BigNumber(ethAmount)
                                  .times(this.state.pool.pricePerWei)
                                  .times(tokenMultiplier);

      await poolaService.buyFromPool(this.state.pool.name, tokenDecimalAmount, weiAmount);
      await this.load();
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
                  PoolaService.instance(window).currentAccountAddress().toLowerCase() === pool?.owner.toLowerCase()
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
