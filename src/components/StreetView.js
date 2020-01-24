import React, {Component} from 'react';

const gm = window.google.maps;

class StreetView extends Component {

    constructor() {
        super();
        this.state = {
            Position: null,
            HeadingDeg: 0,
            Steering: 0,
            Leaning: '',
            PanoramaPosition: null,
            PanoramaHeading: null,
            roadLeg: null,
            roadStep: null,
            Start: null,
            End: null
        };
        this.map = null;
        this.picFolder = 'img/motoNewH';
        this.Motoicon = null;
        this.Moto = null;
        this.Start = null;
        this.End = null;

        this.Sign = [];

        this.directionsResultsPolyline = [];
        this.directionsFinalResPolyline = null;
        this.directionsResultsPolyline_DISPLAYED = false;
        this.directionsFinalResPolyline_DISPLAYED = false;
        this.directionsFinalResSigns_DISPLAYED = false;
    }

    componentDidMount() {
        this.googleMapInit();
    }

    componentWillReceiveProps(nextProps) {
        // this.MotoFor(nextProps.Position)
        // this.MotoDir(nextProps.HeadingDeg, nextProps.Steering, this.map.pov.heading)
        this.displayDirectionsResults(nextProps.results)
        this.displayDirectionsFinalResSigns(nextProps.directionsFinalRes)
        this.displayMotorcycle(nextProps.motorcycle)
        this.panToStep(nextProps.directionsFinalRes, nextProps.roadLeg, nextProps.roadStep)
        if (nextProps.reset) {
            // this.reset()
        }
    }

    componentDidUpdate() {


    }

    googleMapInit() {

        var panoramaProp = {
            visible: true,
            // mode : 'html5',
            overviewMapControl: false,
            streetViewControl: false,
            addressControl: false,
            position: this.gmPoint(43.657374647900724, -79.40337939630405),
            panControl: false,
            zoomControl: false,
            scaleControl: false,
            rotateControl: false,
            linksControl: false,
            clickToGo: false,
            scrollwheel: false,
            disableDefaultUI: true,
            standAlone: false,
            motionTracking: false,
            Pov0360: 0
        };
        this.map = new gm.StreetViewPanorama(document.getElementById(this.props.divID), panoramaProp);
        this.renderMarkers()

    }

    renderMarkers = () => {
        //---------------------------------------------------------------------------------------- Me
        this.Motoicon = new gm.MarkerImage(
            'img/motoBlueH/0.png',
            new gm.Size(100, 100),
            new gm.Point(0, 0),
            new gm.Point(50, 0),
            new gm.Size(100, 100)
        );
        this.Moto = new gm.Marker({
            map: this.map,
            draggable: true,
            position: null,
            zIndex: 8,
            icon: this.Motoicon
        });

        this.Start = new gm.Marker({
            map: this.map,
            draggable: false,
            position: null,
            zIndex: 6,
            icon: new gm.MarkerImage(
                'img/Signs32/SignStart.png',
                new gm.Size(150, 150),
                new gm.Point(0, 0),
                new gm.Point(75, 0),
                new gm.Size(150, 150)
            )
        });

        gm.event.addListener(this.Start, 'dragend', (function () {
            this.props.setStartOrEnd(this.Start.getPosition(), this.End.getPosition())
        }).bind(this), {passive: true});

        this.End = new gm.Marker({
            map: this.map,
            draggable: false,
            position: this.gmPoint(43.664444099789286, -79.39706279407397),
            zIndex: 6,
            icon: new gm.MarkerImage(
                'img/Signs32/SignEnd.png',
                new gm.Size(100, 150),
                new gm.Point(0, 0),
                new gm.Point(50, 0),
                new gm.Size(100, 150)
            )
        });

        gm.event.addListener(this.End, 'dragend', (function () {
            this.props.setStartOrEnd(this.Start.getPosition(), this.End.getPosition())
        }).bind(this), {passive: true});
        // console.log('StreetView', this.map);


        gm.event.addListener(this.map, 'pano_changed', (function () {
            this.map.setVisible(true)
        }).bind(this), {passive: true});

        // gm.event.addListener(this.map, 'tiles_loaded', (function () {
        //     this.map.setVisible(true)
        // }).bind(this), {passive: true});

    }

