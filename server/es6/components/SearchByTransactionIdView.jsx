import {Row,  Col, Button, FormControl, Modal} from 'react-bootstrap';
import React, {Component} from 'react';
import BackChainActions from '../BackChainActions';
import { Link,Redirect } from 'react-router-dom';
import { observer } from 'mobx-react';
import HeaderView from "./HeaderView";
import DisplayMessageView from "./DisplayMessageView";
import Images from '../Images';

@observer export default class SearchByTransactionIdView extends React.Component {
    constructor(props) {
        super(props);
		this.state = {redirect:null,verifyDisabled:true};
		this.transactionIdInputVal = null;
	}

	listenKeyPress(event){
		this.transactionIdInputVal	= event.target.value.trim();
		if(this.transactionIdInputVal.length >0) {
			this.setState({verifyDisabled: false});
		}
		else {
			this.setState({verifyDisabled: true});
		}
		if (this.transactionIdInputVal.length >0 && event.charCode  == 13) {
			this.loadTransactionIntoStore();
		}
	}

	loadTransactionIntoStore() {
		let me = this;
		BackChainActions.loadTransactions(this.transactionIdInputVal, "tnxId", function(redirect) {
			if(redirect == false) {
				me.props.store.displayMessageViewModalActive = true;
			} else {
				me.setState({redirect: redirect});
			}
		});
	}

	componentDidMount() {
		BackChainActions.processApplicationSettings();
	}

    render () {
		if (this.props.store.isInitialSetupDone == null) {
			return null;
		} else if (this.props.store.isInitialSetupDone === false) {
			return <Redirect push to="/setup" />;
		}
		if (this.state.redirect) {
            return <Redirect push to="/listTransactions" />;
		} else {
			let fieldProps = {
				panelPadding : {
					paddingLeft: '35px',
					width: '34%'
				},
				panelBodyTitle : {
					paddingLeft: '36px',
					fontSize: '13px'
				},
				panelBody : {
					paddingTop: 20,
					backgroundColor: 'white',
					height: '460px'
				},
				button : {
					padding: '7px 23px',
					fontSize: '16px',
					boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px',
					borderColor: 'rgb(0, 120, 215)',
					width: '104px'
				},
				cancelButton: {
					padding: '7px 23px',
					color: 'rgb(0, 120, 215)',
					borderColor: 'rgb(0, 120, 215)',
					fontSize: '16px',
					boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px'
				},
				nameSpan : {
					fontSize: '25px'
				},
				nameColor : {
					color: '#5e5d5d'
				},
				subNameSpan : {
					fontFamily:'Open Sans'
				},
				blankLine : {
					marginLeft: '20px',
				},
				browse : {
					fontSize: '20px',
					color: 'rgb(94, 93, 93)',
					fontFamily: 'Open Sans'
				},
				inputBox : {
					width: '79%',
					height: '45px',
					fontSize: '18px',
					fontFamily: "Open Sans",
					color:'rgb(153, 153, 153)',
					borderColor: 'rgba(153,153,153,1)'
				}
			};

			return (
				<div>
					<DisplayMessageViewPopup store={this.props.store}/>

					<div className={"panel panel-default"} onClick={this.props.action}>
						<HeaderView store={this.props.store}/>
						<div className={"panel-body"} style={fieldProps.panelBody}>
						<Row>
							<Col md={2} style={{paddingLeft:'37px'}}>
								<img src={Images.TRANSACTION}/>
							</Col>
							<Col md={10} style={{paddingLeft:'0px', paddingTop: '13px'}}>
								<span style={fieldProps.nameSpan}>
									<strong style={fieldProps.nameColor}>
										Transaction ID
									</strong>
								</span> <br/>
								<span style={fieldProps.subNameSpan}>
									This search returns the transaction associated with the given transaction Id and the transaction shall be verified with Block Chain. Transaction id can be found in a Payload file. This search will require the transaction to be existing in the local repository.
								</span>
							</Col>
						</Row>

						<hr style={fieldProps.blankLine}/>

						<br/>

						<Row style={fieldProps.panelBodyTitle}>
							<div> <span style={fieldProps.browse}> Enter a Transaction ID to verify  </span>  </div>
							<br/>
							<FormControl type="text" style={fieldProps.inputBox} onKeyPress={this.listenKeyPress.bind(this)} onChange={this.listenKeyPress.bind(this)} placeholder="Transaction ID" />
							<br/> <br/>
							<Button disabled={this.state.verifyDisabled} className="btn btn-primary" style={fieldProps.button} onClick={this.loadTransactionIntoStore.bind(this)}>Verify</Button>
							&nbsp; &nbsp; <Link  to="/home"><Button style = {fieldProps.cancelButton} >Cancel</Button></Link>
						</Row>

						</div>
					</div>
				</div>
			);

		}
    }
}

@observer class DisplayMessageViewPopup extends React.Component {
    render() {
        return(<Modal dialogClassName = {"display-msg-modal"} show={this.props.store.displayMessageViewModalActive} onHide={BackChainActions.toggleDisplayMessageView}>
                    <DisplayMessageView title = "Message" msg= "Result not found! Try again with different ID." store={this.props.store}/>
               </Modal>);
    }
}
