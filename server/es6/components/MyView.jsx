import React from 'react';
import ReactDOM from 'react-dom';
import { Row, Col, Button, Panel, FormControl, OverlayTrigger, Popover} from 'react-bootstrap';
import JSZip from 'jszip';
import { toJS } from 'mobx';
import JsonHelper from '../JsonHelper';
import filesaver from '../FileSaver';
import BackChainActions from '../BackChainActions';

export default class MyView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      btIdsListUI:[],
      activeBtIdIndex: 0,
      indexOfBusinessTranction: 0
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
    this.setState({activeBtIdIndex : position, indexOfBusinessTranction: indexOfBusinessTranction});
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
    this.state.btIdsListUI.splice(0, this.state.btIdsListUI.length);
    let businessTransactionIdRegEx = new RegExp("^" + businessTransactionId + ".*$");
    let businessTransactions = this.props.store.viewTransactions.enterprise.transactionSlice.businessTransactions;
    
    if(businessTransactionId) {
      let indexOfBusinessTranction = 0;
      for (let i = 0; i < businessTransactions.length; i++) {
        if((businessTransactions[i].btid.toString()).match(businessTransactionIdRegEx)) {
          indexOfBusinessTranction = i;
          this.state.btIdsListUI.push( businessTransactions[i].btid );
        }
      }
      if(this.state.btIdsListUI.length == 1) {
        this.setState({indexOfBusinessTranction: indexOfBusinessTranction});
      }
    } else {
      for (let i = 0; i < businessTransactions.length; i++) {
        this.state.btIdsListUI.push(businessTransactions[i].btid);
      }
    }
  }

  onBtIdChange(event) {
    this.setState({activeBtIdIndex : 0});
    this.listBusinessTransactionIds(event.target.value.trim());
  }

  openTab(tabName, evt) {
    let i, tabcontent, tablinks;
    
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    // Show the current tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.style.backgroundColor = 'rgba(0, 133, 200, 1)';
    evt.currentTarget.style.color = 'white';

    if(tabName === 'TnxMsg') {
      let element = evt.currentTarget.parentElement.getElementsByClassName('docsTab')[0];
      element.style.backgroundColor = 'rgba(228, 228, 228, 1)';
      element.style.color = '#646464';
    } else if (tabName === 'Docs') {
      let element = evt.currentTarget.parentElement.getElementsByClassName('tnxMsgTab')[0];
      element.style.backgroundColor = 'rgba(228, 228, 228, 1)';
      element.style.color = '#646464';
    }
  }

  render() {
    const contentHeight = window.innerHeight - 300;
    const styles = {
      panelHeading: {
        borderTopRightRadius: '10px',
        borderTopLeftRadius: '10px',
        backgroundColor: 'white'
      },
      panelTitle: {
        fontWeight: 'bold',
        display: 'inline-block',
        color: '#646464'
      },
      panel: {
        backgroundColor: 'rgba(250, 250, 250, 1)',
        marginBottom: '0px',
        borderRadius: '10px'
      },
      panelBody: {
        padding: 20,
        borderBottomRightRadius: '10px',
        borderBottomLeftRadius: '10px'
      },
      jsonPanel: {
        marginBottom: '20px',
        backgroundColor: 'white',
        paddingLeft: '1.5em',
        width: '74%',
        borderTopWidth: '2px',
        borderTopColor: 'rgb(0, 133, 200)',
        borderTopLeftRadius: '0px',
        height: (contentHeight + 13)
      },
      btidTblDiv: {
        border: '1px solid #ccc',
        backgroundColor: 'white',
        height: contentHeight,
        paddingLeft: '0px',
        marginRight: '35px',
        marginTop: '5px',
        width: '190px',
        overflowX: 'hidden',
        overflowY:'scroll'
      },
      selectBtIdLabel: {
        fontSize: '12.2px', 
        color: '#646464', 
        marginLeft: '-5px'
      },
      btIdSearchInput: {
        width: '215px', 
        paddingLeft: '10px'
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
      btIdRows.push(<tr key={this.state.btIdsListUI[i]} onClick={this.toggleActiveBtId.bind(this, i, this.state.btIdsListUI[i], i)} onMouseOver={this.onHoverBtId.bind(this)} onMouseOut = {this.onHoverOutBtId.bind(this, i)} style={{cursor:'pointer', borderBottom:'1px solid gray', backgroundColor: this.setActiveBtIdColor(i)}}>
                                      <td style={{lineHeight:'0.8'}}>
                                          <OverlayTrigger
                                            trigger={['hover', 'focus']}
                                            placement="top"
                                            overlay={<Popover className="bt-id-popover" id={this.state.btIdsListUI[i] + i} > {this.state.btIdsListUI[i]}</Popover>}>
                                            <span>{this.state.btIdsListUI[i]}</span>
                                          </OverlayTrigger>
                                      </td>
                                    </tr>);
    }

    let displayBusinessTransaction = this.props.store.viewTransactions.enterprise.transactionSlice.businessTransactions[this.state.indexOfBusinessTranction];
    JsonHelper.showCommon(displayBusinessTransaction);
    
    let docsTab = (displayBusinessTransaction.Attachments && Object.getOwnPropertyNames(displayBusinessTransaction.Attachments).length > 0) ? 
                      (<Col xs={2} className="tablinks docsTab" onClick={(e) => this.openTab('Docs', e)} style={Object.assign({}, styles.tablinks, {cursor: 'pointer', marginLeft:'2px', width:'auto',color:'#646464', backgroundColor : 'rgba(228, 228, 228, 1)'})}>
                        <span style={{verticalAlign : 'sub'}}>Documents</span>
                      </Col>) : 
                      (<Col xs={2} style={Object.assign({opacity: 0.5}, styles.tablinks, {cursor: 'not-allowed', marginLeft:'2px', width:'auto',color:'#646464', backgroundColor : 'rgba(228, 228, 228, 1)'})}>
                        <span style={{verticalAlign : 'sub'}}>Documents</span>
                      </Col>);

    const tabContents = (<Row style={{marginLeft: '0px'}}>
                              <Col xs={1} className="tablinks tnxMsgTab" onClick={(e) => this.openTab('TnxMsg', e)} id="defaultOpen" style={Object.assign({}, styles.tablinks, {color:'white', cursor: 'pointer', backgroundColor:'rgba(0, 133, 200, 1)', width:'19%'})}>
                                <span style={{verticalAlign : 'sub'}}>Transaction Message</span>
                              </Col>
                              {docsTab}
                              <div id='TnxMsg' className="tabcontent">
                                <pre id="json-renderer" style={styles.jsonPanel}></pre>
                              </div>
                              <div id='Docs' className="tabcontent">
                                <pre style={Object.assign(styles.jsonPanel, {padding:'0em'})}>
                                  <ListDocuments attachmentsData={displayBusinessTransaction.Attachments}/>
                                </pre>
                              </div>
                          </Row>);

    return (<div>
            <style>
              {`
                  .bt-id-popover .arrow{
                    left: 50px !important;

                  }
                  .bt-id-popover {
                    left:223.438px !important;
                  }
                `}
              </style>
              <div className={"panel panel-default"} style={styles.panel}>
              <div className={"panel-heading"} style={styles.panelHeading}>
                <div className="panel-title" style={styles.panelTitle}>Event Details: My View</div>
                <i onClick={() => BackChainActions.setMyAndDiffViewActive(false)} className="fa fa-times" aria-hidden="true" style={{float: 'right', cursor: 'pointer', color: '#646464', fontSize: '21px'}}/>
              </div>
              <div className={"panel-body"} style={styles.panelBody}>
                <p style={{fontSize: '12px', color: '#646464'}}>
                  <strong>Transaction ID:</strong> <span>{this.props.store.viewTransactions.enterprise.id}</span>
                </p>
                <br/>
                <span style={styles.selectBtIdLabel}>
                  <i style={{fontSize: '14px', color: '#999999'}} className="fa fa-search" aria-hidden="true" />
                  &nbsp;Select Business Transaction ID:
                </span>

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
              </div>
    </div></div>);
  }
}

