import React from 'react';
import {Row, Col, Button, FormControl, FormGroup, Checkbox} from 'react-bootstrap';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import BackChainActions from '../BackChainActions';
import moment from 'moment';

@observer export default class NewDisputeView extends React.Component {

	constructor(props) {
        super(props);
        this.setModalBodyRef = this.setModalBodyRef.bind(this);           
        this.handleClick = this.handleClick.bind(this);
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

	handleClick(event) {
		/* Checking If clicked outside of modal body */
    	if (this.modalBodyRef && !this.modalBodyRef.contains(event.target)) {
			BackChainActions.toggleNewDisputeModalView();
			BackChainActions.clearDisputeTransaction();
        }
	}

	closeModal() {
		BackChainActions.toggleNewDisputeModalView();
		BackChainActions.clearDisputeTransaction();
	}
	
	getNewDisputeData() {
		// Todo @pankaj check if required fields by user entered or not (like Transaction ID)
		let disputeTransaction = this.props.store.disputeTransaction;
		let btIds = [];
		for(let i = 0; i < disputeTransaction.transactionSlices.length; i++) {
			let transactionSlice = disputeTransaction.transactionSlices[i];
			if(transactionSlice.type === "Intersection") {
				for(let j = 0; j < transactionSlice.businessTransactionIds.length; j++) {
					btIds.push(transactionSlice.businessTransactionIds[j]);
				}
			}
		}

		let dispute = {
			"id": 1234567, //Todo @pankaj generate random number
			"creationDate": moment().valueOf(),
			"submittedDate" : null,
			"closedDate": null,
			"transactionId": disputeTransaction.id,
			"events" : btIds,
			"raisedBy": "0x69bc764651de75758c489372c694a39aa890f911ba5379caadc08f44f8173051",
			"reasonCode": ReactDOM.findDOMNode(this.select).value,
			"status": "Draft"
		}

		return dispute;
	}

	saveAsDraft() {
		BackChainActions.saveDisputeAsDraft(this.getNewDisputeData())
		.then(function(response) {
			if(response.success) {
				if(response.status) {
					console.log("existes disbute");
					return;
				}
				BackChainActions.toggleNewDisputeModalView();
				BackChainActions.clearDisputeTransaction();
			}
		}, function(error) {
			console.error(error);
		});
	}

	submitToBackchain() {
		// this.getNewDisputeData()
		// Todo write code to submit dispute to back chain
	}

    render() {
		const {store} = this.props;
		let participantsUI = [];
		let transactionSlices = [];
		let disputeTransactionDate  = 'N/A';
		let disputeTransaction = store.disputeTransaction;

        if(disputeTransaction !== null) {
            transactionSlices = disputeTransaction.transactionSlices;
            BackChainActions.loadEventsForTransaction(disputeTransaction);
            disputeTransactionDate = moment(new Date(disputeTransaction.date)).format('MMM DD, YYYY HH:mm A')
        }

        for(let i = 0; i < transactionSlices.length; i++) {
            let transactionSlice = transactionSlices[i];
            if(transactionSlice.type == "Intersection") {
                participantsUI.push(<span key={transactionSlice.enterprises[0]}>{transactionSlice.enterprises[0]}</span>);
                participantsUI.push(<br key={transactionSlice.enterprises[0]+'br'}/>)
                participantsUI.push(<span key={transactionSlice.enterprises[1]}>{transactionSlice.enterprises[1]}</span>);
                participantsUI.push(<br key={transactionSlice.enterprises[1]+'br'}/>)
            }
        }
        
        let evntsUI = [];
        for(let i = 0; i < store.events.length; i++) {
            let event = store.events[i];
            evntsUI.push(<Checkbox key={event}> {moment(new Date(event.date)).format('MMM DD, YYYY HH:mm A')} &nbsp;&nbsp; {event.actionName}</Checkbox>);
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
				backgroundColor: 'rgb(250, 250, 250)', height: '36px', width: '885px',
				padding: '6px',
				borderRadius: '3px',
				boxSizing: 'border-box',
				borderWidth: '1px',
				borderStyle: 'solid',
				borderColor: 'rgba(242, 242, 242, 1)',
				paddingLeft: '20px'
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
			}
		};

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
										<Row style={fieldProps.disputeIdChildDiv}>
											<span style={fieldProps.disputeIdLabel}>Dispute ID:&nbsp;</span>a420987490553228734636691
										</Row><br/>
									</div>

									<div>
										<Row>
											<Col style={fieldProps.colLeft} md={7}>
												<Col md={3}>
													Transaction ID:
												</Col>
												<Col style={{paddingLeft:'0px'}} md={9}>
													<FormControl type="text" placeholder="Enter transaction ID" defaultValue={disputeTransaction == null ? '' : disputeTransaction.id} />
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
														{participantsUI}
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
														<option value="select">select</option>
														<option value="wrongData">Data is wrong</option>
														<option value="sentToWrongLocation">Sent to wrong location</option>
														<option value="enteredWrongData">Entered wrong data</option>
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
											<Button className="btn btn-primary" onClick={this.saveAsDraft.bind(this)} style={Object.assign({},fieldProps.button, {width: '120px'})}>Save as Draft</Button>&nbsp;&nbsp;
											<Button className="btn btn-primary" onClick={this.submitToBackchain.bind(this)} style={Object.assign({},fieldProps.button, {width: '174px'})}>Submit to Backchain</Button>
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