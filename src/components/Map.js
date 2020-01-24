import React, {Component} from 'react';
import {gmPoint, angle_0_360, createSidewalkPoints, pad} from './functions'

const gm = window.google.maps;

class Map extends Component {
    //============================================================================ Init

    constructor() {
        super();
        this.state = this.resetState();
        this.map = null;
        this.Moto = null;
        this.Start = null;
        this.End = null;
        this.Sign = [];
        this.directionsResultsPolyline = [];
        this.directionsFinalResPolyline = null;
        this.directionsFinalResPolygone = null;
        this.directionsResultsPolyline_DISPLAYED = false;
        this.directionsFinalResPolyline_DISPLAYED = false;
        this.directionsFinalResSigns_DISPLAYED = false;
    }

    componentDidMount() {
        this.picFolder = 'img/' + this.props.pickedBike + '/45';
        this.googleMapInit();
    }

    componentWillReceiveProps(nextProps) {
        this.setStartOrEndLocal(nextProps.Start, nextProps.End)
        this.displayDirectionsResults(nextProps.results)
        this.resultHighlightOnMap(nextProps.highlightedRoad)
        this.displayDirectionsFinalRes(nextProps.directionsFinalRes)
        this.displayDirectionsFinalResSigns(nextProps.directionsFinalRes)
        this.displayMovables(nextProps.objectsOutput)

        if (this.props.mapOptions.panToStep) {
            this.panToStep(nextProps.directionsFinalRes, nextProps.roadLeg, nextProps.roadStep)
        }
    }

    googleMapInit() {
        if (!this.map) {
            const mapProp = {
                mapTypeId: gm.MapTypeId[this.props.mapOptions.mapTypeId],
                center: gmPoint(0, 0),
                zoom: 3,
                tilt: 45,
                heading: 0,
                disableDoubleClickZoom: true,
                scaleControl: false,
                streetViewControl: false,
                overviewMapControl: false,
                mapTypeControl: false,
                zoomControl: false,
                panControl: false,
                fullscreenControl: false,
                keyboardShortcuts: false,
                zooming: false
            };
            this.map = new gm.Map(document.getElementById(this.props.divID), mapProp);
            const noPoi = [{
                featureType: "poi",
                stylers: [{visibility: "off"}, {featureType: "transit.station.bus", stylers: [{visibility: "off"}]}]
            }];
            this.map.setOptions({styles: noPoi});
            gm.event.addListener(this.map, 'zoom_changed', () => {
                this.map.zooming = true;
                // this.motoIcon(this.Moto.HeadingMap, this.Moto.DispFrame);
            });
            gm.event.addListener(this.map, 'heading_changed', () => {
                this.map.zooming = false;
                this.motoIcon(this.Moto.HeadingMap, this.Moto.DispFrame);
            });
            gm.event.addListener(this.map, 'tilesloaded', () => {
                this.map.zooming = false;
                this.motoIcon(this.Moto.HeadingMap, this.Moto.DispFrame);
            });
            this.renderMarkers();
        }
    }

    renderMarkers = () => {
        // console.log('==================================');
        // console.log('renderMarkers()');
        if (!this.Moto) {
            this.Moto = new gm.Marker({
                map: this.map,
                draggable: false,
                position: null,
                title: 'Motorcycle',
                zIndex: 1,
                icon: this.motoIcon(0, '0004', 'toReturn'),
                HeadingDeg: 0,
                HeadingMap: 0,
                Leaning: '',
                DispFrame: '0004'
            });
        }
        if (!this.Start) {
            this.Start = new gm.Marker({
                map: this.map,
                draggable: true,
                position: null,
                zIndex: 6,
                icon: new gm.MarkerImage(
                    'img/Signs32/SignStart.png',
                    new gm.Size(32 * this.props.mapOptions.flagsSizeCoeff, 48 * this.props.mapOptions.flagsSizeCoeff),
                    new gm.Point(0 * this.props.mapOptions.flagsSizeCoeff, 0 * this.props.mapOptions.flagsSizeCoeff),
                    new gm.Point(16 * this.props.mapOptions.flagsSizeCoeff, 48 * this.props.mapOptions.flagsSizeCoeff),
                    new gm.Size(32 * this.props.mapOptions.flagsSizeCoeff, 48 * this.props.mapOptions.flagsSizeCoeff)
                )
            });
            gm.event.addListener(this.Start, 'dragend', ( () => {
                this.props.setStartOrEnd(this.Start.getPosition(), this.End.getPosition())
            }));
        }
        if (!this.End) {
            this.End = new gm.Marker({
                map: this.map,
                draggable: true,
                position: null,
                zIndex: 6,
                icon: new gm.MarkerImage(
                    'img/Signs32/SignEnd.png',
                    new gm.Size(32 * this.props.mapOptions.flagsSizeCoeff, 48 * this.props.mapOptions.flagsSizeCoeff),
                    new gm.Point(0 * this.props.mapOptions.flagsSizeCoeff, 0 * this.props.mapOptions.flagsSizeCoeff),
                    new gm.Point(16 * this.props.mapOptions.flagsSizeCoeff, 48 * this.props.mapOptions.flagsSizeCoeff),
                    new gm.Size(32 * this.props.mapOptions.flagsSizeCoeff, 48 * this.props.mapOptions.flagsSizeCoeff)
                )
            });
            gm.event.addListener(this.End, 'dragend', (() => {
                this.props.setStartOrEnd(this.Start.getPosition(), this.End.getPosition())
            }));
        }
    }

