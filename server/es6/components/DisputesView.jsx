import React from 'react';
import ReactDOM from 'react-dom';
import { Row, Button, Panel, Checkbox, Table, Col, OverlayTrigger, Overlay, Popover, Modal } from 'react-bootstrap';
import { toJS } from 'mobx';
import EventsPopoverContent from './EventsPopoverContent';
import BackChainActions from '../BackChainActions';
import { observer } from 'mobx-react';
import { Redirect, Link } from 'react-router-dom';
import { Scrollbars } from 'react-custom-scrollbars';
import Images from '../Images';
import AlertPopupView from './AlertPopupView';
import {disputeHelper} from '../DisputeHelper';
import { utils } from '../Utils';

import '../../public/css/TrackAndVerify.css';

const rowLineHeight = '26px';
const fieldProps = {
    table: {
        border: '1px solid lightgrey'
    },
    tableHeader: {
        color: '#0085C8',
        backgroundColor: 'rgba(250, 250, 250, 1)',
        borderTop: 'solid 2px'
    },
    columns: {
        padding: '10px',
        paddingTop :'13px',
        fontSize: '12px',
        lineHeight: rowLineHeight,
        height: rowLineHeight
    },
    statusIconOverHand: {
        fontSize: '14px',
        position: 'absolute',
        marginTop: '9px',
        marginLeft: '-7px'
    },
    icons: {
        verifying: {
            marginRight: '15px',
            fontSize: '15px',
            color: '#0486CC',
            lineHeight: rowLineHeight
        },
        failed: {
            marginRight: '15px',
            fontSize: '15px',
            color: '#d9443f',
            lineHeight: rowLineHeight
        },
        verified: {
            marginRight: '15px',
            fontSize: '15px',
            color: '#229978',
            lineHeight: rowLineHeight
        },
        downArrow: {
            position: 'absolute',
            marginLeft: '3px'
        }
    },
    noDisputesFoundRow : {
        backgroundColor: 'rgba(248, 241, 201, 1)',
        height: '54px'
    }
};

const reasonCodeMap = {
    "HASH_NOT_FOUND" : "Hash Not Found",
    "INPUT_DISPUTED" : "Incorrect Data Input",
    "TRANSACTION_DATE_DISPUTED" : "Incorrect Transaction Date",
    "TRANSACTION_PARTIES_DISPUTED" : "Incorrect Transaction Participants",
    "DISPUTE_BUSINESS_TRANSACTIONS" : "Incorrect Transaction Events",
    "FINANCIAL_DISPUTED" : "Financial Issue"
};

@observer export default class DisputesView extends React.Component {

    constructor(...args) {
        super(...args);

        this.eventsPopoverRefsMap = {};
        this.actionsPopoverRefsMap = {};
        this.disputeParticipantsPopoverRefsMap = {};
        this.state = {
            redirect: false,
            eventsPopoverVisibilityMap: {},
            actionsPopoverVisibilityMap: {},
            disputeParticipantsPopoverVisibilityMap: {}
        };
    }

    componentDidMount() {
        BackChainActions.processApplicationSettings();
    }

    loadTransactionIntoStoreAndRedirect(disputedTransactionId) {
        let me = this;
        BackChainActions.loadTransactions(disputedTransactionId, "tnxId", function (redirect) {
            if (redirect) {
                me.setState({ redirect: redirect });
            }
        });
    }

    closeDispute(dispute) {
        BackChainActions.closeDispute(dispute);
    }

    discardDraftDispute(dispute) {
        BackChainActions.discardDisputeDraft(dispute.disputeId, true);
    }

    submitDispute(dispute) {
        disputeHelper.isSubmitDisputeWindowStillOpen(dispute.transaction, this.props.store.disputeSubmissionWindowInMinutes).visible ?
            BackChainActions.submitDispute(dispute) 
                : 
            BackChainActions.displayAlertPopup("Dispute Submission Failed", 
            "Allowed dispute submission time for this transaction is elapsed. After creation of transaction, Maximum allowed time to submit dispute is " + this.props.store.disputeSubmissionWindowInMinutes + " Mins.", "ERROR");
    }

