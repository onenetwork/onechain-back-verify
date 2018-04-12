import React from 'react';
import ReactDOM from 'react-dom';
import { Row, Button, Panel, Checkbox, Table, Col, OverlayTrigger, Overlay, Popover, Modal } from 'react-bootstrap';
import { toJS } from 'mobx';
import EventsPopoverContent from './EventsPopoverContent';
import BackChainActions from '../BackChainActions';
import { observer } from 'mobx-react';
import { Redirect, Link } from 'react-router-dom';
import { Scrollbars } from 'react-custom-scrollbars';
import moment from 'moment';
import Images from '../Images';

import '../../public/css/TrackAndVerify.css'; // TODO: move to index.html and copy to PLT CoC

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
    }
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

    loadTransactionIntoStoreAndRedirect(transactionId) {
        let me = this;
        BackChainActions.loadTransactions(transactionId, "tnxId", function (redirect) {
            if (redirect) {
                me.setState({ redirect: redirect });
            }
        });
    }

    closeDispute(dispute) {
        BackChainActions.closeDispute(dispute.id);
    }

    discardDraftDispute(dispute) {
        BackChainActions.discardDisputeDraft(dispute.id);
    }

    submitDispute(dispute) {
        BackChainActions.submitDispute(dispute)
        .then(function(result){
            if(result.success && result.submitDisputeMsg) {
                alert(result.submitDisputeMsg);
            }
        })
        .catch(function (err) {
            console.error(err);
        });
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
                    <th style={fieldProps.columns}>Actions</th>
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
                        {tableHead}
                        {tableBody}
                    </Table>
                </div>
            );
        }
    }

    renderDisputeRows(disputes) {
        let disputesRowsToDisplay = [];
        for (let i = 0; i < disputes.length; i++) {
            let dispute = disputes[i];
            if (!dispute) {
                continue;
            }

            disputesRowsToDisplay.push(this.renderDisputeRow(dispute, i));
        }

        return disputesRowsToDisplay;
    }

    renderDisputeRow(dispute, idx) {
        return (
            <tr style={{ backgroundColor: idx % 2 ? 'rgba(250, 250, 250, 1)' : '' }} key={dispute.id}>
                {this.renderDisputeStatusCell(dispute)}
                {this.renderDisputeIdCell(dispute)}
                {this.renderDateCell(dispute.submittedDate)}
                {this.renderDateCell(dispute.closedDate)}
                {this.renderTransactionIdCell(dispute)}
                {this.renderDateCell(dispute.transaction ? dispute.transaction.date : null)}
                {this.renderDisputeEventsCell(dispute, idx)}
                {this.renderDisputeRaisedByCell(dispute)}
                {this.renderDisputeReasonCell(dispute)}
                {this.renderDisputeParticipantsCell(dispute, idx)}
                {this.renderDisputeActionsCell(dispute, idx)}
            </tr>
        );
    }
    
    getMinsInHrsAndMins(mins) {
        let hours = Math.floor( mins / 60); 
        let minutes = mins % 60;
        return hours + "hrs " + minutes + "mins";
    }

    renderDisputeStatusCell(dispute) {
        let statusIconOverHand = null;
        switch(dispute.status) {
            case "Draft":
                statusIconOverHand = <i className="fa fa-pencil-square" style={Object.assign({color:'#0085C8'},fieldProps.statusIconOverHand)} />;
                break;
            case "Closed":
                statusIconOverHand = <i className="fa fa-check-circle" style={Object.assign({color:'#229978'},fieldProps.statusIconOverHand)} />;
                break;
            case "Open":
                statusIconOverHand = <i className="fa fa-exclamation-circle" style={Object.assign({color:'#F19500'},fieldProps.statusIconOverHand)} />;
        }

        let duration = moment.duration(moment(new Date()).diff(moment(new Date(dispute.transaction.date))));
        let mins = Math.ceil(duration.asMinutes());
        let disputeStatusTime = null;
        if(mins < this.props.store.disputeSubmissionWindowInMinutes) {
            disputeStatusTime =  (<span style={{fontSize: '10px', color: '#999999', display: 'inline-block', lineHeight: '10px'}}> 
                                    {this.getMinsInHrsAndMins(this.props.store.disputeSubmissionWindowInMinutes-mins)}
                                </span>);
        }
        let disputeStatusIcon = (<div>
                                    <span title={dispute.status} className="fa-stack fa-lg">
                                        <i className="fa fa-hand-paper-o" style={{fontSize: '18px', color: 'gray'}}>
                                            {statusIconOverHand}
                                        </i>
                                    </span>
                                    {disputeStatusTime}
                                </div>);

        return <td style={Object.assign({ width: '90px' }, fieldProps.columns)}>{disputeStatusIcon}</td>;
    }

    renderDisputeIdCell(dispute) {
        const disputeId = dispute.id;
        return (
            <td style={Object.assign({ maxWidth: '130px' }, fieldProps.columns)}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <OverlayTrigger
                        trigger={['hover', 'focus']}
                        placement="top"
                        overlay={<Popover id={disputeId} className="dispute-id-popover">{disputeId}</Popover>}>
                        <span>{disputeId}</span>
                    </OverlayTrigger>
                </div>
            </td>
        );
    }

    renderTransactionIdCell(dispute) {
        const transactionId = dispute.transactionId;
        const coreIdComp = <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <OverlayTrigger
                trigger={['hover', 'focus']}
                placement="top"
                overlay={<Popover id={transactionId} className="transaction-id-popover">{transactionId}</Popover>}>
                <span>{transactionId}</span>
            </OverlayTrigger>
        </div>;


        let linkStart = '';
        let linkEnd = '';
        if (dispute.transaction) {
            return (
                <td style={Object.assign({ maxWidth: '130px' }, fieldProps.columns)}>
                    <Link to='#' onClick={this.loadTransactionIntoStoreAndRedirect.bind(this, dispute.transactionId)}>
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
        const formattedDate = dateInMillis ? moment(new Date(dateInMillis)).format('MMM DD, YYYY HH:mm A') : '';
        return <td style={fieldProps.columns}>{formattedDate}</td>;
    }

    renderDisputeEventsCell(dispute, idx) {
        let eventCountString , eventsPopoverContent, eventsPopoverClassName, eventBadge;
        eventCountString = eventsPopoverContent = eventsPopoverClassName = eventBadge = null;

        if(dispute.transaction) {
            eventsPopoverClassName = 'events-popover';
            eventBadge = Images.EVENT_BADGE;
            eventCountString = (<div className={this.getEventCountCSS(dispute.transaction.eventCount)}>
                                    {this.getEventCountString(dispute.transaction.eventCount)}
                                </div>);
            eventsPopoverContent = <EventsPopoverContent store={this.props.store} transaction={dispute.transaction} selectedBtIds={dispute.events} />;
            
        } else {
            eventsPopoverClassName = null;
            eventBadge = Images.EVENT_BADGE_ORANGE;
            eventsPopoverContent = "Transaction " + dispute.transactionId +" couldn’t be found in the database. This is most likely due to data is out of sync. Please go to Sync Statistics page and fill in the gaps.";
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


    renderDisputeRaisedByCell(dispute) {
        // const testMapping = {
        //     "0x69bc764651de75758c489372c694a39aa890f911ba5379caadc08f44f8173051": "CustomerA"
        // }
        // return <td style={fieldProps.columns}>{testMapping[dispute.raisedBy]}</td>;
        //Should get the actual enterprise name from BCAddressToEnterpriseMapping collection
        //If mapping doesn't have the value, we should display a warning message
        return <td style={fieldProps.columns}>{dispute.raisedByName}</td>;
    }


    renderDisputeReasonCell(dispute) {
        return <td style={fieldProps.columns}>{dispute.reasonCode}</td>;
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
            participantsContent = "Transaction " + dispute.transactionId +" couldn’t be found in the database. This is most likely due to data is out of sync. Please go to Sync Statistics page and fill in the gaps.";
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

                    <Popover id={dispute.id + "_disputeParticipants"} title={(
                            <span style={{fontWeight: '700',fontSize: '12px',color: '#0085C8'}}>
                                <i className="fa fa-user" aria-hidden="true" style={{ fontSize: '18px'}}></i>
                                &nbsp;&nbsp;&nbsp;&nbsp;Participants
                            </span>
                        )}>
                        <div id={dispute.id + "_disputeParticipants" + idx} >
                              {participantsContent}
                        </div>
                    </Popover>
                </Overlay>
            </div>
        );
        return <td style={Object.assign({}, fieldProps.columns, {cursor:'pointer'})}>{disputeParticipantCell}</td>;
    }

    renderDisputeActionsCell(dispute,idx) {
        if (dispute.status == 'Draft') {
            let submitDisputeUI = null;
            let duration = moment.duration(moment(new Date()).diff(moment(new Date(dispute.transaction.date))));
            let mins = Math.ceil(duration.asMinutes());
            if(mins < this.props.store.disputeSubmissionWindowInMinutes) {
                submitDisputeUI =  (<Link to='#' onClick={this.submitDispute.bind(this, dispute)}>
                                        <div id={dispute.id + "_submit"} >    
                                            <div className="dispute-transation-div" style= {{width:'128px'}} >
                                                    <i className="fa fa-hand-paper-o" style={{ fontSize: '15px' }}></i>&nbsp; Submit Dispute
                                            </div>
                                        </div>    
                                    </Link>);
            }
            let actionsCell = (
                <div className="counter-ct" onClick={() => this.showActionPopover(idx, true)}>
                    <i className="fa fa-cog" aria-hidden="true" style={{ fontSize: '20px', color: '#0085C8', cursor: 'pointer' }}
                        ref={ref => this.actionsPopoverRefsMap[idx] = ref} ></i>
                    <Overlay
                        show={this.state.actionsPopoverVisibilityMap[idx] || false}
                        onHide={() => this.showActionPopover(idx, false)}
                        rootClose={true}
                        placement="right"
                        container={document.getElementById("root")}
                        target={() => this.actionsPopoverRefsMap[idx]}>

                        <Popover id={dispute.id} className="dispute-action-popover" >
                            {submitDisputeUI}
                            <Link to='#' onClick={this.discardDraftDispute.bind(this, dispute)}>
                                 <div id={dispute.id + "_discard"} >
                                    <div style={{}} className="dispute-transation-div" style={{ width: '128px' }} >
                                        <i className="fa fa-times" style={{ fontSize: '15px' }}></i>&nbsp; Discard Draft
                                    </div>
                               </div>
                             </Link>
                        </Popover>
                    </Overlay>
                </div>
            );
            return <td style={fieldProps.columns}>{actionsCell}</td>;
        } else if (dispute.status == 'Open') {
            let actionsCell = (
                <div className="counter-ct" onClick={() => this.showActionPopover(idx, true)}>
                    <i className="fa fa-cog" aria-hidden="true" style={{ fontSize: '20px', color: '#0085C8', cursor: 'pointer',paddingTop:'4px' }}
                        ref={ref => this.actionsPopoverRefsMap[idx] = ref} ></i>
                    <Overlay
                        show={this.state.actionsPopoverVisibilityMap[idx] || false}
                        onHide={() => this.showActionPopover(idx, false)}
                        rootClose={true}
                        placement="right"
                        container={document.getElementById("root")}
                        target={() => this.actionsPopoverRefsMap[idx]}>

                        <Popover id={dispute.id} className="dispute-action-popover" >
                            <Link to='#' onClick={this.closeDispute.bind(this, dispute)}>
                                <div id={dispute.id + "_close"} >
                                    <div className="dispute-transation-div" style={{ width: '128px' }}>
                                        <i className="fa fa-check-circle" style={{ fontSize: '15px' }}></i>&nbsp; Close Dispute
                                    </div>
                                </div>
                            </Link>
                        </Popover>
                    </Overlay>
                </div>
            );
            return <td style={fieldProps.columns}>{actionsCell}</td>;
        }
        return <td style={fieldProps.columns}></td>;
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