    //=========================================================================== Default

    resetState = () => {
        // console.log('resetState()');
        return ({
            Start: null,
            End: null,
            HeadingDeg: 0,
            HeadingMap: 0,
            Steering: 0,
            Leaning: '',
            PanoramaPositionLat: null,
            PanoramaPositionLng: null,
            highlightedRoad: null,
            roadLeg: null,
            roadStep: null,
            finished: false,
            Position: null,
            settings: {
                motoSize: 1
            },
            generalVolume: 1
        });
    }

    resetStage = () => {
        // console.log('resetStage()');
        if (this.directionsResultsPolyline_DISPLAYED) {
            this.directionsResultsPolyline.map(line => line.setMap(null));
        }
        if (this.directionsFinalResPolyline_DISPLAYED) {
            this.directionsFinalResPolyline.setMap(null);
            this.directionsFinalResPolyline = null;
            if (this.props.drawPolygoneFromPath) {
                this.directionsFinalResPolygone.setMap(null);
                this.directionsFinalResPolygone = null;
            }
        }
        if (this.directionsFinalResSigns_DISPLAYED) {
            this.Sign.map(sign => sign.setMap(null))
        }
        this.directionsResultsPolyline.length = 0;
        this.Sign.length = 0
        this.directionsResultsPolyline_DISPLAYED = false;
        this.directionsFinalResPolyline_DISPLAYED = false;
        this.directionsFinalResSigns_DISPLAYED = false;
    }

    //=========================================================================== Mapping

    setStartOrEndLocal = (Start, End) => {
        if (Start !== this.state.Start || End !== this.state.End) {
            // console.log('setStartOrEndLocal()');
            this.resetStage();
            this.setState({...this.resetState(), Start, End}, () => {
                this.Start.setPosition(this.state.Start)
                this.End.setPosition(this.state.End)
            })
        }
    }

    displayDirectionsResults = (results) => {
        if (!this.directionsResultsPolyline_DISPLAYED && results && results.length > 0) {
            // console.log('displayDirectionsResults() ' + this.props.divID, results);
            // console.log('this.directionsResultsPolyline_DISPLAYED', this.directionsResultsPolyline_DISPLAYED);
            this.directionsResultsPolyline_DISPLAYED = true;
            for (let i = 0; i < results.length; i++) {
                this.props.drawPolylineFromPath(this.map, results[i].summary, "directionsResult", i, results[i].overview_path, "#ff0000", 0.2, this.props.mapOptions.pathsThicknesCoefficient)
                    .then((polyline) => {
                        this.directionsResultsPolyline[polyline.id] = polyline;
                        const bounds = new gm.LatLngBounds();
                        bounds.extend(this.Start.getPosition());
                        bounds.extend(this.End.getPosition());
                        this.map.fitBounds(bounds);
                        gm.event.addListener(this.directionsResultsPolyline[polyline.id], "click", function (e) {
                            this.props.directionsDisplayFinalRoad(polyline.id);
                        }.bind(this));
                        gm.event.addListener(this.directionsResultsPolyline[polyline.id], "mouseover", function (e) {
                            this.props.resultHighlightOnMap(polyline.id);
                        }.bind(this));
                        gm.event.addListener(this.directionsResultsPolyline[polyline.id], "mouseout", function (e) {
                            this.props.resultDeHighlightOnMap();
                        }.bind(this));
                    });
            }
        }
    }

