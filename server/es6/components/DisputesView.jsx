import React from 'react';
import ReactDOM from 'react-dom';
import {Row, Button, Panel, Checkbox, Table, Col, OverlayTrigger, Overlay, Popover, Modal} from 'react-bootstrap';
import { toJS } from 'mobx';
import EventsPopoverContent from './EventsPopoverContent';
import BackChainActions from '../BackChainActions';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
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
            eventsPopoverVisibilityMap: {}
        };
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
                    <th style={Object.assign({},fieldProps.columns,{width: '6%'})}>Events</th>
                    <th style={fieldProps.columns}>Raised By</th>
                    <th style={fieldProps.columns}>Reason Code</th>
                    <th style={Object.assign({},fieldProps.columns,{width: '6%'})}>Participants</th>
                    <th style={fieldProps.columns}>Actions</th>
                </tr>
            </thead>
        );

        let tableBody = (
            <tbody>
                {this.renderDisputeRows(disputes)}
            </tbody>
        );

		return(
            <div>
                <Table responsive condensed hover style={fieldProps.table}>
                    {tableHead}
                    {tableBody}
                </Table>
            </div>
		);
    }

    renderDisputeRows(disputes) {
        let disputesRowsToDisplay = [];
        for(let i = 0; i < disputes.length; i++) {
            let dispute = disputes[i];
            if(!dispute) {
                continue;
            }

            disputesRowsToDisplay.push(this.renderDisputeRow(dispute, i));
        }

        return disputesRowsToDisplay;
    }

    renderDisputeRow(dispute, idx) {
        return (
            <tr style = {{backgroundColor : idx % 2 ? 'rgba(250, 250, 250, 1)' : ''}} key={dispute.id}>
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
            <td style={Object.assign({ maxWidth: '130px'}, fieldProps.columns)}>
                <div style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
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
        return (
            <td style={Object.assign({ maxWidth: '130px'}, fieldProps.columns)}>
                <div style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    <OverlayTrigger
                        trigger={['hover', 'focus']}
                        placement="top"
                        overlay={<Popover id={transactionId} className="transaction-id-popover">{transactionId}</Popover>}>
                        <span>{transactionId}</span>
                    </OverlayTrigger>
                </div>
            </td>
        );
    }

    renderDateCell(dateInMillis) {
        const formattedDate = dateInMillis ? moment(new Date(dateInMillis)).format('MMM DD, YYYY HH:mm A') : '';
        return <td style={fieldProps.columns}>{formattedDate}</td>;
    }

    renderDisputeEventsCell(dispute, idx) {
        /**
         * Pseudeo code
         * iff dispute.events list is empty, fetch all the events from the transaction itself.
         * iff dispute.events has a subset of btIds, only fetch the events from the transaction with a corresponding btIds.
         * iff the transaction doesn't exist in the db, show a warning when user clicks on the popover. It should say
         * "It looks like you aren't fully synchronized and the transaction is missing. You can try to initiate sync to display full 
         * transaction data."
         */
        return <td style={fieldProps.columns}></td>; 
        /*
        return (
            <td style={Object.assign({}, fieldProps.columns, {cursor:'pointer'})}>
                <div className="counter-ct" onClick={() => this.showEventsPopover(idx, true)}>
                    <img
                        className="counter-img"
                        src={Images.EVENT_BADGE}
                        ref={ref => this.eventsPopoverRefsMap[idx] = ref} />
                    <div className={this.getEventCountCSS(transaction.eventCount)}>
                        {this.getEventCountString(transaction.eventCount)}
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
                            <EventsPopoverContent store={this.props.store} transaction={transaction} />
                        </Popover>

                    </Overlay>
                </div>
            </td>
        );
        */
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
        /**
         * Iff the transaction with given dispute.transactionId exits in the db, go ahead and fetch all the enterprises mentioned and display
         * Iff the transaction doesn't exist, same warning message in DisputeEvents column should be displayed. 
         */
        return <td style={fieldProps.columns}></td>;
        /*
        let displayExecutingUsers = transaction.executingUsers;
        if(transaction.executingUsers.length > 1) {
            let usersList = [];
            for(let i = 0;i < transaction.executingUsers.length; i++) {
                usersList.push(<li key={i}>{transaction.executingUsers[i]}</li>);
            }
            displayExecutingUsers = (
                <OverlayTrigger
                    trigger={['hover', 'focus']}
                    placement="top"
                    overlay={(
                        <Popover id={transaction.executingUsers.join() + i}>
                            <ul style={{paddingLeft: '0px',listStyleType: 'none'}}>
                                {usersList}
                            </ul>
                        </Popover>
                    )}>
                    <span>{transaction.executingUsers[0].length > 16 ? transaction.executingUsers[0].substring(0,16) + '...' : transaction.executingUsers[0]}</span>
                </OverlayTrigger>
            );
        }

        return <td style={fieldProps.columns}>{displayExecutingUsers}</td>;
        */
    }

    renderDisputeActionsCell(dispute) {
        return <td style={fieldProps.columns}>AA</td>; //Display the icon and corresponding inner menu items depending on the dispute status.
    }

    getEventCountCSS(eventCount) {
        switch(this.getEventCountString(eventCount).length) {
            case 1:
                return "counter1";
            case 2:
                return "counter2";
        }

        return "counter3";
    }

    getEventCountString(eventCount) {
        if(eventCount >= 1000) {
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