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
        this.state = {
            redirect: false,
            eventsPopoverVisibilityMap: {}
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
        BackChainActions.submitDispute(dispute);
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
                {this.renderDisputeActionsCell(dispute)}
            </tr>
        );
    }

    renderDisputeStatusCell(dispute) {
        return <td style={fieldProps.columns}>{dispute.status}</td>; //Convert it to be an icon
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
        /**
         * TODO:Yusuf Missing Tasks
         * 1. iff dispute.events has a subset of btIds, only fetch the events from the transaction with a corresponding btIds. 
         * 2. iff the transaction doesn't exist in the db, show a warning when user clicks on the popover. It should say
         * "It looks like you aren't fully synchronized and the transaction is missing. You can try to initiate sync to display full 
         * transaction data."
         */
        if(dispute.transaction) {
            return (
                <td style={Object.assign({}, fieldProps.columns, {cursor:'pointer'})}>
                    <div className="counter-ct" onClick={() => this.showEventsPopover(idx, true)}>
                        <img
                            className="counter-img"
                            src={Images.EVENT_BADGE}
                            ref={ref => this.eventsPopoverRefsMap[idx] = ref} />
                        <div className={this.getEventCountCSS(dispute.transaction.eventCount)}>
                            {this.getEventCountString(dispute.transaction.eventCount)}
                        </div>
                        
                        <Overlay
                            show={this.state.eventsPopoverVisibilityMap[idx] || false}
                            onHide={() => this.showEventsPopover(idx, false)}
                            rootClose={true}
                            placement="right"
                            container={document.getElementById("root")}
                            target={() => this.eventsPopoverRefsMap[idx]}>
    
                            <Popover id={"events-popover-" + idx} className="events-popover" title={(
                                <span>
                                    <img style={{width: '18px',height:'18px', marginRight: '8px'}} src={Images.EVENT}/>
                                    Events:
                                </span>
                            )}>
                                <EventsPopoverContent store={this.props.store} transaction={dispute.transaction} />
                            </Popover>
    
                        </Overlay>
                    </div>
                </td>
            );
        } else {
            return <td style={fieldProps.columns}></td>;
        }
    }


    renderDisputeRaisedByCell(dispute) {
        const testMapping = {
            "0x69bc764651de75758c489372c694a39aa890f911ba5379caadc08f44f8173051": "CustomerA"
        }
        return <td style={fieldProps.columns}>{testMapping[dispute.raisedBy]}</td>;
        //Should get the actual enterprise name from BCAddressToEnterpriseMapping collection
        //If mapping doesn't have the value, we should display a warning message
    }


    renderDisputeReasonCell(dispute) {
        return <td style={fieldProps.columns}>{dispute.reasonCode}</td>;
    }

    renderDisputeParticipantsCell(dispute) {
        let partnerNames = '';
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
            partnerNames = listOfPartners.join(', ');
        }

        return <td style={fieldProps.columns}>{partnerNames}</td>;
    }

    renderDisputeActionsCell(dispute) {
        if (dispute.status == 'Draft') {
            let actionsCell = (
                <OverlayTrigger
                    trigger={"click"}
                    container={this}
                    overlay={(
                        <div>
                            <Link to='#' onClick={this.submitDispute.bind(this, dispute)}>
                                <div id={dispute.id + "_submit"} className="fade in popover dispute-transation-div" style={{ cursor: 'pointer' }}>
                                    <img src={Images.DISPUTE_TRANSACTION_CONTAINER_IMAGE} />
                                    <div style={{}} className="dispute-transation-img" >
                                        <i className="fa fa-hand-paper-o" style={{ fontSize: '15px' }}></i>&nbsp; Submit Dispute
                                    </div>
                                </div>
                            </Link>
                            <Link to='#' onClick={this.discardDraftDispute.bind(this, dispute)}>
                                <div id={dispute.id + "_discard"} className="fade in popover dispute-transation-div" style={{ cursor: 'pointer' }}>
                                    <img src={Images.DISPUTE_TRANSACTION_CONTAINER_IMAGE} />
                                    <div style={{}} className="dispute-transation-img" >
                                        <i className="fa fa-hand-paper-o" style={{ fontSize: '15px' }}></i>&nbsp; Discard Draft
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}>
                    <i className="fa fa-cog" aria-hidden="true" style={{ fontSize: '20px', color: '#0085C8', cursor: 'pointer' }}></i>
                </OverlayTrigger>
            );
            return <td style={fieldProps.columns}>{actionsCell}</td>;
        } else if (dispute.status == 'Open') {
            let actionsCell = (
                <OverlayTrigger
                    trigger={"click"}
                    container={this}
                    overlay={(
                        <Link to='#' onClick={this.closeDispute.bind(this, dispute)}>
                            <div id={dispute.id + "_close"} className="fade in popover dispute-transation-div" style={{ cursor: 'pointer' }}>
                                <img src={Images.DISPUTE_TRANSACTION_CONTAINER_IMAGE} />
                                <div style={{}} className="dispute-transation-img" >
                                    <i className="fa fa-hand-paper-o" style={{ fontSize: '15px' }}></i>&nbsp; Close Dispute
                                </div>
                            </div>
                        </Link>
                    )}>
                    <i className="fa fa-cog" aria-hidden="true" style={{ fontSize: '20px', color: '#0085C8', cursor: 'pointer' }}></i>
                </OverlayTrigger>
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
}