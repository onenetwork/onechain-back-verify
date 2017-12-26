import React from 'react';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel} from 'react-bootstrap';
import BackChainActions from '../BackChainActions';
import HeaderView from "./HeaderView";

@observer export default class SyncStatisticsView extends React.Component {
    constructor(props) {
        super(props);
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
			button : {
				height: '35px',
				boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
				fontStyle: 'normal',
                fontSize: '18px',
                backgroundColor: 'rgba(0, 133, 200, 1)',
                color: 'white',
                borderWidth: '0px'
			},
			panelDefault : {
				borderStyle : 'none'
            },
            syncSuccessInfo : {
                marginLeft: '3.7em',
                width: '144px',
                height: '40px',
                lineHeight: '40px',
                fontSize: '13px',
                backgroundColor: 'rgba(215, 235, 242, 1)',
                boxSizing: 'border-box',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'rgba(0, 133, 200, 1)',
                borderLeft: '0px',
                borderTop: '0px',
                borderBottom: '0px',
                borderRadius: '20px',
                borderTopLeftRadius: '0px',
                borderTopRightRadius: '0px',
                borderBottomRightRadius: '0px',
                borderBottomLeftRadius:'0px'
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
                textAlign: 'left'
            },
            verticalLine : {
                borderLeft: '4px solid rgba(0, 133, 200, 1)',
                position: 'absolute',
                zIndex: '1',
                top: '423px'
            },
            gapInfo : {
                marginLeft: '68px',
                width: '123px',
                height: '40px',
                lineHeight: '40px',
                fontSize: '13px',
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
                zIndex: '1'
            }
        };
        let gaps = [];
        let syncGapButtons = (
            <div>
                <Row>
                    <Col md={1} style={{width: '6%'}}></Col>
                    <Col>
                        <Button style={fieldProps.button}>Sync Selected Gaps</Button>&nbsp;
                        <Button style={Object.assign({}, fieldProps.button, {marginLeft : '10px'})}>Sync All Gaps</Button>
                    </Col>
                </Row>
            </div>
        );
        let panelBody = (<div style={{height: '100%', width: '92%'}}>
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
                                        <span style={{color: '#ef941b', fontSize: '1.3em', fontWeight: 700}}> There are 3 sequence gaps. </span> <br/>
                                        Click one or more to sync and close the sequence  gaps.
                                    </Col>
                                </Row>
						</div>);
        let gapsArr = [1,2];
        
        for(let i=0; i < gapsArr.length; i++) {
            gaps.push(<div><Row style={{marginLeft: '0px'}}>
            <Col md={6} style={fieldProps.gapInfo}>
                <span style={{display: 'block', float: 'right'}}>2 hrs 31 mins</span> &nbsp;
            </Col>
            <Col md={6} style={Object.assign({}, fieldProps.syncDate, {backgroundColor: 'rgb(252, 207, 207)', width: '350px'})}>
                &nbsp; Dec 03, 2017  9:03 AM  - Dec 03, 2017  11:34 AM
            </Col>
        </Row><br/></div>);
        }

        let verticalLine = (<div style={Object.assign({}, fieldProps.verticalLine, {height:gaps.length > 0 ? 60 * (gaps.length + 1) : 60, left: gaps.length == 0 ? 262 : 253 })}/>);
        
        let latestNEarliestSync = (
            <div>
                <Row style={{marginLeft: '0px'}}>
                    <Col md={6} style={fieldProps.syncSuccessInfo}>
                        <i style = {{fontSize : '18px', color: 'rgba(0, 133, 200, 1)', display: 'block', float: 'left', marginTop: '10px'}} className="fa fa-circle" aria-hidden="true" />
                        <span style={{display: 'block', float: 'right'}}>Full Sync</span> &nbsp;
                    </Col>
                    <Col md={6} style={Object.assign({}, fieldProps.syncDate, {backgroundColor: 'rgba(215, 235, 242, 1)', width: '190px'})}>
                        &nbsp; Dec 01, 2017  9:30 AM
                    </Col>
                </Row><br/>
                {verticalLine}
                {gaps}
                <Row style={{marginLeft: '0px'}}>
                    <Col md={6} style={fieldProps.syncSuccessInfo}>
                        <i style = {{fontSize : '18px', color: 'rgba(0, 133, 200, 1)', display: 'block', float: 'left', marginTop: '10px'}} className="fa fa-circle" aria-hidden="true" />
                        <span style={{display: 'block', float: 'right'}}>Full Sync</span> &nbsp;
                    </Col>
                    <Col md={6} style={Object.assign({}, fieldProps.syncDate, {backgroundColor: 'rgba(215, 235, 242, 1)', width: '190px'})}>
                        &nbsp; Dec 01, 2017  9:30 AM
                    </Col>
                </Row>
            </div>
        );

        return(
            <div className={"panel panel-default"} style={fieldProps.panelDefault}>
				<HeaderView store={this.props.store} size="big"/>
                <div className={"panel-body"} style={fieldProps.panelBody}>
                    {panelBody}<br/>
                    {latestNEarliestSync}<br/>
                    {syncGapButtons}
                </div>
		  	</div>
        )
    }
}