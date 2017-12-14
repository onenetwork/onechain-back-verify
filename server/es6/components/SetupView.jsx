import React, {Component} from 'react';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel, FormControl,Modal } from 'react-bootstrap';
import { Link, Redirect } from 'react-router-dom';
import BackChainActions from '../BackChainActions';
import HeaderView from './HeaderView';
import oneBcClient from '@onenetwork/one-backchain-client';
import StartSyncView from './StartSyncView';
import DisplayMessageView from "./DisplayMessageView";

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
			BackChainActions.verfiyBackChainSettings(bcClient,function(error,result){
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
        	return <Redirect push to="/index" />;
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
				backgroundColor: 'rgba(0, 133, 200, 1)',
				border: 'none',
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
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainUrl.bind(this)}  onChange={this.blockChainUrl.bind(this)} placeholder="e.g. http://localhost:8545" />					
				</Col>
			</Row>
			<Row style={fieldProps.panelPadding}>
				<Col md={2}><div style={fieldProps.valueLabel}>Contract Address: </div></Col>
				<Col md={8}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainContractAddress.bind(this)}  onChange={this.blockChainContractAddress.bind(this)} placeholder="e.g. 0xc5d4b021858a17828532e484b915149af5e1b138" />
				</Col>
			</Row>
			<Row style={fieldProps.panelPadding}>
				<Col md={2}><div style={fieldProps.valueLabel}>Private Key: </div></Col>
				<Col md={8}>
					<FormControl type="text" style={fieldProps.valueInput} onKeyPress={this.blockChainPrivateKey.bind(this)}  onChange={this.blockChainPrivateKey.bind(this)} placeholder="e.g. 0x8ad0132f808d0830c533d7673cd689b7fde2d349ff0610e5c04ceb9d6efb4eb1" />					
				</Col>
			</Row>
			<Row style={fieldProps.panelPadding}>
				<Col md={2}></Col>
				<Col md={8}>
					<div>
							<button onClick={this.saveInitialConfig.bind(this)} style={fieldProps.buttonStyle}>
							<span>Enter</span>
							</button>
					</div>
				</Col>
			</Row>
		</div>);
		return (
			<div className={"panel panel-default"}>
				<HeaderView store={this.props.store} size="big" />
				<div className={"panel-body"} style={fieldProps.panelBody}>{panelBody}</div>
			</div>
		);
	}
}

@observer class DisplayMessageViewPopup extends React.Component {
    render() {
        return(<Modal dialogClassName = {"display-msg-modal"} show={this.props.store.displayMessageViewModalActive} onHide={BackChainActions.toggleDisplayMessageView}>
                    <DisplayMessageView title = "Message" msg= {"Invalid Blockchain settings.Please try again."} store={this.props.store}/> 
               </Modal>);
    }
}