    resultHighlightOnMap = (highlightedRoad) => {
        if (this.directionsResultsPolyline.length > 0 && this.props.directionsFinalRes === null) {
            this.resultDeHighlightOnMap()
            if (highlightedRoad !== null) {
                this.directionsResultsPolyline[highlightedRoad].setOptions({'strokeOpacity': 1});
            }
        }
    }

    resultDeHighlightOnMap = () => {
        for (let i = 0; i < this.directionsResultsPolyline.length; i++) {
            this.directionsResultsPolyline[i].setOptions({'strokeOpacity': 0.2});
        }
    }

    displayDirectionsFinalRes = (directionsFinalRes) => {
        if (directionsFinalRes && !this.directionsFinalResPolyline_DISPLAYED) {
            // console.log('displayDirectionsFinalRes() ' + this.props.divID);
            this.directionsFinalResPolyline_DISPLAYED = true;
            let color = '#22a79a'
            let opacity = 0.5
            if (this.props.drawPolygoneFromPath) {
                color = '#ffffff'
                opacity = 0
            }
            this.props.drawPolylineFromPath2(this.map, "FinalRoad", "Final Road", null, directionsFinalRes.overview_path, color, opacity, this.props.mapOptions.pathsThicknesCoefficient)
                .then((renfull) => {
                    this.directionsFinalResPolyline = renfull;
                    this.directionsResultsPolyline.map(line => line.setMap(null));
                    if (this.props.drawPolygoneFromPath) {
                        this.props.drawPolygoneFromPath(this.map, "FinalRoad", "Final Road", null, directionsFinalRes.overview_path, "#050a24", 0.6, this.props.mapOptions.pathsThicknesCoefficient)
                            .then((polygone) => {
                                this.motoIcon(this.Moto.HeadingMap, this.Moto.DispFrame)
                                this.directionsFinalResPolygone = polygone;
                                if (this.props.mapOptions.panToMe || this.props.mapOptions.followMe) {
                                    this.map.setCenter(directionsFinalRes.legs[0].steps[0].start_location)
                                }
                                this.map.setZoom(this.props.mapOptions.zoomMin)
                                this.motoIcon(this.Moto.HeadingMap, this.Moto.DispFrame)
                            })
                    }
                })
        }
    }

    displayMovables = (data) => {
        if (data.moovingObj) {
            if (this.Moto.getPosition() !== data.moovingObj.Moto.Position) {
                this.Moto.setPosition(data.moovingObj.Moto.Position);
                this.Moto.HeadingDeg = data.moovingObj.Moto.HeadingDeg;
                this.Moto.HeadingMap = angle_0_360(data.moovingObj.Moto.HeadingDeg - this.map.heading);
                this.Moto.DispFrame = pad(data.moovingObj.Moto.DispFrame, 4);
                this.motoIcon(this.Moto.HeadingMap, this.Moto.DispFrame);
                (this.props.mapOptions.panToMe) ? this.panToMe() : null;
                (this.props.mapOptions.autoZoom && !this.map.zooming) ? this.autoZoom(data) : null;
                (this.props.mapOptions.followMe && !this.map.zooming) ? this.followMe() : null;
                (this.props.mapOptions.headWithMe && !this.map.zooming) ? this.headWithMe() : null;
            }
            if (this.props.roadOutput && this.directionsFinalResPolygone) {
                this.props.roadOutput(gm.geometry.poly.containsLocation(data.moovingObj.Moto.Position, this.directionsFinalResPolygone))
            }
        }
    }

    motoIcon = (HeadingMap, DispFrame, toReturn = null) => {
        let size = this.props.mapOptions.motorcycleSizeCoeff * this.state.settings.motoSize / (22 - this.map.zoom);
        const url = this.picFolder + '/' + HeadingMap.toString() + '_' + DispFrame + '.png';
        const icon = new gm.MarkerImage(
            url,
            new gm.Size(39 * size, 39 * size),
            new gm.Point(0 * size, 0 * size),
            new gm.Point(19 * size, 24 * size),
            new gm.Size(39 * size, 39 * size)
        );
        if (!toReturn) {
            this.Moto.setIcon(icon);
        } else {
            return icon;
        }
    };

