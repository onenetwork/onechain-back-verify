import React, {Component} from 'react';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel, FormControl,Modal } from 'react-bootstrap';
import { Link, Redirect } from 'react-router-dom';
import BackChainActions from '../BackChainActions';
import HeaderView from './HeaderView';
import AlertPopupView from './AlertPopupView';
import DisplaySyncView from "./DisplaySyncView"
import Images from '../Images';

@observer export default class SetupView extends React.Component {
	constructor(props) {
		super(props);
		this.props.store.providerType = SetupView.blockChainTechEnum.ethereum;
	}


	componentDidMount() {
		BackChainActions.processApplicationSettings();
	}

	isEmpty(value) {
		return value == null || typeof value == 'undefined' || value == "";
	}

	saveInitialConfig() {
		if (this.isEmpty(this.props.store.blockChainUrl) || this.isEmpty(this.props.store.blockChainContractAddress) || this.isEmpty(this.props.store.disputeBlockChainContractAddress)) {
			BackChainActions.displayAlertPopup("Missing Required Fields", "Please fill in all the required fields and try again.",'WARN');
			return;
		}
		if (!this.props.store.blockChainUrl.toLowerCase().startsWith("http://") && !this.props.store.blockChainUrl.toLowerCase().startsWith("https://")) {
			BackChainActions.displayAlertPopup("Invalid BlockChain Url", "Please enter a valid block chain url and try again.",'WARN');
			return;
		}
		BackChainActions.verifyBackChainSettings();
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

	hyperLedgerToken(event) {
		this.props.store.hyperLedgerToken = event.target.value.trim();
	}

	toggleBlockChainTech(techName) {
		this.props.store.providerType = techName;
	}

	render() {
		if (this.props.store.isInitialSetupDone === true) {
        	return <Redirect push to="/home" />;
		}
		let fieldProps = {
			panelPadding: {
				paddingLeft: '30px',
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
				fontSize: '18px',
				textAlign: 'right',
				paddingTop: '5px'
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
			blockChainTechLogo: {
    			padding: '5px',
				width: '180px',
				height: '42px',
				cursor: 'pointer',
				color: '#0085C8',
				fontSize: '18px',
				position: 'relative',
				borderRadius: '5px',
				border: '1px solid #0085C8',
				boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px'
			},
			blockChainText: {
				verticalAlign: 'middle'
			},
			blockChainSelectArea: {
				top: '0',
				right: '0',
				width: '40px',
				height: '100%',
				position: 'absolute',
				background: '#f2f2f2',
				borderTopRightRadius: '5px',
    			borderBottomRightRadius: '5px'
			}
		};
		let panelBody = (<div>
			<AlertPopupView store={this.props.store} />
			<p></p>
			<Row style={Object.assign({}, fieldProps.panelPadding, {paddingBottom: '60px'})}>
				<Col md={4}><div style={fieldProps.valueLabel}>Technology: </div></Col>
				<Col md={2}>
					<div onClick= {()=>this.toggleBlockChainTech(SetupView.blockChainTechEnum.ethereum)} style={this.props.store.providerType === SetupView.blockChainTechEnum.ethereum ? Object.assign({},fieldProps.blockChainTechLogo,{fontWeight:'600'}) : fieldProps.blockChainTechLogo}>
						<img src={Images.ETHEREUM_ICON} />
						<span style={fieldProps.blockChainText}>Ethereum</span>
						<div style={fieldProps.blockChainSelectArea}>{this.props.store.providerType === SetupView.blockChainTechEnum.ethereum ? <i className={"fa fa-check"} style={{padding: '10px', fontSize: '20px'}}/> : null}</div>
					</div>
				</Col>
				<Col md={2}>
					<div onClick= {()=>this.toggleBlockChainTech(SetupView.blockChainTechEnum.hyperledger)} style={this.props.store.providerType === SetupView.blockChainTechEnum.hyperledger ? Object.assign({},fieldProps.blockChainTechLogo,{marginLeft: '15px', width: '205px', fontWeight:'600'}) : Object.assign({},fieldProps.blockChainTechLogo,{marginLeft: '15px', width: '205px'})}>
						<img src={Images.HYPERLEDGER_ICON} />&nbsp;
						<span style={fieldProps.blockChainText}>Hyperledger</span>
						<div style={fieldProps.blockChainSelectArea}>{this.props.store.providerType === SetupView.blockChainTechEnum.hyperledger ? <i className={"fa fa-check"} style={{padding: '10px', fontSize: '20px'}}/> : null}</div>
					</div>
				</Col>
			</Row>
			<Row style={fieldProps.panelPadding}>
				<Col md={4}><div style={fieldProps.valueLabel}>Blockchain URL: </div></Col>
				<Col md={7}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainUrl.bind(this)}  onChange={this.blockChainUrl.bind(this)} placeholder={this.props.store.blockChainUrl} value={this.props.store.blockChainUrl == null ? '' : this.props.store.blockChainUrl}/>
				</Col>
			</Row>
			{this.props.store.providerType === SetupView.blockChainTechEnum.ethereum ? 
				(<div><Row style={fieldProps.panelPadding}>
					<Col md={4}><div style={fieldProps.valueLabel}>Content BackChain Contract Address: </div></Col>
					<Col md={7}>
						<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainContractAddress.bind(this)}  onChange={this.blockChainContractAddress.bind(this)} placeholder={this.props.store.blockChainContractAddress} value= {this.props.store.blockChainContractAddress == null ? '' : this.props.store.blockChainContractAddress} />
					</Col>
				</Row>
				<Row style={fieldProps.panelPadding}>
					<Col md={4}><div style={fieldProps.valueLabel}>Dispute BackChain Contract Address: </div></Col>
					<Col md={7}>
						<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.disputeBlockChainContractAddress.bind(this)}  onChange={this.disputeBlockChainContractAddress.bind(this)} placeholder={this.props.store.disputeBlockChainContractAddress} value= {this.props.store.disputeBlockChainContractAddress == null ? '' : this.props.store.disputeBlockChainContractAddress} />
					</Col>
				</Row></div>) :
				(<div><Row style={fieldProps.panelPadding}>
					<Col md={4}><div style={fieldProps.valueLabel}>Token: </div></Col>
					<Col md={7}>
						<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.hyperLedgerToken.bind(this)} onChange={this.hyperLedgerToken.bind(this)} value={this.props.store.hyperLedgerToken == null ? '' : this.props.store.hyperLedgerToken}/>
					</Col>
				</Row></div>)
			}
			<Row style={fieldProps.panelPadding}>
				<Col md={4}></Col>
				<Col md={7}>
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
			<Row style={Object.assign({}, fieldProps.panelPadding, {paddingBottom: '60px'})}>
				<Col md={3}><div style={fieldProps.valueLabel}>Technology: </div></Col>
				<Col md={2}>
					<div onClick= {()=>this.toggleBlockChainTech(SetupView.blockChainTechEnum.ethereum)} style={this.props.store.providerType === SetupView.blockChainTechEnum.ethereum ? Object.assign({},fieldProps.blockChainTechLogo,{fontWeight:'600'}) : fieldProps.blockChainTechLogo}>
						<img src={Images.ETHEREUM_ICON} />
						<span style={fieldProps.blockChainText}>Ethereum</span>
						<div style={fieldProps.blockChainSelectArea}>{this.props.store.providerType === SetupView.blockChainTechEnum.ethereum ? <i className={"fa fa-check"} style={{padding: '10px', fontSize: '20px'}}/> : null}</div>
					</div>
				</Col>
				<Col md={2}>
					<div onClick= {()=>this.toggleBlockChainTech(SetupView.blockChainTechEnum.hyperledger)} style={this.props.store.providerType === SetupView.blockChainTechEnum.hyperledger ? Object.assign({},fieldProps.blockChainTechLogo,{marginLeft: '15px', width: '205px', fontWeight:'600'}) : Object.assign({},fieldProps.blockChainTechLogo,{marginLeft: '15px', width: '205px'})}>
						<img src={Images.HYPERLEDGER_ICON} />&nbsp;
						<span style={fieldProps.blockChainText}>Hyperledger</span>
						<div style={fieldProps.blockChainSelectArea}>{this.props.store.providerType === SetupView.blockChainTechEnum.hyperledger ? <i className={"fa fa-check"} style={{padding: '10px', fontSize: '20px'}}/> : null}</div>
					</div>
				</Col>
			</Row>
			