    displayDirectionsResults = (results) => {
        if (!this.directionsResultsPolyline_DISPLAYED) {
            this.directionsResultsPolyline_DISPLAYED = true;
            for (let i = 0; i < results.length; i++) {
                this.directionsResultsPolyline[i] = this.props.drawPolylineFromPathonPanorama(this.map, results[i].summary, "directionsResult", i, results[i], "Red", 0.2, 16)
                for (let j = 0; j < this.directionsResultsPolyline[i].length; j++) {
                    this.directionsResultsPolyline[i][j].setMap(this.map);
                }
            }
            // console.log('this.directionsResultsPolyline',this.directionsResultsPolyline);
        }

    }


    displayMotorcycle = (data) => {
        if (this.Moto.getPosition() !== data.Position) {
            this.Moto.setPosition(data.Position)
            this.setState({Position: data.Position});
            // if (this.props.mapOptions.panToMe) {
                this.panToMe()
            // }
        }
        let angle = data.HeadingDeg - this.map.pov.heading.toFixed(0);
        if (angle < 0) {
            angle = angle + 360;
        }
        if (this.state.Leaning !== data.Leaning || this.state.HeadingDeg !== angle) {
            this.Motoicon.url = this.picFolder + data.Leaning + '/' + angle + '.png';
            this.Moto.setIcon(this.Motoicon);
            this.setState({HeadingDeg: data.HeadingDeg, Leaning: data.HeadingDeg});
            this.Moto.HeadingDeg = angle
        }

    }

    displayDirectionsFinalResSigns = (directionsFinalRes) => {
        if (directionsFinalRes && !this.directionsFinalResSigns_DISPLAYED) {
            // console.log('map 2 displayDirectionsFinalResSigns()');
            this.directionsFinalResSigns_DISPLAYED = true;
            const signicon = new gm.MarkerImage(
                'img/Signs32/SignEmpty.png',
                new gm.Size(100, 100),
                new gm.Point(0, 0),
                new gm.Point(50, 100),
                new gm.Size(100, 100)
            );
            for (let k = 0; k < directionsFinalRes.legs.length; k++) {
                for (let s = 1; s < directionsFinalRes.legs[k].steps.length; s++) {
                    // console.log('k', k);
                    // console.log('s', s);
                    // console.log('steps[s - 1].sign', directionsFinalRes.legs[k].steps[s - 1].sign);
                    // console.log('steps[s].start_location', directionsFinalRes.legs[k].steps[s].start_location.lat());
                    // console.log('steps[s].start_location', directionsFinalRes.legs[k].steps[s].start_location.lng());
                    signicon.url = 'img/Signs32/Sign' + directionsFinalRes.legs[k].steps[s - 1].sign + '.png';
                    const lastSign = this.Sign.length;
                    // console.log(lastSign);
                    this.Sign[lastSign] = new gm.Marker({
                        map: this.map,
                        draggable: false,
                        title: 'Sign ' + lastSign,
                        id: lastSign,
                        k: k,
                        s: s,
                        position: directionsFinalRes.legs[k].steps[s].start_location,
                        // cameraSign: cameraSign,
                        // cameraAngle: cameraAngle,
                        zIndex: 8,
                        icon: signicon,
                        // SignPov: SignPov
                    });
                    // this.setMap(this.Sign[lastSign]);
                    // console.log('this.Sign[lastSign].getPosition()', this.Sign[lastSign].getPosition().lat());
                    // console.log('this.Sign[lastSign].getPosition()', this.Sign[lastSign].getPosition().lng());
                    // console.log('this.Sign[lastSign].icon.url', this.Sign[lastSign].icon.url);
                    // this.map.setZoom(1);
                }
            }

        }
    }

