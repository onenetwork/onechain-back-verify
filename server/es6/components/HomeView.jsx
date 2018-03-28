import React from 'react';
import { observer } from 'mobx-react';
import {Row,  Col, Button, Panel,Tooltip,OverlayTrigger,Modal} from 'react-bootstrap';
import { Link, Redirect } from 'react-router-dom';
import BackChainActions from '../BackChainActions';
import HeaderView from "./HeaderView";
import '../../public/css/homePage.css';
import DBSyncView from "./DBSyncView";
import Images from '../Images';

@observer export default class HomeView extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    BackChainActions.isInitialSyncDone();
    BackChainActions.processApplicationSettings();
    BackChainActions.syncStatisticsInfo();
  }

  divClick(callBack) {
    // TODO@Ravi : somehow call back is coming in this function when close button of modal is clicked
    // so given a name to button
    if(callBack.target.name!="closeModal") {
      BackChainActions.toggleDBSyncModalViewActive();
    }
  }

  render() {
    let syncPop = '';
    syncPop = <StartSyncViewModal store={this.props.store} />

    if(this.props.store.isInitialSetupDone === null) {
      return null;
    } else if(this.props.store.isInitialSetupDone === false) {
      return <Redirect push to="/setup" />;
    }
    let fieldProps = {
      panelPadding : {
        backgroundColor : 'rgba(208, 233, 240, 1)',
        width: '103%',
        height: '100%',
        borderRadius: '10px'
      },
      panelBodyTitle : {
        paddingLeft: '20px',
        fontSize: '24px',
        color: '#515151'
      },
      panelBody : {
        padding: '70px 0px 20px 80px',
        backgroundColor: 'white'
      },
      button : {
        height: '100px'
      },
      panelDefault : {
        borderStyle : 'none'
      },
      dbNsyncIcon : {
        backgroundColor: 'white',
        marginTop: '28px',
        width: '70px',
        height: '70px',
        borderRadius: '5px',
        cursor: 'pointer'
      }
    };

    const businessTransImage = this.props.store.isInitialSyncDone == true ? Images.BUSINESS_TRANSACTION : Images.BUSINESS_TRANSACTION_DISABLED;
    let className =  "span ";
    let activeOrInactiveClassName = this.props.store.isInitialSyncDone == true ? 'activeSpan' : 'inActiveSpan';
    let descriptiveClassName = this.props.store.isInitialSyncDone == true ? 'activeDescriptive' : 'inActiveDescriptive';
    let innerDiv = this.props.store.isInitialSyncDone == true ? 'innerDiv' : 'innerDivinActive';
    let linkUrl  =  this.props.store.isInitialSyncDone == true ? "/businessId":"#";
    let linkUrlStyle = {cursor: "pointer"};
    if(linkUrl=="#") {
      linkUrlStyle =  {cursor: "default"};
    }
    let businessTxnId = (<div  className = "mainDiv"  style={{paddingTop: '27px'}}>
            <Link style={linkUrlStyle}  to={linkUrl}>
               <div className={innerDiv}>
                <img  style={{paddingLeft: '52px',paddingTop: '5px'}} src ={businessTransImage}/><br/><br/>
                <span className = {className+activeOrInactiveClassName} >Business Transaction ID</span> <br/>
                <p className = {descriptiveClassName}>
                  This search returns all the transactions associated with the given Business transaction Id and the transactions shall be verified with Block Chain. Business transaction id can be found in a Payload file. This search will require the transactions to be existing in the local repository.
                </p>
              </div>
            </Link>
          </div>);

    const transIdImage = this.props.store.isInitialSyncDone == true ? Images.TRANSACTION : Images.TRANSACTION_DISABLED;
    linkUrl  =  this.props.store.isInitialSyncDone == true ? "/transactionId":"#"
    className =  "span transSearch ";
    let txnId = (<div className = "mainDiv" style={{paddingTop: '27px'}}>
            <Link style={linkUrlStyle}   to={linkUrl}>
              <div className={innerDiv}>
                <img  style={{paddingLeft: '52px',paddingTop: '5px'}} src= {transIdImage}/><br/><br/>
                <span className = {className+activeOrInactiveClassName}>Transaction ID</span> <br/>
                <p className = {descriptiveClassName}>
                  This search returns the transaction associated with the given transaction Id and the transaction shall be verified with Block Chain. Transaction id can be found in a Payload file. This search will require the transaction to be existing in the local repository.
                </p>
              </div>
            </Link>
          </div>);

    className =  "span payload ";
    let payload = (<div className = "mainDiv" style={{padding: '25px 0px 25px 0px'}}>
            <span className = "dbActiveSpan"></span>
            <Link to="/payload">
              <div  className="innerDiv" >
                <img  style={{paddingLeft: '57px',paddingTop: '5px'}} src={Images.PAYLOAD_FILE} /><br/><br/>
                <span className={className}>Payload File</span> <br/>
                <p className = "activeDescriptive">
                  This feature verifies the payload with Block Chain by hashing the payloads and comparing the values in Block Chain. If the payload information exists in the local repository, then the remaining information regarding the transaction shall be retrieved and verified as well.
                </p>
              </div>
            </Link>
          </div>);

    let iconAssociatedWithDB = null;
    let toolTipText = null;
    let dbSync = "";
    let syncType = null;
    if (!this.props.store.syncStatisticsExists) {
      syncType="notConnected"
      iconAssociatedWithDB = <i style ={{color: '#cb0000', fontSize: '1.2em'}} className="fa fa-ban" aria-hidden="true"></i>;
      toolTipText = "You’re not connected to OneNetwork’s Chain Of Custody to get transaction data. You can click on the icon and establish a connection.";
      dbSync = <DBSyncViewModal store={this.props.store} syncType={syncType} />
    } else if(this.props.store.syncStatisticsExists) {
      if(this.props.store.gapExists) {
        syncType="gap";
        iconAssociatedWithDB = <i style ={{color: '#ef941b', fontSize: '1.2em'}} className="fa fa-exclamation-circle" aria-hidden="true"></i>;
        toolTipText = "Your database has gaps of missing data. You can fill those gaps by visiting Sync Statistics page.";
      } else {
        syncType="full";
        iconAssociatedWithDB = <i style ={{color: '#249a79', fontSize: '1.2em'}} className="fa fa-check-circle" aria-hidden="true"></i>;
        toolTipText = "You’re fully synced with OneNetwork’s Chain of Custody.";
      }
      dbSync = <DBSyncViewModal store={this.props.store}  syncType={syncType}/>
    }

    const tooltip = (

      <div id="tooltip" role="tooltip"  className="fade in tooltip top" style={{top: '229px', left: '1014.5px'}}>
        <div className="tooltip-arrow" style={{left: '50%'}}></div>
        <div className="tooltip-inner" style={{backgroundColor: '#208093',textAlign: 'left' }}>{toolTipText}</div>
      </div>
      );

    let dbIcon = (<div onClick={this.divClick}>
                {dbSync}
                <OverlayTrigger  placement="top" overlay={tooltip}>
                <div className="dbNsyncIcon" style={Object.assign({}, {padding: '20px 10px'}, fieldProps.dbNsyncIcon)}>
                <span>
                  <i style ={{color: '#3d82c9', fontSize: '2em', paddingRight: '5px'}} className="fa fa-database" aria-hidden="true"></i>
                  {iconAssociatedWithDB}
                </span>
                </div>
              </OverlayTrigger>
           </div> );

    let syncIcon = (<Link to={"/syncStatistics"}><div className="dbNsyncIcon" style={Object.assign({}, {padding: '15px 8px'}, fieldProps.dbNsyncIcon)}>
              <span style = {{paddingLeft: '13px', color: '#3d82c9'}}>
                <i style ={{fontSize: '2em'}} className="fa fa-refresh" aria-hidden="true"></i>
                <br/>
                <span style = {{fontSize: '11px',fontWeight: '600'}}>Sync Info</span>
              </span>
            </div></Link>);
    /*Note: For now we are not removing text based search related code & SearchByTextView.jsx.*/
    let panelBody = (<div style={{height: '100%', width: '92%'}}>
                <Row style={fieldProps.panelBodyTitle}>Verify my transaction with:</Row><br/>
                <Row style={fieldProps.panelPadding}>
                  <Col style={{float:'Left',paddingLeft:'20px',backgroundColor:'rgba(217, 216, 208, 1)',width:'310px',borderTopLeftRadius:'10px',borderBottomLeftRadius:'10px'}}>{payload}</Col>
                  <Col style={{float:'Left',paddingLeft:'20px'}}>{businessTxnId}</Col>
                  <Col style={{float:'Left',paddingLeft:'20px'}}>{txnId}</Col>
                  <Col style={{float:'Left',paddingLeft:'20px'}}>{dbIcon}</Col>
                  <Col style={{float:'Left',paddingLeft:'20px'}}>{syncIcon}</Col>
                </Row>
            </div>);
        return (
      <div className={"panel panel-default"} style={fieldProps.panelDefault} onClick={this.props.action}>
        <HeaderView store={this.props.store} size="big"/>
        <div className={"panel-body"} style={fieldProps.panelBody}>
          {panelBody}
          {syncPop}
        </div>
        </div>
    );
  }
}

