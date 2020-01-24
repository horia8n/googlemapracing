import React, {Component} from 'react';
import {pad} from './functions'

const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

class MotoPick extends Component {

    constructor() {
        super();
        this.state = {
            angle: 0,
            wheel: 0,
            url: '0_0007.png'
        };
        this.sondBuffers = {};
    }


    componentDidMount() {
        this.turn()
    }


    turn = () => {
        let wheel = (this.state.wheel === 0) ? 1 : 0;
        let angle = this.state.angle;
        if (wheel === 0) {
            angle = (angle < 350) ? angle + 10 : 0;
        }
        let url = angle + '_' + pad(7 + wheel * 7, 4) + '.png';
        this.setState({angle, wheel, url})
        setTimeout(() => {
            this.turn()
        }, 70);
    }

    render() {
        return (
            <div className="scene">
                <img className="background" src={'img/scene.png'} alt=""/>
                <div className="GoogleMapRacingTitle">
                    <span style={{color: '#4185F4'}}>G</span><span style={{color: '#EA4236'}}>o</span><span
                    style={{color: '#FCBB07'}}>o</span><span style={{color: '#4185F4'}}>g</span><span
                    style={{color: '#34A853'}}>l</span><span style={{color: '#FCBB07'}}>e</span> <span
                    style={{color: '#34A853'}}>Map</span> <span style={{color: '#EA4236'}}>Racing</span></div>
                <div className="pickVehicleWrap Moto">
                    <div className="pickVehicle Moto" onClick={() => this.props.pickBike("SpeedBike")}>
                        <div className="stats">
                            <div className="title">Speed Bike</div>
                            <table>
                                <tbody>
                                <tr>
                                    <td>Max Speed:</td>
                                    <td>300 km/h</td>
                                </tr>
                                <tr>
                                    <td>Speeds:</td>
                                    <td>6</td>
                                </tr>
                                <tr>
                                    <td>Turning:</td>
                                    <td>Medium</td>
                                </tr>
                                <tr>
                                    <td>Offroading:</td>
                                    <td>Low</td>
                                </tr>
                                <tr>
                                    <td>Torque:</td>
                                    <td>Medium</td>
                                </tr>
                                <tr>
                                    <td>Breaks:</td>
                                    <td>Medium</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                        <img className="piedestal" src={'img/piedestal.png'} alt=""/>
                        <img className="motocycle" src={'img/SpeedBike/d/' + this.state.url} alt=""/>
                    </div>
                </div>
                <div className="pickVehicleWrap DirtBike">
                    <div
                        className="pickVehicle DirtBike"
                        onClick={() => this.props.pickBike("DirtBike")}
                    >
                        <div className="stats">
                            <div className="title">Dirt Bike</div>
                            <table>
                                <tbody>
                                <tr>
                                    <td>Max Speed:</td>
                                    <td>180 km/h</td>
                                </tr>
                                <tr>
                                    <td>Speeds:</td>
                                    <td>4</td>
                                </tr>
                                <tr>
                                    <td>Turning:</td>
                                    <td>High</td>
                                </tr>
                                <tr>
                                    <td>Offroading:</td>
                                    <td>High</td>
                                </tr>
                                <tr>
                                    <td>Torque:</td>
                                    <td>High</td>
                                </tr>
                                <tr>
                                    <td>Breaks:</td>
                                    <td>High</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                        <img className="piedestal" src={'img/piedestal.png'} alt=""/>
                        <img className="motocycle" src={'img/DirtBike/d/' + this.state.url} alt=""/>
                    </div>
                </div>
            </div>
        );
    }

}

export default MotoPick;