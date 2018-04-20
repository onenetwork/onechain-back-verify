import React, {Component} from 'react';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel, FormControl,Modal } from 'react-bootstrap';
import { Link, Redirect } from 'react-router-dom';
import BackChainActions from '../BackChainActions';
import HeaderView from './HeaderView';
import oneBcClient from '@onenetwork/one-backchain-client';
import AlertPopupView from './AlertPopupView';
import DisplaySyncView from "./DisplaySyncView"

@observer export default class SetupView extends React.Component {
	constructor(props) {
		super(props);
	}


	componentDidMount() {
		BackChainActions.processApplicationSettings();
	}

	saveInitialConfig() {

		//Ask for metamask installation
		if(typeof web3 === 'undefined' || typeof web3.currentProvider === 'undefined' || web3.currentProvider.isMetaMask !== true) {
			BackChainActions.displayAlertPopup("Missing MetaTask Extension", 
			["You need to install ", <a href='https://chrome.google.com/webstore/detail/nkbihfbeogaeaoehlefnkodbefgpgknn' target='_blank'>MetaMask</a>, 
			" in order to use Disputes. Please install the extension first and try again."],'ERROR');
			return;
		}
		let me = this;
		if (this.props.store.blockChainUrl == null || this.props.store.blockChainContractAddress == null || this.props.store.disputeBlockChainContractAddress == null) {
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
				disputeContractAddress: this.props.store.disputeBlockChainContractAddress
			});
			BackChainActions.verifyBackChainSettings(bcClient);
		} catch (e) {
			alert(e);
			return;
		}

	}

	blockChainUrl(event){
		this.props.store.blockChainUrl = event.target.value.trim();
	}

	blockChainContractAddress(event){
		this.props.store.blockChainContractAddress = event.target.value.trim();
	}
	
	disputeBlockChainContractAddress(event){
		this.props.store.disputeBlockChainContractAddress = event.target.value.trim();
	}
	
	render() {
		if (this.props.store.isInitialSetupDone === true) {
        	return <Redirect push to="/home" />;
		}
		let fieldProps = {
			panelPadding: {
				paddingLeft: '150px',
				paddingBottom: '50px',
				height: '40px',
				paddingTop: '10px'
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
			},
			valueLabelCol: {
				width:'20%'
			}
		};
		let panelBody = (<div>
			<AlertPopupView store={this.props.store} />
			<p></p>
			<Row style={fieldProps.panelPadding}>
				<Col md={3} style={fieldProps.valueLabelCol}><div style={fieldProps.valueLabel}>Blockchain URL: </div></Col>
				<Col md={8}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainUrl.bind(this)}  onChange={this.blockChainUrl.bind(this)} placeholder={this.props.store.blockChainUrl} value={this.props.store.blockChainUrl == null ? '' : this.props.store.blockChainUrl}/>
				</Col>
			</Row>
			<Row style={fieldProps.panelPadding}>
				<Col md={3} style={fieldProps.valueLabelCol}><div style={fieldProps.valueLabel}>Content BackChain Contract Address: </div></Col>
				<Col md={8}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainContractAddress.bind(this)}  onChange={this.blockChainContractAddress.bind(this)} placeholder={this.props.store.blockChainContractAddress} value= {this.props.store.blockChainContractAddress == null ? '' : this.props.store.blockChainContractAddress} />
				</Col>
			</Row>
			<Row style={fieldProps.panelPadding}>
				<Col md={3} style={fieldProps.valueLabelCol}><div style={fieldProps.valueLabel}>Dispute BackChain Contract Address: </div></Col>
				<Col md={8}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.disputeBlockChainContractAddress.bind(this)}  onChange={this.disputeBlockChainContractAddress.bind(this)} placeholder={this.props.store.disputeBlockChainContractAddress} value= {this.props.store.disputeBlockChainContractAddress == null ? '' : this.props.store.disputeBlockChainContractAddress} />
				</Col>
			</Row>
			<Row style={fieldProps.panelPadding}>
				<Col md={3} style={fieldProps.valueLabelCol}></Col>
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
			<p></p>
			<Row style={{paddingTop:'50px', paddingLeft: '150px', height: '40px',paddingBottom:'60px'}}>
				<Col md={2}><div style={fieldProps.valueLabel}>Blockchain URL: </div></Col>
				<Col md={8}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainUrl.bind(this)}  onChange={this.blockChainUrl.bind(this)} placeholder="e.g. http://localhost:8545" />
				</Col>
			</Row>

			<Row style={fieldProps.panelPadding} >
				<Col md={2} style={{width: '177px'}}><div>  </div></Col>
				<div  className="col-md-7" style={{backgroundColor: 'rgba(221, 236, 255, 1)',borderRadius: '6px',width: '64%',height: '54px'}}>
				<div style={{display: 'inline'}}><span style={{color:'#0085C8',fontSize:'20px',paddingTop:'6px'}} className="fa fa-info-circle fa-2x"></span></div>
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
							<button onClick={this.saveInitialConfig.bind(this)} className="btn btn-primary" style={fieldProps.buttonStyle}>
							<span>Enter</span>
							</button>
					</div>
				</Col>
			</Row>
		</div>);

		if(this.props.store.mode=="prod") {
			return (
				<div className={"panel panel-default"}>
					<style>
						{`
							::-webkit-input-placeholder {
								font-size: 18px !important;
								padding: 1px;
							}
							::-moz-placeholder {
								font-size: 18px !important;
								padding: 1px;
							}
							:-ms-input-placeholder {
								font-size: 18px !important;
								padding: 1px;
							}
							::placeholder {
								font-size: 18px !important;
								padding: 1px;
							}
						`}
					</style>
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