    render() {
        const disputes = toJS(this.props.store.disputes);

        let tableHead = (
            <thead style={fieldProps.tableHeader}>
                <tr>
                    <th style={fieldProps.columns}>Dispute Status</th>
                    <th style={fieldProps.columns}>Dispute ID</th>
                    <th style={fieldProps.columns}>Date Submitted</th>
                    <th style={fieldProps.columns}>Date Closed</th>
                    <th style={fieldProps.columns}>Transaction ID</th>
                    <th style={fieldProps.columns}>Transaction Date</th>
                    <th style={Object.assign({}, fieldProps.columns, { width: '6%' })}>Events</th>
                    <th style={fieldProps.columns}>Raised By</th>
                    <th style={fieldProps.columns}>Reason Code</th>
                    <th style={Object.assign({}, fieldProps.columns, { width: '6%' })}>Participants</th>
                    {this.props.store.showDisputeActions === false ? null : <th style={fieldProps.columns}>Actions</th>}
                </tr>
            </thead>
        );

        let tableBody = (
            <tbody>
                {this.renderDisputeRows(disputes)}
            </tbody>
        );

        if (this.state.redirect) {
            return <Redirect push to="/listTransactions" />;
        } else {
            return (
                <div>
                    <Table responsive condensed hover style={fieldProps.table}>
                        <AlertPopupView store={this.props.store} />    
                        {tableHead}
                        {tableBody}
                    </Table>
                </div>
            );
        }
       
    }

    renderDisputeRows(disputes) {
        let disputesRowsToDisplay = [];
        if (this.props.store.loadingData) {
            disputesRowsToDisplay.push(this.renderLoadingRow());
        } else if (disputes.length == 0) {            
            disputesRowsToDisplay.push(this.renderNoDisputesFoundRow());   
        } else {
            for (let i = 0; i < disputes.length; i++) {
                let dispute = disputes[i];
                if (!dispute) {
                    continue;
                }
                disputesRowsToDisplay.push(this.renderDisputeRow(dispute, i));
            }
        }
        return disputesRowsToDisplay;
    }

    renderLoadingRow() {
        return (
            <tr key={"no_disputes"} style={fieldProps.noDisputesFoundRow}>
                <td colSpan='11' style={{ textAlign: 'center', paddingTop: '16px' }}>
                    <i className="fa fa-refresh fa-spin" aria-hidden="true"></i>
                </td>
            </tr>
        );
    }

    renderNoDisputesFoundRow() {
        return (
            <tr key={"no_disputes"} style={fieldProps.noDisputesFoundRow}>
                <td colSpan ='11' style={{ textAlign: 'center', paddingTop: '16px' }}>
                    <i className="fa fa-exclamation-circle" style={{color: '#F19500',fontSize: '20px',verticalAlign: 'top'}}/>
                    &nbsp;There are no disputes matching the selected search criteria.
                </td>
            </tr>    
        );
    }

    renderDisputeRow(dispute, idx) {
        return (
            <tr style={{ backgroundColor: idx % 2 ? 'rgba(250, 250, 250, 1)' : '' }} key={dispute.disputeId+idx}>
                {this.renderDisputeStatusCell(dispute)}
                {this.renderDisputeIdCell(dispute, idx)}
                {this.renderDateCell(dispute.submittedDate)}
                {this.renderDateCell(dispute.closedDate)}
                {this.renderTransactionIdCell(dispute, idx)}
                {this.renderDateCell(dispute.transaction ? dispute.transaction.date : null)}
                {this.renderDisputeEventsCell(dispute, idx)}
                {this.renderDisputeRaisedByCell(dispute, idx)}
                {this.renderDisputeReasonCell(dispute)}
                {this.renderDisputeParticipantsCell(dispute, idx)}
                {this.props.store.showDisputeActions === false ? null : this.renderDisputeActionsCell(dispute, idx)}
            </tr>
        );
    }
    
