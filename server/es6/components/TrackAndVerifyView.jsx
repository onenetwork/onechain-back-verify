import React from 'react';
import ReactDOM from 'react-dom';
import {Row, Button, Panel, Checkbox, Table, Col, OverlayTrigger, Overlay, Popover, ProgressBar, Modal} from 'react-bootstrap';
import { toJS } from 'mobx';
import MyView from './MyView';
import DiffView from './DiffView';
import EventsPopoverContent from './EventsPopoverContent';
import BackChainActions from '../BackChainActions';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import filesaver from '../FileSaver';
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

@observer export default class TrackAndVerifyView extends React.Component {

    calculateVerifyImgLeftPosition() {
        if(this.props.store.verificationStatus.totalCompleted <= 97) {
            return this.props.store.verificationStatus.totalCompleted - 1;
        } else {
            return 96;
        }
    }

    getProgressBarImg() {
        let barImg = Images.VERIFY_IMAGE_PROCESSING;
        if(this.props.store.verificationStatus.endResult == 'verified') {
            barImg = Images.VERIFY_SUCCEDED;
        } else if(this.props.store.verificationStatus.endResult == 'failed') {
            barImg = Images.VERIFY_FAILED;
        }
        return barImg;
    }

    render() {
        const progressBar = !this.props.hideProgressBar ? (
            <div>
                <ProgressBar now={this.props.store.verificationStatus.totalCompleted} />
                <img src={this.getProgressBarImg()} style={{
                    position : 'relative',
                    top: -58,
                    transition: 'left .6s ease',
                    left: this.calculateVerifyImgLeftPosition()  + '%'
                }} />
            </div>
        ) : null;

        return (
            <div>
                {progressBar}
                <TransctionsTable store={this.props.store} />
            </div>
		);
    }
}

@observer class TransctionsTable extends React.Component {

    constructor(...args) {
        super(...args);

        this.eventsPopoverRefsMap = {};
        this.state = {
            eventsPopoverVisibilityMap: {}
        };
    }

    getVerificationHeaderIcon(transIds, entName) {
        if(!transIds || transIds.length == 0) {
            return <i style={{color : 'blue', lineHeight: fieldProps.columns.lineHeight}} className="fa fa-check-circle" aria-hidden="true" />;
        }
        let failed = false;
        let succeded = true;
        const me = this;
        transIds.forEach(function(transId) {
            var rowState = me.props.store.verifications.get(transId + "_" + entName);
            if(rowState == 'failed') {
                failed = true;
                succeded = false;
            } else if(!rowState || rowState == 'verifying') {
                succeded = false;
            }
        });
        if(failed) {
            return <i style={fieldProps.icons.failed} className="fa fa-exclamation-circle " aria-hidden="true" />;
        } else if(succeded) {
            return <i style={fieldProps.icons.verified} className="fa fa-check-circle" aria-hidden="true" />;
        } else {
            return <i style={fieldProps.icons.verifying} className="fa fa-circle-o-notch fa-spin" aria-hidden="true" />;
        }
    }

    downloadZip (payload, event) {
        let type = event.currentTarget.getAttribute('type');
        let partnerName = event.currentTarget.getAttribute('partnername');
        let txnids = event.currentTarget.getAttribute('txnids');
        BackChainActions.zipTransactionsByIds(type, partnerName, txnids.split(','))
            .then(() => {
                let zip = new JSZip();
                let file = zip.file("payload.json", JSON.stringify(payload));

                file.generateAsync({
                    type: "blob"
                }).then(function(blob) {
                    filesaver.saveAs(blob, "payload.zip");
                }, function(err) {
                    console.log("error occurred while generating zip file " + err);
                });
            });
    }

    render() {
        const transactions = toJS(this.props.store.transactions);
        let myEntName = this.props.store.entNameOfLoggedUser;
        let variableViewNames = [];

        if(transactions.length > 0) {
            variableViewNames = Object.keys(this.props.store.viewsMap);
            if(variableViewNames.indexOf(myEntName) > -1) {
                variableViewNames.splice(variableViewNames.indexOf(myEntName), 1);
            }
        }

        let tableHead = (
            <thead style={fieldProps.tableHeader}>
                <tr>
                    <th style={Object.assign({maxWidth: '130px'}, fieldProps.columns)}><span style={{paddingLeft:'27px'}}>Transaction Id</span></th>
                    <th style={fieldProps.columns}>Date/Time</th>
                    <th style={Object.assign({},fieldProps.columns,{width: '6%'})}>Events</th>
                    <th style={fieldProps.columns}>Executing User</th>
                    {this.renderEnterpriseHeaders(variableViewNames)}
                </tr>
            </thead>
        );

        let tableBody = (
            <tbody>
                {this.renderTransactionRows(transactions, variableViewNames)}
            </tbody>
        );

		return(
            <div>
                <TransactionPreview store={this.props.store}/>
                <Table responsive condensed hover style={fieldProps.table}>
                    {tableHead}
                    {tableBody}
                </Table>
            </div>
		);
    }

