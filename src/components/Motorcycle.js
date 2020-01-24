import React, {Component} from 'react';
import {gmPoint, rad, deg, angle_0_Pi, angleToCardinal} from './functions'
import SpeedBike from './MotoSettingsSpeedBike';
import DirtBike from './MotoSettingsDirtBike';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

class Motorcycle extends Component {

    //============================================================================ Init

    constructor() {
        super();
        this.state = this.resetState();
        this.keyz = [];
        this.sondBuffers = {};
        this.MotoData = {SpeedBike, DirtBike};
    };

    componentWillMount() {
        this.Moto = this.resetMoto(this.props.pickedBike);
        this.initSounds()
        window.addEventListener("keydown", ({keyCode}) => {
            this.keyz[keyCode] = true;
            this.onkeyupdown(keyCode);
        });
        window.addEventListener('keyup', ({keyCode}) => {
            this.keyz[keyCode] = false;
            this.onkeyupdown(keyCode);
        });
    };

    initSounds = () => {
        this.initSound('idleSound', 'engineIdle.ogg');
        this.initSound('accelerationSound', 'engineHigh.ogg');
        this.initSound('gravelSound', 'tireGravel.ogg');
        this.initSound('skidSound', 'tireSkid.ogg');
    };

    initSound = (soundName, soundFile) => {
        this.sondBuffers[soundName] = context.createBufferSource();
        const requestMusicGame = new XMLHttpRequest();
        requestMusicGame.open('GET', 'audio/' + soundFile, true);
        requestMusicGame.responseType = 'arraybuffer';
        requestMusicGame.onload = () => {
            context.decodeAudioData(requestMusicGame.response, (buffer) => {
                this.sondBuffers[soundName] = buffer;
            });
        };
        requestMusicGame.send();
    }

    //=========================================================================== Default

    resetState = () => {
        return {
            Moto: null,
            Position: gmPoint(0, 0),
            ExPoints: [],
            Accelerating: false,
            HeadingDeg: 0,
            KMHSpeed: 0,
            SpeedShift: 1,
            RPM: 0,
            HeadingCard: '',
            Acceleration: '-',
            Steering: 0,
            finished: false,
            reset: true,
            generalVolume: 1
        };
    };

    resetMoto = (bike) => {
        return  this.MotoData[bike];
    };

    reloadSounds = () => {
        this.idleVolume = context.createGain();
        this.idleVolume.gain.value = (this.Moto.Sounds.idle.volumeMin > 0) ? this.Moto.Sounds.idle.volumeMin : 0;
        this.idleVolume.connect(context.destination);
        this.idleSound = context.createBufferSource();
        this.idleSound.buffer = this.sondBuffers.idleSound;
        this.idleSound.loop = this.Moto.Sounds.idle.loop;
        this.idleSound.loopStart = this.Moto.Sounds.idle.loopStart;
        this.idleSound.loopEnd = this.Moto.Sounds.idle.loopEnd;
        this.idleSound.connect(this.idleVolume);
        this.idleSound.playbackRate.value = this.Moto.Sounds.idle.freqMin;
        this.accelerationVolume = context.createGain();
        this.accelerationVolume.gain.value = (this.Moto.Sounds.acceleration.volumeMin > 0) ? this.Moto.Sounds.acceleration.volumeMin : 0;
        ;
        this.accelerationVolume.connect(context.destination);
        this.accelerationSound = context.createBufferSource();
        this.accelerationSound.buffer = this.sondBuffers.accelerationSound;
        this.accelerationSound.loop = this.Moto.Sounds.acceleration.loop;
        this.accelerationSound.loopStart = this.Moto.Sounds.acceleration.loopStart;
        this.accelerationSound.loopEnd = this.Moto.Sounds.acceleration.loopEnd;
        this.accelerationSound.connect(this.accelerationVolume);
        this.accelerationSound.playbackRate.value = this.Moto.Sounds.acceleration.freqMin;
        this.gravelVolume = context.createGain();
        this.gravelVolume.gain.default = 0.6;
        this.gravelVolume.gain.value = this.gravelVolume.gain.default;
        this.gravelVolume.connect(context.destination);
        this.gravelSound = context.createBufferSource();
        this.gravelSound.buffer = this.sondBuffers.gravelSound;
        this.gravelSound.loop = true;
        this.gravelSound.loopStart = 0;
        this.gravelSound.loopEnd = 0.5;
        this.gravelSound.volume = 0;
        this.gravelSound.connect(this.gravelVolume);
        this.gravelSound.playbackRate.value = 1;
        this.skidVolume = context.createGain();
        this.skidVolume.gain.default = 0.6;
        this.skidVolume.gain.value = this.skidVolume.gain.default;
        this.skidVolume.connect(context.destination);
        this.skidSound = context.createBufferSource();
        this.skidSound.buffer = this.sondBuffers.skidSound;
        this.skidSound.loop = true;
        this.skidSound.loopStart = 1;
        this.skidSound.loopEnd = 3;
        this.skidSound.volume = 0;
        this.skidSound.connect(this.skidVolume);
        this.skidSound.playbackRate.value = 1;
        this.idleSound.start(0);
        this.accelerationSound.start(0);
        this.gravelVolume.gain.value = 0
        this.gravelSound.start(0);
        this.skidVolume.gain.value = 0
        this.skidSound.start(0);
    };

