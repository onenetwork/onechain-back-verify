import React from 'react';
import {Row, Col, Button, FormControl, FormGroup, Checkbox} from 'react-bootstrap';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import BackChainActions from '../BackChainActions';
import moment from 'moment';

import {disputeHelper} from '../DisputeHelper';

@observer export default class NewDisputeView extends React.Component {

	constructor(props) {
        super(props);
		this.setModalBodyRef = this.setModalBodyRef.bind(this);           
		this.handleClick = this.handleClick.bind(this);
		this.state = {
			disputeInfoMsg : null,
			disputeWarnMsg: null,
			disputeErrorMsg: null,
			searchTnxIdTimeOut : 0,
			saveOrSubmitDisputeButtonsDisabled: true,
			eventBtids : [],
			tnxIdInputDisabled: false
        };
	}
	
	setDisputeMsg(disputeMsg) {
		switch(disputeMsg.type) {
			case "reset" :
				this.setState({disputeErrorMsg : null, disputeWarnMsg : null, disputeInfoMsg : null});
				break;
			case "disputeInfoMsg" :
				this.setState({disputeErrorMsg : null, disputeWarnMsg : null, disputeInfoMsg : disputeMsg.msg});
				break;
			case "disputeWarnMsg" :
				this.setState({disputeErrorMsg : null, disputeWarnMsg : disputeMsg.msg, disputeInfoMsg : null});
				break;
			case "disputeErrorMsg" :
				this.setState({disputeErrorMsg : disputeMsg.msg, disputeWarnMsg : null, disputeInfoMsg : null});
		}
	}

	setModalBodyRef(node) {
        this.modalBodyRef = node;
    }

	componentWillMount() {
		document.addEventListener('click', this.handleClick, false);
	}
	
	componentWillUnmount() {
		document.removeEventListener('click', this.handleClick, false);
	}

	componentDidMount() {
		if(this.props.store.disputeTransaction) {
			BackChainActions.generateDisputeId(this.props.store.entNameOfLoggedUser+"~"+this.props.store.disputeTransaction.id);
			this.setState({saveOrSubmitDisputeButtonsDisabled:false});
		}
	}
	
	handleClick(event) {
		/* Checking If clicked  at resetMsgs class */
		if(event.target.classList.contains("resetMsgs")) {
			return;
		}
		/* Checking If clicked outside of modal body */
    	if (this.modalBodyRef && !this.modalBodyRef.contains(event.target)) {
			BackChainActions.toggleNewDisputeModalView();
			BackChainActions.clearDisputeTransaction();
			BackChainActions.clearDisputeId();
        }
	}

	closeModal() {
		BackChainActions.toggleNewDisputeModalView();
		BackChainActions.clearDisputeTransaction();
		BackChainActions.clearDisputeId();
	}

	resetMsgs() {
		this.setDisputeMsg({'type':'reset'});
	}
	
	getNewDisputeData() {
		let disputeTransaction = this.props.store.disputeTransaction;
		let dispute = {};
		let disputedBusinessTransactionIds = [];
		for(let i = 0; i < this.state.eventBtids.length; i++) {
			disputedBusinessTransactionIds.push('0x' + this.state.eventBtids[i]);
		}
		if(disputeTransaction) {
			dispute = {
				"disputeId": '0x' + this.props.store.generatedDisputeId,
				"disputedTransactionId": '0x' + disputeTransaction.id,
				"disputedBusinessTransactionIds": disputedBusinessTransactionIds,
				"submittedDate" : null,
				"closedDate": null,
				"state": "Draft",
				"reason": ReactDOM.findDOMNode(this.select).value,
			}
		}
		
		return dispute;
	}

