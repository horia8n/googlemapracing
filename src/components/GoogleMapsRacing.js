import React, {Component} from 'react';
import Motorcycle from './Motorcycle';
import MotoPick from './MotoPick';
import MapCenter from './Map';
import MapSmallBottoLeft from './Map';
import MapSmallBottoRight from './Map';
import SidePanel from './SidePanel';
import {
    gmPoint,
    pad,
    haversineDist,
    segmentAngle,
    directionsFillPath,
    getClosestPointInPath,
    createPolygonOutOfPath
} from './functions'

const gm = window.google.maps;
const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

class GoogleMapsRacing extends Component {

    //============================================================================ Init

    constructor() {
        super();
        this.state = this.resetState();
        this.stateOfGame = null;
        this.sondBuffers = {};
    }

    componentDidMount() {
        this.initSounds()
    }

    initSounds = () => {
        this.initSound('musicGameSound', 'musicGame.ogg');
        this.initSound('anouncer_startSound', 'anouncer_start.ogg');
        this.initSound('anouncer_finishSound', 'anouncer_finish.ogg');
    }

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
        return ({
            pickedBike: null,
            Start: null,
            End: null,
            results: [],
            directionsFinalRes: null,
            highlightedRoad: null,
            roadPicked: null,
            onRoad: false,
            roadLeg: null,
            roadStep: null,
            minibar: 0,
            left: 0,
            googleMapsRideUniqueID: Date.now(),
            objects: {
                input: {},
                output: {}
            },
            motorcycleStarted: false,
            finished: false,
            time: 0,
            playMusic: false,
            generalVolume: 1
        });
    }

    resetStage = () => {
        console.log('resetStage()');
        this.stateOfGame = 'RESET';
        this.reloadSounds()
        const Start = this.state.Start;
        const End = this.state.End;
        this.setState(this.resetState());
        this.stateOfGame = 'REPLAY_GAME';
        this.setStartOrEnd(Start, End);
    }

    reloadSounds = () => {
        console.log('reloadSounds()');
        this.anouncer_startVolume = context.createGain()
        this.anouncer_startVolume.gain.default = 0.6;
        this.anouncer_startVolume.gain.value = this.anouncer_startVolume.gain.default;
        this.anouncer_startVolume.connect(context.destination)
        this.anouncer_startSound = context.createBufferSource();
        this.anouncer_startSound.buffer = this.sondBuffers.anouncer_startSound
        this.anouncer_startSound.volume = 0;
        this.anouncer_startSound.connect(this.anouncer_startVolume);
        this.anouncer_startSound.playbackRate.value = 1
        this.anouncer_finishVolume = context.createGain()
        this.anouncer_finishVolume.gain.default = 0.6;
        this.anouncer_finishVolume.gain.value = this.anouncer_finishVolume.gain.default;
        this.anouncer_finishVolume.connect(context.destination)
        this.anouncer_finishSound = context.createBufferSource();
        this.anouncer_finishSound.buffer = this.sondBuffers.anouncer_finishSound
        this.anouncer_finishSound.volume = 0;
        this.anouncer_finishSound.connect(this.anouncer_finishVolume);
        this.anouncer_finishSound.playbackRate.value = 1
        // this.reloadGameMusic();
    }

    reloadGameMusic = () => {
        console.log('reloadGameMusic()');
        console.log('this.musicGameVolume', this.musicGameVolume)
        this.musicGameVolume = context.createGain();
        this.musicGameVolume.gain.value = 0.4;
        this.musicGameVolume.connect(context.destination);
        this.musicGameSound = context.createBufferSource();
        this.musicGameSound.buffer = this.sondBuffers.musicGameSound;
        this.musicGameSound.loop = true;
        this.musicGameSound.loopStart = 9.1;
        this.musicGameSound.loopEnd = 36.53;
        this.musicGameSound.connect(this.musicGameVolume);
        this.musicGameSound.playbackRate.value = 1;
        this.musicGameSound.start(0)
        console.log('this.musicGameSound', this.musicGameSound);
    }

    musicSound = () => {
        this.setState({playMusic: !this.state.playMusic}, () => {
            const muteMusicButton = document.getElementById('muteMusicButton');
            if (this.state.playMusic === true) {
                muteMusicButton.classList.remove('off');
                muteMusicButton.classList.add('on');
                this.reloadGameMusic()
            } else {
                muteMusicButton.classList.remove('on');
                muteMusicButton.classList.add('off');
                try {
                    this.musicGameSound.stop(0)
                }
                catch (err) {
                    console.log('err', err)
                }
            }
        });
    }


    //=========================================================================== Mapping

    pickBike = (pickedBike) => {
        console.log('pickBike()', pickedBike);
        this.stateOfGame = 'BIKE_PICKED';
        this.setState({pickedBike}, () => {
            this.setStartOrEnd(gmPoint(43.657374647900724, -79.40337939630405), gmPoint(43.664444099789286, -79.39706279407397))
        })
    }

    setStartOrEnd = (Start, End) => {
        const pickedBike = this.state.pickedBike;
        this.setState({... this.resetState(), Start, End, pickedBike}, () => {
            this.stateOfGame = 'SET_START_OR_END';
            this.directionsGetResults()
        })
    }

    directionsGetResults = () => {
        this.directionsGetData(this.state.Start, null, this.state.End, 1, true, true, false, true)
            .then(results => {
                this.setState({results});
                this.stateOfGame = 'RESULTS_RETURNED';
                if (results.length === 0) {
                    this.stateOfGame = 'NO_ROAD';
                    window.alert('Google maps could not find a road between these points. Please move the flags elsewhere.')
                }
            })
            .catch(err => {
                this.stateOfGame = 'RESULTS_RETURNED_ERROR';
                console.log('err', err);
                window.alert("No directions returned by Google API!")
            });
    }

    directionsGetData = (Start, Way, End, Mode, optimizeWaypoints, provideAlternatives, avoidHighways, avoidTolls) => {
        return new Promise((resolve, reject) => {
            const DirectionsService = new gm.DirectionsService();
            DirectionsService.route({
                    'origin': Start,
                    'waypoints': Way,
                    'destination': End,
                    'travelMode': gm.DirectionsTravelMode.DRIVING,
                    'optimizeWaypoints': optimizeWaypoints,
                    'provideRouteAlternatives': provideAlternatives,
                    'avoidHighways': avoidHighways,
                    'avoidTolls': avoidTolls
                },
                (res) => {
                    if (res.status === 'OK') {
                        resolve(res.routes);
                    } else {
                        reject(false);
                    }
                }
            )
        });
    }

    resultHighlightOnMap = (highlightedRoad) => {
        this.setState({highlightedRoad})
    }

    resultDeHighlightOnMap = () => {
        this.setState({highlightedRoad: null})
    }

    directionsDisplayFinalRoad = (i) => {
        try {
            this.musicGameSound.stop(0);
        }
        catch (err) {
            console.log('err', err)
        }
        this.directionsFinalRes = this.state.results[i];
        this.stateOfGame = 'FINAL_ROAD_PICKED';
        this.directionsFinalRes = this.directionsApplyInfoAndSigns(this.directionsFinalRes);
        directionsFillPath(this.directionsFinalRes)
            .then((directionsFinalRes) => {
                this.setState({directionsFinalRes});
                this.stateOfGame = 'FINAL_ROAD_READY';
                this.raceStart(directionsFinalRes)
            });
    }

    drawPolylineFromPath = (Map, Name, bs, id, Path, Color, Opacity, strokeWeight) => {
        const polyline = new gm.Polyline({
            bs: bs,
            id: id,
            path: Path,
            strokeColor: Color,
            strokeOpacity: Opacity,
            strokeWeight: strokeWeight,
            title: Name,
            label: Name,
            zIndex: 1
        });
        return new Promise((resolve, reject) => {
            polyline.setMap(Map);
            resolve(polyline)
        });
    }

    drawPolylineFromPath2 = (Map, Name, bs, id, Path, Color, Opacity, strokeWeight) => {
        var lineSymbol = {
            path: 'M 0,-4 0,4',
            strokeOpacity: 1,
            scale: 4
        };
        const polyline = new gm.Polyline({
            bs: bs,
            id: id,
            path: Path,
            strokeColor: Color,
            strokeOpacity: Opacity,
            strokeWeight: strokeWeight,
            title: Name,
            label: Name,
            zIndex: 2,
            icons: [{
                icon: lineSymbol,
                offset: '0',
                repeat: '100px'
            }]
        });
        return new Promise((resolve, reject) => {
            polyline.setMap(Map);
            resolve(polyline)
        });
    }

    drawPolygoneFromPath = (Map, Name, bs, id, Path, Color, Opacity, strokeWeight) => {
        const polygon = new gm.Polygon({
            paths: createPolygonOutOfPath(Path),
            strokeColor: Color,
            strokeOpacity: Opacity,
            strokeWeight: 2,
            fillColor: Color,
            fillOpacity: Opacity - 0.1,
            zIndex: 1
        });
        return new Promise((resolve, reject) => {
            polygon.setMap(Map);
            resolve(polygon)
        });
    }

    directionsApplyInfoAndSigns = (path) => {
        path.legs.forEach((leg, k) => {
            leg.steps.forEach((step, s) => {
                let SignPov = "";
                let Info = "";
                let InfoUnchanged = "";
                let InfoSplit;
                InfoUnchanged = path.legs[k].steps[s].instructions;
                if (InfoUnchanged.indexOf('<div') > -1 && InfoUnchanged.indexOf('Destination') > -1) {
                    Info = InfoUnchanged.substring(0, InfoUnchanged.indexOf('<div')).toLowerCase();
                } else {
                    Info = InfoUnchanged.toLowerCase();
                }
                Info = Info.replace(/<\/?[^>]+(>|$)/g, " ");
                Info = Info.replace(/\s\s+/g, ' ');
                if (Info.indexOf("exit") > -1 && Info.indexOf("left") === -1 && Info.indexOf("right") === -1) {
                    SignPov = "Exit";
                }
                else if (Info.indexOf("merge") > -1 && Info.indexOf("left") === -1 && Info.indexOf("right") === -1) {
                    SignPov = "Merge";
                }
                else if (Info.indexOf("continue") > -1) {
                    SignPov = "Continue";
                }
                else if (Info.indexOf("ahead") > -1) {
                    SignPov = "Ahead";
                }
                else if (Info.indexOf("slight") > -1 && Info.indexOf("left") > -1) {
                    SignPov = "SlightLeft";
                }
                else if (Info.indexOf("slight") > -1 && Info.indexOf("right") > -1) {
                    SignPov = "SlightRight";
                }
                else if ((Info.indexOf("turn") > -1 || Info.indexOf("take") > -1) && Info.indexOf("left") > -1 && Info.indexOf("exit") === -1) {
                    SignPov = "TurnLeft";
                }
                else if ((Info.indexOf("turn") > -1 || Info.indexOf("take") > -1) && Info.indexOf("right") > -1 && Info.indexOf("exit") === -1) {
                    SignPov = "TurnRight";
                }
                else if (Info.indexOf("merge") > -1 && Info.indexOf("left") > -1) {
                    SignPov = "MergeLeft";
                }
                else if (Info.indexOf("merge") > -1 && Info.indexOf("right") > -1) {
                    SignPov = "MergeRight";
                }
                else if (Info.indexOf("keep") > -1 && Info.indexOf("left") > -1) {
                    SignPov = "KeepLeft";
                }
                else if (Info.indexOf("keep") > -1 && Info.indexOf("right") > -1) {
                    SignPov = "KeepRight";
                }
                else if (Info.indexOf("exit") > -1 && Info.indexOf("left") > -1) {
                    SignPov = "ExitLeft";
                }
                else if (Info.indexOf("exit") > -1 && Info.indexOf("right") > -1) {
                    SignPov = "ExitRight";
                }
                else if (Info.indexOf("take") > -1) {
                    SignPov = "Merge";
                }
                else if (Info.indexOf("u-turn") > -1) {
                    SignPov = "Uturn";
                }
                else if (Info.indexOf("head") > -1 && Info.indexOf("south") > -1) {
                    SignPov = "South";
                }
                else if (Info.indexOf("head") > -1 && Info.indexOf("north") > -1) {
                    SignPov = "North";
                }
                else if (Info.indexOf("head") > -1 && Info.indexOf("east") > -1) {
                    SignPov = "East";
                }
                else if (Info.indexOf("head") > -1 && Info.indexOf("west") > -1) {
                    SignPov = "West";
                }
                else if (Info.indexOf("walk") > -1) {
                    SignPov = "Walk";
                }
                else if (Info.indexOf("bus") > -1) {
                    SignPov = "BusEnd";
                }
                else {
                    SignPov = "Empty";
                }
                if (s > 0 && s < path.legs[k].steps.length - 1) {
                    path.legs[k].steps[s - 1].display = InfoUnchanged;
                    path.legs[k].steps[s - 1].sign = SignPov;
                } else if (s === path.legs[k].steps.length - 1) {
                    InfoSplit = InfoUnchanged.split('<div');
                    InfoSplit[1] = '<div' + InfoSplit[1];
                    path.legs[k].steps[s - 1].display = InfoSplit[0];
                    path.legs[k].steps[s - 1].sign = SignPov;
                    path.legs[k].steps[s].display = InfoSplit[1];
                    path.legs[k].steps[s].sign = 'End';
                } else if (k > 0 && s === 0) {
                    path.legs[k - 1].steps[path.legs[k - 1].steps.length - 1].display = InfoUnchanged;
                    path.legs[k - 1].steps[path.legs[k - 1].steps.length - 1].sign = SignPov;
                }
            });
        });
        return path;
    }

    //=========================================================================== Game

    raceStart = (directionsFinalRes) => {
        this.stateOfGame = 'RACE_READY';
        this.reloadSounds()
        this.setState({roadLeg: 0, roadStep: 0});
        this.setState({
            motorcycleStarted: true,
            objects: {
                ...this.state.objects,
                input: {
                    ...this.state.objects.input,
                    Moto: {
                        EngineOn: true,
                        Position: directionsFinalRes.legs[0].steps[0].lat_lngs[0],
                        HeadingDeg: (segmentAngle(directionsFinalRes.legs[0].steps[0].lat_lngs[0], directionsFinalRes.legs[0].steps[0].lat_lngs[1]) / 10).toFixed(0) * 10,
                        timestamp: Date.now()
                    }
                }
            }
        });
        this.anouncer_startSound.start(0);
        setTimeout(() => {
            this.timerX(Date.now())
        }, 3000)
    }

    objectSetOutput = (id, category, output) => {
        if (output.timestamp) {
            if (this.state.objects.input.hasOwnProperty(id)) {
                const input = this.state.objects.input;
                input[id] = null;
                this.setState({objects: {...this.state.objects, input}});
            }
        }
        const objects = this.state.objects;
        objects.output[category] = (objects.output[category]) ? objects.output[category] : {};
        objects.output[category][id] = output;
        this.setState({objects}, () => {
            if (id === 'Moto' && output.EngineOn && this.stateOfGame === 'RACE_STARTED') {
                this.directionsWatchStep();
            }
        });

    };

    roadOutput = (onRoad) => {
        if (onRoad !== this.state.onRoad) {
            this.setState({onRoad})
        }
    }

    directionsWatchStep = () => {
        let roadLeg = this.state.roadLeg;
        let roadStep = this.state.roadStep;
        let closestPointInPath = getClosestPointInPath(this.state.objects.output.moovingObj.Moto.Position, this.state.directionsFinalRes);
        if (closestPointInPath.k !== roadLeg || closestPointInPath.s !== roadStep) {
            roadLeg = closestPointInPath.k;
            roadStep = closestPointInPath.s;
            this.setState({roadLeg, roadStep})
        }
        let minibar;
        let left;
        let distanceStep;
        distanceStep = (this.directionsFinalRes.legs[roadLeg].steps[roadStep].distance.value / 1000).toFixed(3);
        minibar = 100 - (100 * haversineDist(this.state.objects.output.moovingObj.Moto.Position, this.directionsFinalRes.legs[roadLeg].steps[roadStep].end_point) / distanceStep);
        left = -(minibar * this.directionsFinalRes.legs[roadLeg].steps[roadStep].distance.value / 100 / 1000) + (this.directionsFinalRes.legs[roadLeg].steps[roadStep].distance.value / 1000);
        left = left.toFixed(3)
        this.setState({minibar, left})
        if (
            roadLeg === this.directionsFinalRes.legs.length - 1 &&
            roadStep === this.directionsFinalRes.legs[this.directionsFinalRes.legs.length - 1].steps.length - 1 &&
            haversineDist(this.state.objects.output.moovingObj.Moto.Position, this.directionsFinalRes.legs[roadLeg].steps[roadStep].start_point) > distanceStep
        ) {
            this.raceFinished();
        }
    }

    raceFinished = () => {
        if (!this.state.finished) {
            this.stateOfGame = 'RACE_FINISHED';
            this.anouncer_finishVolume.gain.value = this.anouncer_finishVolume.gain.default * this.state.generalVolume;
            this.anouncer_finishSound.start(0);
            this.setState({finished: true})
            setTimeout(() => {
                this.resetStage()
            }, 5000)
        }
    }

    timerX = (startTime) => {
        setTimeout(() => {
            if (!this.state.finished) {
                this.setState({time: Date.now() - startTime}, () => {
                    this.stateOfGame = 'RACE_STARTED';
                    this.timerX(startTime)
                })
            }
        }, 10)
    };

    displayTimer = (time) => {
        let seconds = time / 1000;
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        minutes = minutes - hours * 60
        seconds = seconds - minutes * 60 - hours * 60
        let miliseconds = seconds - Math.floor(seconds)
        return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds.toFixed(0), 2) + '.' + miliseconds.toFixed(2).toString().substr(2)
    }

    //=========================================================================== Render

    render() {
        return (
            <div className="bikeridepage">
                <div className="mapswrapper">
                    {!this.state.pickedBike && <MotoPick
                        pickBike={this.pickBike}
                    />}
                    {this.state.pickedBike && <Motorcycle
                        divID={'Moto'}
                        category={'moovingObj'}
                        pickedBike={this.state.pickedBike}
                        EngineOn={this.state.motorcycleStarted}
                        motorcycleInput={this.state.motorcycleInput}
                        motorcycleOutput={this.motorcycleOutput}
                        objectsInput={this.state.objects.input}
                        objectSetOutput={this.objectSetOutput}
                        onRoad={this.state.onRoad}
                        finished={this.state.finished}
                    />}
                    {this.state.pickedBike && <MapCenter
                        divID={'MapCenter'}
                        category={'map'}
                        pickedBike={this.state.pickedBike}
                        Start={this.state.Start}
                        End={this.state.End}
                        setStartOrEnd={this.setStartOrEnd}
                        results={this.state.results}
                        resultHighlightOnMap={this.resultHighlightOnMap}
                        resultDeHighlightOnMap={this.resultDeHighlightOnMap}
                        highlightedRoad={this.state.highlightedRoad}
                        directionsFinalRes={this.state.directionsFinalRes}
                        drawPolylineFromPath={this.drawPolylineFromPath}
                        drawPolylineFromPath2={this.drawPolylineFromPath2}
                        drawPolygoneFromPath={this.drawPolygoneFromPath}
                        directionsDisplayFinalRoad={this.directionsDisplayFinalRoad}
                        roadOutput={this.roadOutput}
                        roadLeg={this.state.roadLeg}
                        roadStep={this.state.roadStep}
                        objectsInput={this.state.objects.input}
                        objectsOutput={this.state.objects.output}
                        objectSetOutput={this.objectSetOutput}
                        mapOptions={{
                            mapTypeId: 'HYBRID',
                            motorcycleSizeCoeff: 1,
                            signsSizeCoeff: 1,
                            flagsSizeCoeff: 1,
                            pathsThicknesCoefficient: 8,
                            zoomMin: 21,
                            autoZoom: true,
                            panToMe: true,
                            panToStep: false,
                            panToWholePath: false,
                            followMe: true,
                            headWithMe: false
                        }}
                    />}
                    {this.state.pickedBike && <MapSmallBottoLeft
                        divID={'MapSmallBottoLeft'}
                        category={'map'}
                        pickedBike={this.state.pickedBike}
                        Start={this.state.Start}
                        End={this.state.End}
                        setStartOrEnd={this.setStartOrEnd}
                        results={this.state.results}
                        resultHighlightOnMap={this.resultHighlightOnMap}
                        resultDeHighlightOnMap={this.resultDeHighlightOnMap}
                        highlightedRoad={this.state.highlightedRoad}
                        directionsFinalRes={this.state.directionsFinalRes}
                        drawPolylineFromPath={this.drawPolylineFromPath}
                        drawPolylineFromPath2={this.drawPolylineFromPath}
                        directionsDisplayFinalRoad={this.directionsDisplayFinalRoad}
                        roadLeg={this.state.roadLeg}
                        roadStep={this.state.roadStep}
                        objectsInput={this.state.objects.input}
                        objectsOutput={this.state.objects.output}
                        objectSetOutput={this.objectSetOutput}
                        mapOptions={{
                            mapTypeId: 'ROAD',
                            motorcycleSizeCoeff: 4,
                            signsSizeCoeff: 0.5,
                            flagsSizeCoeff: 0.5,
                            iconSizeCoefficient: 0.5,
                            pathsThicknesCoefficient: 4,
                            zoomMin: 4,
                            autoZoom: false,
                            panToMe: false,
                            panToStep: false,
                            panToWholePath: true,
                            followMe: false,
                            headWithMe: false
                        }}
                    />}
                    {this.state.pickedBike && <MapSmallBottoRight
                        divID={'MapSmallBottoRight'}
                        category={'map'}
                        pickedBike={this.state.pickedBike}
                        Start={this.state.Start}
                        End={this.state.End}
                        setStartOrEnd={this.setStartOrEnd}
                        results={this.state.results}
                        resultHighlightOnMap={this.resultHighlightOnMap}
                        resultDeHighlightOnMap={this.resultDeHighlightOnMap}
                        highlightedRoad={this.state.highlightedRoad}
                        directionsFinalRes={this.state.directionsFinalRes}
                        drawPolylineFromPath={this.drawPolylineFromPath}
                        drawPolylineFromPath2={this.drawPolylineFromPath}
                        directionsDisplayFinalRoad={this.directionsDisplayFinalRoad}
                        roadLeg={this.state.roadLeg}
                        roadStep={this.state.roadStep}
                        objectsInput={this.state.objects.input}
                        objectsOutput={this.state.objects.output}
                        objectSetOutput={this.objectSetOutput}
                        mapOptions={{
                            mapTypeId: 'ROAD',
                            motorcycleSizeCoeff: 3.5,
                            signsSizeCoeff: 0.5,
                            flagsSizeCoeff: 0.5,
                            iconSizeCoefficient: 0.6,
                            pathsThicknesCoefficient: 4,
                            zoomMin: 4,
                            autoZoom: false,
                            panToMe: false,
                            panToStep: true,
                            panToWholePath: false,
                            followMe: false,
                            headWithMe: false
                        }}
                    />}
                    {this.state.pickedBike && <div className="timer">{this.displayTimer(this.state.time)}</div>}
                    {!this.state.pickedBike && <div
                        id="muteMusicButton"
                        className="off"
                        onClick={() => this.musicSound()}
                    >♫
                    </div>}
                </div>
                <SidePanel
                    results={this.state.results}
                    resultHighlightOnMap={this.resultHighlightOnMap}
                    resultDeHighlightOnMap={this.resultDeHighlightOnMap}
                    highlightedRoad={this.state.highlightedRoad}
                    directionsFinalRes={this.state.directionsFinalRes}
                    roadPicked={this.state.roadPicked}
                    directionsDisplayFinalRoad={this.directionsDisplayFinalRoad}
                    roadLeg={this.state.roadLeg}
                    roadStep={this.state.roadStep}
                    minibar={this.state.minibar}
                    left={this.state.left}
                    finished={this.state.finished}
                />
            </div>
        );
    }

}

export default GoogleMapsRacing;