    //=========================================================================== Inputs

    componentWillReceiveProps(nextProps) {
        this.getInput(nextProps.objectsInput)
        this.onoffRoad(nextProps.onRoad)
        this.finished(nextProps.finished)
    };

    onkeyupdown = (key) => {
        // console.log(key);
        if (this.Moto.EngineOn !== false) {
            //-------------------------------------------------------------------- Accelerating
            if (key === 38) {
                this.Moto.Accelerating = (this.keyz[key]);
            }
            //-------------------------------------------------------------------- Clutching
            else if (key === 32) {
                this.Moto.Clutching = (this.keyz[key]);
            }
            //-------------------------------------------------------------------- Breaking
            else if (key === 40) {
                this.Moto.Breaking = (this.keyz[key]);
            }
            //-------------------------------------------------------------------- SteeringLeft
            else if (key === 37) {
                this.Moto.SteeringLeft = (this.keyz[key]);
            }
            //-------------------------------------------------------------------- SteeringRight
            else if (key === 39) {
                this.Moto.SteeringRight = (this.keyz[key]);
            }
            //-------------------------------------------------------------------- ShiftingUp (a)
            else if (key === 65) {
                if (this.Moto.SpeedShift < this.Moto.shiftsData.length - 1) {
                    this.Moto.Clutching = (this.keyz[key]);
                    this.Moto.ShiftingUp = (this.keyz[key]);
                    if (!this.keyz[65]) {
                        this.Moto.SpeedShift++;
                        this.setState({SpeedShift: this.Moto.SpeedShift});
                    }
                }
            }
            //-------------------------------------------------------------------- ShiftingDown (z)
            else if (key === 90) {
                if (this.Moto.SpeedShift > 1) {
                    this.Moto.Clutching = (this.keyz[key]);
                    this.Moto.ShiftingDown = (this.keyz[key]);
                    if (!this.keyz[90]) {
                        this.Moto.SpeedShift--;
                        this.setState({SpeedShift: this.Moto.SpeedShift});
                    }
                }
            }
            (!this.Moto.motoLoopBusy) ? this.motoLoop() : null;
        }
    };

