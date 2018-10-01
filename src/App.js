import React, { Component } from "react";
import logo from "./img/ginetta-logo.svg";
import gradient from "./img/ginetta-gradient.png";
import icon from "./img/ginetta-icon.svg";
import { calc, transform } from "popmotion";
import "./App.css";
var fps = require("fps"),
  ticker = require("ticker"),
  debounce = require("debounce"),
  Boids = require("boids");

const pt = (x, y) => ({ x, y });

let mode = 1;

const speedLimit = 0.6;
const accelerationLimit = 8;
const alignmentDistance = 180; // Radius at which boids align with others
const alignmentForce = 0.45; // Speed to align with other boids
const choesionDistance = 50; // Radius at which boids approach others
const choesionForce = 0.9; // Speed to move towards other boids
const separationDistance = 8; // Radius at which boids avoid others
const separationForce = 1; // Speed to avoid at

const hueRotate = transform.interpolate([0, 360], [290, 240]);

// const hueRotate = transform.interpolate(
//   [0, 90, 300, 360],
//   [300, 250, 140, 200]
// );

const brightnessBySpeed = transform.interpolate([0, speedLimit], [10, 44]);
const progressFromCenter = transform.interpolate(
  [0, alignmentDistance * 0.6, alignmentDistance],
  [1, 1, 0.7]
);
const saturationRotate = transform.interpolate(
  [accelerationLimit, 0],
  [90, 100]
);

const lightRotate = transform.interpolate(
  [
    0,
    360 / 9,
    360 / 8,
    360 / 7,
    360 / 6,
    360 / 5,
    360 / 4,
    360 / 3,
    360 / 2,
    360
  ],
  [0, -0.1, 0, -0.1, 0, -0.1, 0, -0.1, 0, -0.1]
);

class App extends Component {
  state = {
    frames: 0
  };
  componentDidMount() {
    if (!this.canvas) return;

    var attractors = [
      [
        Infinity, // x
        Infinity, // y
        50, // dist
        -accelerationLimit // spd
      ]
    ];

    var canvas = this.canvas;

    var ctx = canvas.getContext("2d"),
      boids = Boids({
        boids: 850,
        accelerationLimit, // Max acceleration per tick
        speedLimit, // Max steps to take per tick
        alignmentDistance,
        alignmentForce,
        choesionDistance,
        choesionForce,
        separationDistance,
        separationForce,
        attractors: attractors
      });

    function move(e) {
      var halfHeight = canvas.height / 2,
        halfWidth = canvas.width / 2;

      attractors[0][0] = e.x - halfWidth;
      attractors[0][1] = e.y - halfHeight;
    }

    const down = e => {
      e.preventDefault();
      attractors[0][3] = accelerationLimit * 1.5;
      attractors[0][4] = 250;
    };

    const up = e => {
      e.preventDefault();
      attractors[0][3] = accelerationLimit;
      attractors[0][4] = 40;
    };

    const changeMode = e => {
      mode = !mode;
    };

    document.addEventListener("touchstart", changeMode, false);
    document.addEventListener("touchend", up, false);
    document.addEventListener("touchmove", move, false);

    document.body.onmousemove = move;
    document.body.onmousedown = down;
    document.body.onmouseup = up;
    document.body.ondblclick = changeMode;

    window.onresize = debounce(function() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }, 100);
    window.onresize();

    document.body.style.margin = "0";
    document.body.style.padding = "0";

    const halfHeight = canvas.height / 2;
    const halfWidth = canvas.width / 2;

    ticker(window, 60)
      .on("tick", function() {
        frames.tick();
        boids.tick();
      })
      .on("draw", function() {
        var boidData = boids.boids;

        ctx.fillStyle = mode ? "rgba(0,0,0,.0241)" : "rgba(0,0,0,.041)"; // '#FFF1EB'
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const boid0 = boidData[0];

        // const direction = calc.pointFromAngleAndDistance(
        //   pt(boid0[0] + halfWidth + boid0[0], boid0[1] + halfHeight + boid0[1]),
        //   angle,
        //   100
        // );

        // ctx.fillRect(direction.x, direction.y, 3, 3);

        // for (var i = 0, l = 1, x, y; i < l; i += 1) {
        for (var i = 0, l = boidData.length, x, y; i < l; i += 1) {
          const boid = boidData[i];
          const boidSize = mode ? 5 : 2;

          x = boid[0];
          y = boid[1];
          // wrap around the screen
          x = x > halfWidth ? -halfWidth : -x > halfWidth ? halfWidth : x;
          y = y > halfHeight ? -halfHeight : -y > halfHeight ? halfHeight : y;
          const speed = Math.abs(Math.max(boid[2], boid[3]));
          const acceleration = Math.abs(Math.max(boid[4], boid[5]));
          const angle = calc.angle(pt(0, 0), pt(boid[4], boid[5]));
          const distanceFromOrigin = calc.distance(pt(0, 0), pt(x, y));

          const isOutOfBounds = distanceFromOrigin > alignmentDistance;
          const distanceFromBorder = distanceFromOrigin - alignmentDistance;

          const center = calc.pointFromAngleAndDistance(pt(x, y), angle, 1);

          boid[4] -= isOutOfBounds
            ? center.x / (10000 / distanceFromBorder)
            : 0;
          boid[5] -= isOutOfBounds
            ? center.y / (10000 / distanceFromBorder)
            : 0;

          ctx.fillStyle =
            "hsl(" +
            hueRotate(angle) +
            ", " +
            saturationRotate(acceleration) +
            "%, " +
            brightnessBySpeed(speed) * progressFromCenter(distanceFromOrigin) +
            "%)";

          ctx.fillRect(x + halfWidth, y + halfHeight, boidSize, boidSize);
        }
      });

    var frames = fps({ every: 10, decay: 0.04 }).on("data", rate => {
      for (var i = 0; i < 3; i += 1) {
        if (rate <= 56 && boids.boids.length > 10) boids.boids.pop();
        if (rate >= 60 && boids.boids.length < 500)
          boids.boids.push([
            0,
            0,
            Math.random() * 6 - 3,
            Math.random() * 6 - 3,
            0,
            0
          ]);
      }
      this.setState({
        frames: String(Math.round(rate)),
        count: String(boids.boids.length)
      });
    });
  }

  render() {
    return (
      <div className="App">
        <span className="App-fps">FPS {this.state.frames}</span>
        <div className="App-intro">
          <canvas
            key="canvas"
            className={mode ? "blur" : ""}
            ref={node => {
              this.canvas = node;
              //
            }}
          />
        </div>
        {mode ? (
          <React.Fragment>
            <img class="App-icon-transparent" src={icon} />
            <div className="App-icon-bg">
              <img class="App-icon" src={icon} />
            </div>
          </React.Fragment>
        ) : null}
        {/* <img class="App-gradient" src={gradient} /> */}
        <img
          class="App-logo"
          src={logo}
          onClick={() => {
            mode = !mode;
          }}
        />
      </div>
    );
  }
}

export default App;
