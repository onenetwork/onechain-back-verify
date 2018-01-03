import React from 'react';
import { observer } from 'mobx-react';
import BackChainActions from '../BackChainActions';
import {Modal} from 'react-bootstrap';
import StartSyncView from "./StartSyncView";
require('es6-promise/auto');
require('es6-object-assign/auto');
require("babel-polyfill");


@observer export default class HeaderView extends React.Component {
	constructor(props) {
		super(props);
	}
    
	componentDidMount() {
        BackChainActions.fetchLastSyncDate();
    }

    render() {
	    let fieldProps = {
            logoPanel : {
                backgroundImage : this.props.size == 'big' ? "url('/images/banner-large.png')" :  "url('/images/banner-small.png')",
                color: 'white',
                height: this.props.size == 'big' ? 178 : 100,
                fontSize: 13
            },
            logo: {
                position: 'relative',
                left: '50%',
                marginLeft: -55
            },
			mainInfoDiv : {
               width: '100%',
               textAlign: this.props.size == 'big' ? 'center' : 'left',
               marginTop: -20
            },
            inlineLogo: {
                float: 'left',
                padding: '38px 30px 10px 25px',
                marginTop: -10,
                paddingRight: '30px'
            },
            mainDiv : {
                marginTop: '54px',
                marginBottom: '20px'
            },
            h3 : {
                marginTop: '10px',
                fontSize: '17px'
            }

        };
        let lastSynced = this.props.store.lastestSyncedDate ? 'Database Last Sync: ' + this.props.store.lastestSyncedDate : 'Database Not Synced';
        if(this.props.size == 'big') {
            return (
                <div  >
                    <div className={"panel-heading"} style={fieldProps.logoPanel}>
                        <div style={fieldProps.mainDiv}>                
                            <div style={fieldProps.mainInfoDiv}>
                                <img src="/images/BVtext.png"  /> 
                                <h3 style={fieldProps.h3}>Revolutionizing the Supply Chain</h3>
                            </div>					
                        </div>
                        <img src="/images/logo-large.png" style={fieldProps.logo}/>
                    </div>
                </div>
            );
        } else {
            return (
                <div>
                    <div className={"panel-heading"} style={fieldProps.logoPanel}>
                        <div>
                            <div style={fieldProps.mainInfoDiv}>
                                <div style={fieldProps.inlineLogo}>
                                    <img src="/images/transparent_sml_logo.png"/>
                                </div>
                                <div  style={{paddingTop: '35px'}} >
                                    <img  style={{paddingBottom: '5px'}} src="/images/BVtext_sm.png"/> <br/>
                                    <span style={{fontSize: '14px'}}>Revolutionizing the Supply Chain</span>
                                </div>                            
                            </div>					
                        </div>
                    </div>
                </div>
            );
        }
        
    }
}