@observer class DBSyncViewModal extends React.Component {
  render() {
    return(<Modal dialogClassName = {"db-sync-modal"} show={this.props.store.dbSyncModalViewActive} onHide={BackChainActions.toggleDBSyncModalViewActive}>
                <DBSyncView store={this.props.store} syncType={this.props.syncType} />
       </Modal>);
  }
}
@observer class StartSyncViewModal extends React.Component {
  render() {
    return(<Modal dialogClassName = {"start-sync-modal"} show={this.props.store.startSyncViewModalActive} onHide={BackChainActions.toggleStartSyncModalView}>
         <StartSyncPopup store={this.props.store} />
      </Modal>);
  }
}

@observer
class StartSyncPopup extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
  let syncPopupBody = "";

  if (this.props.store.syncGoingOn && this.props.store.startSync) {
    syncPopupBody = <SyncRefresh msgs={["Attempting to start synchronization.", "This may take a few minutes."]} btnName="OK" closeModal={this.closeModal} />
  } else if (this.props.store.syncGoingOn == false && this.props.store.syncFailed == false) {
    syncPopupBody = <SyncDone msg={"Your database will begin synchronizing shortly."} btnName="OK" closeModal={this.closeModal}  />
  } else if (this.props.store.syncFailed ) {
    syncPopupBody = <SyncFailed msg={"Couldn't start synchronization. Please try again later!"} btnName="OK" closeModal={this.closeModal}  />
  }
  return syncPopupBody;
  }
}

