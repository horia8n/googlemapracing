import {gmPoint} from './functions'
const settings = {
    EngineOn: false,
    motoLoopBusy: false,
    Accelerating: false,
    Clutching: false,
    Clutch: 1,
    clutchStep: 0.05,
    clutchMax: 1,
    Breaking: false,
    Steering: false,
    Steer: 0,
    steeringStep: 1,
    steeringMax: 15,
    steer_to_angle_adjustor: 0.0020,
    SteeringLeft: false,
    SteeringRight: false,
    Leaning: '',
    FootAideLevels: 4,
    FootAideFrame: 0,
    LeanPattern: 7,
    LeanFrame: 4,
    WheelTurnPattern: 2,
    WheelTurnFrame: 0,
    DispFrame: 4,
    angle: 0,
    HeadingDeg: 0,
    SpeedShift: 1,
    speed_KM_H_adjustor: 11550000,
    ShiftingUp: false,
    ShiftingDown: false,
    shiftsData: [
        {ratio: 0}, // N,
        {ratio: 0.0000035}, // 1
        {ratio: 0.0000065}, // 2
        {ratio: 0.0000104}, // 3
        {ratio: 0.00001475}, // 4
        {ratio: 0.0000191}, // 5
        {ratio: 0.000026}, // 6
    ],
    SpeedShiftBefore: null,
    ShiftSpeed: 0.00001,
    MeExTime: null,
    ExPoint: null,
    ExPoints: [gmPoint(0, 0)],
    NewTime: null,
    NewPoint: null,
    RPM: 0,
    acceleration: 0,
    accelerationMax: 25,
    speedCoord: 0,
    motion_adjustor: 0.01849,
    motionFriction: 0.000000005,
    motionFriction2: 350,
    onroadMotionFriction: 350,
    offroadMotionFriction: 1400,
    propsedTorque: 0,
    Torque: 0,
    torqueStep: 0.01,
    torqueMax: 1,
    torqueFriction: 0.003,
    torqueLowPenalty: 0.000002,
    torqueHighPenalty: 0.000001,
    torque_adjustor: 0.04,
    Motor: 0,
    Transmition: 0,
    Motion: 0,
    motorFriction: 0,
    Engine: 0,
    GearBox: 0,
    DriveTrain: 0,
    motionRatioFriction: 0,
    Break: 0,
    break_adjustor: 0.012,
    engine_adjustor: 0.8,
    shiftRatioCurrent: 0,
    KMHSpeed: 0,
    Position: null,
    Sounds: {
        idle: {
            loop: true,
            loopStart: 1,
            loopEnd: 3,
            freqMin: 2.5,
            volumeMin: 0.2,
            freqMax: 5,
            volumeMax: -0.2
        },
        acceleration: {
            loop: true,
            loopStart: 0,
            loopEnd: 4,
            freqMin: 0.03,
            volumeMin: 0.1,
            freqMax: 2.2,
            volumeMax: 0.2
        }
    }
};
export default settings;