    getMinsInHrsAndMins(mins) {
        let hours = Math.floor( mins / 60); 
        let minutes = mins % 60;
        let hrsAndMins = hours == 0 ? "" : hours + "hrs ";
        hrsAndMins += minutes + "mins";
        return hrsAndMins;
    }

    renderDisputeStatusCell(dispute) {
        let statusIconOverHand = null;
        switch(dispute.state) {
            case "DRAFT":
                statusIconOverHand = <i className="fa fa-pencil-square" style={Object.assign({color:'#0085C8'},fieldProps.statusIconOverHand)} />;
                break;
            case "CLOSED":
                statusIconOverHand = <i className="fa fa-check-circle" style={Object.assign({color:'#229978'},fieldProps.statusIconOverHand)} />;
                break;
            case "OPEN":
                statusIconOverHand = <i className="fa fa-exclamation-circle" style={Object.assign({color:'#F19500'},fieldProps.statusIconOverHand)} />;
        }

        let disputeStatusTime = null;

        if (dispute.transaction && dispute.state =='DRAFT') {
			let result = disputeHelper.isSubmitDisputeWindowStillOpen(dispute.transaction, this.props.store.disputeSubmissionWindowInMinutes);
            if(result.visible) {
                disputeStatusTime =  (<div style={{fontSize: '10px', color: '#999999', lineHeight: '10px'}}> 
                                        {this.getMinsInHrsAndMins(this.props.store.disputeSubmissionWindowInMinutes-result.tnxDurationInMinutes)}
                                      </div>);
            } else {
                disputeStatusTime = (<div style={{ fontSize: '10px', color: '#999999', lineHeight: '10px' }}>
                   Expired
                </div>);
            }
        }
        
        let disputeStatusIcon = (<div>
                                    <span title={dispute.state} className="fa-stack fa-lg">
                                        <i className="fa fa-hand-paper-o" style={{fontSize: '18px', color: 'gray'}}>
                                            {statusIconOverHand}
                                        </i>
                                    </span>
                                    {disputeStatusTime}
                                </div>);

        return <td style={Object.assign({ width: '90px' }, fieldProps.columns)}>{disputeStatusIcon}</td>;
    }

    renderDisputeIdCell(dispute, idx) {
        const disputeId = dispute.disputeId;
        return (
            <td style={Object.assign({ maxWidth: '130px' }, fieldProps.columns)}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <OverlayTrigger
                        trigger={['hover', 'focus']}
                        placement="top"
                        overlay={<Popover id={disputeId + idx} className="dispute-id-popover">{disputeId}</Popover>}>
                        <span>{disputeId}</span>
                    </OverlayTrigger>
                </div>
            </td>
        );
    }

    renderTransactionIdCell(dispute, idx) {
        const disputedTransactionId = dispute.disputedTransactionId;
        const coreIdComp = <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <OverlayTrigger
                trigger={['hover', 'focus']}
                placement="top"
                overlay={<Popover id={disputedTransactionId + idx} className="transaction-id-popover">{disputedTransactionId}</Popover>}>
                <span>{disputedTransactionId}</span>
            </OverlayTrigger>
        </div>;


        let linkStart = '';
        let linkEnd = '';
        if (dispute.transaction && !this.props.store.showOnlyVerifyView) {
            return (
                <td style={Object.assign({ maxWidth: '130px' }, fieldProps.columns)}>
                    <Link to='#' onClick={this.loadTransactionIntoStoreAndRedirect.bind(this, dispute.disputedTransactionId)}>
                        {coreIdComp}
                    </Link>
                </td>
            );
        } else {
            return (
                <td style={Object.assign({ maxWidth: '130px' }, fieldProps.columns)}>
                    {coreIdComp}
                </td>
            );
        }
    }

