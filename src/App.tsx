import React, { FC } from 'react';
import './App.css';
import { PlusSquareOutlined, SwapOutlined } from "@ant-design/icons";

import { Form, Button, Divider, Input, Menu, PageHeader, Select, InputNumber, FormInstance, Tooltip, Col, Row, List, Popconfirm, Spin, message, notification } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import PoolComponent from './pool-component';
import BigNumber from 'bignumber.js';
import { PoolaContract } from './abstractions/poola-contract';
import { Web3Provider } from './utils/Web3Provider';
import { Config } from './utils/Config';

interface AppState {
  createNewPoolVisible: boolean
  poolsCount: number
  allowance: number
  allowanceInWei: BigNumber
  confirmWithdrawVisible: boolean
  finishedGettingAllowance: boolean
  poolsRange: number[]
}

class App extends React.Component<any, AppState> {
  formRef = React.createRef<FormInstance>();

  state = {
    createNewPoolVisible: false,
    poolsCount: 0,
    allowance: 0,
    allowanceInWei: new BigNumber(0),
    confirmWithdrawVisible: false,
    finishedGettingAllowance: false,
    poolsRange: []
  }

  async withdraw() {
    const poola = PoolaContract.get();
    poola.withdraw(this.state.allowanceInWei)
      .onTransactionHash(() => {
        this.setState({
          confirmWithdrawVisible: false
        });

        notification.open({
          message: `Withdraw request sent`,
          description: `Your transaction for withdrawing ${this.state.allowance} ETH has been created. You will receive a notification once it has been confirmed`
        });
      })
      .onConfirmation(() => {
        notification.open({
          message: `Withdraw confirmed`,
          description: `Your withdraw of ${this.state.allowance} ETH has been confirmed`
        });
      });
  };

  async showConfirmWithdraw() {
    const poola = PoolaContract.get();

    this.setState({
      finishedGettingAllowance: false,
      confirmWithdrawVisible: true
    });

    const allowanceInWei = await poola.allowances(Web3Provider.currentAddress);
    const allowanceInEth = Number(allowanceInWei.div(new BigNumber(10).pow(18)));

    if (allowanceInEth === 0) {
      message.warning("No allowance to withdraw!");
      this.setState({
        confirmWithdrawVisible: false
      });
    } else {
      this.setState({
        finishedGettingAllowance: true,
        allowance: allowanceInEth,
        allowanceInWei: allowanceInWei
      });
    }
  };

  cancelWithdraw = () => {
    this.setState({
      confirmWithdrawVisible: false
    });
  };

  showCreateNewPool = () => {
    this.setState({
      createNewPoolVisible: true
    });
  };

  handleCreateNewPoolCancel = () => {
    this.setState({
      createNewPoolVisible: false
    });
  };

  handleCreateNewPoolCreate = () => {
    this.formRef.current?.submit();
  };

  handleOnFinish(values: {poolName: string, token: string, weiPrice: number}) {
    const poola = PoolaContract.get();

    poola.createPool(values.poolName, values.token, values.weiPrice)
      .onTransactionHash(() => {
        notification.open({
          message: `Pool creation in process`,
          description: `Your transaction was sent to the network. You will receive a notification once your pool has been created`
        });

        this.setState({
          createNewPoolVisible: false
        });
      })
      .onConfirmation(async () => {
        notification.open({
          message: `Pool ${values.poolName} created`,
          description: `Your pool was succesfully created. You can deposit to it to increase its size`
        });
        await this.refresh();
      });
  };

  constructor(args: any) {
    super(args);
    this.handleOnFinish = this.handleOnFinish.bind(this);
    this.withdraw = this.withdraw.bind(this);
    this.showConfirmWithdraw = this.showConfirmWithdraw.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  async componentDidMount() {
    this.refresh();
  }

  async refresh() {
    const poola = PoolaContract.get();
    const poolsCount = await poola.getPoolsCount();

    this.setState({
      poolsCount: poolsCount,
      poolsRange: Array.from(Array(Number(poolsCount)).keys())
    });
  }

  render() {
    return (
      <div className="App">
    
          <PageHeader
            title="Poola Exchange"
            className="site-page-header"
            extra={
              [
                <Button
                  icon={<PlusSquareOutlined />}
                  onClick={this.showCreateNewPool}>
                  Create new Pool
                </Button>,
                <Popconfirm
                  visible={this.state.confirmWithdrawVisible}
                  icon={<SwapOutlined />}
                  title={
                    this.state.finishedGettingAllowance
                    ? `Withdraw ${this.state.allowance} ETH?`
                    : <Spin />
                  }
                  okButtonProps={{disabled: !this.state.finishedGettingAllowance}}
                  onConfirm={this.withdraw}
                  onCancel={this.cancelWithdraw}>
                    <Button
                      icon={<SwapOutlined />}
                      onClick={this.showConfirmWithdraw}>
                      Withdraw
                    </Button>
                </Popconfirm>
              ]
            }>
          </PageHeader>
          
          <Divider />

          <div className="Container">
            {
              <List
                grid={{gutter: 16, xs: 1, sm: 2, md: 2, lg: 4, xl: 4, xxl: 6}}
                dataSource={this.state.poolsRange}
                renderItem={x => <List.Item><PoolComponent poolIndex={x} /></List.Item>}>
              </List>
            }
          </div>
          
          <Modal
            title="Create new Pool"
            visible={this.state.createNewPoolVisible}
            onCancel={this.handleCreateNewPoolCancel}
            onOk={this.handleCreateNewPoolCreate}>
            <Form
              ref={this.formRef}
              onFinish={this.handleOnFinish}
              labelCol={{ span: 5 }}
              wrapperCol={{ span: 19 }}>

              <Form.Item label="Pool name" name="poolName" rules={[{required: true}]}>
                <Input />
              </Form.Item>

              <Form.Item label="Token" name="token" rules={[{required: true}]}>
                <Select
                  placeholder="Select a token"
                  children={
                    Config.addresses[Config.network]
                      .whitelistedTokens
                      .map(x => <Select.Option value={x.address}>{x.symbol} - {x.name}</Select.Option>)
                  } />
              </Form.Item>

              <Form.Item label="Price">
                <Form.Item initialValue={1} noStyle name="weiPrice" rules={[{required: true}]}>
                  <InputNumber
                      min={1}
                      value={1} />
                </Form.Item>
                <Tooltip title="price information">
                  <span style={{ margin: '0 8px' }}>
                    * This is how much token is worth 1 ETH
                  </span>
                </Tooltip>
              </Form.Item>
            </Form>
          </Modal>
          
      </div>
    );
  }
}

export default App;