    autoZoom = (data) => {
        // console.log('this.map',this.map);
        if (data.moovingObj.Moto.KMHSpeed <= 50) {
            (this.map.zoom !== 21) ? this.map.setZoom(21) : null;
        }
        else if (data.moovingObj.Moto.KMHSpeed > 50 && data.moovingObj.Moto.KMHSpeed <= 150) {
            (this.map.zoom < 20) ? this.map.setZoom(20) : null;
        }
        else if (data.moovingObj.Moto.KMHSpeed > 150 && data.moovingObj.Moto.KMHSpeed <= 195) {
            (this.map.zoom > 20) ? this.map.setZoom(20) : null;
        }
        else if (data.moovingObj.Moto.KMHSpeed > 195 && data.moovingObj.Moto.KMHSpeed <= 225) {
            (this.map.zoom < 19) ? this.map.setZoom(19) : null;
        }
        else if (data.moovingObj.Moto.KMHSpeed > 225 && data.moovingObj.Moto.KMHSpeed <= 250) {
            (this.map.zoom > 19) ? this.map.setZoom(19) : null;
        }
        else if (data.moovingObj.Moto.KMHSpeed > 250 && data.moovingObj.Moto.KMHSpeed <= 270) {
            (this.map.zoom < 18) ? this.map.setZoom(18) : null;
        }
        else if (data.moovingObj.Moto.KMHSpeed > 270) {
            (this.map.zoom > 18) ? this.map.setZoom(18) : null;
        }
    }

    panToMe = () => {
        try {
            if (this.Moto.getPosition().lat() > (this.map.getBounds().getNorthEast().lat() + this.map.getCenter().lat()) / 2
                || this.Moto.getPosition().lat() < (this.map.getBounds().getSouthWest().lat() + this.map.getCenter().lat()) / 2
                || this.Moto.getPosition().lng() > (this.map.getBounds().getNorthEast().lng() + this.map.getCenter().lng()) / 2
                || this.Moto.getPosition().lng() < (this.map.getBounds().getSouthWest().lng() + this.map.getCenter().lng()) / 2) {
                const centermapLat = (this.Moto.getPosition().lat() - this.map.getCenter().lat()) / 2 + this.Moto.getPosition().lat();
                const centermapLng = (this.Moto.getPosition().lng() - this.map.getCenter().lng()) / 2 + this.Moto.getPosition().lng();
                // //map.panTo(this.Moto.getPosition());
                this.map.panTo(gmPoint(centermapLat, centermapLng));
            }
        }
        catch (err) {
            // console.log('err', err);
        }
    }

    panToStep = (Path, roadLeg, roadStep) => {
        if (Path !== null && (roadLeg !== this.state.roadLeg || roadStep !== this.state.roadStep)) {
            const bounds = new gm.LatLngBounds();
            Path.legs[roadLeg].steps[roadStep].lat_lngs.map(point => {
                bounds.extend(point)
            });
            this.map.fitBounds(bounds);
            this.setState({roadLeg, roadStep});
        }
    }

    panToWholePath = (Path) => {
        if (Path) {
            const bounds = new gm.LatLngBounds();
            Path.legs.map(leg => leg.steps.map(step => step.lat_lngs.map(point => {
                bounds.extend(point)
            })));
            this.map.fitBounds(bounds);
        }
    }

    followMe = () => {
        // const mid = gmPoint((this.map.getCenter().lat() + this.Moto.getPosition().lat()) / 2, (this.map.getCenter().lng() + this.Moto.getPosition().lng()) / 2)
        // this.map.setCenter(mid)
        this.map.setCenter(this.Moto.getPosition())
    }

    headWithMe = () => {
        if (angle_0_360(this.map.heading - this.Moto.HeadingDeg) > 80 && !this.map.zooming) {
            this.map.setHeading(this.Moto.HeadingDeg);
        }
    }