			<Row style={fieldProps.panelPadding}>
				<Col md={3}><div style={fieldProps.valueLabel}>Blockchain URL: </div></Col>
				<Col md={7}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainUrl.bind(this)}  onChange={this.blockChainUrl.bind(this)} placeholder="e.g. http://localhost:8545" />
				</Col>
			</Row>

			<Row style={fieldProps.panelPadding} >
				<Col md={3}><div></div></Col>
				<Col md={7}>
					<div style={{backgroundColor: 'rgba(221, 236, 255, 1)',borderRadius: '6px', height: '54px', paddingLeft: '12px', paddingTop: '6px'}}>
						<div style={{float: 'left', marginRight: '5px'}}>
							<i style={{color:'#0085C8',fontSize:'20px'}} className="fa fa-info-circle fa-2x"></i>
						</div>
						<div style={{float: 'left'}}>
							The default Blockchain URL will connect you to One Network's Blockchain.<br/>
							However, you can specify another Blockchain URL if you wish.
						</div>
						<div style={{clear: 'both'}}></div>
					</div>
				</Col>
			</Row>
			<p></p>
			<Row style={fieldProps.panelPadding}>
				<Col md={3}> </Col>
				<Col md={7}>
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
SetupView.blockChainTechEnum=Object.freeze({"ethereum":"ethereum", "hyperledger":"hyperledger"});