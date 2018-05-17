import React from 'react';
import ReactDOM from 'react-dom';
import {Row, Col, Button, Panel} from 'react-bootstrap';
import JSZip from 'jszip';

import JsonHelper from '../JsonHelper';
import filesaver from '../FileSaver';
import BackChainActions from '../BackChainActions';

export default class MyView extends React.Component {

  componentDidMount() {
    JsonHelper.showCommon(this.props.store.viewTransactions.enterprise);
  }

  render() {
    const contentHeight = window.innerHeight - 250;
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
        marginRight: '40px',
        marginLeft: '40px',
        marginBottom: '20px',
        backgroundColor: 'white',
        paddingLeft: '1.5em',
        height: contentHeight
      }
    };

    return <div className={"panel panel-default"} style={styles.panel}>
      <div className={"panel-heading"} style={styles.panelHeading}>
        <div className="panel-title" style={styles.panelTitle}>Event Details: My View</div>
        <i onClick={() => BackChainActions.setMyAndDiffViewActive(false)} className="fa fa-times" aria-hidden="true" style={{float: 'right', cursor: 'pointer', color: '#646464', fontSize: '21px'}}/>
      </div>
      <div className={"panel-body"} style={styles.panelBody}>
        <p style={{fontSize: '12px', color: '#646464'}}>
          <strong>Transaction ID:</strong> <span>{this.props.store.viewTransactions.enterprise.id}</span>
        </p>
        <br></br>
        <pre id="json-renderer" style={styles.jsonPanel}></pre>
      </div>
    </div>;
  }
}