    getInput = (input) => {
        if (input.Moto) {
            if (input.Moto.EngineOn && !this.state.Moto) {
                this.reloadSounds();
                this.Moto.EngineOn = input.Moto.EngineOn;
                this.Moto.Position = input.Moto.Position;
                this.Moto.HeadingDeg = input.Moto.HeadingDeg;
                this.Moto.HeadingCard = angleToCardinal(input.Moto.HeadingDeg);
                this.Moto.Leaning = '';
                this.Moto.DispFrame = 4;
                this.Moto.Steer = 0;
                this.Moto.KMHSpeed = 0;
                this.Moto.SpeedShift = 1;
                this.Moto.RPM = 0;
                this.Moto.HeadingRad = rad(input.Moto.HeadingDeg);
                const output = {
                    EngineOn: this.Moto.EngineOn,
                    Position: this.Moto.Position,
                    HeadingDeg: this.Moto.HeadingDeg,
                    HeadingCard: this.Moto.HeadingCard,
                    HeadingRad: this.Moto.HeadingRad,
                    KMHSpeed: this.Moto.KMHSpeed,
                    Steer: this.Moto.Steer,
                    Leaning: this.Moto.Leaning,
                    DispFrame: this.Moto.DispFrame,
                    SpeedShift: this.Moto.SpeedShift,
                    RPM: this.Moto.RPM,
                    timestamp: input.Moto.timestamp
                }
                this.props.objectSetOutput(this.props.divID, this.props.category, output);
                this.setState({Moto: output});
            }
            else if (!input.Moto.EngineOn && this.state.Moto) {
                this.Moto.EngineOn = input.Moto.EngineOn;
                this.Moto.Position = gmPoint(0, 0)
                this.Moto.HeadingDeg = 0
                this.Moto.HeadingCard = ''
                this.Moto.HeadingRad = rad(0)
                this.Moto.Leaning = ''
                this.Moto.DispFrame = 4
                this.Moto.Steer = 0
                this.Moto.KMHSpeed = 0
                this.Moto.HeadingRad = 0;
                const output = {
                    EngineOn: this.Moto.EngineOn,
                    Position: this.Moto.Position,
                    HeadingDeg: this.Moto.HeadingDeg,
                    HeadingCard: this.Moto.HeadingCard,
                    HeadingRad: this.Moto.HeadingRad,
                    KMHSpeed: this.Moto.KMHSpeed,
                    Steer: this.Moto.Steer,
                    Leaning: this.Moto.Leaning,
                    DispFrame: this.Moto.DispFrame,
                    SpeedShift: this.Moto.SpeedShift,
                    RPM: this.Moto.RPM,
                    timestamp: input.Moto.timestamp
                }
                this.props.objectSetOutput(this.props.divID, this.props.category, output);
                this.setState({Moto: null});
            }
        }
    };

    //=========================================================================== Vehicle

    motoLoop = () => {
        this.Moto.motoLoopBusy = true;
        this.motoSteer()
        this.motoDrive()
        this.motoVisual()
        this.motoAudio()
        this.motoOutput()
        //-------------------- LOOP
        setTimeout(() => {
            if (this.Moto.EngineOn && (this.Moto.Accelerating || this.Moto.Clutching || this.Moto.Breaking || this.Moto.Motion > 0 || this.Moto.Torque > 0)) {
                this.motoLoop()
            } else {
                this.Moto.motoLoopBusy = false;
            }
        }, 20);
    };

    motoSteer = () => {
        if (this.Moto.SteeringLeft || this.Moto.SteeringRight || this.Moto.Steering !== 0) {
            let direction = (this.Moto.SteeringLeft) ? -1 : 0;
            direction = (this.Moto.SteeringRight) ? 1 : direction;

            if (direction === 0) {
                this.Moto.Steer = (Math.abs(this.Moto.Steer) > this.Moto.steeringStep) ? this.Moto.Steer - Math.sign(this.Moto.Steer) * this.Moto.steeringStep : 0;
            } else {
                if (direction !== -Math.sign(this.Moto.Steer)) {
                    this.Moto.Steer = (Math.abs(this.Moto.Steer) < Math.abs(this.Moto.steeringMax) - Math.abs(this.Moto.steeringStep)) ? this.Moto.Steer + direction * this.Moto.steeringStep : direction * this.Moto.steeringMax;
                } else {
                    this.Moto.Steer = (Math.abs(this.Moto.Steer) > this.Moto.steeringStep) ? this.Moto.Steer + direction * this.Moto.steeringStep : 0;
                }
            }

            this.Moto.HeadingRad = angle_0_Pi(this.Moto.HeadingRad + this.Moto.Steer * this.Moto.steer_to_angle_adjustor / Math.pow(0.8, this.Moto.Motion));
            this.Moto.HeadingDeg = (deg(this.Moto.HeadingRad) / 10).toFixed(0) * 10;
            this.Moto.HeadingCard = angleToCardinal(this.Moto.HeadingDeg)
        }
    };

