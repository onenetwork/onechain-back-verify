import React from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel, FormControl, OverlayTrigger, Popover} from 'react-bootstrap';
import JsonHelper from '../JsonHelper';
import JSZip from 'jszip';
import { toJS } from 'mobx';
import BackChainActions from '../BackChainActions';
import { Scrollbars } from 'react-custom-scrollbars';
import {ListDocuments} from './MyView';
import {requestHelper} from '../RequestHelper';
const intersect = require('object.intersect');

@observer export default class DiffView extends React.Component {
  constructor(props) {
    super(props);
    this.findPartnerEntName = this.findPartnerEntName.bind(this);
    this.state = {
      btIdsListUI:[],
      activeBtIdIndex: 0,
      partnerEntName: null,
      currentTabName: 'diffTab',
      indexOfBusinessTranction: 0,
      currentTabContentId : 'Diff',
      resetTabsName: ['commonTab', 'docsTab']
    };
  }

  componentDidMount() {
    this.listBusinessTransactionIds();
    document.getElementById("defaultOpen").click();
  }

  toggleActiveBtId(position, businessTransactionId, indexOfBusinessTranction) {
    if (this.state.activeBtIdIndex === position) {
      return;
    }
    this.setState({activeBtIdIndex : position, indexOfBusinessTranction: indexOfBusinessTranction})
  }

  setActiveBtIdColor(position) {
    return this.state.activeBtIdIndex === position ? "lightgray" : "";
  }

  onHoverBtId(event) {
    event.currentTarget.style.backgroundColor = 'lightgray';
  }

  onHoverOutBtId(position, event) {
    if (this.state.activeBtIdIndex === position) {
      return;
    }
    event.currentTarget.style.backgroundColor = 'white';
  }

  listBusinessTransactionIds(businessTransactionId) {
    let btIdsArr=[];
    this.state.btIdsListUI.splice(0, this.state.btIdsListUI.length);
    let businessTransactionIdRegEx = new RegExp("^" + businessTransactionId + ".*$");
    let businessTransactions = this.props.store.viewTransactions.enterprise.transactionSlice.businessTransactions;
    
    if(businessTransactionId) {
      let indexOfBusinessTranction = 0;
      for (let i = 0; i < businessTransactions.length; i++) {
        if((businessTransactions[i].btid.toString()).match(businessTransactionIdRegEx)) {
          indexOfBusinessTranction = i;
          btIdsArr.push(businessTransactions[i].btid);
        }
      }
      if(this.state.btIdsListUI.length == 1) {
        this.setState({indexOfBusinessTranction: indexOfBusinessTranction});
      }
    } else {
      for (let i = 0; i < businessTransactions.length; i++) {
        btIdsArr.push(businessTransactions[i].btid);
      }
    }
    this.setState({btIdsListUI: btIdsArr});
  }

  onBtIdChange(event) {
    this.setState({activeBtIdIndex : 0});
    this.listBusinessTransactionIds(event.target.value.trim());
  }

  findPartnerEntName(partnerViewObj) {
    let transactionSlice = partnerViewObj.transactionSlice;
    let entNameOfLoggedUser = this.props.store.entNameOfLoggedUser;
    let indexOfMyEntName = transactionSlice.enterprises.indexOf(entNameOfLoggedUser);
    this.state.partnerEntName = indexOfMyEntName == 0 ? transactionSlice.enterprises[1]:transactionSlice.enterprises[0];
  }

  openTab(currentTabContentId, resetTabsName, currentTabName) {
    // Declare all variables
    let i, tabcontent, tablinks;
    this.state.currentTabContentId = currentTabContentId;
    this.state.currentTabName = currentTabName;
    this.state.resetTabsName = resetTabsName;
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(currentTabContentId).style.display = "block";
    this.findPartnerEntName(this.props.store.viewTransactions.intersection);

    let currentTabElement = document.getElementsByClassName(currentTabName)[0];
    currentTabElement.className += " active";
    currentTabElement.style.backgroundColor = 'rgba(0, 133, 200, 1)';
    currentTabElement.style.color = 'white';

    for(let i = 0; i < resetTabsName.length; i++) {
      let element = currentTabElement.parentElement.getElementsByClassName(resetTabsName[i])[0];
      element.style.backgroundColor = 'rgba(228, 228, 228, 1)';
      element.style.color = '#646464';
    }

    if (currentTabName === 'docsTab') {
      BackChainActions.verifyDocumentHashes(this.props.store.viewTransactions.intersection.transactionSlice.businessTransactions[this.state.indexOfBusinessTranction].Attachments);
    }
  }

