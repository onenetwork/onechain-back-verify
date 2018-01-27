import React from 'react';
import { observer } from 'mobx-react';
import BackChainActions from '../BackChainActions';
import {Modal} from 'react-bootstrap';
import StartSyncView from "./StartSyncView";
import Images from '../Images';

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
                backgroundImage : this.props.size == 'big' ? `url('${Images.BANNER_LARGE}')` :  `url('${Images.BANNER_SMALL}')`,
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
        if(this.props.size == 'big') {
            return (
                <div  >
                    <div className={"panel-heading"} style={fieldProps.logoPanel}>
                        <div style={fieldProps.mainDiv}>                
                            <div style={fieldProps.mainInfoDiv}>
                                <img src={Images.BV_TEXT} /> 
                                <h3 style={fieldProps.h3}>Revolutionizing the Supply Chain</h3>
                            </div>					
                        </div>
                        <img src={Images.LOGO_LARGE} style={fieldProps.logo}/>
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
                                    <img src={Images.LOGO_SMALL}/>
                                </div>
                                <div  style={{paddingTop: '35px'}} >
                                    <img  style={{paddingBottom: '5px'}} src={Images.BV_TEXT_SMALL}/> <br/>
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