    motoDrive = () => {
        this.Moto.Motion = (this.Moto.Motion > 0) ? this.Moto.Motion : 0;
        //------------------------------------------------------- Torque
        if (this.Moto.Clutching) {
            this.Moto.Torque = (this.Moto.Torque - this.Moto.torqueFriction > 0) ? this.Moto.Torque - this.Moto.torqueFriction : 0;
        } else {
            if (this.Moto.Accelerating) {
                this.Moto.motionRatioFriction = this.Moto.shiftsData[this.Moto.SpeedShift].ratio * this.Moto.motionFriction2;
                this.Moto.Torque = this.Moto.Motion / this.Moto.shiftsData[this.Moto.SpeedShift].ratio + this.Moto.torqueStep - this.Moto.motionRatioFriction;
            } else {
                this.Moto.Torque = this.Moto.Motion / this.Moto.shiftsData[this.Moto.SpeedShift].ratio - this.Moto.torqueFriction;
            }
        }
        this.Moto.Torque = (this.Moto.Torque < this.Moto.torqueMax) ? this.Moto.Torque : this.Moto.torqueMax;
        this.Moto.Torque = (this.Moto.Torque > 0) ? this.Moto.Torque : 0;
        //------------------------------------------------------- Break
        if (this.Moto.Breaking) {
            this.Moto.Break = this.Moto.break_adjustor * this.Moto.shiftsData[this.Moto.SpeedShift].ratio;
        } else {
            this.Moto.Break = 0;
        }
        //------------------------------------------------------- Motor
        this.Moto.Motor = this.Moto.Torque - this.Moto.motorFriction;
        //------------------------------------------------------- Engine
        this.Moto.Engine = this.Moto.Motor * this.Moto.shiftsData[this.Moto.SpeedShift].ratio;
        //------------------------------------------------------- Motion
        if (this.Moto.Clutching) {
            this.Moto.Motion = this.Moto.Motion - this.Moto.motionFriction - this.Moto.Break
        } else {
            this.Moto.Motion = this.Moto.Engine - this.Moto.Break
        }
        this.Moto.Motion = (this.Moto.Motion < 0) ? 0 : this.Moto.Motion;
        //------------------------------------------------------- KMHSpeed
        this.Moto.KMHSpeed = this.Moto.Motion * this.Moto.speed_KM_H_adjustor;
        //------------------------------------------------------- MapMotion
        const motionLat = Math.cos(this.Moto.HeadingRad) * this.Moto.Motion;
        const motionLng = Math.sin(this.Moto.HeadingRad) * this.Moto.Motion;
        this.Moto.Position = gmPoint(motionLat + this.Moto.Position.lat(), motionLng + this.Moto.Position.lng());
    };

    motoVisual = () => {
        this.Moto.FootAideFrame = (this.Moto.Accelerating && this.Moto.KMHSpeed * 2 <= this.Moto.FootAideLevels - 1 && this.Moto.FootAideFrame <= this.Moto.KMHSpeed * 2) ? Math.floor(this.Moto.KMHSpeed * 2) : this.Moto.FootAideLevels - 2;
        this.Moto.FootAideFrame = (this.Moto.Accelerating && this.Moto.FootAideFrame === this.Moto.FootAideLevels - 2 && this.Moto.KMHSpeed > 60) ? this.Moto.FootAideLevels - 1 : this.Moto.FootAideFrame;
        this.Moto.FootAideFrame = (!this.Moto.Accelerating && this.Moto.KMHSpeed <= this.Moto.FootAideLevels - 1 && this.Moto.FootAideFrame > this.Moto.KMHSpeed) ? Math.floor(this.Moto.KMHSpeed) : this.Moto.FootAideFrame;
        this.Moto.FootAideFrame = (this.Moto.Breaking) ? this.Moto.FootAideLevels : this.Moto.FootAideFrame;
        this.Moto.FootAideFrame = (this.Moto.FootAideFrame >= 0) ? this.Moto.FootAideFrame : 0;
        this.Moto.WheelTurnFrame = (this.Moto.WheelTurnPattern - this.Moto.WheelTurnFrame > 1 && this.Moto.Motion > 0) ? this.Moto.WheelTurnFrame + 1 : 0;
        this.Moto.LeanFrame = Math.floor(this.Moto.Steer / 5) + (Math.floor(this.Moto.LeanPattern / 2) + 1);
        // this.Moto.LeanFrame = (this.Moto.KMHSpeed < 40 && !this.Moto.Accelerating && !this.Moto.Breaking && this.Moto.LeanFrame <= 1) ? 2 : this.Moto.LeanFrame;
        // this.Moto.LeanFrame = (this.Moto.KMHSpeed < 40 && !this.Moto.Accelerating && !this.Moto.Breaking && this.Moto.LeanFrame >= this.Moto.LeanPattern) ? this.Moto.LeanPattern - 1 : this.Moto.LeanFrame;
        this.Moto.DispFrame = this.Moto.LeanFrame + (this.Moto.WheelTurnFrame * this.Moto.LeanPattern) + (this.Moto.FootAideFrame * this.Moto.WheelTurnPattern * this.Moto.LeanPattern);
    };

