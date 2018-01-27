import React from 'react';
import ReactDOM from 'react-dom';
import {Row,  Col, Button, Panel} from 'react-bootstrap';
import JsonHelper from '../JsonHelper';
import JSZip from 'jszip';
import filesaver from '../FileSaver';
import BackChainActions from '../BackChainActions';
import { Scrollbars } from 'react-custom-scrollbars';
const intersect = require('object.intersect');

export default class DiffView extends React.Component {
  constructor(props) {
    super(props);
    this.findPartnerEntName = this.findPartnerEntName.bind(this);
		this.state = {
      partnerEntName: null
    };
  }

  componentDidMount() {
    document.getElementById("defaultOpen").click();
    this.findPartnerEntName(this.props.store.viewTransactions.intersection);
  }

  findPartnerEntName(partnerViewObj) {
    let transactionSlice = partnerViewObj.transactionSlice;
    let entNameOfLoggedUser = this.props.store.entNameOfLoggedUser;
    let indexOfMyEntName = transactionSlice.enterprises.indexOf(entNameOfLoggedUser);
    this.state.partnerEntName = indexOfMyEntName == 0 ? transactionSlice.enterprises[1]:transactionSlice.enterprises[0];
  }

  openTab(tabName, myViewObj, partnerViewObj, evt) {
    // Declare all variables
    let i, tabcontent, tablinks;

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
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    evt.currentTarget.style.backgroundColor = 'rgba(0, 133, 200, 1)';
    evt.currentTarget.style.color = 'white';

    var copymyView = JSON.parse(JSON.stringify(myViewObj));
    var copypartnerView = JSON.parse(JSON.stringify(partnerViewObj));
    delete copymyView.transactionSlice['type'];
    delete copymyView.transactionSlice['sequence'];
    delete copymyView.transactionSlice['enterprise'];
    delete copymyView.transactionSlice['enterprises'];
    delete copypartnerView.transactionSlice['type'];
    delete copypartnerView.transactionSlice['sequence'];
    delete copypartnerView.transactionSlice['enterprise'];
    delete copypartnerView.transactionSlice['enterprises'];

    if(tabName === 'Diff') {
      let element = evt.currentTarget.parentElement.getElementsByClassName('commonTab')[0];
      element.style.backgroundColor = 'rgba(228, 228, 228, 1)';
      element.style.color = '#646464';
      JsonHelper.diffUsingJS(copymyView, copypartnerView, this.state.partnerEntName);
    }
    else if (tabName === 'Common') {
      let element = evt.currentTarget.parentElement.getElementsByClassName('diffTab')[0];
      element.style.backgroundColor = 'rgba(228, 228, 228, 1)';
      element.style.color = '#646464';
      let common = intersect(copymyView, copypartnerView);
      JsonHelper.showCommon(common);
    }
  }

  render() {
    let fieldProps = {
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
        height: '700px'
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

    let panelBody = (
      <div style={fieldProps.panelBody}>
        <p style={{fontSize: '12px', color: '#646464'}}>
          <strong>Transaction ID:</strong> <span>{this.props.store.viewTransactions.enterprise.id}</span>
        </p>
        <p></p>
        <Row style={{marginLeft: '0px'}}>
            <Col xs={1} className="tablinks diffTab" onClick={(e) => this.openTab('Diff', this.props.store.viewTransactions.enterprise, this.props.store.viewTransactions.intersection, e)} id="defaultOpen" style={Object.assign({},fieldProps.tablinks,{color:'white', backgroundColor:'rgba(0, 133, 200, 1)'})}>
              <span style={{verticalAlign : 'sub'}}>Difference</span>
            </Col>
            <Col xs={2} className="tablinks commonTab" onClick={(e) => this.openTab('Common', this.props.store.viewTransactions.enterprise, this.props.store.viewTransactions.intersection, e)} style={Object.assign({},fieldProps.tablinks,{marginLeft:'2px', width:'auto',color:'#646464', backgroundColor : 'rgba(228, 228, 228, 1)'})}>
              <span className="fa-stack">
                <i className="fa fa-circle-o fa-stack-1x" aria-hidden="true"></i>
                <i className="fa fa-circle-o fa-stack-1x" aria-hidden="true" style={{paddingLeft: '10px'}}></i>
              </span>
              <span> Common Elements with {this.state.partnerEntName}</span>
            </Col>
        </Row>
        <div id='Diff' className="tabcontent">
            <Scrollbars id="diffoutput" style={{'overflow': 'scroll', height: 700}}></Scrollbars>
        </div>
        <div id='Common' className="tabcontent">
            <pre id="json-renderer" style={fieldProps.jsonPanel}></pre>
        </div>
      </div>
    );

    return (
      <div className={"panel panel-default"} style={fieldProps.panel}>
        <div className={"panel-heading"} style={fieldProps.panelHeading}>
          <div className="panel-title" style={fieldProps.panelTitle}>Event Details:
            <span style= {{color:'rgb(0, 133, 200)'}} className="fa-stack">
              <i className="fa fa-circle-o fa-stack-1x" aria-hidden="true"></i>
              <i className="fa fa-circle-o fa-stack-1x" aria-hidden="true" style={{paddingLeft: '10px'}}></i>
            </span>
            <span style= {{color:'rgb(0, 133, 200)'}}>{this.state.partnerEntName} Intersection</span>
          </div>
          <i onClick={() => BackChainActions.setMyAndDiffViewActive(false)} className="fa fa-times" aria-hidden="true" style={{float: 'right', cursor: 'pointer', color: '#646464', fontSize: '21px'}}/>
        </div>
        {panelBody}
      </div>
    );
  }

}