	onTnxIdChange(event) {
		const me = this;
		this.setDisputeMsg({'type':'reset'});
		event.persist();
		if (me.state.searchTnxIdTimeOut) {
			clearTimeout(me.state.searchTnxIdTimeOut);
		}
		if(!event.target.value) {
			BackChainActions.clearDisputeTransaction();
			BackChainActions.clearDisputeId();
			return;
		}
		me.setState({
			searchTnxIdTimeOut: setTimeout(function() {
				BackChainActions.populateDisputeTransaction(event.target.value)
				.then(function(result){
					if(result === true){
						if (disputeHelper.isSubmitDisputeWindowStillOpen(me.props.store.disputeTransaction, me.props.store.disputeSubmissionWindowInMinutes).visible) {
							me.setState({saveOrSubmitDisputeButtonsDisabled:false});
						} else {
							me.setDisputeMsg({'type':'disputeWarnMsg', 'msg':"Time window to raise a dispute on this transaction has already passed. You have " + me.props.store.disputeSubmissionWindowInMinutes + " minutes to raise disputes on a transaction."});
							return;
						}
					}
					BackChainActions.generateDisputeId(me.props.store.entNameOfLoggedUser+"~"+event.target.value);
					if(me.props.store.disputeTransaction) {
						me.setState({saveOrSubmitDisputeButtonsDisabled:false});
					} else {
						me.setState({saveOrSubmitDisputeButtonsDisabled:true});
					}
				})
				.catch(function (err) {
					me.setState({saveOrSubmitDisputeButtonsDisabled:true});
					me.setDisputeMsg({'type':'disputeWarnMsg', 'msg': err});
				});
			}, 3000)
		});
	}

	saveAsDraft() {
 
		let me = this;
		if (!me.transactionId.value || me.transactionId.value.trim().length == 0) {
			me.setDisputeMsg({'type':'disputeWarnMsg', 'msg':"Please enter transaction id"});
			return;
		}
		else if (ReactDOM.findDOMNode(this.select).value == "select") {
			me.setDisputeMsg({'type':'disputeWarnMsg', 'msg':"Please select a reason code."});
			return;
		} else {
			me.setDisputeMsg({'type':'reset'});
		}

		me.setState({saveOrSubmitDisputeButtonsDisabled:true});
		BackChainActions.saveDisputeAsDraft(this.getNewDisputeData())
		.then(function(response) {
			if(response.success) {
				if(response.exists) {
					me.setDisputeMsg({'type':'disputeWarnMsg', 'msg':"You already have a dispute in " + response.status + " status for this transaction. Please close this window and see it in the list."});
					return;
				}
				BackChainActions.toggleNewDisputeModalView();
				BackChainActions.clearDisputeTransaction();
				BackChainActions.clearDisputeId();
			}
		}, function(error) {
			console.error(error);
		});
	}

	submitDispute() {
		let me = this;
		if (!me.transactionId.value || me.transactionId.value.trim().length == 0) {
			me.setDisputeMsg({'type':'disputeWarnMsg', 'msg':"Please enter transaction id"});
			return;
		}
		else if (ReactDOM.findDOMNode(this.select).value == "select") {
			me.setDisputeMsg({'type':'disputeWarnMsg', 'msg':"Please select a reason code."});
			return;
		} else {
			me.setDisputeMsg({'type':'reset'});
		}

		me.setState({saveOrSubmitDisputeButtonsDisabled:true});
		me.setState({tnxIdInputDisabled:true});
		let dispute = this.getNewDisputeData();
        BackChainActions.submitDispute(dispute, this.props.store.disputeSubmissionWindowInMinutes)
        .then(function(result){
            if(result.success) {
				setTimeout(function() {
					BackChainActions.toggleNewDisputeModalView();
					BackChainActions.clearDisputeTransaction();
					BackChainActions.clearDisputeId();
				}, 1000*5);
				me.setDisputeMsg({'type':'disputeInfoMsg', 'msg':result.submitDisputeMsg});
            } else if(result.success === false && result.submitDisputeMsg) {
				me.setState({saveOrSubmitDisputeButtonsDisabled:false});
				me.setDisputeMsg({'type':'disputeWarnMsg', 'msg':result.submitDisputeMsg});
            }
        })
        .catch(function (err) {
            console.error(err);
        });
	}

	evntClickHandler(event) {
		let checkBox = event.currentTarget;
		if(checkBox.checked) {
			this.state.eventBtids.push(checkBox.value);
		} else {
			let index = this.state.eventBtids.indexOf(checkBox.value);
			this.state.eventBtids.splice(index,1);
		}
	}