    motoAudio = () => {
        //------------------------------------------------------- RPM
        const rpm = this.Moto.Torque / this.Moto.torque_adjustor;
        const rpmMaximum = 22.5;
        const rpmMaxed = (rpm < rpmMaximum) ? rpm : rpmMaximum;
        const idleVolume = ((this.Moto.Sounds.idle.volumeMax - this.Moto.Sounds.idle.volumeMin) * rpmMaxed / rpmMaximum) + this.Moto.Sounds.idle.volumeMin;
        this.idleVolume.gain.value = (idleVolume > 0) ? idleVolume : 0;
        const idleFreq = ((this.Moto.Sounds.idle.freqMax - this.Moto.Sounds.idle.freqMin) * rpmMaxed / rpmMaximum) + this.Moto.Sounds.idle.freqMin;
        this.idleSound.playbackRate.value = (idleFreq > 0) ? idleFreq : 0;
        const accelerationVolume = ((this.Moto.Sounds.acceleration.volumeMax - this.Moto.Sounds.acceleration.volumeMin) * rpmMaxed / rpmMaximum) + this.Moto.Sounds.acceleration.volumeMin;
        this.accelerationVolume.gain.value = (accelerationVolume > 0) ? accelerationVolume : 0;
        const accelerationFreq = ((this.Moto.Sounds.acceleration.freqMax - this.Moto.Sounds.acceleration.freqMin) * rpmMaxed / rpmMaximum) + this.Moto.Sounds.acceleration.freqMin;
        this.accelerationSound.playbackRate.value = (accelerationFreq > 0) ? accelerationFreq : 0;

        //------------------------------------------------------- Steering
        if (this.Moto.Steer >= -10 && this.Moto.Steer <= 10) {
            this.skidVolume.gain.value = 0;
        }
        else if (this.Moto.Steer <= -15) {
            if (this.Moto.Breaking) {
                this.skidVolume.gain.value = (0.005 + 3500 * this.Moto.Motion) * this.state.generalVolume;
            }
        }
        else if (this.Moto.Steer >= 15) {
            if (this.Moto.Breaking) {
                this.skidVolume.gain.value = (0.005 + 3500 * this.Moto.Motion) * this.state.generalVolume;
            }
        }
        //------------------------------------------------------- Clutching
        if (this.Moto.Clutching || !this.Moto.Breaking) {
            this.skidVolume.gain.value = 0;
        }
    };

    motoOutput = () => {
        const setRpm = (rpm) => {
            const max = 24;
            const rpmMaxed = (rpm < max) ? rpm : max
            let str = '';
            for (let i = 0; i < rpmMaxed; i++) {
                str += '-';
            }
            this.setState({Acceleration: str});
        }
        setRpm(this.Moto.Torque * 25)
        //------------------------------------------------------- Motorcycle Output
        const output = {
            EngineOn: this.Moto.EngineOn,
            Position: this.Moto.Position,
            HeadingDeg: this.Moto.HeadingDeg,
            HeadingCard: this.Moto.HeadingCard,
            KMHSpeed: this.Moto.KMHSpeed,
            Steer: this.Moto.Steer,
            Leaning: this.Moto.Leaning,
            DispFrame: this.Moto.DispFrame,
            ShiftData: this.Moto.shiftsData[this.Moto.SpeedShift],
            SpeedShift: this.Moto.SpeedShift,
            RPM: this.Moto.RPM
        };
        this.props.objectSetOutput(this.props.divID, this.props.category, output);
        this.setState({Moto: output});
    };

    //=========================================================================== Game