    renderDateCell(dateInMillis) {
        const formattedDate = dateInMillis ? utils.formatDate(dateInMillis) : '';
        return <td style={fieldProps.columns}>{formattedDate}</td>;
    }

    renderDisputeEventsCell(dispute, idx) {
        let eventCountString , eventsPopoverContent, eventsPopoverClassName, eventBadge;
        eventCountString = eventsPopoverContent = eventsPopoverClassName = eventBadge = null;

        if(dispute.transaction) {
            eventsPopoverClassName = 'events-popover';
            eventBadge = Images.EVENT_BADGE;
            eventCountString = (<div className={this.getEventCountCSS(dispute.disputedBusinessTransactionIds.length == 0 ? dispute.transaction.eventCount : dispute.disputedBusinessTransactionIds.length)}>
                                    {this.getEventCountString(dispute.disputedBusinessTransactionIds.length == 0 ? dispute.transaction.eventCount : dispute.disputedBusinessTransactionIds.length)}
                                </div>);
            eventsPopoverContent = <EventsPopoverContent store={this.props.store} transaction={dispute.transaction} selectedBtIds={dispute.disputedBusinessTransactionIds} />;
            
        } else {
            eventsPopoverClassName = null;
            eventBadge = Images.EVENT_BADGE_ORANGE;
            eventsPopoverContent = <div className="largePopoverContent">Transaction&nbsp;<span style={{fontWeight: 600}}>{dispute.disputedTransactionId}</span>&nbsp;couldn’t be found in the database. This is most likely due to data is out of sync. Please go to Sync Statistics page and fill in the gaps.</div>;
            eventCountString =  (<div className="counter1">
                                    <i className="fa fa-exclamation" aria-hidden="true"/>
                                </div>);
        }

        return (
            <td style={Object.assign({}, fieldProps.columns, {cursor:'pointer'})}>
                <div className="counter-ct" onClick={() => this.showEventsPopover(idx, true)}>
                    <img
                        className="counter-img"
                        src={eventBadge}
                        ref={ref => this.eventsPopoverRefsMap[idx] = ref} />
                        {eventCountString}
                    <Overlay
                        show={this.state.eventsPopoverVisibilityMap[idx] || false}
                        onHide={() => this.showEventsPopover(idx, false)}
                        rootClose={true}
                        placement="right"
                        container={document.getElementById("root")}
                        target={() => this.eventsPopoverRefsMap[idx]}>

                        <Popover id={"events-popover-" + idx} className={eventsPopoverClassName} title={(
                            <span>
                                <img style={{width: '18px',height:'18px', marginRight: '8px'}} src={Images.EVENT}/>
                                Events:
                            </span>
                        )}>
                            {eventsPopoverContent}
                        </Popover>
                            
                    </Overlay>
                </div>
            </td>
        );
    }


    renderDisputeRaisedByCell(dispute, idx) {
        let raisedByName = "";
        if (dispute.state == "DRAFT")
            raisedByName = this.props.store.entNameOfLoggedUser;
        else
            raisedByName = disputeHelper.getRaisedByEnterpriseName(dispute.disputingParty, this.props.store.backChainAddressMapping);
        
        return (<td style={Object.assign({ maxWidth: '130px' }, fieldProps.columns)}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <OverlayTrigger
                    trigger={['hover', 'focus']}
                    placement="top"
                    overlay={<Popover id={dispute.disputeId + idx} className="dispute-id-popover">{raisedByName}</Popover>}>
                    <span>{raisedByName}</span>
                </OverlayTrigger>
            </div>
        </td>)
    }


    renderDisputeReasonCell(dispute) {
        return <td style={fieldProps.columns}>{reasonCodeMap[dispute.reason]}</td>;
    }

