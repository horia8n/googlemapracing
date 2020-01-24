import React, {Component} from 'react';

class DirectionsPanel extends Component {


    componentDidUpdate() {
        if (!this.props.finished) {
            document.getElementById('minibar_' + this.props.roadLeg + '_' + this.props.roadStep).style.width = this.props.minibar + '%';
        }
    }

    getTimeSec = (seconds) => {
        const date = new Date(1970, 0, 1);
        date.setSeconds(seconds);
        return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
    }

    renderStep = (k, s, step) => {
        return (
            <div
                className="step"
                key={k + '_' + s}
            >
                <table>
                    <tbody>
                    <tr>
                        <td className="imgTD">
                            <img
                                src={'img/SignsPan/Sign' + step.sign + '.png'}/>
                        </td>
                        <td className="txtTD" dangerouslySetInnerHTML={{__html: step.display}}></td>
                    </tr>
                    <tr>
                        <td className="imgTD"></td>
                        <td className="durTD">
                            <div className="timeTD">Time</div>
                            <div className="distTD">Distance</div>
                            <div className="percTD"></div>
                            <div className="leftTD">Next Sign</div>
                        </td>
                    </tr>
                    <tr>
                        <td className="imgTD"></td>
                        <td className="durTD">
                            <div className="timeTD">
                                {this.getTimeSec(Number(step.duration.value))}
                            </div>
                            <div className="distTD">
                                {(step.distance.value / 1000).toString() + ' km'}
                            </div>
                            <div className="percTD">{
                                (k === this.props.roadLeg && s === this.props.roadStep) ?
                                    Math.round(this.props.minibar) + '%' : '0%'
                            }</div>
                            <div className="leftTD">
                                {
                                    (k === this.props.roadLeg && s === this.props.roadStep) ?
                                        (this.props.left).toString() + ' km' : (step.distance.value / 1000).toString() + ' km'
                                }
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="imgTD"></td>
                        <td className="txtTD minibarTD">
                            <img className="minibar" id={'minibar_' + k + '_' + s} src="img/minibar.png"/>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    renderSteps = () => {
        if (this.props.directionsFinalRes === null) {
            return null;
        }
        return this.props.directionsFinalRes.legs.map((leg, k) => {
            if (k < this.props.roadLeg) {
                return null;
            }
            return leg.steps.map((step, s) => {
                if (s < this.props.roadStep) {
                    return null;
                }
                return this.renderStep(k, s, step);
            })
        })
    }

    render() {
        return (
            <div className="DirectionsPanel">
                {(this.props.finished === true) ?
                    <div>
                        <div>You Win!</div>
                        <div>Nice Job!</div>
                    </div>
                    : this.renderSteps()
                }
            </div>
        );
    }

}

export default DirectionsPanel;