const SyncRefresh = (props) => {
  let fieldProps = {
    button : {
      height: '35px',
      boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
      fontStyle: 'normal',
      fontSize: '16px'
    }
  }
  return (
    <div>
      <Row style={{ paddingLeft: '90px',paddingTop:'53px'}}>
        <Col style={{color:'#0085C8'}} md={1}><i className="fa fa-refresh fa-spin fa-4x fa-fw"></i></Col>
        <Col style={{paddingLeft:'50px', fontSize:'20px', color:'#515151'}} md={10}>
          {props.msgs.map(i => {
            return <div key={i}>{i}</div>;
          })}
        </Col>
      </Row><br/>
      <Row style={{ paddingBottom: '33px' }}>
        <Col md={5}></Col>
        <Col md={2}>
          <Button bsStyle="primary" onClick={BackChainActions.toggleStartSyncModalView} style={Object.assign({}, fieldProps.button, {width: '80px'})}> {props.btnName} </Button>
        </Col>
      </Row>
    </div>
  )
}

const SyncDone = (props) => {
  let fieldProps = {
    button: {
      height: '35px',
      boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
      fontStyle: 'normal',
      fontSize: '16px'
    }
  }
  return (
    <div>
      <Row style={{ paddingLeft: '90px', paddingTop: '53px'}}>
      <Col style={{color:'#3c763d'}} md={1}><i className="fa fa-check-circle fa-4x fa-fw"></i></Col>
      <Col style={{paddingLeft:'50px', fontSize:'20px', color:'#515151'}} md={10}>
        {props.msg}
      </Col>
    </Row> <br />
    <Row style={{ paddingBottom: '33px' }}>
      <Col md={5}></Col>
      <Col md={2}>
          <Button bsStyle="primary" onClick={BackChainActions.toggleStartSyncModalView} style={Object.assign({}, fieldProps.button, { width: '80px' })}> {props.btnName} </Button>
      </Col>
    </Row>
    </div >
  )
}

const SyncFailed = (props) => {
  let fieldProps = {
    button: {
      height: '35px',
      boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
      fontStyle: 'normal',
      fontSize: '16px'
    }
  }
  return (
    <div>
    <Row style={{ paddingLeft: '90px', paddingTop: '53px'}}>
      <Col style={{color:'#bb0400'}} md={1}><i className="fa fa-times fa-4x fa-fw"></i></Col>
      <Col style={{paddingLeft:'50px', fontSize:'20px', color:'#515151', paddingTop: '12px'}} md={10}>
        {props.msg}
      </Col>
    </Row><br/>
    <Row style={{ paddingBottom: '33px' }}>
      <Col md={5}></Col>
      <Col md={2}>
          <Button bsStyle="primary" onClick={BackChainActions.toggleStartSyncModalView} style={Object.assign({}, fieldProps.button, { width: '80px' })}> {props.btnName} </Button>
      </Col>
      </Row>
    </div>
  )
}
