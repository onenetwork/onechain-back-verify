import React from 'react';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel} from 'react-bootstrap';
import BackChainActions from '../BackChainActions';
import HeaderView from "./HeaderView";
import AlertPopupView from "./AlertPopupView";
import {BigNumber} from 'bignumber.js';
import moment from 'moment';
import {Link} from 'react-router-dom';

@observer export default class SyncStatisticsView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedGapsForSync: []
        };
    }

    componentDidMount() {
        let me = this;
        BackChainActions.populateStoreWithApplicationSettings();
        BackChainActions.getSyncStatisticsInfo(true); //We need to process and get the UI report ready
    }

    findGapIndex(gapToFind, alreadySelectedGaps) {
        let index = -1;
        for(let i=0; i < alreadySelectedGaps.length; i++) {
            var curGap = alreadySelectedGaps[i];
            if(curGap.fromSequenceNo == gapToFind.fromSequenceNo && curGap.toSequenceNo == gapToFind.toSequenceNo) {
                index = i;
                break;
            }
        }
        return index;
    }

    selectGap(event){
        let currentGapDOM = event.currentTarget;        
        let clickedGap = {
            fromSequenceNo : event.currentTarget.getAttribute('fromsequenceno'),
            toSequenceNo : event.currentTarget.getAttribute('tosequenceno')
        }
        let selectedGapsForSync = this.state.selectedGapsForSync;
        const gapIndex = this.findGapIndex(clickedGap, selectedGapsForSync);        
        if(gapIndex > -1) {
            selectedGapsForSync.splice(gapIndex, 1);
            currentGapDOM.style.backgroundColor = "#fccfcf";
            if(currentGapDOM.nextElementSibling){
                currentGapDOM.nextElementSibling.style.backgroundColor= "#fccfcf";
            } else {
                currentGapDOM.previousSibling.style.backgroundColor= "#fccfcf";
            } 
           
        } else {
            selectedGapsForSync.push(clickedGap);
            currentGapDOM.style.backgroundColor = "#f88b8b";
            if(currentGapDOM.nextElementSibling){
                currentGapDOM.nextElementSibling.style.backgroundColor= "#f88b8b";
            } else {
                currentGapDOM.previousSibling.style.backgroundColor= "#f88b8b";
            }
        }
        this.setState({
            selectedGapsForSync : selectedGapsForSync
        });
    }

    render() {
        let fieldProps = {
			panelBodyTitle : {
				paddingLeft: '20px',	
				fontSize: '22px',
				color: '#515151'
			},
			panelBody : {
				padding: '70px 0px 20px 80px',
				backgroundColor: 'white'
			},
			panelDefault : {
				borderStyle : 'none'
            }
        };
        
        let syncStatisticsReportUI = [];
        let verticalLineUI = [];
        let gapSize = 0;
        for(let i=0; i < this.props.store.syncStatisticsReport.length; i++) {
            let syncStatisticsReport = this.props.store.syncStatisticsReport[i];
            if(syncStatisticsReport.type == "fullSync") {
                syncStatisticsReportUI.push(<FullSync key={i + 'full'} syncStatisticsReport = {syncStatisticsReport}/>);
            }
            if(this.props.store.syncStatisticsReport.length!=1 && i==0) {
                verticalLineUI.push(<VerticalLine key={'vertical'} verticlHeight = {this.props.store.syncStatisticsReport.length-2}/>);
            }
            if(syncStatisticsReport.type == "gap") {
                gapSize++;
                syncStatisticsReportUI.push(<Gap key={i + 'gap'} syncStatisticsReport = {syncStatisticsReport} selectGap = {this.selectGap.bind(this)} store = {this.props.store} />);
            }
        }

        let latestNEarliestSync = (
            <div style={{display:'inline-flex'}}>
                {verticalLineUI}
                <div>
                    {syncStatisticsReportUI}
                </div>
            </div>
        );

        let panelBody = "";
        if(this.props.store.syncStatisticsReport.length==1 && this.props.store.syncStatisticsReport[0].type == 'fullSync') {            
            panelBody = (<div style={{height: '100%', width: '92%'}}>
                            <Row style={fieldProps.panelBodyTitle}>
                                <Col md={1} style={{width: '7%'}}>
                                <span>
                                    <i className="fa fa-database" aria-hidden="true">
                                        &nbsp;<i className="fa fa-refresh" aria-hidden="true" style = {{fontSize: '13px'}}/>
                                    </i>
                                </span>
                                </Col>
                                <Col> Database Sync Statistics </Col>
                            </Row><hr/><br/>
                            <Row>
                                <Col md={1} style={{width: '6%', color: '#229978'}}>  <i style ={{fontSize: '2.5em'}} className="fa fa-check-circle" aria-hidden="true"></i></Col>
                                <Col>
                                    <span style={{color: '#229978', fontSize: '1.3em', fontWeight: 700}}>Your DB is fully synced.</span> <br/>
                                </Col>
                            </Row>
                        </div>);
        } else {
            panelBody = (<div style={{height: '100%', width: '92%'}}>
                                <Row style={fieldProps.panelBodyTitle}>
                                    <Col md={1} style={{width: '7%'}}>
                                    <span>
                                        <i className="fa fa-database" aria-hidden="true">
                                            &nbsp;<i className="fa fa-refresh" aria-hidden="true" style = {{fontSize: '13px'}}/>
                                        </i>
                                    </span>
                                    </Col>
                                    <Col> Database Sync Statistics </Col>
                                </Row><hr/><br/>
                                <Row>
                                    <Col md={1} style={{width: '6%', color: '#ef941b'}}> <i style ={{fontSize: '2.5em'}} className="fa fa-exclamation-circle" aria-hidden="true"></i></Col>
                                    <Col>
                                        <span style={{color: '#ef941b', fontSize: '1.3em', fontWeight: 700}}> There are {gapSize} sequence gaps. </span> <br/>
                                        Click one or more to sync and close the sequence  gaps.
                                    </Col>
                                </Row>
                        </div>);
        }

        return(
            <div className={"panel panel-default"} style={fieldProps.panelDefault}>
				<HeaderView store={this.props.store} size="big"/>
                <div className={"panel-body"} style={fieldProps.panelBody}>
                    {panelBody}<br/>
                    {latestNEarliestSync}<br/>
                    <SyncGapButtons store={this.props.store} parentState={this.state}  selectedGapsLbl = {"Sync Selected Gaps"} allGapsLbl = {"Sync All Gaps"}/>
                </div>
                <AlertPopupView store={this.props.store} />
		  	</div>
        )
    }
}