    onoffRoad = (onRoad) => {
        if (this.Moto.EngineOn) {
            if (onRoad) {
                this.Moto.motionFriction2 = this.Moto.onroadMotionFriction;
                this.gravelVolume.gain.value = 0;
                this.gravelSound.playbackRate.value = 1;
            } else {
                this.Moto.motionFriction2 = this.Moto.offroadMotionFriction;
                if (this.Moto.Motion > 0) {
                    this.gravelVolume.gain.value = (30000 * this.Moto.Motion < 0.1) ? 30000 * this.Moto.Motion * this.state.generalVolume : 0.1 * this.state.generalVolume;
                    this.gravelSound.playbackRate.value = 1 + 100000 * this.Moto.Motion;
                } else {
                    this.gravelVolume.gain.value = 0;
                    this.gravelSound.playbackRate.value = 1;
                }
            }
        }
    };

    finished = (state) => {
        if (state && !this.state.finished && this.Moto.EngineOn) {
            this.Moto.SpeedShift = 1;
            this.Moto.Breaking = true;
            setTimeout(() => {
                this.resetStage()
            }, 4500)
        }
    };

    resetStage = () => {
        this.idleSound.stop(0);
        this.accelerationSound.stop(0);
        this.gravelSound.stop(0);
        this.skidSound.stop(0);
        this.Moto = this.resetMoto(this.props.pickedBike);
        this.setState({...this.resetState()});
    };

    //=========================================================================== Render

    renderDash = () => {
        if (!this.state.Moto) {
            return null;
        }
        return (
            <div className="dash">
                <div className="HeadingGearsSpeed">
                    <div className="HeadingCard">{this.state.Moto.HeadingCard}</div>
                    <div
                        className="ShiftSpeed">{this.state.Moto.SpeedShift}</div>
                    <div className="SimKMHSpeed">{this.state.Moto.KMHSpeed.toFixed(0)}</div>
                    <div className="SimKMHSpeedkmh">km/h</div>
                </div>
                <div className="RpmAudioVolume">
                    <div className="RPM">{this.state.Acceleration}</div>
                    <div className="AudioVolume">
                        <label htmlFor="generalVolume">Audio Volume</label>
                        <input
                            name="generalVolume"
                            type="range" className="slider"
                            min="0" max="2" step="0.05"
                            value={this.state.generalVolume}
                            onChange={(e) => this.setState({generalVolume: Number(e.target.value)})}
                            onInput={(e) => this.setState({generalVolume: Number(e.target.value)})}
                        />
                    </div>
                </div>
            </div>
        );
    };

    renderSettings = () => {
        return (
            <div className="settings">
                <div className="settings_block">
                    {this.displaySetting('Gear 1 Freq at Min Speed', 'gear_1_FreqMin', 0.5, 1.5, 0.05)}
                    {this.displaySetting('Gear 1 Freq at Max Speed', 'gear_1_FreqMax', 0.5, 1.5, 0.05)}
                    {this.displaySetting('Gear 2 Freq at Min Speed', 'gear_2_FreqMin', 0.5, 1.5, 0.05)}
                    {this.displaySetting('Gear 2 Freq at Max Speed', 'gear_2_FreqMax', 0.5, 1.5, 0.05)}
                    {this.displaySetting('Gear 3 Freq at Min Speed', 'gear_3_FreqMin', 0.5, 1.5, 0.05)}
                    {this.displaySetting('Gear 3 Freq at Max Speed', 'gear_3_FreqMax', 0.5, 1.5, 0.05)}
                    {this.displaySetting('Gear 4 Freq at Min Speed', 'gear_4_FreqMin', 0.5, 1.5, 0.05)}
                    {this.displaySetting('Gear 4 Freq at Max Speed', 'gear_4_FreqMax', 0.5, 1.5, 0.05)}
                    {this.displaySetting('Gear 5 Freq at Min Speed', 'gear_5_FreqMin', 0.5, 1.5, 0.05)}
                    {this.displaySetting('Gear 5 Freq at Max Speed', 'gear_5_FreqMax', 0.5, 1.5, 0.05)}
                    {this.displaySetting('Gear 6 Freq at Min Speed', 'gear_6_FreqMin', 0.5, 1.5, 0.05)}
                    {this.displaySetting('Gear 6 Freq at Max Speed', 'gear_6_FreqMax', 0.5, 1.5, 0.05)}
                </div>
                <div className="">
                </div>
            </div>
        );
    };