    renderEnterpriseHeaders(variableViewNames) {
        const myEntName = this.props.store.entNameOfLoggedUser;
        const entNames = myEntName ? [myEntName].concat(variableViewNames) : [].concat(variableViewNames);
        let enterpriseHeaders = [];
        for(let key of entNames) {
            let circleIcon = '';
            let divStyle = {paddingTop: '7px'};
            let colStyle = {};
            let type = "";
            if((myEntName && key != myEntName) || (!myEntName && key.indexOf('&') > -1)) {
                type = "Intersection";
                colStyle = {padding: '7px'};
                divStyle = {padding: '3px 0px 0px 11px'};
                circleIcon = <span className="fa-stack"><i className="fa fa-circle-o fa-stack-1x" aria-hidden="true" /><i className="fa fa-circle-o fa-stack-1x" aria-hidden="true" style = {{paddingLeft: '10px'}} /></span>;
            } else {
                type = "Enterprise";
            }

            const views = this.props.store.viewsMap[key];
            if (views) {
                enterpriseHeaders.push(
                    <th key={key} style={Object.assign({}, fieldProps.columns, colStyle)}>
                        {circleIcon}
                        {key}
                        <div style={divStyle}>{this.getVerificationHeaderIcon(views, key)}&nbsp;&nbsp;
                        <i type={type} partnername={key} txnids={views.join()} style = {{color: '#646464', cursor:'pointer'}} className="fa fa-file-archive-o" aria-hidden="true" onClick={this.downloadZip.bind(this, this.props.store.payload)}/></div>
                    </th>
                );
            }
        }

        return enterpriseHeaders;
    }

    renderTransactionRows(transactions, variableViewNames) {
        let transactionsToVerify = [];
        for(let i = 0; i < transactions.length; i++) {
            let transaction = transactions[i];
            if(!transaction) {
                continue;
            }

            transactionsToVerify.push(this.renderTransactionRow(transaction, i, variableViewNames));
        }

        return transactionsToVerify;
    }

    renderTransactionRow(transaction, idx, variableViewNames) {
        return (
            <tr style = {{backgroundColor : idx % 2 ? 'rgba(250, 250, 250, 1)' : ''}} key={transaction.id}>
                {this.renderTransactionIdCell(transaction, idx == this.props.store.transactions.length - 1)}
                {this.renderTransactionDateCell(transaction)}
                {this.renderTransactionEventsCell(transaction, idx)}
                {this.renderTransactionExecutingUsersCell(transaction)}
                {this.renderTransactionMyEnterpriseVerifyCell(transaction)}
                {this.renderTransactionOtherEnterpriseVerifyCells(transaction, variableViewNames)}
            </tr>
        );
    }

    renderTransactionIdCell(transaction, lastTransaction) {
        const transactionId = transaction.id;
        return (
            <td style={Object.assign({ maxWidth: '130px'}, fieldProps.columns)}>
                <div style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    <i style={{color: '#229978', fontSize: '14px', lineHeight: fieldProps.columns.lineHeight}} className="fa fa-handshake-o" aria-hidden="true"/>&nbsp;&nbsp;&nbsp;
                    <OverlayTrigger
                        trigger={['hover', 'focus']}
                        placement="top"
                        overlay={<Popover id={transactionId} className="transaction-id-popover">{transactionId}</Popover>}>
                        <span>{transactionId}</span>
                    </OverlayTrigger>
                </div>
                {this.renderDownArrow(lastTransaction)}
            </td>
        );
    }

    renderDownArrow(lastTransaction) {
        if(lastTransaction) {
            return null;
        }

        return (
            <div style={fieldProps.icons.downArrow}>
                <img style={{width:'8px', height:'26px'}} src={Images.DOWN_ARROW}/>
            </div>
        );
    }

    renderTransactionDateCell(transaction) {
        const formattedDate = moment(new Date(transaction.date)).format('MMM DD, YYYY HH:mm A');
        return <td style={fieldProps.columns}>{formattedDate}</td>;
    }

    renderTransactionEventsCell(transaction, idx) {
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
    }

    renderTransactionExecutingUsersCell(transaction) {
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
    }

    renderTransactionMyEnterpriseVerifyCell(transaction) {
        const myEntName = this.props.store.entNameOfLoggedUser;
        for(let i = 0; i < transaction.transactionSlices.length; i++) {
            let transactionSlice = transaction.transactionSlices[i];
            if(transactionSlice.type == "Enterprise") {
                let transactionDetails = {
                    transactionId: transaction.id,
                    myEntName: myEntName || transactionSlice.enterprise,
                    transactionSliceType: transactionSlice.type
                }

                return (
                    <td
                        key={transaction.id + "_" + (myEntName || transactionSlice.enterprise)}
                        txnid={transaction.id}
                        style={fieldProps.columns}>
                        <ViewOrDownloadTxn
                            store={this.props.store}
                            downloadZip={this.downloadZip}
                            transactionDetails={transactionDetails} />
                    </td>
                );
            }
        }

        return null;
    }