const FullSync = (props) => {
    let fieldProps = {
        syncSuccessInfo : {
            marginLeft: '3.7em',
            width: '364px',
            height: '53px',
            fontSize: '12px',
            backgroundColor: 'rgba(215, 235, 242, 1)',
            borderRadius: '0px 20px 20px 0px',
        },
        syncDate : {
            borderWidth: '0px',
            height: '40px',
            lineHeight: '40px',
            border: 'none',
            borderRadius: '20px',
            borderTopLeftRadius: '0px',
            borderBottomLeftRadius: '0px',
            boxShadow: 'none',
            textAlign: 'left',
            backgroundColor: 'rgba(215, 235, 242, 1)'
        }
    }
	return (
        <div>
            <Row style={{marginLeft: '0px'}}>
                <Col md={6} style={fieldProps.syncSuccessInfo}>
                    <i style = {{fontSize : '18px', color: 'rgba(0, 133, 200, 1)', display: 'block', float: 'left', marginTop: '10px'}} className="fa fa-circle" aria-hidden="true" />
                    <span style={{paddingLeft:'35px',paddingTop:'10px',fontWeight:'700',display: 'block'}}>{props.syncStatisticsReport.syncMsg}</span> 
                    <span style={{paddingLeft:'19px'}}>{props.syncStatisticsReport.fromDate}&nbsp;<span>-</span>{props.syncStatisticsReport.toDate}</span> 
                </Col>
            </Row>
            <br/>
        </div>
	)
}

