import React, {Component} from 'react';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel, FormControl,Modal } from 'react-bootstrap';
import { Link, Redirect } from 'react-router-dom';
import BackChainActions from '../BackChainActions';
import HeaderView from './HeaderView';
import oneBcClient from '@onenetwork/one-backchain-client';
import DisplayMessageView from "./DisplayMessageView";
import DisplaySyncView from "./DisplaySyncView"

@observer export default class SetupView extends React.Component {
	constructor(props) {
		super(props);
	}


	componentDidMount() {
		BackChainActions.processApplicationSettings();
	}

	saveInitialConfig() {
		let me = this;
		if (this.props.store.blockChainUrl == null || this.props.store.blockChainContractAddress == null || this.props.store.blockChainPrivateKey == null) {
			alert('Please input all the following values');
			return;
		}
		if (!this.props.store.blockChainUrl.toLowerCase().startsWith("http://") && !this.props.store.blockChainUrl.toLowerCase().startsWith("https://")) {
			alert('Inivalid server url');
			return;
		}
		try {
			//verify if all inputs are valid
			let bcClient = oneBcClient({
				blockchain: 'eth',
				url: this.props.store.blockChainUrl,
				contractAddress: this.props.store.blockChainContractAddress,
				privateKey: this.props.store.blockChainPrivateKey
			});
			BackChainActions.verifyBackChainSettings(bcClient,function(error,result){
				if(error) {
					me.props.store.displayMessageViewModalActive = true;
				} else if(result) {
					BackChainActions.saveBlockChainSettings(me.props.store.blockChainUrl, me.props.store.blockChainContractAddress, me.props.store.blockChainPrivateKey);
				}
			});
		} catch (e) {
			alert(e);
			return;
		}

	}

	displaySycPopup() {
		this.props.store.displayMessageViewModalActive = true;
	}

	blockChainUrl(event){
		this.props.store.blockChainUrl = event.target.value.trim();
	}

	blockChainContractAddress(event){
		this.props.store.blockChainContractAddress = event.target.value.trim();
	}

	blockChainPrivateKey(event){
		this.props.store.blockChainPrivateKey = event.target.value.trim();
	}

