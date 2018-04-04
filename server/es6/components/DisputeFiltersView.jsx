import { observer } from "mobx-react";
import React from 'react';
import { Button, FormControl } from 'react-bootstrap';
import '../../public/css/disputeFiltersView.css';


@observer export default class DisputeFiltersView extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            showFilterTable: false
        };
    }

    showHideAdvancedFilters(value) {
        let me = this;
        me.setState({ showFilterTable: value });
    }
    render() {

        const fieldProps = {
            checkbox: {
                display: 'inline',
                width: '16px',
                height: '15px'
            }
        };

        let filterUI = null;
        if (!this.state.showFilterTable) {
            filterUI = (<div className="more-link-div" onClick={this.showHideAdvancedFilters.bind(this, true)}>
                <i className="fa fa-filter" aria-hidden="true" ></i>
                &nbsp;&nbsp;More
                    &nbsp;&nbsp;<i className="fa fa-angle-down" aria-hidden="true" style={{ fontSize: '16px' }}></i>
            </div>);
        } else {
            filterUI = (<div className="more-link-div" onClick={this.showHideAdvancedFilters.bind(this, false)}>
                <i className="fa fa-filter" aria-hidden="true" ></i>
                &nbsp;&nbsp;Less
                    &nbsp;&nbsp;<i className="fa fa-angle-up" aria-hidden="true" style={{ fontSize: '16px' }}></i>
            </div>);
        }

        let checkBox = (
            <div style={{ display: 'inline', fontWeight: '400', fontStyle: 'normal', fontSize: '13px' }}>
                Show :
                &nbsp;&nbsp;
                <FormControl type="checkbox" style={fieldProps.checkbox}/>&nbsp; Draft
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <FormControl type="checkbox" style={fieldProps.checkbox}/>&nbsp; Open
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <FormControl type="checkbox" style={fieldProps.checkbox}/>&nbsp; Closed
            </div>
        );

        let searchBox = (
            <div style={{ display: 'inline' }}>
                <input className="filter-input" type="text" placeholder="Search by Transaction ID" />
                <i className="fa fa-search" aria-hidden="true" style={{ position: 'relative', left: '-17px', color: '#A1A1A1' }}></i>
            </div>
        );

        return (
            <div className="filter-div"> 
                {filterUI}
                {this.state.showFilterTable ? <FilterTable /> : ''}
                &nbsp;&nbsp;&nbsp;&nbsp;
                {searchBox}
                &nbsp;&nbsp;&nbsp;&nbsp;
                {checkBox}
            </div>
        );
    }
}

