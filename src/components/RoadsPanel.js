import React, {Component} from 'react';

class RoadsPanel extends Component {

    constructor() {
        super();
        this.state = {
            substate: false
        };
    }

    componentDidUpdate() {
            let roads = document.getElementsByClassName('road');
            roads = Array.from(roads);
            roads.forEach(item => {
                item.style.opacity = 0.3;
            });
            if(this.props.highlightedRoad !== null){
                document.getElementById('road_' + this.props.highlightedRoad).style.opacity = 1;
            }
    }

    render() {
        return (
            <div className="RoadsPanel">
                {this.props.results.map((road, index) => {
                    return (
                        <div
                            className="road"
                            id={'road_' + index}
                            key={index}
                            onClick={() => this.props.directionsDisplayFinalRoad(index)}
                            onMouseOver={() => this.props.resultHighlightOnMap(index)}
                            onMouseOut={() => this.props.resultDeHighlightOnMap()}
                        >
                            <img src="img/SignsPan/SignRoute.png"/>
                            <span>{road.summary}</span>
                        </div>
                    );
                })}
                <div>-------------------</div>
                <div className="title">Instructions:</div>
                <div>This is a cross between a GPS unit and a video game.</div>
                <div>Pick one of the motorcycles then pick one of the roads to drive on or drag one of the flags to another point on the map.</div>
                <div>Once a road is picked, the race starts. Not much of a race, just against time.</div>
                <br/>
                <div className="title">Operation:</div>
                <div><img src="img/arrowkeys.jpg" alt="arrow keys"/></div>
                <div>Arrow Up is your Accelerator.</div>
                <div>Steer with Left and Right Arrows</div>
                <div>SpaceBar is your Clutch.</div>
                <div>There are 6 speeds. A to shift up, Z to shift down.</div>
                <br/>
                <div className="title">How I made this:</div>
                <div><b>The motocycles</b> are free 3D models I found on the internet and simplified in Blender. I made the riders in Poser and imported the motorcycles in. Once I placed the riders on the motorcycles, I created patterns for inclination and other positions of the rider (putting foot or knee down ...etc) and created a movie that I save as a series of pngs. I then rotate the whole scene in Poser and create a movie for every 10 degrees. The wheels do look like they turn and I do this by oscillating between 2 pictures. In other words, for every picture you see, there is a double in which the wheels are rotated of 30 degrees.</div>
                <div>For <b>the sounds</b>, I took the sound of a motor in idle mode and a sound of a motor accelerating (the sounds are actually from a old F1 game) and play them together. The frequency (playback rate) of the 2 sounds are then hooked to the torque of the engine and cross-faded so the idle sound is lauder on low RPM and muted on high. I also added a gravel sound when the motorcycle is off the road and a wheel squiking sound for when the motorcycle breaks while turning.</div>
                <div><b>The infrastructure</b> is provided by Google map's system of coordinates.</div>
                <div><b>The roads</b> are calculated by Google's DirectionsService. At first it requests for roads between the two flags and prints the results on the maps. Once a road is picked, I calculate extra coordinates and add them to the given path as the service provides only the ends of straight lines. Once I have a smooth path I create a polygon that encircles the path and forms the road on which the race is happening. I also interpret the directions provided and crate traffic signs that I place at every turn. The directions are also displayed, turn by turn, in the side panel.</div>
                <div><b>The motion</b> of the motorcycles is calculated using a very simple formula. Motion = Torque x GearRatio. To this formula I add a few friction forces but otherwise it's as simple as that.</div>
                <div><b>The position</b> is calculated by adding the calculated motion to the lat-long system of the infrastructure.</div>
                <div><b>Speed Bike - Dirt Bike.</b> I tried to give the two motorcycles a different feeling, sound and driving style. While the Speed Bike is very fast and agile in the inclinations, the Dirt Bike is slower but has more torque and slides well keeping momentum through the corners. I tried to give them a different sound as well. The Speed Bike has a higher idle and a louder accelerating sound while the Dirt Bike has a lower idle and a quieter acceleration sound.</div>
            </div>
        );
    }
}

export default RoadsPanel;