	render() {
		if (this.props.store.isInitialSetupDone === true) {
        	return <Redirect push to="/home" />;
		}
		let fieldProps = {
			panelPadding: {
				paddingLeft: '150px',
				paddingBottom: '50px',
				height: '40px'
			},
			panelBody: {
				paddingTop: 60,
				backgroundColor: 'white',
				height: '400px'
			},
			valueLabel: {
				fontFamily: 'Open Sans',
				fontWeight: 400,
				fontStyle: 'normal',
				fontSize: '18px'
			},
			valueInput: {
				fontFamily: 'Open Sans',
				fontWeight: 400,
				fontStyle: 'normal',
				borderStyle: 'solid',
				borderWidth: '1px',
				borderColor: 'rgba(153, 153, 153, 1)',
				borderRadius: '3px',
				fontSize: '18px'
			},
			buttonStyle: {
				boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px',
				borderColor: 'rgb(0, 120, 215)',
				borderRadius: '5px',
				fontSize: '20px',
				color: '#FFFFFF',
				fontFamily: 'Open Sans',
				fontWeight: 400,
				fontStyle: 'normal',
				fontSize: '18px',
				width: '96px',
				height: '42px'
			}
		};
		let panelBody = (<div>
			<DisplayMessageViewPopup store={this.props.store}/>
			<p></p>
			<Row style={fieldProps.panelPadding}>
				<Col md={2}><div style={fieldProps.valueLabel}>Blockchain URL: </div></Col>
				<Col md={8}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainUrl.bind(this)}  onChange={this.blockChainUrl.bind(this)} placeholder={this.props.store.blockChainUrl} value={this.props.store.blockChainUrl}/>
				</Col>
			</Row>
			<Row style={fieldProps.panelPadding}>
				<Col md={2}><div style={fieldProps.valueLabel}>Contract Address: </div></Col>
				<Col md={8}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainContractAddress.bind(this)}  onChange={this.blockChainContractAddress.bind(this)} placeholder={this.props.store.blockChainContractAddress} value= {this.props.store.blockChainContractAddress} />
				</Col>
			</Row>
			<Row style={fieldProps.panelPadding}>
				<Col md={2}><div style={fieldProps.valueLabel}>Private Key: </div></Col>
				<Col md={8}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainPrivateKey.bind(this)}  onChange={this.blockChainPrivateKey.bind(this)} placeholder={this.props.store.blockChainPrivateKey} value = {this.props.store.blockChainPrivateKey} />
				</Col>
			</Row>
			<Row style={fieldProps.panelPadding}>
				<Col md={2}></Col>
				<Col md={8}>
					<div>
							<button onClick={this.saveInitialConfig.bind(this)} style={fieldProps.buttonStyle} className="btn btn-primary">
							<span>Enter</span>
							</button>
					</div>
				</Col>
			</Row>
		</div>);

		let panelBodyProd = (<div>
			{<DisplayDataSyncPopup store={this.props.store}/>}
			<p></p>
			<Row style={{paddingTop:'50px', paddingLeft: '150px', height: '40px',paddingBottom:'60px'}}>
				<Col md={2}><div style={fieldProps.valueLabel}>Blockchain URL: </div></Col>
				<Col md={8}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainUrl.bind(this)}  onChange={this.blockChainUrl.bind(this)} placeholder="e.g. http://localhost:8545" />
				</Col>
			</Row>

			<Row style={fieldProps.panelPadding} >
				<Col md={2} style={{width: '177px'}}><div>  </div></Col>
				<div  class="col-md-7" style={{backgroundColor: 'rgba(221, 236, 255, 1)',borderRadius: '6px',width: '64%',height: '54px'}}>
				<div style={{display: 'inline'}}><span style={{color:'#0085C8',fontSize:'20px',paddingTop:'6px'}} class="fa fa-info-circle fa-2x"></span></div>
				<div style={{display: 'inline',paddingLeft:'10px'}}>
						<span>The default Blockchain URL will connect you to One Network's Blockchain.</span>
						<span style={{display: 'block',paddingLeft:'30px'}} > However, you can specify another Blockchain URL if you wish.</span>
				</div>
				</div>
			</Row>

			<Row  style={{paddingTop:'60px', paddingLeft: '135px', height: '40px'}}>
				<Col md={2} style={{width: '177px'}}> </Col>
				<Col md={8}>
					<div>
							<button onClick={this.displaySycPopup.bind(this)} className="btn btn-primary" style={fieldProps.buttonStyle}>
							<span>Enter</span>
							</button>
					</div>
				</Col>
			</Row>
		</div>);

		if(this.props.store.mode=="prod") {
			return (
				<div className={"panel panel-default"}>
					<HeaderView store={this.props.store} size="big" />
					<div className={"panel-body"} style={fieldProps.panelBody}>{panelBodyProd}</div>
				</div>
			);
		}else {
			return (
				<div className={"panel panel-default"}>
					<HeaderView store={this.props.store} size="big" />
					<div className={"panel-body"} style={fieldProps.panelBody}>{panelBody}</div>
				</div>
			);
		}
	}
}

@observer class DisplayMessageViewPopup extends React.Component {
    render() {
        return(<Modal dialogClassName = {"display-msg-modal"} show={this.props.store.displayMessageViewModalActive} onHide={BackChainActions.toggleDisplayMessageView}>
                    <DisplayMessageView title = "Message" msg= {"Could not connect to the blockchain, please check your settings and try again."} store={this.props.store}/>
               </Modal>);
    }
}

@observer class DisplayDataSyncPopup extends React.Component {
    render() {
        return(<Modal dialogClassName = {"display-msg-modal"} show={this.props.store.displayMessageViewModalActive} onHide={BackChainActions.toggleDisplayMessageView}>
                  <DisplaySyncView  store={this.props.store}/>
               </Modal>);
    }
}
