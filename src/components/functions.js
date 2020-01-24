const gm = window.google.maps;

export const gmPoint = (Y, X) => {
    return new gm.LatLng(Y, X);
}

export const pointAtDistAndAngle = (P, d, a, Q = null) => {
    // uses gmPoint(Y,X)
    // uses rad(x)
    //if Q=null, angle a is in rad
    //if Q!=null, angle a is in deg
    if (Q != null) {
        a = rad(a);
    }
    let Y = d * Math.cos(a) + P.lat();
    let X = d * Math.sin(a) + P.lng();
    return gmPoint(Y, X);
}

export const rad = angle => {
    return angle * Math.PI / 180;
}

export const deg = angle => {
    return angle * 180 / Math.PI;
}

export const segmentAngle = (P1, P2, Q = null) => {
    //if Q!=null, angle a is returned in rad
    //if Q=null, angle a is returned in deg
    const x1 = P1.lng();
    const y1 = P1.lat();
    const x2 = P2.lng();
    const y2 = P2.lat();
    if (Q === null) {
        return (Math.atan2((x2 - x1), (y2 - y1))) * 180 / Math.PI;
    } else {
        return Math.atan2((x2 - x1), (y2 - y1));
    }
}

export const pad = (num, size) => {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
    // return num;
}

export const coordDistance = (p1, p2) => {
    const dLat = rad(p2.lat() - p1.lat()), dLong = rad(p2.lng() - p1.lng());
    return Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
}

export const haversineDist = (p1, p2) => {
    const R = 6371, a = coordDistance(p1, p2);
    const c = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return c.toFixed(3);
}

export const findClosestView = point => {
    console.log('******* findClosestView()');
    return new Promise((resolve, reject) => {
        const service = new gm.StreetViewService();
        service.getPanorama({
                location: point,
                radius: 50,
                source: gm.StreetViewSource.OUTDOOR
            },
            (result, status) => {
                if (status === 'OK') {
                    resolve(result);
                } else {
                    reject(false);
                }
            })
    });
}

export const CoordToAddress = coord => {
    return new Promise((resolve, reject) => {
        const service = new gm.Geocoder();
        service.geocode({'latLng': coord},
            (result, status) => {
                if (status === 'OK') {
                    resolve(result);
                } else {
                    reject(false);
                }
            })
    });
}

export const AddressToCoord = address => {
    return new Promise((resolve, reject) => {
        const service = new gm.Geocoder();
        service.geocode({'address': address},
            (result, status) => {
                if (status === 'OK') {
                    resolve(result);
                } else {
                    reject(false);
                }
            })
    });
}

export const halfwayPoint = (P1, P2) => {
    return gmPoint(
        (P2.lat() + P1.lat()) / 2,
        (P2.lng() + P1.lng()) / 2,
    )
}

export const percWayPoint = (P1, P2, perc) => {
    return gmPoint(
        (P2.lat() - P1.lat()) * perc / 100 + P1.lat(),
        (P2.lng() - P1.lng()) * perc / 100 + P1.lng(),
    )
}

export const random = (a, b) => {
    return Math.floor((Math.random() * b) + a);
}

export const angle_0_360 = angle => {
    let new_angle = angle % 360
    return (new_angle >= 0) ? new_angle : 360 + angle
}

export const angle_0_Pi = angle => {
    return rad(angle_0_360(deg(angle)))
}

export const angleToCardinal = angle => {
    let cardinal = '';
    if (angle < 22.5) {
        cardinal = 'N'
    } else if (angle < 45 + 22.5) {
        cardinal = 'NE'
    } else if (angle < 90 + 22.5) {
        cardinal = 'E'
    } else if (angle < 135 + 22.5) {
        cardinal = 'SE'
    } else if (angle < 180 + 22.5) {
        cardinal = 'S'
    } else if (angle < 225 + 22.5) {
        cardinal = 'SW'
    } else if (angle < 270 + 22.5) {
        cardinal = 'W'
    } else if (angle < 315 + 22.5) {
        cardinal = 'NW'
    } else {
        cardinal = 'N'
    }
    return cardinal
}