    renderDisputeParticipantsCell(dispute, idx) {
        let partnerLengthOrExclamation, participantsContent, disputeParticipantBadge;
        partnerLengthOrExclamation = participantsContent = disputeParticipantBadge = null;

        if(dispute.transaction) {
            disputeParticipantBadge = Images.DISPUTE_PARTICIPANT_BADGE;
            participantsContent=(<ul style={{listStyleType: 'none', marginLeft: '-30px', width: '175px', lineHeight: '18px',paddingTop:'7px'}}>
                                    {this.partnerNameInList(dispute)}
                                </ul> );
            partnerLengthOrExclamation= (<div style={{position: 'absolute', left: '33px', top: '6px', color: 'white', fontSize: '10px'}}>
                                            {this.getPartnerNames(dispute).length}
                                        </div>);
        } else {
            disputeParticipantBadge = Images.DISPUTE_PARTICIPANT_BADGE_ORANGE;
            participantsContent = <div className="largePopoverContent">Transaction&nbsp;<span style={{fontWeight: 600}}>{dispute.disputedTransactionId}</span>&nbsp;couldn’t be found in the database. This is most likely due to data is out of sync. Please go to Sync Statistics page and fill in the gaps.</div>;
            partnerLengthOrExclamation= (<div style={{position: 'absolute', left: '35px', top: '6px', color: 'white', fontSize: '10px'}}>
                                            <i className="fa fa-exclamation" aria-hidden="true"/>
                                        </div>);
        }

        let disputeParticipantCell = (
            <div className="counter-participants" onClick={() => this.showDisputeParticipantsPopover(idx, true)}>
                <img
                    style={{width: '25px',height: '25px'}}
                    src={disputeParticipantBadge}
                    ref={ref => this.disputeParticipantsPopoverRefsMap[idx] = ref} />
                    {partnerLengthOrExclamation}

                <Overlay
                    show={this.state.disputeParticipantsPopoverVisibilityMap[idx] || false}
                    onHide={() => this.showDisputeParticipantsPopover(idx, false)}
                    rootClose={true}
                    placement="right"
                    container={document.getElementById("root")}
                    target={() => this.disputeParticipantsPopoverRefsMap[idx]}>

                    <Popover id={dispute.disputeId+ idx + "_disputeParticipants"} title={(
                            <span style={{fontWeight: '700',fontSize: '12px',color: '#0085C8'}}>
                                <i className="fa fa-user" aria-hidden="true" style={{ fontSize: '18px'}}></i>
                                &nbsp;&nbsp;&nbsp;&nbsp;Participants
                            </span>
                        )}>
                        <div id={dispute.disputeId + "_disputeParticipants" + idx} >
                              {participantsContent}
                        </div>
                    </Popover>
                </Overlay>
            </div>
        );
        return <td style={Object.assign({}, fieldProps.columns, {cursor:'pointer'})}>{disputeParticipantCell}</td>;
    }