@observer class FilterTable extends React.Component { 
    render() {

        const fieldProps = {
            text: {
                fontWeight: '400',
                fontStyle: 'normal',
                fontSize: '13px',
                textAlign: 'left',
                width: '140px',
                paddingTop: '10px'
            },
            textBox: {
                width: '337px',
                height: '30px',
                background: 'inherit',
                backgroundColor: 'rgba(255, 255, 255, 1)',
                boxSizing: 'border-box',
                borderStyle: 'solid',
                borderColor: 'rgba(153,153,153,1)',
                borderRadius: '3px',
                boxShadow: 'none',
                borderWidth: '1px'
            },
            dateTextBox: {
                display: 'inline',
                left: '36px',
                top: '0px',
                width: '100px',
                height: '30px',
                background: 'inherit',
                backgroundColor: 'rgba(255, 255, 255, 1)',
                boxSizing: 'border-box',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(153, 153, 153, 1)',
                borderRadius: '3px',
            },
            checkbox: {
                display: 'inline',
                width: '16px',
                height: '15px'
            }
        };


        let filterLeftMenus = (
            <div style={{ width: "50%", display: 'inline' }}>
                <div style={{ display: 'inline' }} style={fieldProps.text}>Businees Transaction ID: </div>
                &nbsp;&nbsp;
                    <div style={{ display: 'inline', position: 'absolute', left: '179px', top: '26px' }}>
                    <FormControl type="text" style={fieldProps.textBox} />
                </div>
                <div>
                    <div style={fieldProps.text}>Transaction Date: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '179px', top: '73px', fontSize: '12px' }}>
                        From &nbsp;<FormControl type="text" style={fieldProps.dateTextBox} />&nbsp;&nbsp;<i className="fa fa-calendar" aria-hidden="true" style={{ color: '#0085C8' }}></i>
                        &nbsp;&nbsp;
                            To &nbsp;<FormControl type="text" style={fieldProps.dateTextBox} />&nbsp;&nbsp;<i className="fa fa-calendar" aria-hidden="true" style={{ color: '#0085C8' }}></i>
                    </div>
                </div>
                <div>
                    <div style={fieldProps.text}>Description: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '179px', top: '126px' }}>
                        <FormControl type="checkbox" style={fieldProps.checkbox}/>&nbsp;Reason 1 description here <br />
                        <FormControl type="checkbox" style={fieldProps.checkbox}/>&nbsp;Reason 2 description here <br />
                        <FormControl type="checkbox" style={fieldProps.checkbox}/>&nbsp;Reason 3 description here <br />
                        <FormControl type="checkbox" style={fieldProps.checkbox}/>&nbsp;Reason 4 description here <br />
                        <FormControl type="checkbox" style={fieldProps.checkbox}/>&nbsp;Reason 5 description here
                        </div>
                </div>
            </div>
        );

        let filterRightMenus = (
            <div style={{ width: '50%', right: '0px', top: '23px', position: 'absolute' }}>
                <div style={{ display: 'inline' }} style={fieldProps.text}>Dispute ID: </div>
                &nbsp;&nbsp;
                    <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '5px' }}>
                    <FormControl type="text" style={fieldProps.textBox} />
                </div>
                <div>
                    <div style={fieldProps.text}>Dispute Submitted Date: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '50px', fontSize: '12px' }}>
                        From &nbsp;<FormControl type="text" style={fieldProps.dateTextBox} />&nbsp;&nbsp;<i className="fa fa-calendar" aria-hidden="true" style={{ color: '#0085C8' }}></i>
                        &nbsp;&nbsp;
                            To &nbsp;<FormControl type="text" style={fieldProps.dateTextBox} />&nbsp;&nbsp;<i className="fa fa-calendar" aria-hidden="true" style={{ color: '#0085C8' }}></i>
                    </div>
                </div>
                <div>
                    <div style={fieldProps.text}>Dispute Closed Date: </div>
                    &nbsp;&nbsp;
                        <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '100px', fontSize: '12px' }}>
                        From &nbsp;<FormControl type="text" style={fieldProps.dateTextBox} />&nbsp;&nbsp;<i className="fa fa-calendar" aria-hidden="true" style={{ color: '#0085C8' }}></i>
                        &nbsp;&nbsp;
                            To &nbsp;<FormControl type="text" style={fieldProps.dateTextBox} />&nbsp;&nbsp;<i className="fa fa-calendar" aria-hidden="true" style={{ color: '#0085C8' }}></i>
                    </div>
                </div>
                <div style={{ display: 'inline' }} style={fieldProps.text}>Raised By: </div>
                &nbsp;&nbsp;
                    <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '145px' }}>
                    <FormControl type="text" style={fieldProps.textBox} />
                </div>
                <div style={{ display: 'inline' }} style={fieldProps.text}>Participants: </div>
                &nbsp;&nbsp;
                    <div style={{ display: 'inline', position: 'absolute', left: '149px', top: '195px' }}>
                    <FormControl type="text" style={fieldProps.textBox} />
                </div>

                
            </div>
        );

        let applyButton = (
            <div style={{ textAlign: 'right', paddingRight: '67px', position: 'relative', top: '100px' }}>
                <Button style={{ width: '88px', height: '30px' }} className="btn btn-primary"  >Apply</Button>
            </div>
        );
        return (
            <div className="filter-table-div">
                {filterLeftMenus}
                {filterRightMenus}
                {applyButton}
            </div>
        );
    }
}