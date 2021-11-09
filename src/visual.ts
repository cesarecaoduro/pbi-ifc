/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "core-js/stable";
import "regenerator-runtime/runtime";
import "./../style/visual.less";

import {
    Scene,
    PerspectiveCamera,
    AmbientLight,
    DirectionalLight,
    WebGLRenderer,
    GridHelper,
    AxesHelper
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import { IFCLoader } from "web-ifc-three/IFCLoader.js";

import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import { VisualSettings } from "./settings";

export class Visual implements IVisual {
    private target: HTMLElement;
    private updateCount: number;
    private settings: VisualSettings;
    private textNode: Text;
    public scene: Scene;
    public size: {
        width: number,
        height: number
    }

    constructor(options: VisualConstructorOptions) {
        // console.log('Visual constructor', options);
        this.target = options.element;
        if (document) {
            const new_div: HTMLElement = document.createElement("canvas");
            new_div.id = "three-canvas";
            this.target.appendChild(new_div);  
            const file_input: HTMLInputElement = document.createElement("input");
            file_input.id = "file-input";
            file_input.type = "file";
            this.target.appendChild(file_input);         
        }

        this.scene = new Scene();
        // console.log(this.scene);

        const ifcLoader = new IFCLoader();
        // console.log(ifcLoader);

        //Sets up the renderer, fetching the canvas of the HTML
        const threeCanvas = document.getElementById("three-canvas");
        // console.log(threeCanvas);

        this.size = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
        // console.log(this.size);

        //Creates the camera (point of view of the user)
        const aspect = this.size.width / this.size.height;
        const camera = new PerspectiveCamera(75, aspect);
        camera.position.z = 15;
        camera.position.y = 13;
        camera.position.x = 8;

        //Creates the lights of the scene
        const lightColor = 0xffffff;

        const ambientLight = new AmbientLight(lightColor, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(lightColor, 1);
        directionalLight.position.set(0, 10, 0);
        directionalLight.target.position.set(-5, 0, 0);
        this.scene.add(directionalLight);
        this.scene.add(directionalLight.target);

        
        //Sets up the renderer, fetching the canvas of the HTML
        const renderer = new WebGLRenderer({
            canvas: threeCanvas,
            alpha: true
        });

        renderer.setSize(this.size.width, this.size.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        //Creates grids and axes in the scene
        const grid = new GridHelper(50, 30);
        this.scene.add(grid);

        const axes = new AxesHelper();
        // axes.material.depthTest = false;
        axes.renderOrder = 1;
        this.scene.add(axes);

        //Creates the orbit controls (to navigate the scene)
        const controls = new OrbitControls(camera, threeCanvas);
        controls.enableDamping = true;
        controls.target.set(-2, 0, 0);
        // console.log(controls);

        //Animation loop
        const animate = () => {
            controls.update();
            renderer.render(this.scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        //Adjust the viewport to the size of the browser
        window.addEventListener("resize", () => {
            this.size.width = window.innerWidth;
            this.size.height = window.innerHeight;
            camera.aspect = this.size.width / this.size.height;
            camera.updateProjectionMatrix();
            renderer.setSize(this.size.width, this.size.height);
        });
        // console.log(this.scene);
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}