const Gap = (props) => {
    let fieldProps = {
        gapInfo : {
            marginLeft: '65px',
            width: '337px',
            height: '53px',
            fontSize: '12px',
            backgroundColor: 'rgba(252, 207, 207, 1)',
            boxSizing: 'border-box',
            borderWidth: '0px 2px 0px 4px',
            borderTopStyle: 'initial',
            borderRightStyle: 'solid',
            borderBottomStyle: 'initial',
            borderLeftStyle: 'solid',
            borderTopColor: 'initial',
            borderRightColor: 'rgba(243, 91, 90, 1)',
            borderBottomColor: 'initial',
            borderLeftColor: 'rgba(243, 91, 90, 1)',
            borderRadius: '0px',
            zIndex: '1',
            cursor: 'pointer'
        },
        syncDate : {
            borderWidth: '0px',
            height: '53px',
            border: 'none',
            borderRadius: '20px',
            borderTopLeftRadius: '0px',
            borderBottomLeftRadius: '0px',
            boxShadow: 'none',
            textAlign: 'left',
            backgroundColor: 'rgb(252, 207, 207)',
            cursor: 'pointer'
        }
    }
    
      
	return (
		<div>
            <Row style={{marginLeft: '0px'}}>
                <Col md={6} style={fieldProps.gapInfo}  onClick={props.selectGap} fromsequenceno = {props.syncStatisticsReport.fromSeqNo} tosequenceno = {props.syncStatisticsReport.toSeqNo}>
                    <span style={{display: 'block', fontWeight:'700', paddingLeft: '8px', paddingTop:'10px'}}>{props.syncStatisticsReport.syncMsg}</span>
                    <span style={{paddingLeft:'8px'}}>{props.syncStatisticsReport.fromDate}&nbsp;<span>-</span>{props.syncStatisticsReport.toDate}</span>
                </Col>
                <Col md={3} onClick={props.selectGap} fromsequenceno = {props.syncStatisticsReport.fromSeqNo} tosequenceno = {props.syncStatisticsReport.toSeqNo} style={Object.assign({}, fieldProps.syncDate, {width: '220px'})}>
                <span style={{paddingTop:'10px',display: 'inline-block', width:'200px'}}><i className="fa fa-clock-o" aria-hidden="true"></i>&nbsp;&nbsp;{props.syncStatisticsReport.time}</span>
                <span style={{display: 'inline-block', width: '200px' }}><i className="fa fa-files-o" aria-hidden="true"></i>&nbsp;&nbsp;{props.syncStatisticsReport.noOfMissingRecords}&nbsp;records</span>
                </Col>
            </Row>
            <br/>
        </div>
	)
}

const VerticalLine = (props) => {
    let fieldProps = {
        verticalLine : {
            borderLeft: '4px solid rgba(0, 133, 200, 1)',
            position: 'relative',
            zIndex: '1',
            marginTop: '20px'
        }
    }
    let verticlHeight = props.verticlHeight;
	return (
		<div style={Object.assign({}, fieldProps.verticalLine, {height: verticlHeight > 0 ? 72 * (verticlHeight + 1) : 72, left: 69 })}/>
	)
}

const SyncGapButtons = (props) => {
    let fieldProps = {
        button : {
            height: '35px',
            boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
            fontStyle: 'normal',
            fontSize: '18px',
            backgroundColor: 'rgba(0, 133, 200, 1)',
            color: 'white',
            borderWidth: '0px'
        },
        cancelButton: {
            padding: '7px 23px',
            color: 'rgb(0, 120, 215)',
            borderColor: 'rgb(0, 120, 215)',
            boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px',
            height: '35px',
            width: '53px',
            fontSize: '22px',
            paddingTop: '0px',
            paddingLeft: '15px'
        }
    }

    function onHover(event) {
        event.currentTarget.style.backgroundColor = 'rgba(0, 114, 168, 1)';
    }

    function onHoverOut(event) {
        event.currentTarget.style.backgroundColor = 'rgba(0, 133, 200, 1)';
    }

    function fillSelectedGaps() {
		BackChainActions.startGapSync(props.store.authenticationToken, props.store.chainOfCustodyUrl, props.parentState.selectedGapsForSync);
    }
    
    function fillAllGaps() {
        BackChainActions.startGapSync(props.store.authenticationToken, props.store.chainOfCustodyUrl, props.store.syncStatistics.gaps);
    }

    if(props.store.syncStatisticsReport.length==1 && props.store.syncStatisticsReport[0].type == 'fullSync') {
        return (
            <div>
                <Row>
                    <Col md={1} style={{width: '6%'}}></Col>
                    <Col>
                        <Link to="/home"><Button  style = {fieldProps.button} onMouseOver = {onHover.bind(this)} onMouseOut = {onHoverOut.bind(this)}>Backchain Verify Home</Button></Link>
                    </Col>
                </Row>
            </div>
        )

    }else {
        return (
            <div>
                <Row>
                    <Col md={1} style={{width: '6%'}}></Col>
                    <Col>
                        <Link to="/home"><Button style={fieldProps.cancelButton} ><i className="fa fa-home" aria-hidden="true"></i></Button></Link>	&nbsp;&nbsp;
                        <Button disabled={props.parentState.selectedGapsForSync.length == 0} id="syncSelectedGap" style={fieldProps.button} onClick={fillSelectedGaps.bind(this)} onMouseOver = {onHover.bind(this)} onMouseOut = {onHoverOut.bind(this)}>{props.selectedGapsLbl}</Button>&nbsp;
                        <Button disabled={props.store.syncStatistics == null || props.store.syncStatistics.gaps.length == 0} style={Object.assign({}, fieldProps.button, {marginLeft : '10px'})} onClick={fillAllGaps.bind(this)} onMouseOver = {onHover.bind(this)} onMouseOut = {onHoverOut.bind(this)}>{props.allGapsLbl}</Button>
                    </Col>
                </Row>
            </div>
        )
    }
}