    renderStats = () => {
        if (!this.state.Moto) {
            return null;
        }
        return (
            <table className="statsTable">
                <tbody>
                <tr>
                    <th>Var</th>
                    <th>Km</th>
                    <th>Coord</th>
                </tr>
                <tr>
                    <td>this.Moto.Accelerating</td>
                    <td>{this.Moto.Accelerating ? '----' : ''}</td>
                    <td>{}</td>
                </tr>
                <tr>
                    <td>this.Moto.Clutching</td>
                    <td>{this.Moto.Clutching ? '----' : ''}</td>
                    <td>{}</td>
                </tr>
                <tr>
                    <td>this.Moto.Breaking</td>
                    <td>{this.Moto.Breaking ? '----' : ''}</td>
                    <td>{}</td>
                </tr>
                <tr>
                    <td>this.state.Moto.Position.lat()</td>
                    <td>{}</td>
                    <td>{this.state.Moto.Position.lat()}</td>
                </tr>
                <tr>
                    <td>this.state.Moto.Position.lng()</td>
                    <td>{}</td>
                    <td>{this.state.Moto.Position.lng()}</td>
                </tr>
                <tr>
                    <td>this.Moto.HeadingDeg</td>
                    <td>{}</td>
                    <td>{this.state.Moto.HeadingDeg}</td>
                </tr>
                <tr>
                    <td>this.Moto.HeadingRad</td>
                    <td>{}</td>
                    <td>{this.Moto.HeadingRad}</td>
                </tr>
                <tr>
                    <td>this.Moto.Torque</td>
                    <td>{(this.Moto.Torque * this.Moto.shiftsData[this.Moto.SpeedShift].ratio * this.Moto.speed_KM_H_adjustor).toFixed(2)}</td>
                    <td>{this.Moto.Torque.toFixed(20)}</td>
                </tr>
                <tr>
                    <td>this.Moto.motionRatioFriction</td>
                    <td>{(this.Moto.motionRatioFriction * this.Moto.shiftsData[this.Moto.SpeedShift].ratio * this.Moto.speed_KM_H_adjustor).toFixed(2)}</td>
                    <td>{this.Moto.motionRatioFriction.toFixed(20)}</td>
                </tr>
                <tr>
                    <td>this.Moto.motorFriction</td>
                    <td>{(this.Moto.motorFriction * this.Moto.shiftsData[this.Moto.SpeedShift].ratio * this.Moto.speed_KM_H_adjustor).toFixed(2)}</td>
                    <td>{this.Moto.motorFriction.toFixed(20)}</td>
                </tr>
                <tr>
                    <td>this.Moto.Motor</td>
                    <td>{(this.Moto.Motor * this.Moto.shiftsData[this.Moto.SpeedShift].ratio * this.Moto.speed_KM_H_adjustor).toFixed(2)}</td>
                    <td>{this.Moto.Motor.toFixed(20)}</td>
                </tr>
                <tr>
                    <td>{'this.Moto.shiftsData[' + this.Moto.SpeedShift + '].ratio'}</td>
                    <td>{(this.Moto.shiftsData[this.Moto.SpeedShift].ratio * this.Moto.speed_KM_H_adjustor).toFixed(2)}</td>
                    <td>{this.Moto.shiftsData[this.Moto.SpeedShift].ratio.toFixed(20)}</td>
                </tr>
                <tr>
                    <td>Engine</td>
                    <td>{(this.Moto.Engine * this.Moto.speed_KM_H_adjustor).toFixed(2)}</td>
                    <td>{this.Moto.Engine.toFixed(20)}</td>
                </tr>
                <tr>
                    <td>Break</td>
                    <td>{(this.Moto.Break * this.Moto.speed_KM_H_adjustor).toFixed(2)}</td>
                    <td>{this.Moto.Break.toFixed(20)}</td>
                </tr>
                <tr>
                    <td>Motion</td>
                    <td>{(this.Moto.Motion * this.Moto.speed_KM_H_adjustor).toFixed(2)}</td>
                    <td>{this.Moto.Motion.toFixed(20)}</td>
                </tr>
                </tbody>
            </table>
        );
    };

    render() {
        return (
            <div className="moto">
                <div className="wrapper">
                    {this.renderDash()}
                    {/*{this.renderSettings()}*/}
                    {this.renderStats()}
                </div>
            </div>
        );
    }
}

export default Motorcycle;