    panToMe = () => {
        const Position = this.Moto.getPosition();
        const PanoramaPosition = this.map.getPosition();
        // const maximumDistanceBetweenMeAndPanorama = 0.00000000005 + this.props.KMHSpeed / 500000000000;
        // console.log('maximumDistanceBetweenMeAndPanorama', maximumDistanceBetweenMeAndPanorama);
        const motoAngle = this.props.segmentAngle(this.map.getPosition(), this.Moto.getPosition())
        if(Math.abs(this.map.pov.heading - motoAngle) < 0.01){
            this.map.setPov({
                heading: motoAngle,
                pitch: 3,
                zoom: 1
            });
        }
        // console.log('Math.abs(this.props.coordDistance(Position, PanoramaPosition)', Math.abs(this.props.coordDistance(Position, PanoramaPosition)));
        // if (Math.abs(this.props.coordDistance(Position, PanoramaPosition) > maximumDistanceBetweenMeAndPanorama)) {
        //     console.log('----------------------panToMe()');
        //     // console.log('Position', Position);
        //     // console.log('PanoramaPosition', PanoramaPosition);
        //     // const statePanoramaPosition = this.state.PanoramaPosition;
        //     this.map.setPov({
        //         heading: this.props.segmentAngle(this.map.getPosition(), this.Moto.getPosition()),
        //         pitch: 3,
        //         zoom: 1
        //     });
        //     this.map.setPosition(this.Moto.getPosition())
        //
        //     this.setState({PanoramaPosition: Position});
        //     this.setState({PanoramaHeading: this.map.pov.heading});
        // }
        if (this.props.ExPoints.length) {
            const heading = this.props.segmentAngle(this.map.getPosition(), this.Moto.getPosition());
            if (Math.abs(heading - this.map.pov.heading) > 30) {
                this.map.setPov({heading, pitch: 3, zoom: 1});
            }
        }
    }

    panToStep = (Path, roadLeg, roadStep) => {
        if (Path !== null && roadLeg !== null && roadStep !== null &&
            (roadLeg !== this.state.roadLeg || roadStep !== this.state.roadStep)) {


            // console.log('panToStep()');
            // console.log('roadLeg', roadLeg);
            // console.log('roadStep', roadStep);
            // console.log('Path.legs[roadLeg].steps[roadStep].start_point', Path.legs[roadLeg].steps[roadStep].start_point);
            this.findClosestView(Path.legs[roadLeg].steps[roadStep].start_point)
                .then(res => {
                    // console.log('--------',res);
                    // this.map.setPosition(res.location.latLng);
                    this.map.setPano(res.location.pano);
                    this.setState({roadLeg, roadStep});
                    this.map.setPov({
                        heading: this.props.segmentAngle(res.location.latLng, Path.legs[roadLeg].steps[roadStep].end_point),
                        pitch: 3,
                        zoom: 1
                    });
                })
                .catch(err => console.log(err))
            // this.map.setPosition(Path.legs[roadLeg].steps[roadStep].start_point);
            // this.map.setPov({
            //     heading: this.props.segmentAngle(Path.legs[roadLeg].steps[roadStep].start_point, Path.legs[roadLeg].steps[roadStep].end_point),
            //     pitch: 3,
            //     zoom: 1
            // });
        }
    }


    findClosestView = (point) => {
        return new Promise((resolve, reject) => {
            const service = new gm.StreetViewService();
            service.getPanorama({
                    location: point,
                    radius: 50,
                    source: gm.StreetViewSource.OUTDOOR
                },
                (res, status) => {
                    if (status === 'OK') {
                        resolve(res);
                    } else {
                        reject(false);
                    }
                })
        });
    }

    gmPoint = (Y, X) => {
        return new gm.LatLng(Y, X);
    }

    render() {
        return (
            <div id={this.props.divID}></div>
        );
    }

}

export default StreetView;