    renderDisputeActionsCell(dispute,idx) {
        let popOver = "";
        if (dispute.state == "CLOSED") { 
            return <td style={fieldProps.columns}></td>;
        } else if (dispute.state == "DRAFT") {
            let submitDisputeUI = null;
            if(dispute.transaction) {
                if(disputeHelper.isSubmitDisputeWindowStillOpen(dispute.transaction, this.props.store.disputeSubmissionWindowInMinutes).visible) {
                    submitDisputeUI =  (<Link to='#' onClick={this.submitDispute.bind(this, dispute)}>
                                            <div id={dispute.disputeId + "_submit" + idx} >    
                                                <div className="dispute-transation-div" style= {{width:'128px'}} >
                                                        <i className="fa fa-hand-paper-o" style={{ fontSize: '15px' }}></i>&nbsp; Submit Dispute
                                                </div>
                                            </div>    
                                        </Link>);
                }
            }
            popOver = (<Popover id={dispute.disputeId + idx} className="dispute-action-popover" >
                {submitDisputeUI}
                <Link to='#' onClick={this.discardDraftDispute.bind(this, dispute)}>
                    <div id={dispute.disputeId + "_discard" + idx} >
                        <div style={{}} className="dispute-transation-div" style={{ width: '128px' }} >
                            <i className="fa fa-times" style={{ fontSize: '15px' }}></i>&nbsp; Discard Draft
                                    </div>
                    </div>
                </Link>
            </Popover>);
            let actionsCell = (
                <OverlayTrigger trigger="focus" placement="right" overlay={popOver}>
                    <div className="counter-ct" style={{ paddingLeft: '10px' }} >
                        <a href="#"> <i className="fa fa-cog" aria-hidden="true" style={{ fontSize: '20px', color: '#0085C8', cursor: 'pointer' }}></i></a>
                    </div>
                </OverlayTrigger>
            );
            return <td style={fieldProps.columns}>{actionsCell}</td>;
        } else if (dispute.state == "OPEN") {
            let actionsCell = "";
            if (disputeHelper.getRaisedByEnterpriseName(dispute.disputingParty, this.props.store.backChainAddressMapping) == this.props.store.entNameOfLoggedUser) {
                popOver = (<Popover id={dispute.disputeId + idx} className="dispute-action-popover" >
                    <Link to='#' onClick={this.closeDispute.bind(this, dispute)}>
                        <div id={dispute.disputeId + "_close" + idx} >
                            <div className="dispute-transation-div" style={{ width: '128px' }}>
                                <i className="fa fa-check-circle" style={{ fontSize: '15px' }}></i>&nbsp; Close Dispute
                            </div>
                        </div>
                    </Link>
                </Popover>
                );
                actionsCell = (
                    <OverlayTrigger trigger="focus" placement="right" overlay={popOver}>
                        <div className="counter-ct" style={{ paddingLeft: '10px' }} >
                            <a href="#"> <i className="fa fa-cog" aria-hidden="true" style={{ fontSize: '20px', color: '#0085C8', cursor: 'pointer' }}></i></a>
                        </div>
                    </OverlayTrigger>
                );
            }
            return <td style={fieldProps.columns}>{actionsCell}</td>;
        }
    }

    getEventCountCSS(eventCount) {
        switch (this.getEventCountString(eventCount).length) {
            case 1:
                return "counter1";
            case 2:
                return "counter2";
        }

        return "counter3";
    }

    getEventCountString(eventCount) {
        if (eventCount >= 1000) {
            return Math.floor(eventCount / 1000) + "k";
        }
        return eventCount.toString();
    }

    showEventsPopover(idx, show) {
        let newMap = Object.assign({}, this.state.eventsPopoverVisibilityMap);
        newMap[idx] = show;
        this.setState({ eventsPopoverVisibilityMap: newMap });
    }

    showActionPopover(idx, show) {
        let newMap = Object.assign({}, this.state.actionsPopoverVisibilityMap);
        newMap[idx] = show;
        this.setState({ actionsPopoverVisibilityMap: newMap });
    }

    showDisputeParticipantsPopover(idx, show) {
        let newMap = Object.assign({}, this.state.disputeParticipantsPopoverVisibilityMap);
        newMap[idx] = show;
        this.setState({ disputeParticipantsPopoverVisibilityMap: newMap });
    }

    getPartnerNames(dispute) {
        let partnerNames = [];
        if (dispute.transaction) {
            let listOfPartners = [];
            for (let i = 0; i < dispute.transaction.transactionSlices.length; i++) {
                let transactionSlice = dispute.transaction.transactionSlices[i];
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
            partnerNames = listOfPartners;
        }
        return partnerNames;
    }

    partnerNameInList(dispute) {
        let partnerNames = this.getPartnerNames(dispute);
        let partnerList = [];
        for (let i = 0; i < partnerNames.length; i++) { 
            partnerList.push(
                <li key={i} >{partnerNames[i]}</li>
                )
        }
        return partnerList;
    }
}