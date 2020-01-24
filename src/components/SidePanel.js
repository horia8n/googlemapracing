import React, {Component} from 'react';

import DirectionsPanel from './DirectionsPanel';
import RoadsPanel from './RoadsPanel';

class SidePanel extends Component {

    constructor() {
        super();
        this.state = {
            substate: false
        };
    }

    render() {
        return (
            <div className="SidePanel">
                {this.props.directionsFinalRes === null ?
                    <RoadsPanel
                        results={this.props.results}
                        highlightedRoad={this.props.highlightedRoad}
                        directionsDisplayFinalRoad={this.props.directionsDisplayFinalRoad}
                        resultHighlightOnMap={this.props.resultHighlightOnMap}
                        resultDeHighlightOnMap={this.props.resultDeHighlightOnMap}
                    />
                    :
                    <DirectionsPanel
                        directionsFinalRes={this.props.directionsFinalRes}
                        roadLeg={this.props.roadLeg}
                        roadStep={this.props.roadStep}
                        minibar={this.props.minibar}
                        left={this.props.left}
                        finished={this.props.finished}
                    />
                }
            </div>
        );
    }

}

export default SidePanel;