    render() {
		const {store} = this.props;
		let participantsDom = [];
		let transactionSlices = [];
		let disputeTransactionDate  = 'N/A';
		let disputeTransaction = store.disputeTransaction;

        if(disputeTransaction) {
            transactionSlices = disputeTransaction.transactionSlices;
			BackChainActions.loadEventsForTransaction(disputeTransaction);
            disputeTransactionDate = moment(new Date(disputeTransaction.date)).format('MMM DD, YYYY HH:mm A')
		}
		let listOfPartners = [];
		for (let i = 0; i < transactionSlices.length; i++) {
			let transactionSlice = transactionSlices[i];
			if (transactionSlice.type == "Enterprise" && listOfPartners.indexOf(transactionSlice.enterprise) < 0) {
				listOfPartners.push(transactionSlice.enterprise);
			} else if (transactionSlice.type == "Intersection") {
				if (listOfPartners.indexOf(transactionSlice.enterprises[0]) < 0) {
					listOfPartners.push(transactionSlice.enterprises[0]);
				}
				if (listOfPartners.indexOf(transactionSlice.enterprises[1]) < 0) {
					listOfPartners.push(transactionSlice.enterprises[1]);
				}
			}
		}
		for(let i=0, len = listOfPartners.length; i < len; i++) {
			participantsDom.push(<div key={"pt_" + listOfPartners[i]}>{listOfPartners[i]}</div>);
		}
        
        let evntsUI = [];
        for(let i = 0; i < store.events.length; i++) {
            let event = store.events[i];
            evntsUI.push(<Checkbox value={event.btid} onClick={this.evntClickHandler.bind(this)} key={event.btid}> {moment(new Date(event.date)).format('MMM DD, YYYY HH:mm A')} &nbsp;&nbsp; {event.actionName}</Checkbox>);
		}

		if(!this.props.store.disputeTransaction) {
			evntsUI = [];
		}
        
        let fieldProps = {
			cancelButton: {
				padding: '7px 23px',
				color: 'rgb(0, 120, 215)',
				borderColor: 'rgb(0, 120, 215)',
				fontSize: '16px',
				boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px'
			},
			button: {
				fontSize: '16px',
				boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px',
				borderColor: 'rgb(0, 120, 215)'
			},
			modalBackdrop: {
				backgroundColor : '#2F4F4F', 
				opacity: 0.4
			},
			modalFadeIn: {
				display: 'block'
			},
			modalDisputes: {
				width: '933px'
			},
			modalContents: {
				backgroundColor: '#fff', 
				border: '1px solid rgba(0,0,0,.2)'
			},
			modalBodyTop: {
				border: '1px solid white',
				borderBottomColor: '#8ec2e3',
				width: '98%',
				marginLeft: '8px', marginBottom: '18px'
			},
			faHandPaperO: {
				fontSize: '18px', 
				marginBottom: '5px'
			},
			newDisputeLabel: {
				fontWeight: 600, 
				fontSize: '14px', 
				color: '#515151'
			},
			faTimes: {
				fontSize: '20px', 
				float: 'right', 
				color: '#646464', 
				marginTop: '-7px', 
				cursor: 'pointer'
			},
			disputeIdParentDiv: {
				paddingLeft: '21px'
			},
			disputeIdChildDiv: {
				height: '36px', 
				width: '885px',
				padding: '6px',
				borderRadius: '3px',
				boxSizing: 'border-box',
				borderWidth: '1px',
				borderStyle: 'solid',
				paddingLeft: '20px',
				display: 'table'
			},
			disputeIdLabel: {
				color: 'rgb(0, 133, 200)'
			},
			modalBodyBottom: {
				border: '1px solid white', 
				borderTopColor: '#8ec2e3', 
				width: '98%',
				marginLeft: '8px'
			},
			modalBodyBottomChildDiv: {
				marginTop: '15px',
				marginLeft: '53%'
			},
			eventsParticipantsValDiv: {
				border: '1px solid #80808054',
				borderRadius: '4px',
				padding: '0px 5px 0px 5px',
				height: '90px',
    			overflowY: 'scroll'
			},
			colLeft: {
				width:'57%'
			},
			msgTimes: {
				fontSize: '15px', 
				float: 'right',
				cursor: 'pointer'
			}
		};

		let disputeWarningInfo = null;
		if(this.state.disputeWarnMsg) {
			disputeWarningInfo = (<Row style={Object.assign({}, fieldProps.disputeIdChildDiv, { backgroundColor: '#f7f1cb', borderColor: '#f4deb0'})}>
								<i className="fa fa-times resetMsgs" style={Object.assign({}, fieldProps.msgTimes, { color: '#ef941b'})} onClick={this.resetMsgs.bind(this)}/>
								<span><i className="fa fa-exclamation-triangle" style={{ fontSize: '22px', color:'#ef941b'}}/></span>&nbsp;&nbsp;
								<span style={{ fontSize: '14px', paddingRight: '48px', position:'relative',top:'-2px' }}>&nbsp;<span style={{ color: '#ef941b', fontWeight: 700 }}>Warning!</span>&nbsp;<span style={{ color: '#ef941b',fontWeight: '400' }}>{this.state.disputeWarnMsg}</span></span>
							</Row>);
		}
		let disputeErrorMsgInfo = null;
		if (this.state.disputeErrorMsg) {
			disputeErrorMsgInfo = (<Row style={Object.assign({}, fieldProps.disputeIdChildDiv, { backgroundColor: '#f2dede', borderColor: '#ebcbd1' })}>
								<i className="fa fa-times resetMsgs" style={Object.assign({}, fieldProps.msgTimes, { color: '#d83f3f'})} onClick={this.resetMsgs.bind(this)}/>
								<span><i className="fa fa-times-circle" style={{ fontSize: '22px', color: '#d83f3f' }} /></span>&nbsp;&nbsp;
								<span style={{ fontSize: '14px', paddingRight: '48px', position:'relative',top:'-2px' }}>&nbsp;<span style={{ color: '#d83f3f', fontWeight: 700 }}>Error!</span>&nbsp;<span style={{ color: '#d83f3f',fontWeight: '400' }}>{this.state.disputeErrorMsg}</span></span>
							</Row>);
		}
		let disputeSuccessInfoMsg = null;
		if (this.state.disputeInfoMsg) {
			disputeSuccessInfoMsg = (<Row style={Object.assign({}, fieldProps.disputeIdChildDiv, { backgroundColor: '#dff0da', borderColor: '#cee8c2' })}>
								<i className="fa fa-times resetMsgs" style={Object.assign({}, fieldProps.msgTimes, { color: '#249a79'})} onClick={this.resetMsgs.bind(this)}/>
								<span><i className="fa fa-check-circle" style={{ fontSize: '22px', color: '#249a79' }} /></span>&nbsp;&nbsp;
								<span style={{ fontSize: '14px', paddingRight: '48px', position: 'relative', top: '-2px' }}>&nbsp;<span style={{ color: '#249a79', fontWeight: 700 }}>Success!</span>&nbsp;<span style={{ color: '#249a79',fontWeight: '400' }}>{this.state.disputeInfoMsg}</span></span>
							</Row>);
		}
        return(
			<div>
					<style>
					{`
						.eventsVal:focus,
						.eventsVal.focus {
							border-color: #66afe9 !important;
							outline: 0;
							-webkit-box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
							box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
						}
					`}

					</style>
				<div role="dialog">
					<div className={"modal-backdrop fade in"} style={fieldProps.modalBackdrop}></div>
					<div role="dialog" className={"fade in modal"} style={fieldProps.modalFadeIn}>
						<div className={"modal-disputes modal-dialog"} style={fieldProps.modalDisputes}>
							<div className={"modal-contents"} role="document" style={fieldProps.modalContents}>
								<div className={"modal-body"} ref={this.setModalBodyRef}>

									<div style={fieldProps.modalBodyTop}>
										<i className="fa fa-hand-paper-o" aria-hidden="true" style={fieldProps.faHandPaperO}>&nbsp;&nbsp;
											<span style = {fieldProps.newDisputeLabel}>New Dispute</span>
										</i>
										<i className="fa fa-times" aria-hidden="true" style={fieldProps.faTimes} onClick={this.closeModal} />
									</div>

									<div style={fieldProps.disputeIdParentDiv}>
										{disputeErrorMsgInfo}
										{disputeWarningInfo}
										{disputeSuccessInfoMsg}
										<br />
										<Row style={Object.assign({}, fieldProps.disputeIdChildDiv, { backgroundColor: 'rgb(250, 250, 250)', borderColor: 'rgba(242, 242, 242, 1)' })}>
											<span style={fieldProps.disputeIdLabel}>Dispute ID:&nbsp;</span><span> {this.props.store.generatedDisputeId} </span>
										</Row>
										<br/>
									</div>

									<div>
										<Row>
											<Col style={fieldProps.colLeft} md={7}>
												<Col md={3}>
													Transaction ID:
												</Col>
												<Col style={{paddingLeft:'0px'}} md={9}>
													<FormControl disabled={this.state.tnxIdInputDisabled} inputRef={(ref) => { this.transactionId = ref }} type="text" onChange={this.onTnxIdChange.bind(this)} placeholder="Enter transaction ID" defaultValue={disputeTransaction == null ? '' : disputeTransaction.id} />
												</Col>
											</Col>

											<Col md={5}>
												<Col md={5}>
													Transaction Date:
												</Col>
												<Col style={{marginLeft: '-28px'}} md={7}>
                                                    {disputeTransactionDate}
												</Col>
											</Col>
										</Row><br/>

										<Row>
											<Col style={fieldProps.colLeft} md={7}>
												<Col md={3}>
													Events:
												</Col>
												<Col style={{paddingLeft:'0px'}} md={9}>
													<div className="eventsVal" contentEditable="true" suppressContentEditableWarning={true} style={fieldProps.eventsParticipantsValDiv}>
                                                        {evntsUI}
													</div>
												</Col>
											</Col>

											<Col md={5}>
												<Col md={5}>
													Participants:
												</Col>
												<Col style={{marginLeft: '-28px'}} md={7}>
													<div style={Object.assign({},fieldProps.eventsParticipantsValDiv,{color: 'gray'})} >
														{participantsDom}
													</div>
												</Col>
											</Col>
										</Row><br/>

										<Row>
											<Col style={fieldProps.colLeft} md={7}>
												<Col md={3}>
													Reason Code:
												</Col>
												<Col style={{paddingLeft:'0px'}} md={9}>
													<FormControl ref={select => { this.select = select }} componentClass="select" placeholder="select">
														<option value="select">Please select a reason code</option>
														<option value="HASH_NOT_FOUND">Hash Not Found</option>
														<option value="INPUT_DISPUTED">Incorrect Data Input</option>
														<option value="TRANSACTION_DATE_DISPUTED">Incorrect Transaction Date</option>
														<option value="TRANSACTION_PARTIES_DISPUTED">Incorrect Transaction Participants</option>
														<option value="DISPUTE_BUSINESS_TRANSACTIONS">Incorrect Transaction Events</option>
														<option value="FINANCIAL_DISPUTED">Financial Issue</option>
													</FormControl>
												</Col>
											</Col>

											<Col md={5}>
												<Col md={5}>
													Raised By:
												</Col>
												<Col style={{marginLeft: '-28px'}} md={7}>
													{this.props.store.disputeTransaction ? this.props.store.entNameOfLoggedUser : null}
												</Col>
											</Col>
										</Row><br/>
									</div>

									<div style={fieldProps.modalBodyBottom}>
										<div style={fieldProps.modalBodyBottomChildDiv}> 
											<Button style = {fieldProps.cancelButton} onClick={this.closeModal}>Discard</Button>&nbsp;&nbsp;
											<Button className="btn btn-primary" disabled={this.state.saveOrSubmitDisputeButtonsDisabled} onClick={this.saveAsDraft.bind(this)} style={Object.assign({},fieldProps.button, {width: '120px'})}>Save as Draft</Button>&nbsp;&nbsp;
											<Button className="btn btn-primary" disabled={this.state.saveOrSubmitDisputeButtonsDisabled} onClick={this.submitDispute.bind(this)} style={Object.assign({},fieldProps.button, {width: '174px'})}>Submit to Backchain</Button>
										</div>
									</div>
											
								</div>
							</div>
						</div>
					</div>
				</div>
			
			</div>
		)
    }
}