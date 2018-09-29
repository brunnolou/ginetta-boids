import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
var fps = require("fps"),
	ticker = require("ticker"),
	debounce = require("debounce"),
	Boids = require("boids");

class App extends Component {
	state = {
		frames: 0
	};
	componentDidMount() {
		console.log("this.canvas: ", this.canvas);
		if (!this.canvas) return;

		var attractors = [
			[
				Infinity, // x
				Infinity, // y
				150, // dist
				0.25 // spd
			]
		];

		var canvas = this.canvas;

		var ctx = canvas.getContext("2d"),
			boids = Boids({
				boids: 850,
				accelerationLimit: 8, // Max acceleration per tick
				speedLimit: 1, // Max steps to take per tick
				alignmentDistance: 180, // Radius at which boids align with others
				alignmentForce: 0.45, // Speed to align with other boids
				choesionDistance: 50, // Radius at which boids approach others
				choesionForce: 0.9, // Speed to move towards other boids
				separationDistance: 8, // Radius at which boids avoid others
				separationForce: 1, // Speed to avoid at
				attractors: attractors
			});

		document.body.onmousemove = function(e) {
			var halfHeight = canvas.height / 2,
				halfWidth = canvas.width / 2;

			attractors[0][0] = e.x - halfWidth;
			attractors[0][1] = e.y - halfHeight;
		};

		window.onresize = debounce(function() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}, 100);
		window.onresize();

		document.body.style.margin = "0";
		document.body.style.padding = "0";
		document.body.appendChild(canvas);

		ticker(window, 60)
			.on("tick", function() {
				frames.tick();
				boids.tick();
			})
			.on("draw", function() {
				var boidData = boids.boids,
					halfHeight = canvas.height / 2,
					halfWidth = canvas.width / 2;

				ctx.fillStyle = "rgba(30,30,30,0.05)"; // '#FFF1EB'
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				ctx.fillStyle = "#fff";
				for (var i = 0, l = boidData.length, x, y; i < l; i += 1) {
					x = boidData[i][0];
					y = boidData[i][1];
					// wrap around the screen
					boidData[i][0] =
						x > halfWidth ? -halfWidth : -x > halfWidth ? halfWidth : x;
					boidData[i][1] =
						y > halfHeight ? -halfHeight : -y > halfHeight ? halfHeight : y;
					ctx.fillRect(x + halfWidth, y + halfHeight, 2, 2);
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
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<h1 className="App-title">FPS {this.state.frames}</h1>
				</header>
				<p className="App-intro">
					<canvas
						key="canvas"
						ref={node => {
							this.canvas = node;
							// console.log(node);
						}}
					/>
				</p>
			</div>
		);
	}
}

export default App;