    displayDirectionsFinalResSigns = (directionsFinalRes) => {
        // console.log('displayDirectionsFinalResSigns()', directionsFinalRes);
        if (directionsFinalRes && !this.directionsFinalResSigns_DISPLAYED) {
            this.directionsFinalResSigns_DISPLAYED = true;
            const signicon = new gm.MarkerImage(
                '',
                new gm.Size(32 * this.props.mapOptions.signsSizeCoeff, 32 * this.props.mapOptions.signsSizeCoeff),
                new gm.Point(0 * this.props.mapOptions.signsSizeCoeff, 0 * this.props.mapOptions.signsSizeCoeff),
                new gm.Point(16 * this.props.mapOptions.signsSizeCoeff, 32 * this.props.mapOptions.signsSizeCoeff),
                new gm.Size(32 * this.props.mapOptions.signsSizeCoeff, 32 * this.props.mapOptions.signsSizeCoeff)
            );
            for (let k = 0; k < directionsFinalRes.legs.length; k++) {
                for (let s = 1; s < directionsFinalRes.legs[k].steps.length; s++) {
                    signicon.url = 'img/Signs32/Sign' + directionsFinalRes.legs[k].steps[s - 1].sign + '.png';
                    if (this.props.divID === 'MapCenter') {
                        const halfStreetWide = 0.00008;
                        const createSidewalkP1 = directionsFinalRes.legs[k].steps[s - 1].lat_lngs[directionsFinalRes.legs[k].steps[s - 1].lat_lngs.length - 2];
                        const createSidewalkP2 = directionsFinalRes.legs[k].steps[s].lat_lngs[0];
                        const createSidewalkP3 = directionsFinalRes.legs[k].steps[s].lat_lngs[1];
                        const sidewalkPoints = createSidewalkPoints(createSidewalkP1, createSidewalkP2, createSidewalkP3, halfStreetWide)
                        this.Sign[this.Sign.length] = new gm.Marker({
                            map: this.map,
                            draggable: false,
                            position: sidewalkPoints[0],
                            zIndex: 8,
                            icon: signicon,
                        });
                        this.Sign[this.Sign.length] = new gm.Marker({
                            map: this.map,
                            draggable: false,
                            position: sidewalkPoints[1],
                            zIndex: 8,
                            icon: signicon,
                        });
                    } else {
                        this.Sign[this.Sign.length] = new gm.Marker({
                            map: this.map,
                            draggable: false,
                            position: directionsFinalRes.legs[k].steps[s].start_location,
                            zIndex: 8,
                            icon: signicon,
                        });
                    }

                }
            }
        }
    }

    //=========================================================================== Game

    finished = () => {
        setTimeout(() => {
            this.resetStage()
        }, 4500)
    }

    //=========================================================================== Render

    displaySetting = (name, settingIndex, min, max, step) => {
        return (
            <div className={'setting ' + settingIndex}>
                <label htmlFor={settingIndex}>{name}</label>
                <input
                    name={settingIndex}
                    type="range" className="slider"
                    min={min} max={max} step={step}
                    value={this.state.settings[settingIndex]}
                    onChange={(e) => this.setSetting(settingIndex, Number(e.target.value))}
                    onInput={(e) => this.setSetting(settingIndex, Number(e.target.value))}
                />
            </div>
        );
    };

    setSetting = (settingIndex, value) => {
        const settings = this.state.settings;
        settings[settingIndex] = value;
        this.setState({settings});
    };

    render() {
        return (
            <div className={'map topview ' + this.props.divID}>
                <div className="map_wrapper">
                    <div className="googleMap" id={this.props.divID}>{}</div>
                    {this.props.divID === 'MapCenter' &&<div className="keysInstructions">
                        <div className="inner">
                            <div className="middle">
                                <div className="line">
                                    <span className="but">↑</span>
                                    <span className="text">Accelerate</span>
                                </div>
                                <div className="line">
                                    <span className="but">←</span>
                                    <span className="text">Left</span>
                                </div>
                                <div className="line">
                                    <span className="but">→</span>
                                    <span className="text">Right</span>
                                </div>
                                <div className="line">
                                    <span className="but">↓</span>
                                    <span className="text">Break</span>
                                </div>
                                <div className="line">
                                    <span className="but">A</span>
                                    <span className="text">Shift Up</span>
                                </div>
                                <div className="line">
                                    <span className="but">Z</span>
                                    <span className="text">Shift Down</span>
                                </div>
                            </div>
                        </div>
                    </div>}
                    {this.props.divID === 'MapCenter' &&
                    <div className="settings">
                        <div className="settings_block">
                            {this.displaySetting('Moto Size', 'motoSize', 1, 2, 0.05)}
                        </div>
                    </div>
                    }
                </div>
            </div>
        );
    }
}

export default Map;