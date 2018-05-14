import React from 'react';
import ReactDOM from 'react-dom';
import {Row,  Col, Button, Panel, FormControl} from 'react-bootstrap';
import JsonHelper from '../JsonHelper';
import JSZip from 'jszip';
import { toJS } from 'mobx';
import filesaver from '../FileSaver';
import BackChainActions from '../BackChainActions';
import { Scrollbars } from 'react-custom-scrollbars';
const intersect = require('object.intersect');

export default class DiffView extends React.Component {
  constructor(props) {
    super(props);
    this.findPartnerEntName = this.findPartnerEntName.bind(this);
    this.state = {
      partnerEntName: null,
      activeBtIdIndex: 0,
      currentTabContentId : null,
      currentTabName: null,
      resetTabsName: []
    };
  }

  componentDidMount() {
    BackChainActions.populateBusinessTransactionIds(null);
    document.getElementById("defaultOpen").click();
  }

  toggleActiveBtId(position, businessTransactionId) {
    if (this.state.activeBtIdIndex === position) {
      return;
    }
    this.setState({activeBtIdIndex : position})
    
    for (let i = 0; i < this.props.store.listBusinessTransactionIds.length; i++) {
      if(this.props.store.listBusinessTransactionIds[i] === businessTransactionId) {
        this.openTab(this.state.currentTabContentId, this.props.store.listEnterpriseBusinessTransactions[i], this.props.store.listIntersectionBusinessTransactions[i], this.state.resetTabsName, this.state.currentTabName);
        break;
      }
    }
  }

  setActiveBtIdColor(position) {
    if (this.state.activeBtIdIndex === position) {
      return "lightgray";
    }
    return "";
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

  onBtIdChange(event) {
    this.setState({activeBtIdIndex : 0});
    BackChainActions.populateBusinessTransactionIds(event.target.value.trim());
  }


  findPartnerEntName(partnerViewObj) {
    let transactionSlice = partnerViewObj.transactionSlice;
    let entNameOfLoggedUser = this.props.store.entNameOfLoggedUser;
    let indexOfMyEntName = transactionSlice.enterprises.indexOf(entNameOfLoggedUser);
    this.state.partnerEntName = indexOfMyEntName == 0 ? transactionSlice.enterprises[1]:transactionSlice.enterprises[0];
  }

  openTab(currentTabContentId, myViewObj, partnerViewObj, resetTabsName, currentTabName) {
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

    /*TODO@Pankaj Below is temporary check once docs part is clear remove it */
    if(myViewObj == null || partnerViewObj == null) {
      return;
    }
    
    if(currentTabContentId === 'Diff') {
      JsonHelper.diffUsingJS(myViewObj, partnerViewObj);
    } else if (currentTabContentId === 'Common') {
      let common = intersect(myViewObj, partnerViewObj);
      JsonHelper.showCommon(common);
    } else if (currentTabContentId === 'Docs') {

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
        width: '190px'
      },
      tablinks: {
        borderTopLeftRadius: '8px',
        borderTopRightRadius:'8px',
        height : '27px',
        lineHeight : '27px',
        textAlign : 'center',
        cursor: 'pointer'
      }
    };

    let btIds = this.props.store.businessTransactionIds;
    let btIdsListUI = [];

    for (let i = 0; i < btIds.length; i++) {
      btIdsListUI.push(<tr key={btIds[i]} onClick={this.toggleActiveBtId.bind(this, i, btIds[i])} onMouseOver={this.onHoverBtId.bind(this)} onMouseOut = {this.onHoverOutBtId.bind(this, i)} style={{cursor:'pointer', borderBottom:'1px solid gray', backgroundColor: this.setActiveBtIdColor(i)}}>
                      <td style={{lineHeight:'0.8'}}>
                        {btIds[i]}
                      </td>
                    </tr>);
    }

    const tabContents = (<Row style={{marginLeft: '0px'}}>
                            <Col xs={1} className="tablinks diffTab" onClick={(e) => this.openTab('Diff', this.props.store.listEnterpriseBusinessTransactions[0], this.props.store.listIntersectionBusinessTransactions[0], ['commonTab', 'docsTab'], 'diffTab')} id="defaultOpen" style={Object.assign({}, styles.tablinks, {color:'white', backgroundColor:'rgba(0, 133, 200, 1)'})}>
                              <span style={{verticalAlign : 'sub'}}>Difference</span>
                            </Col>
                            <Col xs={2} className="tablinks commonTab" onClick={(e) => this.openTab('Common', this.props.store.listEnterpriseBusinessTransactions[0], this.props.store.listIntersectionBusinessTransactions[0], ['diffTab', 'docsTab'], 'commonTab')} style={Object.assign({}, styles.tablinks, {marginLeft:'2px', width:'auto',color:'#646464', backgroundColor : 'rgba(228, 228, 228, 1)'})}>
                              <span className="fa-stack">
                                <i className="fa fa-circle-o fa-stack-1x" aria-hidden="true"></i>
                                <i className="fa fa-circle-o fa-stack-1x" aria-hidden="true" style={{paddingLeft: '10px'}}></i>
                              </span>
                              <span> Common Elements with {this.state.partnerEntName}</span>
                            </Col>
                            <Col xs={2} className="tablinks docsTab" onClick={(e) => this.openTab('Docs', null, null, ['diffTab', 'commonTab'], 'docsTab')} style={Object.assign({}, styles.tablinks, {marginLeft:'2px', width:'auto',color:'#646464', backgroundColor : 'rgba(228, 228, 228, 1)'})}>
                                <span style={{verticalAlign : 'sub'}}>Documents</span>
                            </Col>
                            <div style={{maxWidth: '77.4%', marginLeft: '215px', marginTop: '27px'}}>
                              <div id='Diff' style={{'borderTop': '2px solid rgb(0, 133, 200)'}} className="tabcontent">
                                  <Scrollbars id="diffoutput" style={{'overflow': 'scroll', height: contentHeight }}></Scrollbars>
                              </div>
                              <div id='Common' className="tabcontent">
                                  <pre id="json-renderer" style={styles.jsonPanel}></pre>
                              </div>
                              <div id='Docs' className="tabcontent">
                                  <pre style={styles.jsonPanel}></pre>
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
                {btIdsListUI}
              </tbody>
            </table>
          </div>
        </div>

        {tabContents}
      </div>
    </div>;

    return (<div className={"panel panel-default"} style={styles.panel}>
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
  </div>);
  }

}