  render() {
    const contentHeight = window.innerHeight - 237;
    const { store } = this.props;

    const styles = {
      panelHeading : {
        borderTopRightRadius: '10px',
        borderTopLeftRadius: '10px',
        backgroundColor: 'white'
      },
      panelTitle : {
        fontWeight: 'bold',
        display: 'inline-block',
        color: '#646464'
      },
      panel : {
        backgroundColor: 'rgba(250, 250, 250, 1)',
        marginBottom: '0px',
        borderRadius: '10px'
      },
      panelBody : {
        padding: 20,
        borderBottomRightRadius: '10px',
        borderBottomLeftRadius: '10px'
      },
      jsonPanel : {
        backgroundColor: 'white',
        paddingLeft: '4em',
        paddingRight: '1.5em',
        borderTopWidth: '2px',
        borderTopColor: 'rgba(0, 133, 200, 1)',
        borderRadius: 'unset',
        height: contentHeight
      },
      btIdSearchInput: {
        width: '215px', 
        paddingLeft: '10px'
      },
      btidTblDiv: {
        border: '1px solid #ccc',
        backgroundColor: 'white',
        height: (contentHeight-12),
        paddingLeft: '0px',
        marginRight: '35px',
        marginTop: '5px',
        width: '190px',
        overflowX: 'hidden',
        overflowY: 'scroll'
      },
      tablinks: {
        borderTopLeftRadius: '8px',
        borderTopRightRadius:'8px',
        height : '27px',
        lineHeight : '27px',
        textAlign : 'center'
      }
    };

    let btIdRows = [];
    for (var i = 0; i < this.state.btIdsListUI.length; i++) {
      btIdRows.push(<tr key={this.state.btIdsListUI[i]} onClick={this.toggleActiveBtId.bind(this, i, this.state.btIdsListUI[i], i)} onMouseOver={this.onHoverBtId.bind(this)} onMouseOut={this.onHoverOutBtId.bind(this, i)} style={{ cursor: 'pointer', borderBottom: '1px solid gray', backgroundColor: this.setActiveBtIdColor(i) }}>
        <td style={{ lineHeight: '0.8' }}>
          <OverlayTrigger
            trigger={['hover', 'focus']}
            placement="top"
            overlay={<Popover className="bt-id-popover" id={this.state.btIdsListUI[i] + i} > {this.state.btIdsListUI[i]}</Popover>}>
            <span>{this.state.btIdsListUI[i]}</span>
          </OverlayTrigger>
        </td>
      </tr>);
    }

    JsonHelper.diffUsingJS(this.props.store.viewTransactions.enterprise.transactionSlice.businessTransactions[this.state.indexOfBusinessTranction], this.props.store.viewTransactions.intersection.transactionSlice.businessTransactions[this.state.indexOfBusinessTranction]);
    let common = intersect(this.props.store.viewTransactions.enterprise.transactionSlice.businessTransactions[this.state.indexOfBusinessTranction], this.props.store.viewTransactions.intersection.transactionSlice.businessTransactions[this.state.indexOfBusinessTranction]);
    JsonHelper.showCommon(common);
    
    let displayBusinessTransaction = this.props.store.viewTransactions.intersection.transactionSlice.businessTransactions[this.state.indexOfBusinessTranction];
    
    let docsTab = (displayBusinessTransaction.Attachments && Object.getOwnPropertyNames(displayBusinessTransaction.Attachments).length > 0) ? 
                      (<Col xs={2} className="tablinks docsTab" onClick={(e) => this.openTab('Docs', ['diffTab', 'commonTab'], 'docsTab')} style={Object.assign({}, styles.tablinks, {cursor: 'pointer', marginLeft:'2px', width:'auto',color:'#646464', backgroundColor : 'rgba(228, 228, 228, 1)'})}>
                        <span style={{verticalAlign : 'sub'}}>Documents</span>
                      </Col>) : 
                      (<Col xs={2} style={Object.assign({opacity: 0.5}, styles.tablinks, {cursor: 'not-allowed', marginLeft:'2px', width:'auto',color:'#646464', backgroundColor : 'rgba(228, 228, 228, 1)'})}>
                        <span style={{verticalAlign : 'sub'}}>Documents</span>
                      </Col>);

    const tabContents = (<Row style={{marginLeft: '0px'}}>
                            <Col xs={1} className="tablinks diffTab" onClick={(e) => this.openTab('Diff', ['commonTab', 'docsTab'], 'diffTab')} id="defaultOpen" style={Object.assign({}, styles.tablinks, {cursor: 'pointer', color:'white', backgroundColor:'rgba(0, 133, 200, 1)'})}>
                              <span style={{verticalAlign : 'sub'}}>Difference</span>
                            </Col>
                            <Col xs={2} className="tablinks commonTab" onClick={(e) => this.openTab('Common', ['diffTab', 'docsTab'], 'commonTab')} style={Object.assign({}, styles.tablinks, {cursor: 'pointer', marginLeft:'2px', width:'auto',color:'#646464', backgroundColor : 'rgba(228, 228, 228, 1)'})}>
                              <span className="fa-stack">
                                <i className="fa fa-circle-o fa-stack-1x" aria-hidden="true"></i>
                                <i className="fa fa-circle-o fa-stack-1x" aria-hidden="true" style={{paddingLeft: '10px'}}></i>
                              </span>
                              <span> Common Elements with {this.state.partnerEntName}</span>
                            </Col>
                            {docsTab}
                            <div style={{maxWidth: '77.4%', marginLeft: '215px', marginTop: '27px'}}>
                              <div id='Diff' style={{'borderTop': '2px solid rgb(0, 133, 200)'}} className="tabcontent">
                                  <Scrollbars id="diffoutput" style={{'overflow': 'scroll', height: contentHeight }}></Scrollbars>
                              </div>
                              <div id='Common' className="tabcontent">
                                  <pre id="json-renderer" style={styles.jsonPanel}></pre>
                              </div>
                              <div id='Docs' className="tabcontent">
                                <pre style={Object.assign(styles.jsonPanel, {padding:'0em'})}>
                                  <ListDocuments store={this.props.store} attachmentsData={displayBusinessTransaction.Attachments}/>
                                </pre>
                              </div>
                            </div>
                        </Row>);

    const panelBody = <div style={styles.panelBody}>
      <p style={{fontSize: '12px', color: '#646464'}}>
        <strong>Transaction ID:</strong> <span>{store.viewTransactions.enterprise.id}</span>
      </p>
      <p></p>
      
      <div className={"row"} style={{marginBottom: '6px', marginTop: '3px'}}>
        <div className={"col-md-2"} style={styles.btIdSearchInput}>
          <FormControl type="text" onChange={this.onBtIdChange.bind(this)} placeholder="Search for BTID" />
          <div className={"table-responsive"} style={styles.btidTblDiv}>
            <table className={"table"}>
              <tbody>
                {btIdRows}
              </tbody>
            </table>
          </div>
        </div>

        {tabContents}
      </div>
    </div>;

    return (<div>
      <style>
        {`
          .bt-id-popover .arrow{
            left: 50px !important;
          }
          .bt-id-popover {
            left:155.438px !important;
          }
      `}
      </style>
      <div className={"panel panel-default"} style={styles.panel}>
      <div className={"panel-heading"} style={styles.panelHeading}>
        <div className="panel-title" style={styles.panelTitle}>Event Details:
          <span style= {{color:'rgb(0, 133, 200)'}} className="fa-stack">
            <i className="fa fa-circle-o fa-stack-1x" aria-hidden="true"></i>
            <i className="fa fa-circle-o fa-stack-1x" aria-hidden="true" style={{paddingLeft: '10px'}}></i>
          </span>
          <span style= {{color:'rgb(0, 133, 200)'}}>{this.state.partnerEntName} Intersection</span>
        </div>
        <i onClick={() => BackChainActions.setMyAndDiffViewActive(false)} className="fa fa-times" aria-hidden="true" style={{float: 'right', cursor: 'pointer', color: '#646464', fontSize: '21px'}}/>
      </div>
      {panelBody}
  </div></div>);
  }
}