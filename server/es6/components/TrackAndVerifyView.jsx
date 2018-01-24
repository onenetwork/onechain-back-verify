import React from 'react';
import {Row, Button, Panel, Checkbox, Table, Col, OverlayTrigger, Popover, ProgressBar, Modal} from 'react-bootstrap';
import { toJS } from 'mobx';
import MyView from './MyView';
import DiffView from './DiffView';
import BackChainActions from '../BackChainActions';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import filesaver from '../FileSaver';
import { Scrollbars } from 'react-custom-scrollbars';
import '../../public/css/TrackAndVerify.css';

const verifyImgProgressing = "/images/verify-progressing.png";
const verifyImgVerified = "/images/verify-succeded.png";
const verifyImgFailed = "/images/verify-failed.png";
@observer export default class TrackAndVerifyView extends React.Component {
    constructor(props) {
        super(props);
    }

    calculateVerifyImgLeftPosition() {
        if(this.props.store.verificationStatus.totalCompleted <= 97) {
            return this.props.store.verificationStatus.totalCompleted - 1;
        } else {
            return 96;
        }
    }

    getProgressBarImg() {
        let barImg = verifyImgProgressing;
        if(this.props.store.verificationStatus.endResult == 'verified') {
            barImg = verifyImgVerified;
        } else if(this.props.store.verificationStatus.endResult == 'failed') {
            barImg = verifyImgFailed;
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

    getVerificationHeaderIcon(transIds, entName) {
        if(!transIds || transIds.length == 0) {
            return <i style={{color : 'blue'}} className="fa fa-check-circle" aria-hidden="true" />;
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
            return <i style={{marginRight: '15px', fontSize: '15px', verticalAlign: 'top', color: '#d9443f'}} className="fa fa-exclamation-circle " aria-hidden="true" />;
        } else if(succeded) {
            return <i style={{marginRight: '15px', fontSize: '15px', verticalAlign: 'top', color: '#229978'}} className="fa fa-check-circle" aria-hidden="true" />;
        } else {
            return <i style={{marginRight: '15px', fontSize: '15px', verticalAlign: 'top', color: '#0486CC'}} className="fa fa-circle-o-notch fa-spin" aria-hidden="true" />;
        }
    }

    downloadZip (payload, event) {
        let type = event.currentTarget.getAttribute('type');
        let partnerName = event.currentTarget.getAttribute('partnername');
        let txnids = event.currentTarget.getAttribute('txnids');
        BackChainActions.zipTransactionsByIds(type, partnerName, txnids.split(','),function(){
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

        let fieldProps = {
            table: {
                border: '1px solid lightgrey'
            },
			tableHeader : {
                color: '#0085C8',
                backgroundColor: 'rgba(250, 250, 250, 1)',
                borderTop: 'solid 2px'
            },
            columns : {
                padding: '10px',
                fontSize: '12px',
                verticalAlign: 'top'
            },
            downArrow : {
                position: 'absolute',
                marginLeft: '3px'
            },
        };

        const myViewLabel = 'My View';
        let myEntName = this.props.store.entNameOfLoggedUser;
        let transactionsToVerify = [], views = [];

        if(this.props.store.transactions.length > 0) {
            let variableViewNames = [];
            variableViewNames = Object.keys(this.props.store.viewsMap);
            myEntName = this.props.store.entNameOfLoggedUser;
            if(variableViewNames.indexOf(myEntName) > -1) {
                variableViewNames.splice(variableViewNames.indexOf(myEntName), 1);
            }

            let eventCountCss = "counter3";
            const transactions = toJS(this.props.store.transactions);
            for (let i = 0; i < transactions.length; i++) {
                let transaction = transactions[i];
                let executingUsers = [], viewsTransactions = [], downArrow = '', eventCount = null, eventList = [];
                if(transaction){
                for(let j = 0; j < transaction.transactionSlices.length; j++) {
                    let transactionSlice = transaction.transactionSlices[j];
                    /*
                    let eventCount = transactionSlice.businessTransactions.length;
                    if(eventCount.toString().length == 1) {
                        eventCountCss =  "counter1";
                    } else if(eventCount.toString().length == 2) {
                        eventCountCss =  "counter2";
                    }
                    */
                    if(transactionSlice.type == "Enterprise") {
                        let transactionDetails = {
                            transactionId : transaction['id'],
                            myEntName : myEntName,
                            transactionSliceType : transactionSlice.type
                        }
                        /*
                        for(let k = 0; k < transactionSlice.businessTransactions.length; k++) {
                            executingUsers.push(transactionSlice.businessTransactions[k].LastModifiedUser);
                            let date = transactionSlice.businessTransactions[k].LastModifiedDate.date;
                            let actionName = transactionSlice.businessTransactions[k].ActionName.split('.')[1];
                            if(date.toString().length + actionName.length < 29) {
                                eventList.push(<li key={i+j+k}><span style={{color:'#990000',display:'inline'}}>{date}</span> <span style={{display:'inline'}}>&nbsp;&nbsp;&nbsp;{actionName}</span></li>);
                            }
                            else {
                            eventList.push(<li key={i+j+k}><span style={{color:'#990000'}}>{date}</span><br></br><span>{actionName}</span></li>);
                            }
                        }
                        */
                        viewsTransactions.push(
                            <td key = {transaction['id'] + myViewLabel} txnid = {transaction['id']} style={fieldProps.columns}>
                                <ViewOrDownloadTxn store = {this.props.store} downloadZip = {this.downloadZip}  transactionDetails = {transactionDetails} />
                            </td>
                        );
                    }
                    else if(transactionSlice.type == "Intersection") {
                        let logInUserEntIndex = (transactionSlice.enterprises).indexOf(myEntName);
                        let partnerEntName = logInUserEntIndex == 0 ?  transactionSlice.enterprises[1] : transactionSlice.enterprises[0];
                        if(this.props.store.isInitialSyncDone == null || this.props.store.isInitialSyncDone == false) {
                            partnerEntName =  transactionSlice.enterprises[0] +" & "+ transactionSlice.enterprises[1];
                        }

                        for(let k = 0; k < variableViewNames.length; k++) {
                            if(variableViewNames[k] == partnerEntName) {
                                partnerEntName = logInUserEntIndex == 0 ?  transactionSlice.enterprises[1] : transactionSlice.enterprises[0];
                                let transactionDetails = {
                                    transactionId : transaction['id'],
                                    partnerEntName : partnerEntName,
                                    transactionSliceType : transactionSlice.type
                                }

                                viewsTransactions.push(
                                    <td key = {transaction['id'] +''+partnerEntName} txnid = {transaction['id']} style={Object.assign({},fieldProps.columns,{paddingLeft: '18px'})}>
                                        <ViewOrDownloadTxn store = {this.props.store} downloadZip = {this.downloadZip} transactionDetails = {transactionDetails} />
                                    </td>
                                );
                            } else {
                                /* Insert blank td for views doesn't belong to current transaction */
                                viewsTransactions.push(<td key = {transaction['id'] +''+variableViewNames[k]}></td>);
                            }
                        }
                    }
                }

                /* Don't draw downArrow for last row */
                if(i != this.props.store.transactions.length - 1) {
                    downArrow =  <div style={fieldProps.downArrow}>
                        <img style={{width:'8px', height:'26px'}} src="/images/down-arrow.svg"/>
                    </div>
                }

                let displaytransId = transaction['id'];
                displaytransId = (<OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={<Popover id={transaction['id']} >{transaction['id']}</Popover>}>
                                        <span className="transactionIdCss">{transaction['id']}</span>
                                      </OverlayTrigger>);

                let displayExecutingUsers = Array.from(new Set(executingUsers));
                if(displayExecutingUsers.length > 1) {
                    let uniqueExecutingUsers = Array.from(new Set(executingUsers));
                    let usersList = [];
                    for(let index in Array.from(new Set(executingUsers))) {
                        usersList.push(<li key={index}>{Array.from(new Set(executingUsers))[index]}</li>);
                    }
                    displayExecutingUsers = (<OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={<Popover id={uniqueExecutingUsers.join() + i}>
                        <ul style={{paddingLeft: '0px',listStyleType: 'none'}}>{usersList}</ul>
                    </Popover>}>
                        <span>{uniqueExecutingUsers[0].length > 16 ? uniqueExecutingUsers[0].substring(0,16) + '...' : uniqueExecutingUsers[0]}</span>
                    </OverlayTrigger>)
                }

                transactionsToVerify.push(
                    <tr style = {{backgroundColor : i%2 ? 'rgba(250, 250, 250, 1)' : ''}} key={transaction['id']}>
                        <td style={{maxWidth: ' 154px',padding: '10px', fontSize: '12px', verticalAlign: 'top'}}>
                                <div style={{display: 'inline-flex'}}>
                                    <i style={{color: '#229978', fontSize: '14px'}} className="fa fa-handshake-o" aria-hidden="true"/>&nbsp;&nbsp;&nbsp;
                                        {displaytransId}
                                </div>
                                {downArrow}
                        </td>
                        <td style={fieldProps.columns}>{transaction['date']}</td>
                        <td style={Object.assign({},fieldProps.columns, {cursor:'pointer'})}>
                        <div>
                            <OverlayTrigger rootClose trigger="click" placement="right"
                            overlay={<Popover id= {i} arrowOffsetTop = '50' title={<span><img style={{width: '18px',height:'18px'}} src="../images/event.svg"/>&nbsp;&nbsp;Events:</span>}>
                                <ul style={{paddingLeft: '0px',listStyleType: 'none'}}>
                                    <Scrollbars style={{ width: 223, height: (eventList.length * 18 > 200 ? 200 : eventList.length * 18) }}>
                                        {eventList}
                                    </Scrollbars>
                                </ul>
                            </Popover>}>
                            <img style={{width: '30px',height:'26px'}} src="../images/event-badge.svg"/>
                            </OverlayTrigger>
                            <div className = {eventCountCss}>{eventCount}</div>
                            </div>
                        </td>
                        <td style={fieldProps.columns}>{displayExecutingUsers}</td>
                        {viewsTransactions}
                    </tr>
                    );
                }
            }
        }

        for(let key in this.props.store.viewsMap) {
            let circleIcon = '';
            let divStyle = {paddingTop: '7px'};
            let colStyle = {};
            let type = "";
            if(key != myEntName) {
                type = "Intersection"
                colStyle = {padding: '7px'};
                divStyle = {padding: '3px 0px 0px 11px'};
                circleIcon = <span className="fa-stack"><i className="fa fa-circle-o fa-stack-1x" aria-hidden="true" /><i className="fa fa-circle-o fa-stack-1x" aria-hidden="true" style = {{paddingLeft: '10px'}} /></span>;
            } else {
                type = "Enterprise"
            }
            views.push(
            <th key={key} style={Object.assign({}, fieldProps.columns, colStyle)}>
                {circleIcon}
                {key}
                <div style={divStyle}>{this.getVerificationHeaderIcon(this.props.store.viewsMap[key], key)}&nbsp;&nbsp;
                <i type={type} partnername={key} txnids={this.props.store.viewsMap[key].join()} style = {{color: '#646464', cursor:'pointer'}} className="fa fa-file-archive-o" aria-hidden="true" onClick={this.downloadZip.bind(this, this.props.store.payload)}/></div>
            </th>);
        }


        let tableHead = (
            <thead style={fieldProps.tableHeader}>
                <tr>
                    <th style={fieldProps.columns}><span style={{paddingLeft:'27px'}}>Transaction Id</span></th>
                    <th style={fieldProps.columns}>Date/Time</th>
                    <th style={Object.assign({},fieldProps.columns,{width: '6%'})}>Events</th>
                    <th style={fieldProps.columns}>Executing User</th>
                    {views}
                </tr>
            </thead>
        );

        let tableBody = (
            <tbody>
                {transactionsToVerify}
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
        return(<Modal dialogClassName = {dialogClassName} show={this.props.store.myAndDiffViewModalActive} onHide={BackChainActions.toggleMyAndDiffView}>
                {previewComponent}
               </Modal>);
    }
}

const ViewOrDownloadTxn = (props) => {

    let transactionId = props.transactionDetails.transactionId;
    let myEntName = props.transactionDetails.myEntName;
    let transactionSliceType = props.transactionDetails.transactionSliceType;
    let partnerEntName = props.transactionDetails.partnerEntName;
    let entNameForViwe = transactionSliceType == "Intersection" ? partnerEntName : myEntName;

    function getVerificationIcon() {
        let state = props.store.verifications.get(transactionId + "_" + entNameForViwe);
        if(!state || state == 'verifying') {
            return '';
        } else if(state == 'failed') {
            return <i style={{marginRight: '15px', fontSize: '15px', verticalAlign: 'top', color: '#d9443f'}} className="fa fa-exclamation-circle " aria-hidden="true" />;
        } else if(state == 'verified') {
            return <i style={{marginRight: '15px', fontSize: '15px', verticalAlign: 'top', color: '#229978'}} className="fa fa-check-circle" aria-hidden="true" />;
        }
    }

    function storeTransactions(event) {
        BackChainActions.toggleMyAndDiffView();
        BackChainActions.loadViewTransactionsById(transactionSliceType, partnerEntName, event.currentTarget.getAttribute('txnid').split(','));
        BackChainActions.zipTransactionsByIds(transactionSliceType, partnerEntName, event.currentTarget.getAttribute('txnid').split(','),function(){
        });
    }

    function downloadZip(event) {
        props.downloadZip(props.store.payload, event);
    }

    return(
        <div>
            {getVerificationIcon()}&nbsp;&nbsp;
            <OverlayTrigger rootClose trigger="click" placement="right"
                overlay={<Popover id={transactionId + entNameForViwe} style = {{width: '100px', fontWeight: '600', padding: '5px', lineHeight: '25px', zIndex: '0'}}>
                            <Row txnid = {transactionId} onClick={storeTransactions.bind(this)} style = {{color: 'rgba(45, 162, 191, 1)', cursor:'pointer'}}>
                                <Col md={1}>
                                    <i className="fa fa-eye" aria-hidden="true"></i>
                                </Col>&nbsp;
                                <Col md={1} style = {{paddingLeft: '5px'}}>
                                    View
                                </Col>
                            </Row>
                            <Row type= {transactionSliceType} partnername= {entNameForViwe} txnids= {transactionId} style = {{color: 'rgba(45, 162, 191, 1)', cursor:'pointer'}} onClick={downloadZip.bind(this)}>
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