export const directionsFillPath = (Path) => {
    let i = 1;
    let X = null, Y = null;
    let dx = null, dy = null;
    let x1 = null, y1 = null, x2 = null, y2 = null;
    let A = null, G = null, N = 0.0001;
    let new_pt, pointsAdded = 0;
    for (let k = 0; k < Path.legs.length; k++) {
        for (let s = 0; s < Path.legs[k].steps.length; s++) {
            i = 1;
            let j = 3;
            let d = 2;
            N = 0.00005;
            while (i < j) {
                x1 = Path.legs[k].steps[s].lat_lngs[i - 1].lng();
                y1 = Path.legs[k].steps[s].lat_lngs[i - 1].lat();
                x2 = Path.legs[k].steps[s].lat_lngs[i].lng();
                y2 = Path.legs[k].steps[s].lat_lngs[i].lat();
                dx = x2 - x1;
                dy = y2 - y1;
                A = y1 - (dy / dx) * x1;
                if (Math.sqrt(dx * dx + dy * dy) > N) {
                    pointsAdded++;
                    X = x1;
                    Y = null;
                    G = dx * N / Math.sqrt(dx * dx + dy * dy);
                    X = X + G;
                    Y = (dy / dx) * X + A;
                    new_pt = new gm.LatLng(Y, X);
                    Path.legs[k].steps[s].lat_lngs.splice(i, 0, new_pt);
                    i = i + 1;
                    if (j < 10) {
                        N = N * d;
                    }
                    if (j < Path.legs[k].steps[s].lat_lngs.length) {
                        j = j + 1;
                        d = d * 2;
                    }
                } else {
                    i = i + 1;
                }
            }
        }
    }
    return new Promise((resolve, reject) => {
        resolve(Path);
    });
}

export const getClosestPointInPath = (refPoint, Path) => {
    let closestPointInPath = {k: null, s: null, p: null};
    let distanceRefPointToThisPointInPath;
    let distanceStored = false;
    for (let k = 0; k < Path.legs.length; k++) {
        for (let s = 0; s < Path.legs[k].steps.length; s++) {
            for (let p = 0; p < Path.legs[k].steps[s].lat_lngs.length; p++) {
                try {
                    distanceRefPointToThisPointInPath = haversineDist(refPoint, Path.legs[k].steps[s].lat_lngs[p]);
                } catch (err) {
                }
                if (distanceStored === false || distanceRefPointToThisPointInPath < distanceStored) {
                    distanceStored = distanceRefPointToThisPointInPath;
                    closestPointInPath = {k, s, p};
                }
            }
        }
    }
    return closestPointInPath;
}

export const createPolygonOutOfPath = (path) => {
    // const path = directionsFinalRes.overview_path
    const points_Array = [];
    const halfStreetWide = 0.00008;
    points_Array.push(pointAtDistAndAngle(path[0], halfStreetWide, segmentAngle(path[0], path[1], 'rad') + 0.5 * Math.PI))
    points_Array.unshift(pointAtDistAndAngle(path[0], halfStreetWide, segmentAngle(path[0], path[1], 'rad') - 0.5 * Math.PI))
    for (let i = 1; i < path.length - 2; i++) {
        const sidePoints = createSidewalkPoints(path[i - 1], path[i], path[i + 1], halfStreetWide)
        points_Array.push(sidePoints[0])
        points_Array.unshift(sidePoints[1])
    }
    points_Array.push(pointAtDistAndAngle(path[path.length - 1], halfStreetWide, segmentAngle(path[path.length - 1], path[path.length - 2], 'rad') - 0.5 * Math.PI))
    points_Array.unshift(pointAtDistAndAngle(path[path.length - 1], halfStreetWide, segmentAngle(path[path.length - 1], path[path.length - 2], 'rad') + 0.5 * Math.PI))
    return points_Array;
}

export const createSidewalkPoints = (P1, P2, P3, halfStreetWide) => {
    const gridAngleP2P1 = segmentAngle(P2, P1, 'rad')
    const gridAngleP2P3 = segmentAngle(P2, P3, 'rad')
    let relAngleP1P3 = gridAngleP2P1 - gridAngleP2P3
    relAngleP1P3 = (relAngleP1P3 >= 0) ? relAngleP1P3 : 2 * Math.PI + relAngleP1P3
    if (relAngleP1P3 < 3 * Math.PI / 4 || relAngleP1P3 > 5 * Math.PI / 4) {
        halfStreetWide = 2 * halfStreetWide;
    }
    let gridAngleP2Adj1 = gridAngleP2P3 + relAngleP1P3 / 2
    return [pointAtDistAndAngle(P2, halfStreetWide, gridAngleP2Adj1), pointAtDistAndAngle(P2, halfStreetWide, gridAngleP2Adj1 + Math.PI)];
}