export const ListDocuments = (props) => {
  let attachmentsDataUI = [];
  let attachmentsData = props.attachmentsData;
  function downloadFileByName(docName, fileName, event) {
    window.open('/downloadViewDocument/'+ docName + '/' + fileName, "_self");
  }

  function onHoverFileRow(event) {
    event.currentTarget.style.backgroundColor = 'lightgray';
  }

  function onHoverOutFileRow(event) {
    event.currentTarget.style.backgroundColor = 'white';
  }

  function matchIdWithFileName(id) {
    id = id.replace("/", "_");
    return id;
  }

  for (let key in attachmentsData) {
    if (attachmentsData.hasOwnProperty(key)) {
      let attachmentsArray = attachmentsData[key];

      for(let i = 0; i < attachmentsArray.length; i++) {
        attachmentsDataUI.push(
          <tr key={attachmentsArray[i].id} onMouseOver={onHoverFileRow.bind(this)} onMouseOut={onHoverOutFileRow.bind(this)} onClick={downloadFileByName.bind(this, matchIdWithFileName(attachmentsArray[i].id), attachmentsArray[i].name)} style={{borderBottom:'2px solid #ddd', cursor:'pointer'}}>
              <td style={{lineHeight:'1.3', fontSize: '14px', paddingLeft: '30px'}}>
                <i style = {{color: '#999999', fontSize: '16px'}} className="fa fa-file-text"/>&nbsp;&nbsp;{attachmentsArray[i].name}
              </td>
              <td style={{lineHeight:'1.3', paddingRight: '30px'}}>
                <i style = {{color: '#229978', fontSize: '16px'}} className="fa fa-check-circle"/>
              </td>
          </tr> );
      }
    }
  }

	return (
          <div className={"table-responsive"}>
            <table className={"table"}>
                <tbody>
                  {attachmentsDataUI}
                </tbody>
            </table>
          </div>
	)
}