    renderTransactionOtherEnterpriseVerifyCells(transaction, variableViewNames) {
        const myEntName = this.props.store.entNameOfLoggedUser;
        let cells = [];

        for(let i = 0; i < variableViewNames.length; i++) {
            let variableViewName = variableViewNames[i];
            let found = false;
            for(let j = 0; j < transaction.transactionSlices.length; j++) {
                let transactionSlice = transaction.transactionSlices[j];
                if(transactionSlice.type == "Intersection") {
                    let myEntIndex = transactionSlice.enterprises.indexOf(myEntName);
                    let partnerEntName = '';
                    if(myEntIndex < 0) {
                        partnerEntName = transactionSlice.enterprises[0] +" & "+ transactionSlice.enterprises[1];
                    } else {
                        partnerEntName = myEntIndex == 0 ?  transactionSlice.enterprises[1] : transactionSlice.enterprises[0];
                    }                     
                    if(variableViewName != partnerEntName) {
                        found = true; //Don't print empty <td>
                        continue;
                    }

                    let transactionDetails = {
                        transactionId: transaction.id,
                        partnerEntName: partnerEntName,
                        transactionSliceType: transactionSlice.type
                    }

                    cells.push(
                        <td
                            key={transaction.id + "_" + partnerEntName}
                            txnid={transaction.id}
                            style={Object.assign({},fieldProps.columns,{paddingLeft: '18px'})}>
                            <ViewOrDownloadTxn
                                store={this.props.store}
                                downloadZip={this.downloadZip}
                                transactionDetails={transactionDetails} />
                        </td>
                    );
                    found = true;
                    break;
                } else {
                    found = true;
                }
            }

            if(!found) {
                cells.push(<td></td>);
            }
        }

        return cells;
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

@observer class TransactionPreview extends React.Component {
    render() {
        let previewComponent = null, dialogClassName = '';

        if(this.props.store.myAndDiffViewModalType == 'Enterprise') {
            dialogClassName  = "transaction-preview-modal";
            previewComponent = <MyView store= {this.props.store}/>
        } else if (this.props.store.myAndDiffViewModalType == 'Intersection') {
            dialogClassName  = "transaction-diff-preview-modal";
            previewComponent = <DiffView store= {this.props.store}/>
        }
        return(<Modal dialogClassName = {dialogClassName} show={this.props.store.myAndDiffViewModalActive} onHide={() => BackChainActions.setMyAndDiffViewActive(false)}>
                {previewComponent}
               </Modal>);
    }
}

const ViewOrDownloadTxn = props => {
    const {
        transactionId,
        myEntName,
        partnerEntName,
        transactionSliceType
    }  = props.transactionDetails;
    let entNameForView = transactionSliceType == "Intersection" ? partnerEntName : myEntName;

    function getVerificationIcon() {
        let state = props.store.verifications.get(transactionId + "_" + entNameForView);
        if(!state || state == 'verifying') {
            // Don't return the spinning icon for each row because it looks messy.
            return '';
        } else if(state == 'failed') {
            return <i style={fieldProps.icons.failed} className="fa fa-exclamation-circle" aria-hidden="true" />;
        } else if(state == 'verified') {
            return <i style={fieldProps.icons.verified} className="fa fa-check-circle" aria-hidden="true" />;
        }
    }

    function storeTransactions(event) {
        BackChainActions.loadViewTransactionsById(transactionSliceType, partnerEntName, event.currentTarget.getAttribute('txnid'));
    }

    function downloadZip(event) {
        props.downloadZip(props.store.payload, event);
    }

    return(
        <div>
            {getVerificationIcon()}&nbsp;&nbsp;
            <OverlayTrigger rootClose trigger="click" placement="right"
                overlay={<Popover id={transactionId + entNameForView} className="popover-menu">
                            <Row txnid = {transactionId} onClick={storeTransactions.bind(this)} style = {{color: 'rgba(45, 162, 191, 1)', cursor:'pointer'}}>
                                <Col md={1}>
                                    <i className="fa fa-eye" aria-hidden="true"></i>
                                </Col>&nbsp;
                                <Col md={1} style = {{paddingLeft: '5px'}}>
                                    View
                                </Col>
                            </Row>
                            <Row type= {transactionSliceType} partnername= {entNameForView} txnids= {transactionId} style = {{color: 'rgba(45, 162, 191, 1)', cursor:'pointer'}} onClick={downloadZip.bind(this)}>
                                <Col md={1}>
                                    <i className="fa fa-download" aria-hidden="true"></i>
                                </Col>&nbsp;
                                <Col md={1} style = {{paddingLeft: '5px'}}>
                                    Download
                                </Col>
                            </Row>
                        </Popover>}>
                    <i style = {{color: '#646464', cursor:'pointer'}} className="fa fa-file" aria-hidden="true"/>
            </OverlayTrigger>
        </div>
    );
}
